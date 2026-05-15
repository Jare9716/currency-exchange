import { Customer, CustomerRepository } from "@/domain/Customer";

export class CreateCustomer {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(customer: Customer): Promise<void> {
    await this.customerRepository.save(customer);
  }
}
