import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';

// Types
interface SendOtpInput { phone: string }
interface VerifyOtpInput { phone: string; otp: string; name?: string }
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: { id: string; name: string; role: string; isVerified: boolean; district?: string; state?: string };
}

// API functions
export const sendOtp = (data: SendOtpInput) => {
  return apiClient.post('/auth/send-otp', data)
    .then((r) => r.data.data as { message: string; devOtp?: string });
};

export const verifyOtp = (data: VerifyOtpInput): Promise<AuthResponse> =>
  apiClient.post('/auth/verify-otp', data).then((r) => r.data.data);

export const logout = (refreshToken: string) =>
  apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data);

// React Query mutations
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
