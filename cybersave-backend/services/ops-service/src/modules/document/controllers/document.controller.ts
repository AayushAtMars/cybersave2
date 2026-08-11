import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { getModels } from '../../../config/models';
import { getUploadUrl, getDownloadUrl, deleteFile } from '../config/storage';
import { RequestUploadUrlSchema } from '@cybersave/shared';
import axios from 'axios';
import { config } from '../../../config';

const getDocumentModel = () => getModels().DocumentRecord;

// ── Fire-and-forget audit emit ───────────────────────────────────────────────
const emitAuditLog = (payload: {
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  category: string;
  resource: string;
  ipAddress: string;
  status: string;
}) => {
  axios.post(`${config.coreServiceUrl}/api/v1/auth/audit/log`, payload).catch(() => {});
};

// ── POST /documents/upload-url ─────────────────────────────────────────────────
export const requestUploadUrl = async (req: Request, res: Response): Promise<void> => {
  const { fileName, mimeType, sizeBytes, documentCategory, applicationId } =
    req.body as typeof RequestUploadUrlSchema._type;

  const citizenId = req.user!.id;
  const DocumentRecord = getDocumentModel();

  // Calculate current storage usage
  const docs = await DocumentRecord.find({ ownerId: citizenId, deletedAt: { $exists: false } });
  const currentUsage = docs.reduce((sum: number, doc: any) => sum + doc.sizeBytes, 0);

  const LIMIT = 50 * 1024 * 1024; // 50 MB
  if (currentUsage + sizeBytes > LIMIT) {
    res.status(400).json({
      success: false,
      error: 'Storage limit exceeded. Maximum limit is 50 MB.',
      errorCode: 'STORAGE_LIMIT_EXCEEDED',
    });
    return;
  }

  const ext = fileName.split('.').pop() ?? 'bin';
  const storageKey = `${citizenId}/${applicationId ?? 'vault'}/${uuidv4()}.${ext}`;

  const { signedUrl, token } = await getUploadUrl(storageKey);

  // Pre-create the metadata record (status: pending until confirmed)
  await DocumentRecord.create({
    ownerId: citizenId,
    applicationId,
    storageKey,
    originalName: fileName,
    mimeType,
    sizeBytes,
    documentCategory,
  });

  res.json({
    success: true,
    data: {
      uploadUrl: signedUrl,
      token,
      storageKey,
    },
  });
};

// ── POST /documents/confirm ───────────────────────────────────────────────────
export const confirmUpload = async (req: Request, res: Response): Promise<void> => {
  const { storageKey } = req.body as { storageKey: string };
  const citizenId = req.user!.id;
  const DocumentRecord = getDocumentModel();

  const doc = await DocumentRecord.findOneAndUpdate(
    { storageKey, ownerId: citizenId },
    { updatedAt: new Date() },
    { new: true }
  );

  if (!doc) {
    res.status(404).json({ success: false, error: 'Document not found', errorCode: 'DOCUMENT_NOT_FOUND' });
    return;
  }

  emitAuditLog({
    userId: citizenId,
    userName: (doc as any).ownerName || 'Citizen User',
    userRole: req.user?.role ?? 'citizen',
    action: 'Document Uploaded',
    category: 'document',
    resource: doc.originalName,
    ipAddress: String(req.ip || req.headers['x-forwarded-for'] || 'Unknown'),
    status: 'success',
  });

  res.json({ success: true, data: { document: { id: doc.id, originalName: doc.originalName, sizeBytes: doc.sizeBytes, documentCategory: doc.documentCategory } } });
};

// ── GET /documents/:id/download-url ──────────────────────────────────────────
export const getDocumentDownloadUrl = async (req: Request, res: Response): Promise<void> => {
  const requesterId = req.user!.id;
  const requesterRole = req.user!.role;
  const { id } = req.params;
  const DocumentRecord = getDocumentModel();

  const doc = await DocumentRecord.findById(id);
  if (!doc || doc.deletedAt) {
    res.status(404).json({ success: false, error: 'Document not found', errorCode: 'DOCUMENT_NOT_FOUND' });
    return;
  }

  const isOwner = doc.ownerId === requesterId;
  const isStaff = ['operator', 'admin', 'super_admin'].includes(requesterRole);
  if (!isOwner && !isStaff) {
    res.status(403).json({ success: false, error: 'Forbidden', errorCode: 'FORBIDDEN' });
    return;
  }

  const downloadUrl = await getDownloadUrl(doc.storageKey);

  emitAuditLog({
    userId: requesterId,
    userName: isStaff ? `Operator (${requesterRole})` : 'Citizen User',
    userRole: requesterRole,
    action: 'Document Download',
    category: 'document',
    resource: doc.originalName,
    ipAddress: String(req.ip || req.headers['x-forwarded-for'] || 'Unknown'),
    status: 'success',
  });

  res.json({ success: true, data: { downloadUrl, expiresInSeconds: 300 } });
};

// ── DELETE /documents/:id ─────────────────────────────────────────────────────
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const { id } = req.params;
  const DocumentRecord = getDocumentModel();

  const doc = await DocumentRecord.findOne({ _id: id, ownerId: citizenId });
  if (!doc) {
    res.status(404).json({ success: false, error: 'Document not found', errorCode: 'DOCUMENT_NOT_FOUND' });
    return;
  }

  const docName = doc.originalName;
  await deleteFile(doc.storageKey);
  doc.deletedAt = new Date();
  await doc.save();

  emitAuditLog({
    userId: citizenId,
    userName: 'Citizen User',
    userRole: req.user?.role ?? 'citizen',
    action: 'Document Deleted',
    category: 'document',
    resource: docName,
    ipAddress: String(req.ip || req.headers['x-forwarded-for'] || 'Unknown'),
    status: 'success',
  });

  res.json({ success: true, data: { message: 'Document deleted' } });
};

// ── GET /documents/cron/retention ─────────────────────────────────────────────
export const runRetentionCleanup = async (req: Request, res: Response): Promise<void> => {
  const secret = req.headers['x-cron-secret'];
  if (secret !== config.cronSecret) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  const DocumentRecord = getDocumentModel();
  const expired = await DocumentRecord.find({
    scheduledDeleteAt: { $lte: new Date() },
    deletedAt: { $exists: false },
  }).limit(100);

  let deleted = 0;
  for (const doc of expired) {
    try {
      await deleteFile(doc.storageKey);
      doc.deletedAt = new Date();
      await doc.save();
      deleted++;
    } catch {
      // Continue
    }
  }

  res.json({ success: true, data: { processed: expired.length, deleted } });
};

// ── GET /documents ─────────────────────────────────────────────────────────────
export const listDocuments = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const DocumentRecord = getDocumentModel();
  const docs = await DocumentRecord.find({ 
    ownerId: citizenId, 
    deletedAt: { $exists: false } 
  }).sort({ createdAt: -1 });

  res.json({ 
    success: true, 
    data: { items: docs, documents: docs } 
  });
};

// ── Admin: GET /documents/admin/all ─────────────────────────────────────────────
export const listAdminDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const DocumentRecord = getDocumentModel();
    const count = await DocumentRecord.countDocuments();
    if (count === 0) {
      const seedDocs = [
        {
          ownerId: 'seed_user_1',
          ownerName: 'Rajesh Kumar',
          storageKey: 'seed/aadhaar.pdf',
          originalName: 'Aadhaar Card',
          mimeType: 'application/pdf',
          sizeBytes: 156000,
          documentCategory: 'id_proof',
          verifiedStatus: 'verified',
          createdAt: new Date('2024-01-12T10:00:00Z'),
          updatedAt: new Date('2024-01-12T10:00:00Z')
        },
        {
          ownerId: 'seed_user_2',
          ownerName: 'Sarah Chen',
          storageKey: 'seed/voter.pdf',
          originalName: 'Voter ID Card',
          mimeType: 'application/pdf',
          sizeBytes: 98000,
          documentCategory: 'id_proof',
          verifiedStatus: 'pending',
          createdAt: new Date('2024-03-20T11:30:00Z'),
          updatedAt: new Date('2024-03-20T11:30:00Z')
        },
      ];
      await DocumentRecord.insertMany(seedDocs);
    }

    const docs = await DocumentRecord.find({ deletedAt: { $exists: false } }).sort({ createdAt: -1 });

    // Connect to core-service's Auth URI (mongoUriApplication is typically the main db string)
    const dbUri = config.mongoUriApplication.includes('cybersave-applications')
      ? config.mongoUriApplication.replace('cybersave-applications', 'cybersave-auth')
      : config.mongoUriApplication;

    const authConn = mongoose.createConnection(dbUri);
    await new Promise((resolve) => authConn.once('open', resolve));

    const UserSchema = new mongoose.Schema({
      name: String
    }, { collection: 'users' });

    const UserModel = authConn.model('User', UserSchema);

    const docsWithNames: any[] = [];
    for (const doc of docs) {
      const docObj = doc.toObject();
      if (!docObj.ownerName) {
        if (mongoose.Types.ObjectId.isValid(docObj.ownerId)) {
          const user = await UserModel.findById(docObj.ownerId).lean();
          docObj.ownerName = user ? (user as any).name : 'Citizen User';
        } else {
          docObj.ownerName = 'Citizen User';
        }
      }
      docsWithNames.push(docObj);
    }

    await authConn.close();

    res.json({ success: true, data: { items: docsWithNames } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
