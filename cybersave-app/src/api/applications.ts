import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RequiredDocument {
  name: string;
  description?: string;
  mandatory: boolean;
  acceptedFormats: string[];
  maxSizeMb: number;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'aadhaar';
  placeholder?: string;
  required: boolean;
  options?: string[];
  maxLength?: number;
}

export interface Service {
  _id: string;
  name: string;
  description?: string;
  category: string;
  department: string;
  govtFee: number;
  convenienceFee: number;
  totalFee: number;
  slaHours: number;
  eligibility?: string[];
  requiredDocuments: RequiredDocument[];
  formFields: FormField[];
  isActive: boolean;
}


export interface Application {
  _id: string;
  applicationRefNo: string;
  citizenId: string;
  serviceId: string;
  serviceName: string;
  status: string;
  currentStep: number;
  totalAmount: number;
  govtFee: number;
  convenienceFee: number;
  paymentStatus: string;
  paymentGatewayRef?: string;
  slaDeadline?: string;
  rejectionReason?: string;
  assignedOperatorName?: string;
  completedAt?: string;
  certificateUrl?: string;    // set by admin after approval
  department?: string;        // department handling the application
  timeline: Array<{ event: string; actorRole: string; note?: string; timestamp: string }>;
  documentIds: string[];
  applicantName?: string;
  applicantPhone?: string;
  applicantDob?: string;
  applicantGender?: string;
  applicantAddress?: Record<string, unknown>;
  formData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Services ──────────────────────────────────────────────────────────────────
export const useServices = (category?: string) =>
  useQuery<PaginatedResponse<Service>>({
    queryKey: ['services', category],
    queryFn: () =>
      apiClient
        .get('/services', { params: { category, limit: 50 } })
        .then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // 5 min — service catalog doesn't change often
  });

export const useService = (id: string) =>
  useQuery<Service>({
    queryKey: ['services', id],
    queryFn: () => apiClient.get(`/services/${id}`).then((r) => r.data.data.service),
    enabled: !!id,
  });

// ── Applications ──────────────────────────────────────────────────────────────
export const useApplications = (status?: string) =>
  useQuery<PaginatedResponse<Application>>({
    queryKey: ['applications', status],
    queryFn: () =>
      apiClient
        .get('/applications', { params: { status, limit: 20 } })
        .then((r) => r.data.data),
  });

export const useApplication = (id: string) =>
  useQuery<Application>({
    queryKey: ['applications', id],
    queryFn: () =>
      apiClient.get(`/applications/${id}`).then((r) => r.data.data.application),
    enabled: !!id,
  });

export const useCreateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) =>
      apiClient.post('/applications', { serviceId }).then((r) => r.data.data.application),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
};

export const useSaveWizardStep = (id: string) =>
  useMutation({
    mutationFn: ({ step, data }: { step: number; data: Record<string, unknown> }) =>
      apiClient.patch(`/applications/${id}/step/${step}`, data).then((r) => r.data.data),
  });

// ── Payments ──────────────────────────────────────────────────────────────────
export const useCreateOrder = () =>
  useMutation({
    mutationFn: ({ applicationId, amount }: { applicationId: string; amount: number }) =>
      apiClient.post('/payments/orders', { applicationId, amount }).then((r) => r.data.data),
  });

export const useWallet = () =>
  useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.get('/payments/wallet').then((r) => r.data.data),
  });

export const useTransactions = () =>
  useQuery({
    queryKey: ['transactions'],
    queryFn: () =>
      apiClient.get('/payments/transactions', { params: { limit: 20 } }).then((r) => r.data.data),
  });

export const useCreateTopupOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) =>
      apiClient.post('/payments/wallet/topup', { amount }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

// ── Admin API ──────────────────────────────────────────────────────────────────────────────
export const useAdminApplications = (status?: string, search?: string) =>
  useQuery<PaginatedResponse<Application>>({
    queryKey: ['admin-applications', status, search],
    queryFn: () =>
      apiClient
        .get('/applications/admin/all', { params: { status, search, limit: 50 } })
        .then((r) => r.data.data),
    staleTime: 30 * 1000,
  });

export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.get('/applications/admin/stats').then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

export const useUploadCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, certificateUrl, department }: { id: string; certificateUrl: string; department?: string }) =>
      apiClient.patch(`/applications/${id}/certificate`, { certificateUrl, department }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) =>
      apiClient.patch(`/applications/${id}/status`, { status, rejectionReason }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
};

