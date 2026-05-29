import { RateProposal, ShiftRepository } from "@/domain/Shift";

export class GetRateProposal {
  constructor(private shiftRepository: ShiftRepository) {}

  async execute(date?: string): Promise<RateProposal> {
    return this.shiftRepository.getRateProposal(date);
  }
}

import { shiftRepository } from "@/infrastructure/http/HttpShiftRepository";
export const getRateProposal = new GetRateProposal(shiftRepository);
