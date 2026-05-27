import { Shift, ShiftRepository, CloseShiftPayload } from "@/domain/Shift";
import { DomainError } from "@/domain/Errors";

export class CloseShift {
  constructor(private shiftRepository: ShiftRepository) {}

  async execute(shiftId: string, payload: CloseShiftPayload): Promise<Shift> {
    if (!shiftId) {
      throw new DomainError("validation_error", "El ID de turno es obligatorio para cerrar el turno");
    }
    if (!payload || !payload.physical_counts || payload.physical_counts.length === 0) {
      throw new DomainError("validation_error", "Se requiere el conteo físico de divisas para cerrar el turno");
    }
    return this.shiftRepository.close(shiftId, payload);
  }
}

import { shiftRepository } from "@/infrastructure/http/HttpShiftRepository";
export const closeShift = new CloseShift(shiftRepository);
