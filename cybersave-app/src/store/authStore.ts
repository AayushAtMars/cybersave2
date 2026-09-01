import { create } from 'zustand';

interface AuthUser {
  id: string;
  name: string;
  role: string;
  isVerified: boolean;
  phone?: string;
  email?: string;
  dob?: string;
  gender?: string;
  avatar?: string;
  district?: string;
  state?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
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
  sessions?: Array<{
    id: string;
    device: string;
    location: string;
    ip: string;
    lastActive: string | Date;
    type?: string;
  }>;
}


interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  updateTokens: (accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
}


export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),

  updateTokens: (accessToken, refreshToken) =>
    set((state) => ({
      accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
    })),

  clearAuth: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}));


