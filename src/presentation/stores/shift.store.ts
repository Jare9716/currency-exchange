import { create } from "zustand";
import { Shift, RateProposal, OpenShiftPayload, CloseShiftPayload } from "@/domain/Shift";
import { getCurrentShift } from "@/use-cases/GetCurrentShift";
import { getRateProposal } from "@/use-cases/GetRateProposal";
import { openShift as openShiftUseCase } from "@/use-cases/OpenShift";
import { closeShift as closeShiftUseCase } from "@/use-cases/CloseShift";

interface ShiftState {
  activeShift?: Shift;
  rateProposal?: RateProposal;
  isLoading: boolean;
  error?: string;
  fetchActiveShift: (branchCode: string) => Promise<void>;
  fetchRateProposal: () => Promise<void>;
  openShift: (payload: OpenShiftPayload) => Promise<void>;
  closeActiveShift: (payload: CloseShiftPayload) => Promise<void>;
  resetShift: () => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  activeShift: undefined,
  rateProposal: undefined,
  isLoading: false,
  error: undefined,
  fetchActiveShift: async (branchCode) => {
    set({ isLoading: true, error: undefined });
    try {
      const shift = await getCurrentShift.execute(branchCode);
      set({ activeShift: shift, error: undefined });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error al obtener el turno activo";
      set({ error: errMsg });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchRateProposal: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const proposal = await getRateProposal.execute();
      set({ rateProposal: proposal, error: undefined });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error al obtener la propuesta de tasas";
      set({ error: errMsg });
    } finally {
      set({ isLoading: false });
    }
  },
  openShift: async (payload) => {
    set({ isLoading: true, error: undefined });
    try {
      const shift = await openShiftUseCase.execute(payload);
      set({ activeShift: shift, error: undefined });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error al abrir el turno";
      set({ error: errMsg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
  closeActiveShift: async (payload) => {
    const { activeShift } = get();
    if (!activeShift) {
      set({ error: "No hay un turno activo para cerrar" });
      return;
    }
    set({ isLoading: true, error: undefined });
    try {
      await closeShiftUseCase.execute(activeShift.id, payload);
      set({ activeShift: undefined, error: undefined });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error al cerrar el turno";
      set({ error: errMsg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
  resetShift: () =>
    set({
      activeShift: undefined,
      rateProposal: undefined,
      isLoading: false,
      error: undefined,
    }),
}));
