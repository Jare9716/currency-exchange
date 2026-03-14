import { ClintonListService } from "../domain/ClintonListService";

export class ValidateClintonList {
  constructor(private clintonListService: ClintonListService) {}

  async execute(name: string, identifier: string): Promise<boolean> {
    return await this.clintonListService.isBlocked(name, identifier);
  }
}
