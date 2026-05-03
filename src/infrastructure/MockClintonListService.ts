import { ClintonListService } from "@/domain/ClintonListService";

/**
 * TEMPORARY IMPLEMENTATION
 * This is a mock service for development and testing purposes.
 * It will be replaced by a real external API integration in the future.
 */
export class MockClintonListService implements ClintonListService {
  async isBlocked(name: string, identifier: string): Promise<boolean> {
    // Mock logic: Block any user whose name includes "Clinton" or "Block" or "Reportado"
    const lowerName = name.toLowerCase();
    if (lowerName.includes("clinton") || lowerName.includes("block") || identifier === "0000000000") {
      return true;
    }
    return false;
  }
}

export const clintonListService = new MockClintonListService();
