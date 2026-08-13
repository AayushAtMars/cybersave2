import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';

// ── Types ────────────────────────────────────────────────────────────────────
interface SendOtpInput { phone: string }
interface VerifyOtpInput { phone: string; otp: string; name?: string }
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: { id: string; name: string; role: string; isVerified: boolean; district?: string; state?: string };
}

// ── API functions ─────────────────────────────────────────────────────────────
export const sendOtp = (data: SendOtpInput) => {
  console.log('[API REQUEST] POST /auth/send-otp payload:', data);
  return apiClient.post('/auth/send-otp', data)
    .then((r) => {
      console.log('[API SUCCESS] /auth/send-otp:', r.data);
      // In dev mode the backend returns devOtp so the tester doesn't need server logs
      return r.data.data as { message: string; devOtp?: string };
    })
    .catch((err) => {
      console.error('[API ERROR] /auth/send-otp failed. Details:', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
        data: err.response?.data,
      });
      throw err;
    });
};



export const verifyOtp = (data: VerifyOtpInput): Promise<AuthResponse> =>
  apiClient.post('/auth/verify-otp', data).then((r) => r.data.data);

export const logout = (refreshToken: string) =>
  apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data);

// ── React Query mutations ─────────────────────────────────────────────────────
export const useSendOtp = () =>
  useMutation({
    mutationFn: sendOtp,
  });

export const useVerifyOtp = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data, variables) => {
      setAuth({ ...data.user, phone: variables.phone }, data.accessToken, data.refreshToken);
    },
  });
};

export const useUpdateProfile = () => {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (data: { dob?: string; gender?: string; email?: string; avatar?: string; aadhaarNumber?: string; panNumber?: string }) =>
      apiClient.patch('/auth/profile', data).then((r) => r.data.data),
    onSuccess: (data) => {
      updateUser(data.user);
    },
  });
};

export const useUpdateAddress = () => {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (data: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      addresses?: Array<{
        id: string;
        label: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
        isDefault: boolean;
      }>;
    }) => apiClient.patch('/auth/profile/address', data).then((r) => r.data.data),
    onSuccess: (data) => {
      updateUser({ address: data.address, addresses: data.addresses });
    },
  });
};

