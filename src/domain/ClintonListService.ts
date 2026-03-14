export interface ClintonListService {
  isBlocked(name: string, identifier: string): Promise<boolean>;
}
