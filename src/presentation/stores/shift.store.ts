import { create } from "zustand";
import { Shift, RateProposal, ShiftSummary, OpenShiftPayload } from "@/domain/Shift";
import { getCurrentShift } from "@/use-cases/GetCurrentShift";
import { getRateProposal } from "@/use-cases/GetRateProposal";
import { openShift as openShiftUseCase } from "@/use-cases/OpenShift";
import { closeShift as closeShiftUseCase } from "@/use-cases/CloseShift";
import { getShiftSummary } from "@/use-cases/GetShiftSummary";

interface ShiftState {
  activeShift?: Shift;
  rateProposal?: RateProposal;
  summary?: ShiftSummary;
  isLoading: boolean;
  error?: string;
  fetchActiveShift: (branchCode: string) => Promise<void>;
  fetchRateProposal: () => Promise<void>;
  openShift: (payload: OpenShiftPayload) => Promise<void>;
  closeActiveShift: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  resetShift: () => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  activeShift: undefined,
  rateProposal: undefined,
  summary: undefined,
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
  closeActiveShift: async () => {
    const { activeShift } = get();
    if (!activeShift) {
      set({ error: "No hay un turno activo para cerrar" });
      return;
    }
    set({ isLoading: true, error: undefined });
    try {
      await closeShiftUseCase.execute(activeShift.id);
      set({ activeShift: undefined, summary: undefined, error: undefined });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error al cerrar el turno";
      set({ error: errMsg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchSummary: async () => {
    const { activeShift } = get();
    if (!activeShift) return;
    set({ isLoading: true, error: undefined });
    try {
      const summ = await getShiftSummary.execute(activeShift.id);
      set({ summary: summ, error: undefined });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error al obtener el resumen del turno";
      set({ error: errMsg });
    } finally {
      set({ isLoading: false });
    }
  },
  resetShift: () =>
    set({
      activeShift: undefined,
      rateProposal: undefined,
      summary: undefined,
      isLoading: false,
      error: undefined,
    }),
}));
