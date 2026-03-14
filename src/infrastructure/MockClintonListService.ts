import { ClintonListService } from '../domain/ClintonListService';

export class MockClintonListService implements ClintonListService {
  async isBlocked(name: string, _identifier: string): Promise<boolean> {
    // Mock logic: Block any user whose name includes "Clinton" or "Block" or "Reportado"
    const lowerName = name.toLowerCase();
    if (lowerName.includes('clinton') || lowerName.includes('block')) {
      return true;
    }
    return false;
  }
}

export const clintonListService = new MockClintonListService();
