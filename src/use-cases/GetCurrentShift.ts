import { Shift, ShiftRepository } from "@/domain/Shift";

export class GetCurrentShift {
  constructor(private shiftRepository: ShiftRepository) {}

  async execute(branchCode: string): Promise<Shift | undefined> {
    return this.shiftRepository.getCurrent(branchCode);
  }
}

import { shiftRepository } from "@/infrastructure/http/HttpShiftRepository";
export const getCurrentShift = new GetCurrentShift(shiftRepository);
