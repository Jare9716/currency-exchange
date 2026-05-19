import { ClintonListService } from "@/domain/ClintonListService";
import { HttpClient } from "@/infrastructure/http/HttpClient";
import { z } from "zod";

const apiSanctionSearchResponseSchema = z
  .object({
    results: z.array(
      z
        .object({
          matches: z.array(z.unknown()),
        })
        .loose(),
    ),
  })
  .loose();

export class HttpClintonListService implements ClintonListService {
  async isBlocked(name: string, identifier: string): Promise<boolean> {
    const response = await HttpClient.post(
      "/api/v1/sanction-lists/universal-search",
      {
        cases: [
          {
            name: name,
            idNumber: identifier,
          },
        ],
        minScore: 75,
      },
    );
    
    const data = await response.json();
    const parsed = apiSanctionSearchResponseSchema.parse(data);
    if (parsed.results.length === 0) return false;
    return parsed.results[0].matches.length > 0;
  }
}

export const clintonListService = new HttpClintonListService();
