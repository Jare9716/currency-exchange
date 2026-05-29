import { Shift, OpenShiftPayload, ShiftRepository } from "@/domain/Shift";
import { DomainError } from "@/domain/Errors";

export class OpenShift {
  constructor(private shiftRepository: ShiftRepository) {}

  async execute(payload: OpenShiftPayload): Promise<Shift> {
    if (!payload.branch_code) {
      throw new DomainError("validation_error", "El código de sucursal es obligatorio");
    }
    const cash = Number(payload.opening_cash_cop);
    if (isNaN(cash) || cash < 0) {
      throw new DomainError("validation_error", "El saldo inicial de caja en COP debe ser mayor o igual a cero");
    }
    return this.shiftRepository.open(payload);
  }
}

import { shiftRepository } from "@/infrastructure/http/HttpShiftRepository";
export const openShift = new OpenShift(shiftRepository);
