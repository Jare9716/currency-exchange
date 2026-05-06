import { ClintonListService } from "@/domain/ClintonListService";
import { API_BASE_URL } from "@/config";

export class HttpClintonListService implements ClintonListService {
  async isBlocked(name: string, identifier: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/clinton-list/persons/by-name?name=${name}&idNumber=${identifier}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.matchCount > 0;
    } catch (error) {
      console.error("Error consultando Clinton list:", error);
      return false; // Fail open or closed depending on requirements. Returning false matches current UI logic.
    }
  }
}

export const clintonListService = new HttpClintonListService();
