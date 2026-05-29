import {
  Shift,
  RateProposal,
  OpenShiftPayload,
  CloseShiftPayload,
  ShiftRepository,
} from "@/domain/Shift";
import { HttpClient } from "@/infrastructure/http/HttpClient";
import { ApiError } from "@/domain/Errors";
import { z } from "zod";

const apiShiftCurrencySchema = z.object({
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
  volatility_pct: z.string().nullish().transform((val) => val ?? "0.00"),
  base_units: z.string().nullish().transform((val) => val ?? "0.00"),
  units_purchased: z.string().nullish().transform((val) => val ?? "0.00"),
  units_sold: z.string().nullish().transform((val) => val ?? "0.00"),
  profit_cop: z.string().nullish().transform((val) => val ?? "0.00"),
});

const apiShiftSchema = z.object({
  id: z.string(),
  date: z.string(),
  operator_id: z.string(),
  branch_code: z.string(),
  official_trm: z.string().nullish().transform((val) => val ?? undefined),
  buy_rate: z.string().nullish().transform((val) => val ?? undefined),
  sell_rate: z.string().nullish().transform((val) => val ?? undefined),
  opening_cash_cop: z.string(),
  status: z.enum(["open", "closed"]),
  opened_at: z.string(),
  closed_at: z.string().nullish().transform((val) => val ?? undefined),
  currencies: z.array(apiShiftCurrencySchema).nullish().transform((val) => val ?? []),
});

const apiRateProposalCurrencySchema = z.object({
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
  guard_rail_message: z.string().nullish().transform((val) => val ?? undefined),
});

const apiRateProposalSchema = z.object({
  proposal_date: z.string(),
  currencies: z.array(apiRateProposalCurrencySchema).nullish().transform((val) => val ?? []),
});

export class HttpShiftRepository implements ShiftRepository {
  async getCurrent(branchCode: string): Promise<Shift | undefined> {
    try {
      const response = await HttpClient.get(
        `/api/v1/fx/shifts/current?branch_code=${encodeURIComponent(branchCode)}`
      );
      const data = await response.json();
      return apiShiftSchema.parse(data);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404 && error.errorCode === "NO_OPEN_SHIFT") {
        return undefined;
      }
      throw error;
    }
  }

  async getRateProposal(date?: string): Promise<RateProposal> {
    const url = date
      ? `/api/v1/fx/shifts/rate-proposal?proposal_date=${encodeURIComponent(date)}`
      : "/api/v1/fx/shifts/rate-proposal";
    const response = await HttpClient.get(url);
    const data = await response.json();
    return apiRateProposalSchema.parse(data);
  }

  async open(payload: OpenShiftPayload): Promise<Shift> {
    const apiPayload = {
      branch_code: payload.branch_code,
      opening_cash_cop: payload.opening_cash_cop,
    };
    const response = await HttpClient.post("/api/v1/fx/shifts/open", apiPayload);
    const data = await response.json();
    return apiShiftSchema.parse(data);
  }

  async close(shiftId: string, payload: CloseShiftPayload): Promise<Shift> {
    const apiPayload = {
      physical_counts: payload.physical_counts.map((c) => ({
        iso_code: c.iso_code,
        count: c.amount,
      })),
    };
    const response = await HttpClient.post(
      `/api/v1/fx/shifts/${encodeURIComponent(shiftId)}/close`,
      apiPayload
    );
    const data = await response.json();
    const shiftData = data && typeof data === "object" && "shift" in data ? data.shift : data;
    return apiShiftSchema.parse(shiftData);
  }


}

export const shiftRepository = new HttpShiftRepository();
