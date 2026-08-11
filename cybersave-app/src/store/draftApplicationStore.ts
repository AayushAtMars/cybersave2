import { create } from 'zustand';

// Mirrors the Application model from application-service (architecture.md §3)
export interface DraftApplication {
  id: string;
  applicationRefNo: string;
  serviceId: string;
  serviceName: string;
  totalAmount: number; // in paise
  govtFee?: number; // in paise
  convenienceFee?: number; // in paise
  currentStep: number;
  // Step 1 — personal details
  applicantName?: string;
  applicantPhone?: string;
  applicantDob?: string;
  applicantGender?: string;
  applicantAddress?: Record<string, unknown>;
  // Step 2 — service-specific form
  formData?: Record<string, unknown>;
  // Step 3 — uploaded document IDs
  documentIds?: string[];
  // Step 4 — review confirmed
  reviewConfirmed?: boolean;
  declarationAccepted?: boolean;
}

interface DraftState {
  draft: DraftApplication | null;
  setDraft: (draft: DraftApplication) => void;
  updateDraft: (partial: Partial<DraftApplication>) => void;
  clearDraft: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  draft: null,

  setDraft: (draft) => set({ draft }),

  updateDraft: (partial) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, ...partial } : null,
    })),

  clearDraft: () => set({ draft: null }),
}));
