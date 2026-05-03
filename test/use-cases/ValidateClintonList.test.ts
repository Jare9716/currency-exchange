import { ValidateClintonList } from '@/use-cases/ValidateClintonList';
import { ClintonListService } from '@/domain/ClintonListService';

describe('ValidateClintonList', () => {
  let clintonListService: jest.Mocked<ClintonListService>;
  let validateClintonList: ValidateClintonList;

  beforeEach(() => {
    clintonListService = {
      isBlocked: jest.fn(),
    } as jest.Mocked<ClintonListService>;
    validateClintonList = new ValidateClintonList(clintonListService);
  });

  it('should return true if the client is in the Clinton List', async () => {
    // Arrange
    const name = 'Pablo Escobar';
    const identifier = '12345678';
    clintonListService.isBlocked.mockResolvedValue(true);

    // Act
    const result = await validateClintonList.execute(name, identifier);

    // Assert
    expect(result).toBe(true);
    expect(clintonListService.isBlocked).toHaveBeenCalledWith(name, identifier);
  });

  it('should return false if the client is not in the Clinton List', async () => {
    // Arrange
    const name = 'Jane Doe';
    const identifier = '87654321';
    clintonListService.isBlocked.mockResolvedValue(false);

    // Act
    const result = await validateClintonList.execute(name, identifier);

    // Assert
    expect(result).toBe(false);
  });
});
