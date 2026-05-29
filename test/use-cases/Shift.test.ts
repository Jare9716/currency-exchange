import { GetCurrentShift } from "@/use-cases/GetCurrentShift";
import { GetRateProposal } from "@/use-cases/GetRateProposal";
import { OpenShift } from "@/use-cases/OpenShift";
import { CloseShift } from "@/use-cases/CloseShift";
import { ShiftRepository, Shift, RateProposal } from "@/domain/Shift";
import { DomainError } from "@/domain/Errors";

describe("Shift Use Cases", () => {
  let shiftRepository: jest.Mocked<ShiftRepository>;

  beforeEach(() => {
    shiftRepository = {
      getCurrent: jest.fn(),
      getRateProposal: jest.fn(),
      open: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<ShiftRepository>;
  });

  describe("GetCurrentShift", () => {
    it("should return active shift details when found", async () => {
      const mockShift: Shift = {
        id: "shift-123",
        date: "2026-05-12",
        operator_id: "operator-1",
        branch_code: "BOG01",
        opening_cash_cop: "2000000.00",
        status: "open",
        opened_at: new Date().toISOString(),
        currencies: [],
      };
      shiftRepository.getCurrent.mockResolvedValue(mockShift);

      const useCase = new GetCurrentShift(shiftRepository);
      const result = await useCase.execute("BOG01");

      expect(result).toBe(mockShift);
      expect(shiftRepository.getCurrent).toHaveBeenCalledWith("BOG01");
    });

    it("should return undefined when no shift is open", async () => {
      shiftRepository.getCurrent.mockResolvedValue(undefined);

      const useCase = new GetCurrentShift(shiftRepository);
      const result = await useCase.execute("BOG01");

      expect(result).toBeUndefined();
    });
  });

  describe("GetRateProposal", () => {
    it("should return rate proposal data", async () => {
      const mockProposal: RateProposal = {
        proposal_date: "2026-05-12",
        currencies: [],
      };
      shiftRepository.getRateProposal.mockResolvedValue(mockProposal);

      const useCase = new GetRateProposal(shiftRepository);
      const result = await useCase.execute();

      expect(result).toBe(mockProposal);
      expect(shiftRepository.getRateProposal).toHaveBeenCalled();
    });
  });

  describe("OpenShift", () => {
    it("should successfully open shift with valid params", async () => {
      const mockShift: Shift = {
        id: "shift-123",
        date: "2026-05-12",
        operator_id: "operator-1",
        branch_code: "BOG01",
        opening_cash_cop: "2000000.00",
        status: "open",
        opened_at: new Date().toISOString(),
        currencies: [],
      };
      shiftRepository.open.mockResolvedValue(mockShift);

      const useCase = new OpenShift(shiftRepository);
      const result = await useCase.execute({
        branch_code: "BOG01",
        opening_cash_cop: "2000000.00",
        currencies: [{ iso_code: "USD" }],
      });

      expect(result).toBe(mockShift);
      expect(shiftRepository.open).toHaveBeenCalledWith(
        expect.objectContaining({
          branch_code: "BOG01",
          opening_cash_cop: "2000000.00",
          currencies: [{ iso_code: "USD" }],
        })
      );
    });

    it("should throw DomainError if branch_code is missing", async () => {
      const useCase = new OpenShift(shiftRepository);
      await expect(
        useCase.execute({
          branch_code: "",
          opening_cash_cop: "2000000",
          currencies: [{ iso_code: "USD" }],
        })
      ).rejects.toThrow(DomainError);
    });

    it("should throw DomainError if opening_cash_cop is negative", async () => {
      const useCase = new OpenShift(shiftRepository);
      await expect(
        useCase.execute({
          branch_code: "BOG01",
          opening_cash_cop: "-500",
          currencies: [{ iso_code: "USD" }],
        })
      ).rejects.toThrow(DomainError);
    });
  });

  describe("CloseShift", () => {
    it("should successfully close shift when payload is valid", async () => {
      const mockShift: Shift = {
        id: "shift-123",
        date: "2026-05-12",
        operator_id: "operator-1",
        branch_code: "BOG01",
        opening_cash_cop: "2000000.00",
        status: "closed",
        opened_at: new Date().toISOString(),
        closed_at: new Date().toISOString(),
        currencies: [],
      };
      const mockPayload = {
        physical_counts: [{ iso_code: "COP", amount: 2000000 }],
      };
      shiftRepository.close.mockResolvedValue(mockShift);

      const useCase = new CloseShift(shiftRepository);
      const result = await useCase.execute("shift-123", mockPayload);

      expect(result).toBe(mockShift);
      expect(shiftRepository.close).toHaveBeenCalledWith("shift-123", mockPayload);
    });

    it("should throw DomainError if physical_counts is missing", async () => {
      const useCase = new CloseShift(shiftRepository);
      await expect(useCase.execute("shift-123", { physical_counts: [] })).rejects.toThrow(DomainError);
    });

    it("should throw DomainError if shiftId is missing", async () => {
      const useCase = new CloseShift(shiftRepository);
      await expect(
        useCase.execute("", { physical_counts: [{ iso_code: "COP", amount: 2000000 }] })
      ).rejects.toThrow(DomainError);
    });
  });
});
