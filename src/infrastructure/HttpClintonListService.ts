import { ClintonListService } from "@/domain/ClintonListService";
import { HttpClient } from "@/infrastructure/http/HttpClient";

export class HttpClintonListService implements ClintonListService {
  async isBlocked(name: string, identifier: string): Promise<boolean> {
    try {
      const response = await HttpClient.get(
        `/api/v1/clinton-list/persons/by-name?name=${name}&idNumber=${identifier}`
      );
      
      const data = await response.json();
      return data.matchCount > 0;
    } catch (error) {
      console.error("Error consultando Clinton list:", error);
      return false; // Fail open or closed depending on requirements. Returning false matches current UI logic.
    }
  }
}

export const clintonListService = new HttpClintonListService();
