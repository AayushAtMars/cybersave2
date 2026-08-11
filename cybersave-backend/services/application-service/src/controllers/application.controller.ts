import { Request, Response } from 'express';
import { Application } from '../models/Application';
import { Service } from '../models/Service';
import { ApplicationStatus } from '@cybersave/shared';
import { triggerNotification } from '../utils/notification';


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

  const filter: Record<string, unknown> = { citizenId };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Application.find(filter)
      .select('-formData -timeline')  // Omit heavy fields from list view
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

  const application = await Application.findOne({ _id: id, citizenId, status: ApplicationStatus.DRAFT });
  if (!application) {
    res.status(404).json({ success: false, error: 'Draft application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  // Each step merges its payload into the application
  const updates: Partial<typeof application> = { currentStep: Math.max(application.currentStep, stepNum + 1) };

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

// ── POST /applications/:id/submit — called by payment webhook ─────────────────
// This is an internal endpoint — called by payment-service, not directly by the citizen
export const submitApplication = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { paymentGatewayRef, paymentOrderId } = req.body as {
    paymentGatewayRef: string;
    paymentOrderId: string;
  };

  const application = await Application.findById(id);
  if (!application) {
    res.status(404).json({ success: false, error: 'Application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  if (application.status !== ApplicationStatus.DRAFT) {
    // Idempotent — if already submitted, return success (payment webhook retry protection)
    res.json({ success: true, data: { message: 'Already submitted', status: application.status } });
    return;
  }

  // Fetch service to compute SLA deadline
  const service = await Service.findById(application.serviceId);
  const slaDeadline = service
    ? new Date(Date.now() + service.slaHours * 60 * 60 * 1000)
    : undefined;

  application.status = ApplicationStatus.SUBMITTED;
  application.paymentGatewayRef = paymentGatewayRef;
  application.paymentOrderId = paymentOrderId;
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

  // Trigger notification
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

  const query: Record<string, unknown> = {
    status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, 'docs_pending', 'processing'] },
  };

  if (filterType === 'mine') {
    query.assignedOperatorId = operatorId;
  } else if (filterType === 'unassigned') {
    query.assignedOperatorId = { $exists: false };
  } else {
    // Show both unassigned and mine
    query.$or = [{ assignedOperatorId: operatorId }, { assignedOperatorId: { $exists: false } }];
  }

  const [items, total] = await Promise.all([
    Application.find(query)
      .sort({ slaDeadline: 1 }) // closest deadline first — SLA urgency sorted!
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
  
  // Trigger notification
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

  const application = await Application.findById(id);
  if (!application) {
    res.status(404).json({ success: false, error: 'Application not found', errorCode: 'APPLICATION_NOT_FOUND' });
    return;
  }

  // Remove existing verification records for this document
  application.verifiedDocuments = application.verifiedDocuments.filter((d) => d.documentId !== documentId);
  application.verifiedDocuments.push({ documentId, status, comments });

  application.timeline.push({
    event: `Document verification: ${status}`,
    actorId: operatorId,
    actorRole: 'operator',
    note: `Doc ID: ${documentId}${comments ? ` - Reason: ${comments}` : ''}`,
    timestamp: new Date(),
  });

  // If a document was rejected, automatically flip application status to docs_pending
  if (status === 'rejected') {
    application.status = 'docs_pending' as any;
    application.rejectionReason = comments;
  }

  await application.save();

  // Trigger notification
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

  // Trigger notification
  triggerNotification(
    application.citizenId,
    `Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
    `The status of your application ${application.applicationRefNo} (${application.serviceName}) has changed to ${status.replace('_', ' ')}.`,
    'application_update'
  );

  res.json({ success: true, data: { application } });
};

// ── GET /applications/admin/stats — admin stats aggregation ──────────────────
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalApplications = await Application.countDocuments();
    const pendingReview = await Application.countDocuments({
      status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, 'docs_pending'] },
    });
    const completedCount = await Application.countDocuments({ status: ApplicationStatus.COMPLETED });
    
    // SLA breached: deadline in the past and status is not completed/rejected
    const slaBreached = await Application.countDocuments({
      slaDeadline: { $lt: new Date() },
      status: { $nin: [ApplicationStatus.COMPLETED, ApplicationStatus.REJECTED, ApplicationStatus.DRAFT] },
    });

    // Simple revenue aggregator (only paid applications)
    const paidApps = await Application.find({ paymentStatus: 'paid' }).select('totalAmount');
    const totalRevenue = paidApps.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);

    // Today's boundaries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Today's metrics
    const paidToday = await Application.find({
      paymentStatus: 'paid',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).select('totalAmount govtFee convenienceFee');
    
    const revenueToday = paidToday.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);

    // Dynamic Online vs Cash Collections split: Govt Fee is online, Convenience Fee is Cash
    let onlineRevenueToday = 0;
    let cashRevenueToday = 0;
    paidToday.forEach(app => {
      // Sum the actual document fee components dynamically
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

    // Distribution by service category (aggregate share)
    const categoryDistribution = await Application.aggregate([
      { $group: { _id: '$serviceName', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ]);

    // Recent 5 applications
    const recentApplicationsRaw = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const recentApplications = recentApplicationsRaw.map((app) => ({
      ...app,
      totalAmount: (app.totalAmount ?? 0) / 100,
    }));

    // Query real operator logs from timeline across all applications
    const appsWithOperatorTimeline = await Application.find({
      'timeline.actorRole': 'operator'
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

    const operatorLogsList: any[] = [];
    appsWithOperatorTimeline.forEach(app => {
      app.timeline.forEach(event => {
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

    // Sort by timestamp desc and take top 5
    operatorLogsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const finalOperatorLogs = operatorLogsList.slice(0, 5);

    // 7 Days Charts Data (Revenue & Trends)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueOverview = [];
    const applicationTrends = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

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

      revenueOverview.push({
        day: daysOfWeek[d.getDay()],
        revenue: dayRev / 100
      });

      applicationTrends.push({
        day: daysOfWeek[d.getDay()],
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



// ── PATCH /applications/:id/certificate — admin uploads certificate URL ────────
export const uploadCertificate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { certificateUrl, department } = req.body as { certificateUrl: string; department?: string };
  const operatorId = (req.headers['x-user-id'] as string) ?? 'admin';

  if (!certificateUrl) {
    res.status(400).json({ success: false, error: 'certificateUrl is required' });
    return;
  }

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

// ── GET /applications/admin/all — admin: list ALL applications ─────────────────
export const listAllApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = Math.min(parseInt((req.query.limit as string) ?? '8', 10), 100);
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const assigned = req.query.assigned as string | undefined;
    const citizenId = req.query.citizenId as string | undefined;

    const filter: Record<string, any> = {};

    if (citizenId) {
      filter.citizenId = citizenId;
    } else {
      filter.status = { $ne: ApplicationStatus.DRAFT }; // Exclude drafts from general admin listing
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

    // Category mapping based on serviceName regex
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

    // Assignment filter
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

    // Format monetary value from paise to rupees
    const items = itemsRaw.map(item => ({
      ...item,
      totalAmount: (item.totalAmount ?? 0) / 100
    }));

    // Calculate real stats metrics
    const totalApplications = await Application.countDocuments({ status: { $ne: ApplicationStatus.DRAFT } });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const todayReceived = await Application.countDocuments({
      status: { $ne: ApplicationStatus.DRAFT },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const pendingReview = await Application.countDocuments({
      status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, 'docs_pending'] }
    });

    const inProcessing = await Application.countDocuments({
      status: 'processing'
    });

    const completedToday = await Application.countDocuments({
      status: ApplicationStatus.COMPLETED,
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Pipeline steps
    const pipeline = {
      submitted: await Application.countDocuments({ status: ApplicationStatus.SUBMITTED }),
      underReview: await Application.countDocuments({ status: ApplicationStatus.UNDER_REVIEW }),
      processing: await Application.countDocuments({ status: 'processing' }),
      approved: await Application.countDocuments({ status: ApplicationStatus.APPROVED || 'approved' }),
      completed: await Application.countDocuments({ status: ApplicationStatus.COMPLETED }),
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
          totalApplications,
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

// ── POST /applications/admin/create — admin: create citizen application directly ──────
export const createApplicationByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { citizenId, serviceId, applicantName, applicantPhone, applicantDob, applicantGender, applicantAddress, formData } = req.body;
    const operatorId = req.headers['x-user-id'] as string;
    const operatorName = (req.headers['x-user-name'] as string) ?? 'Admin/Operator';

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
      paymentStatus: 'paid', // Walk-in is marked as pre-paid or cash collected
      timeline: [
        { event: 'Application created by Admin', actorId: operatorId, actorRole: 'operator', timestamp: new Date() },
      ],
    });

    // Send a notification alert to citizen
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
