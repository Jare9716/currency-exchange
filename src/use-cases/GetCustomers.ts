import { Customer, CustomerRepository, CustomerFilters } from "@/domain/Customer";

export class GetCustomers {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(filters?: CustomerFilters): Promise<{ items: Customer[]; total: number }> {
    return await this.customerRepository.findAll(filters);
  }
}
