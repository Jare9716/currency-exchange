import { z } from "zod";

export const shiftCurrencySchema = z.object({
  id: z.string(),
  iso_code: z.string(),
  reference_rate: z.string(),
  rate_source: z.string(),
  proposed_buy_rate: z.string(),
  proposed_sell_rate: z.string(),
  approved_buy_rate: z.string(),
  approved_sell_rate: z.string(),
  rate_status: z.string(),
  volatility_flagged: z.boolean(),
  volatility_pct: z.string(),
  base_units: z.string(),
  units_purchased: z.string(),
  units_sold: z.string(),
  profit_cop: z.string(),
});

export type ShiftCurrency = z.infer<typeof shiftCurrencySchema>;

export const shiftSchema = z.object({
  id: z.string(),
  date: z.string(),
  operator_id: z.string(),
  branch_code: z.string(),
  official_trm: z.string().optional(),
  buy_rate: z.string().optional(),
  sell_rate: z.string().optional(),
  opening_cash_cop: z.string(),
  status: z.enum(["open", "closed"]),
  opened_at: z.string(),
  closed_at: z.string().optional(),
  currencies: z.array(shiftCurrencySchema),
});

export type Shift = z.infer<typeof shiftSchema>;

export const shiftSummarySchema = z.object({
  shift: shiftSchema,
  total_cop_purchased: z.string(),
  total_cop_sold: z.string(),
  total_profit_cop: z.string(),
  transaction_count: z.number(),
});

export type ShiftSummary = z.infer<typeof shiftSummarySchema>;

export const rateProposalCurrencySchema = z.object({
  iso_code: z.string(),
  name: z.string(),
  reference_rate: z.string(),
  rate_source: z.string(),
  proposed_buy_rate: z.string(),
  proposed_sell_rate: z.string(),
  spread: z.string(),
  volatility_pct: z.string(),
  volatility_flagged: z.boolean(),
  guard_rail_ok: z.boolean(),
  guard_rail_message: z.string().optional(),
});

export type RateProposalCurrency = z.infer<typeof rateProposalCurrencySchema>;

export const rateProposalSchema = z.object({
  proposal_date: z.string(),
  currencies: z.array(rateProposalCurrencySchema),
});

export type RateProposal = z.infer<typeof rateProposalSchema>;

export interface OpenShiftCurrencyPayload {
  iso_code: string;
  buy_rate_override?: string;
  sell_rate_override?: string;
}

export interface OpenShiftPayload {
  branch_code: string;
  opening_cash_cop: string;
  currencies: OpenShiftCurrencyPayload[];
}

export interface PhysicalCount {
  iso_code: string;
  amount: number;
}

export interface CloseShiftPayload {
  physical_counts: PhysicalCount[];
}

export interface ShiftRepository {
  getCurrent(branchCode: string): Promise<Shift | undefined>;
  getRateProposal(date?: string): Promise<RateProposal>;
  open(payload: OpenShiftPayload): Promise<Shift>;
  close(shiftId: string, payload: CloseShiftPayload): Promise<Shift>;
  getSummary(shiftId: string): Promise<ShiftSummary>;
}
