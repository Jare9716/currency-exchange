import { Shift, ShiftRepository } from "@/domain/Shift";
import { DomainError } from "@/domain/Errors";

export class CloseShift {
  constructor(private shiftRepository: ShiftRepository) {}

  async execute(shiftId: string): Promise<Shift> {
    if (!shiftId) {
      throw new DomainError("validation_error", "El ID de turno es obligatorio para cerrar el turno");
    }
    return this.shiftRepository.close(shiftId);
  }
}

import { shiftRepository } from "@/infrastructure/http/HttpShiftRepository";
export const closeShift = new CloseShift(shiftRepository);
