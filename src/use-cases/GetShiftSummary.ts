import { ShiftSummary, ShiftRepository } from "@/domain/Shift";
import { DomainError } from "@/domain/Errors";

export class GetShiftSummary {
  constructor(private shiftRepository: ShiftRepository) {}

  async execute(shiftId: string): Promise<ShiftSummary> {
    if (!shiftId) {
      throw new DomainError("validation_error", "El ID de turno es obligatorio para obtener el resumen");
    }
    return this.shiftRepository.getSummary(shiftId);
  }
}

import { shiftRepository } from "@/infrastructure/http/HttpShiftRepository";
export const getShiftSummary = new GetShiftSummary(shiftRepository);
