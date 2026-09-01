import { Request, Response } from 'express';
import { getModels } from '../../../config/models';
import { ApplicationStatus } from '@cybersave/shared';
import { triggerNotification } from '../utils/notification';

// Lazy-resolve models
const getApplicationModel = () => getModels().Application;
const getServiceModel = () => getModels().Service;

// ── Ref number generator ──────────────────────────────────────────────────────
const generateRefNo = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CS-${date}-${rand}`;
};

// ── POST /applications — create draft ─────────────────────────────────────────
export const createApplication = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const { serviceId } = req.body as { serviceId: string };

  const Service = getServiceModel();
  const Application = getApplicationModel();

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    res.status(404).json({ success: false, error: 'Service not found', errorCode: 'SERVICE_NOT_FOUND' });
    return;
  }

  const application = await Application.create({
    applicationRefNo: generateRefNo(),
    citizenId,
    serviceId: service._id,
    serviceName: service.name,
    status: ApplicationStatus.DRAFT,
    govtFee: service.govtFee,
    convenienceFee: service.convenienceFee,
    totalAmount: service.govtFee + service.convenienceFee,
    timeline: [
      { event: 'Application created', actorId: citizenId, actorRole: 'citizen', timestamp: new Date() },
    ],
  });

  res.status(201).json({ success: true, data: { application } });
};

// ── GET /applications — citizen's own list (paginated) ────────────────────────
export const listApplications = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const page = parseInt(req.query.page as string ?? '1', 10);
  const limit = Math.min(parseInt(req.query.limit as string ?? '20', 10), 100);
  const status = req.query.status as string | undefined;

  const Application = getApplicationModel();
  const filter: Record<string, unknown> = { citizenId };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Application.find(filter)
      .select('-formData -timeline')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

// ── GET /applications/:id ─────────────────────────────────────────────────────
export const getApplication = async (req: Request, res: Response): Promise<void> => {
  const requesterId = req.user!.id;
  const requesterRole = req.user!.role;
  const { id } = req.params;

  const Application = getApplicationModel();
  const isStaff = ['operator', 'admin', 'super_admin'].includes(requesterRole);
  const query = isStaff ? { _id: id } : { _id: id, citizenId: requesterId };

  const application = await Application.findOne(query).populate('serviceId', 'name category requiredDocuments');
  if (!application) {
    res.status(404).json({ success: false, error: 'Application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  res.json({ success: true, data: { application } });
};

// ── PATCH /applications/:id/step/:step — wizard step save ─────────────────────
export const saveWizardStep = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const { id, step } = req.params;
  const stepNum = parseInt(step, 10);

  const Application = getApplicationModel();
  const application = await Application.findOne({ _id: id, citizenId, status: ApplicationStatus.DRAFT });
  if (!application) {
    res.status(404).json({ success: false, error: 'Draft application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  const updates: Partial<any> = { currentStep: Math.max(application.currentStep, stepNum + 1) };

  switch (stepNum) {
    case 1:
      Object.assign(updates, {
        applicantName: req.body.applicantName,
        applicantPhone: req.body.applicantPhone,
        applicantDob: req.body.applicantDob,
        applicantGender: req.body.applicantGender,
        applicantAddress: req.body.applicantAddress,
      });
      break;
    case 2:
      updates.formData = { ...application.formData, ...req.body.formData };
      break;
    case 3:
      updates.documentIds = req.body.documentIds;
      break;
    case 4:
      updates.reviewConfirmed = true;
      updates.declarationAccepted = true;
      break;
    default:
      res.status(400).json({ success: false, error: 'Invalid step', errorCode: 'INVALID_STEP' });
      return;
  }

  await Application.findByIdAndUpdate(id, updates);
  res.json({ success: true, data: { message: `Step ${stepNum} saved`, currentStep: updates.currentStep } });
};

// ── POST /applications/:id/submit ─────────────────────────────────────────────
export const submitApplication = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { paymentGatewayRef, paymentOrderId, paymentMethod } = req.body as {
    paymentGatewayRef: string;
    paymentOrderId: string;
    paymentMethod?: string;
  };

  const Application = getApplicationModel();
  const Service = getServiceModel();

  const application = await Application.findById(id);
  if (!application) {
    res.status(404).json({ success: false, error: 'Application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  if (application.status !== ApplicationStatus.DRAFT) {
    res.json({ success: true, data: { message: 'Already submitted', status: application.status } });
    return;
  }

  const service = await Service.findById(application.serviceId);
  const slaDeadline = service
    ? new Date(Date.now() + service.slaHours * 60 * 60 * 1000)
    : undefined;

  application.status = ApplicationStatus.SUBMITTED;
  application.paymentGatewayRef = paymentGatewayRef;
  application.paymentOrderId = paymentOrderId;
  if (paymentMethod) {
    application.paymentMethod = paymentMethod;
  }
  application.paymentStatus = 'paid';
  application.slaDeadline = slaDeadline;
  application.timeline.push({
    event: 'Application submitted — payment confirmed',
    actorId: 'system',
    actorRole: 'system',
    note: `Gateway ref: ${paymentGatewayRef}`,
    timestamp: new Date(),
  });

  await application.save();

  triggerNotification(
    application.citizenId,
    'Application Submitted Successfully',
    `Your application for ${application.serviceName} has been submitted (Ref: ${application.applicationRefNo}). Processing time is ${service ? service.slaHours : 24} hours.`,
    'application_update'
  );

  res.json({ success: true, data: { application } });
};

// ── GET /applications/operator/queue — operator's work queue ──────────────────
export const listOperatorQueue = async (req: Request, res: Response): Promise<void> => {
  const operatorId = req.headers['x-user-id'] as string;
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
  const filterType = req.query.filter as 'all' | 'mine' | 'unassigned';

  const Application = getApplicationModel();
  const query: Record<string, unknown> = {
    status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, 'docs_pending', 'processing'] },
  };

  if (filterType === 'mine') {
    query.assignedOperatorId = operatorId;
  } else if (filterType === 'unassigned') {
    query.assignedOperatorId = { $exists: false };
  } else {
    query.$or = [{ assignedOperatorId: operatorId }, { assignedOperatorId: { $exists: false } }];
  }

  const [items, total] = await Promise.all([
    Application.find(query)
      .sort({ slaDeadline: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
};

// ── POST /applications/:id/assign — operator self-claims a task ──────────────
export const assignApplication = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { operatorId: bodyOperatorId, operatorName: bodyOperatorName } = req.body as { operatorId?: string; operatorName?: string };
  const operatorId = bodyOperatorId || (req.headers['x-user-id'] as string);
  const operatorName = bodyOperatorName || (req.headers['x-user-name'] as string) || 'Operator';

  const Application = getApplicationModel();
  const application = await Application.findById(id);
  if (!application) {
    res.status(404).json({ success: false, error: 'Application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  const requesterRole = req.user?.role || 'operator';
  const isAdmin = ['admin', 'super_admin'].includes(requesterRole);

  if (application.assignedOperatorId && application.assignedOperatorId !== operatorId && !isAdmin) {
    res.status(409).json({ success: false, error: 'Application already assigned to another operator', errorCode: 'ALREADY_ASSIGNED' });
    return;
  }

  application.assignedOperatorId = operatorId;
  application.assignedOperatorName = operatorName;
  if (application.status === ApplicationStatus.SUBMITTED) {
    application.status = ApplicationStatus.UNDER_REVIEW;
  }
  application.timeline.push({
    event: 'Operator assigned',
    actorId: operatorId,
    actorRole: 'operator',
    note: `Assigned to ${operatorName}`,
    timestamp: new Date(),
  });

  await application.save();

  triggerNotification(
    application.citizenId,
    'Application Claimed',
    `Your application ${application.applicationRefNo} (${application.serviceName}) has been claimed by operator ${operatorName} and is now under review.`,
    'application_update'
  );

  res.json({ success: true, data: { application } });
};

// ── PATCH /applications/:id/verify-document ───────────────────────────────────
export const verifyDocument = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { documentId, status, comments } = req.body as {
    documentId: string;
    status: 'approved' | 'rejected';
    comments?: string;
  };
  const operatorId = req.headers['x-user-id'] as string;

  const Application = getApplicationModel();
  const application = await Application.findById(id);
  if (!application) {
    res.status(404).json({ success: false, error: 'Application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  application.verifiedDocuments = application.verifiedDocuments.filter((d: any) => d.documentId !== documentId);
  application.verifiedDocuments.push({ documentId, status, comments });

  application.timeline.push({
    event: `Document verification: ${status}`,
    actorId: operatorId,
    actorRole: 'operator',
    note: `Doc ID: ${documentId}${comments ? ` - Reason: ${comments}` : ''}`,
    timestamp: new Date(),
  });

  if (status === 'rejected') {
    application.status = 'docs_pending' as any;
    application.rejectionReason = comments;
  }

  await application.save();

  triggerNotification(
    application.citizenId,
    status === 'approved' ? 'Document Approved' : 'Document Action Required',
    status === 'approved'
      ? `One of your uploaded documents for request ${application.applicationRefNo} has been verified.`
      : `Document rejected for ${application.applicationRefNo}: ${comments}. Please upload a clear replacement copy.`,
    'application_update'
  );

  res.json({ success: true, data: { application } });
};

// ── PATCH /applications/:id/status — update overall status ────────────────────
export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body as { status: ApplicationStatus; rejectionReason?: string };
  const operatorId = req.headers['x-user-id'] as string;

  const Application = getApplicationModel();
  const application = await Application.findById(id);
  if (!application) {
    res.status(404).json({ success: false, error: 'Application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  application.status = status;
  if (status === ApplicationStatus.REJECTED && rejectionReason) {
    application.rejectionReason = rejectionReason;
  }
  if (status === ApplicationStatus.COMPLETED) {
    application.completedAt = new Date();
  }

  application.timeline.push({
    event: `Status updated to ${status}`,
    actorId: operatorId,
    actorRole: 'operator',
    note: rejectionReason,
    timestamp: new Date(),
  });

  await application.save();

  triggerNotification(
    application.citizenId,
    `Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
    `The status of your application ${application.applicationRefNo} (${application.serviceName}) has changed to ${status.replace('_', ' ')}.`,
    'application_update'
  );

  res.json({ success: true, data: { application } });
};

// Helper to get start and end of day in IST (UTC+5:30) for a given offset from today
const getISTDayBounds = (daysOffset = 0) => {
  const now = new Date();
  // Get time in IST (UTC + 5.5 hours)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  if (daysOffset !== 0) {
    istTime.setDate(istTime.getDate() + daysOffset);
  }
  
  const startOfIstDay = new Date(istTime);
  startOfIstDay.setUTCHours(0, 0, 0, 0);
  const startOfDay = new Date(startOfIstDay.getTime() - (5.5 * 60 * 60 * 1000));
  
  const endOfIstDay = new Date(istTime);
  endOfIstDay.setUTCHours(23, 59, 59, 999);
  const endOfDay = new Date(endOfIstDay.getTime() - (5.5 * 60 * 60 * 1000));

  return { startOfDay, endOfDay };
};

// ── GET /applications/admin/stats — admin stats aggregation ──────────────────
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const Application = getApplicationModel();

    const totalApplications = await Application.countDocuments();
    const pendingReview = await Application.countDocuments({
      status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, 'docs_pending'] },
    });
    const completedCount = await Application.countDocuments({ status: ApplicationStatus.COMPLETED });

    const slaBreached = await Application.countDocuments({
      slaDeadline: { $lt: new Date() },
      status: { $nin: [ApplicationStatus.COMPLETED, ApplicationStatus.REJECTED, ApplicationStatus.DRAFT] },
    });

    const paidApps = await Application.find({ paymentStatus: 'paid' }).select('totalAmount');
    const totalRevenue = paidApps.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);

    const { startOfDay, endOfDay } = getISTDayBounds(0);

    const paidToday = await Application.find({
      paymentStatus: 'paid',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).select('totalAmount govtFee convenienceFee');

    const revenueToday = paidToday.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);

    let onlineRevenueToday = 0;
    let cashRevenueToday = 0;
    paidToday.forEach(app => {
      onlineRevenueToday += (app.govtFee ?? 0);
      cashRevenueToday += (app.convenienceFee ?? 0);
    });

    const applicationsToday = await Application.countDocuments({
      status: { $ne: ApplicationStatus.DRAFT },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const completedToday = await Application.countDocuments({
      status: ApplicationStatus.COMPLETED,
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const rejectedToday = await Application.countDocuments({
      status: ApplicationStatus.REJECTED,
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const categoryDistribution = await Application.aggregate([
      { $group: { _id: '$serviceName', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ]);

    const recentApplicationsRaw = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const recentApplications = recentApplicationsRaw.map((app) => ({
      ...app,
      totalAmount: (app.totalAmount ?? 0) / 100,
    }));

    const appsWithOperatorTimeline = await Application.find({
      'timeline.actorRole': 'operator'
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

    const operatorLogsList: any[] = [];
    appsWithOperatorTimeline.forEach(app => {
      app.timeline.forEach((event: any) => {
        if (event.actorRole === 'operator') {
          operatorLogsList.push({
            applicationId: app._id,
            applicationRefNo: app.applicationRefNo,
            serviceName: app.serviceName,
            applicantName: app.applicantName,
            event: event.event,
            note: event.note,
            actorId: event.actorId,
            timestamp: event.timestamp
          });
        }
      });
    });

    operatorLogsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const finalOperatorLogs = operatorLogsList.slice(0, 5);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueOverview: any[] = [];
    const applicationTrends: any[] = [];

    for (let i = 6; i >= 0; i--) {
      const { startOfDay: start, endOfDay: end } = getISTDayBounds(-i);

      const dayPaid = await Application.find({
        paymentStatus: 'paid',
        createdAt: { $gte: start, $lte: end }
      }).select('totalAmount');
      const dayRev = dayPaid.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);

      const comp = await Application.countDocuments({
        status: ApplicationStatus.COMPLETED,
        completedAt: { $gte: start, $lte: end }
      });
      const pend = await Application.countDocuments({
        status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, 'docs_pending', 'processing'] },
        createdAt: { $gte: start, $lte: end }
      });
      const rej = await Application.countDocuments({
        status: ApplicationStatus.REJECTED,
        updatedAt: { $gte: start, $lte: end }
      });

      // Get the correct day of week label in IST
      const labelDate = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000) - (i * 24 * 60 * 60 * 1000));
      const dayLabel = daysOfWeek[labelDate.getUTCDay()];

      revenueOverview.push({
        day: dayLabel,
        revenue: dayRev / 100
      });

      applicationTrends.push({
        day: dayLabel,
        completed: comp,
        pending: pend,
        rejected: rej
      });
    }

    res.json({
      success: true,
      data: {
        totalApplications,
        pendingReview,
        completedCount,
        slaBreached,
        totalRevenue: totalRevenue / 100,
        revenueToday: revenueToday / 100,
        onlineRevenueToday: onlineRevenueToday / 100,
        cashRevenueToday: cashRevenueToday / 100,
        applicationsToday,
        completedToday,
        rejectedToday,
        categoryDistribution,
        recentApplications,
        revenueOverview,
        applicationTrends,
        operatorLogs: finalOperatorLogs,
        activeCentres: 12
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── PATCH /applications/:id/certificate ───────────────────────────────────────
export const uploadCertificate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { certificateUrl, department } = req.body as { certificateUrl: string; department?: string };
  const operatorId = (req.headers['x-user-id'] as string) ?? 'admin';

  if (!certificateUrl) {
    res.status(400).json({ success: false, error: 'certificateUrl is required' });
    return;
  }

  const Application = getApplicationModel();
  const application = await Application.findById(id);
  if (!application) {
    res.status(404).json({ success: false, error: 'Application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  application.certificateUrl = certificateUrl;
  if (department) application.department = department;
  application.status = ApplicationStatus.COMPLETED;
  application.completedAt = new Date();
  application.timeline.push({
    event: 'Certificate uploaded — application completed',
    actorId: operatorId,
    actorRole: 'operator',
    note: `Certificate URL: ${certificateUrl}`,
    timestamp: new Date(),
  });

  await application.save();

  triggerNotification(
    application.citizenId,
    'Certificate Ready for Download',
    `Your ${application.serviceName} certificate (${application.applicationRefNo}) is ready. Open the app to download it.`,
    'application_update'
  );

  res.json({ success: true, data: { application } });
};

// ── GET /applications/admin/all ─────────────────────────────────────────────
export const listAllApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = Math.min(parseInt((req.query.limit as string) ?? '8', 10), 100);
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const assigned = req.query.assigned as string | undefined;
    const citizenId = req.query.citizenId as string | undefined;
    const operatorId = req.query.operatorId as string | undefined;
    const requesterRole = req.headers['x-user-role'] as string;
    const requesterId = req.headers['x-user-id'] as string;
    
    // If the caller is an operator, force the scope to themselves
    const effectiveOperatorId = requesterRole === 'operator' ? requesterId : operatorId;

    const Application = getApplicationModel();
    const filter: Record<string, any> = {};

    const baseMetricsFilter: Record<string, any> = {};

    if (effectiveOperatorId) {
      filter.assignedOperatorId = effectiveOperatorId;
      baseMetricsFilter.assignedOperatorId = effectiveOperatorId;
    } else if (citizenId) {
      filter.citizenId = citizenId;
    } else {
      filter.status = { $ne: ApplicationStatus.DRAFT };
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { applicationRefNo: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } },
        { applicantName: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      if (category === 'Aadhaar Services') {
        filter.serviceName = { $regex: 'aadhaar|mobile|address', $options: 'i' };
      } else if (category === 'PAN Card') {
        filter.serviceName = { $regex: 'pan', $options: 'i' };
      } else if (category === 'Certificates') {
        filter.serviceName = { $regex: 'certificate|birth|income|caste', $options: 'i' };
      } else if (category === 'Banking') {
        filter.serviceName = { $regex: 'banking|kisan|nidhi', $options: 'i' };
      } else if (category === 'Insurance') {
        filter.serviceName = { $regex: 'insurance', $options: 'i' };
      } else if (category === 'Utility') {
        filter.serviceName = { $regex: 'utility|bill|electricity', $options: 'i' };
      } else if (category === 'Other') {
        filter.serviceName = { $nin: [
          /aadhaar/i, /mobile/i, /address/i, /pan/i, /certificate/i,
          /birth/i, /income/i, /caste/i, /banking/i, /kisan/i, /nidhi/i,
          /insurance/i, /utility/i, /bill/i, /electricity/i
        ] };
      }
    }

    if (assigned === 'unassigned') {
      filter.assignedOperatorId = { $exists: false };
    } else if (assigned === 'assigned') {
      filter.assignedOperatorId = { $exists: true, $ne: null };
    }

    const [itemsRaw, total] = await Promise.all([
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Application.countDocuments(filter),
    ]);

    const items = itemsRaw.map(item => ({
      ...item,
      totalAmount: (item.totalAmount ?? 0) / 100
    }));

    const { startOfDay, endOfDay } = getISTDayBounds(0);
    const todayReceived = await Application.countDocuments({
      ...baseMetricsFilter,
      status: { $ne: ApplicationStatus.DRAFT },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const pendingReview = await Application.countDocuments({
      ...baseMetricsFilter,
      status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, 'docs_pending'] }
    });

    const inProcessing = await Application.countDocuments({
      ...baseMetricsFilter,
      status: 'processing'
    });

    const completedToday = await Application.countDocuments({
      ...baseMetricsFilter,
      status: ApplicationStatus.COMPLETED,
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const pipeline = {
      submitted: await Application.countDocuments({ ...baseMetricsFilter, status: ApplicationStatus.SUBMITTED }),
      underReview: await Application.countDocuments({ ...baseMetricsFilter, status: ApplicationStatus.UNDER_REVIEW }),
      processing: await Application.countDocuments({ ...baseMetricsFilter, status: 'processing' }),
      approved: await Application.countDocuments({ ...baseMetricsFilter, status: ApplicationStatus.APPROVED || 'approved' }),
      completed: await Application.countDocuments({ ...baseMetricsFilter, status: ApplicationStatus.COMPLETED }),
    };

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        metrics: {
          totalApplications: await Application.countDocuments({ ...baseMetricsFilter, status: { $ne: ApplicationStatus.DRAFT } }),
          todayReceived,
          pendingReview,
          inProcessing,
          completedToday,
        },
        pipeline
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /applications/admin/create ───────────────────────────────────────────
export const createApplicationByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { citizenId, serviceId, applicantName, applicantPhone, applicantDob, applicantGender, applicantAddress, formData } = req.body;
    const operatorId = req.headers['x-user-id'] as string;
    const operatorName = (req.headers['x-user-name'] as string) ?? 'Admin/Operator';

    const Service = getServiceModel();
    const Application = getApplicationModel();

    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found', errorCode: 'SERVICE_NOT_FOUND' });
      return;
    }

    const application = await Application.create({
      applicationRefNo: generateRefNo(),
      citizenId,
      serviceId: service._id,
      serviceName: service.name,
      status: ApplicationStatus.SUBMITTED,
      govtFee: service.govtFee,
      convenienceFee: service.convenienceFee,
      totalAmount: service.govtFee + service.convenienceFee,
      applicantName,
      applicantPhone,
      applicantDob,
      applicantGender,
      applicantAddress: applicantAddress || {
        line1: 'Walk-in Registration',
        city: 'City',
        state: 'State',
        pincode: '110001'
      },
      formData: formData || {},
      assignedOperatorId: operatorId,
      assignedOperatorName: operatorName,
      paymentStatus: 'paid',
      timeline: [
        { event: 'Application created by Admin', actorId: operatorId, actorRole: 'operator', timestamp: new Date() },
      ],
    });

    await triggerNotification(
      citizenId,
      `New Application: ${service.name}`,
      `Your application ${application.applicationRefNo} has been successfully created by our agent.`,
      'application_update'
    );

    res.status(201).json({ success: true, data: { application } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /applications/operator/stats — operator stats aggregation ─────────────
export const getOperatorStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const operatorId = req.headers['x-user-id'] as string;
    const Application = getApplicationModel();

    const totalAssigned = await Application.countDocuments({ assignedOperatorId: operatorId });
    const pendingReview = await Application.countDocuments({
      assignedOperatorId: operatorId,
      status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, 'docs_pending', 'processing'] },
    });
    const completedCount = await Application.countDocuments({ 
      assignedOperatorId: operatorId,
      status: ApplicationStatus.COMPLETED 
    });

    const slaBreached = await Application.countDocuments({
      assignedOperatorId: operatorId,
      slaDeadline: { $lt: new Date() },
      status: { $nin: [ApplicationStatus.COMPLETED, ApplicationStatus.REJECTED, ApplicationStatus.DRAFT] },
    });

    const { startOfDay, endOfDay } = getISTDayBounds(0);

    const applicationsAssignedToday = await Application.countDocuments({
      assignedOperatorId: operatorId,
      status: { $ne: ApplicationStatus.DRAFT },
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const completedToday = await Application.countDocuments({
      assignedOperatorId: operatorId,
      status: ApplicationStatus.COMPLETED,
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const rejectedToday = await Application.countDocuments({
      assignedOperatorId: operatorId,
      status: ApplicationStatus.REJECTED,
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const recentApplicationsRaw = await Application.find({ assignedOperatorId: operatorId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();
    
    const recentApplications = recentApplicationsRaw.map((app) => ({
      ...app,
      totalAmount: (app.totalAmount ?? 0) / 100,
    }));

    const appsWithOperatorTimeline = await Application.find({
      'timeline.actorId': operatorId
    })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

    const operatorLogsList: any[] = [];
    appsWithOperatorTimeline.forEach(app => {
      app.timeline.forEach((event: any) => {
        if (event.actorId === operatorId) {
          operatorLogsList.push({
            applicationId: app._id,
            applicationRefNo: app.applicationRefNo,
            serviceName: app.serviceName,
            applicantName: app.applicantName,
            event: event.event,
            note: event.note,
            actorId: event.actorId,
            timestamp: event.timestamp
          });
        }
      });
    });

    operatorLogsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const finalOperatorLogs = operatorLogsList.slice(0, 10);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const applicationTrends: any[] = [];

    for (let i = 6; i >= 0; i--) {
      const { startOfDay: start, endOfDay: end } = getISTDayBounds(-i);

      const comp = await Application.countDocuments({
        assignedOperatorId: operatorId,
        status: ApplicationStatus.COMPLETED,
        completedAt: { $gte: start, $lte: end }
      });
      const pend = await Application.countDocuments({
        assignedOperatorId: operatorId,
        status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, 'docs_pending', 'processing'] },
        updatedAt: { $gte: start, $lte: end }
      });
      const rej = await Application.countDocuments({
        assignedOperatorId: operatorId,
        status: ApplicationStatus.REJECTED,
        updatedAt: { $gte: start, $lte: end }
      });

      const labelDate = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000) - (i * 24 * 60 * 60 * 1000));
      const dayLabel = daysOfWeek[labelDate.getUTCDay()];

      applicationTrends.push({
        day: dayLabel,
        completed: comp,
        pending: pend,
        rejected: rej
      });
    }

    res.json({
      success: true,
      data: {
        totalAssigned,
        pendingReview,
        completedCount,
        slaBreached,
        applicationsToday: applicationsAssignedToday,
        completedToday,
        rejectedToday,
        recentApplications,
        applicationTrends,
        operatorLogs: finalOperatorLogs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /applications/stats — citizen stats aggregation ───────────────────────
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const citizenId = req.user!.id;
    const { Application, DocumentRecord, Transaction } = getModels();

    // 1. Active Applications (not draft, not completed, not rejected)
    const activeApplications = await Application.countDocuments({
      citizenId,
      status: { $nin: [ApplicationStatus.DRAFT, ApplicationStatus.COMPLETED, ApplicationStatus.REJECTED] }
    });

    // 2. Services Completed
    const servicesCompleted = await Application.countDocuments({
      citizenId,
      status: ApplicationStatus.COMPLETED
    });

    // 3. Stored Documents
    const storedDocuments = await DocumentRecord.countDocuments({
      ownerId: citizenId
    });

    // 4. Payments This Month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Sum totalAmount of paid applications this month
    const paidApps = await Application.find({
      citizenId,
      paymentStatus: 'paid',
      createdAt: { $gte: startOfMonth }
    }).select('totalAmount');
    
    const paymentsThisMonth = paidApps.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);

    res.json({
      success: true,
      data: {
        activeApplications,
        servicesCompleted,
        storedDocuments,
        paymentsThisMonth: paymentsThisMonth / 100 // Convert from paise to INR
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
