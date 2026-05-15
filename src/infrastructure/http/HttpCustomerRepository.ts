import { Customer, CustomerRepository, customerSchema, CustomerFilters } from "@/domain/Customer";
import { HttpClient } from "@/infrastructure/http/HttpClient";
import { z } from "zod";

const paginatedCustomersSchema = z.object({
  items: z.array(customerSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
});

export class HttpCustomerRepository implements CustomerRepository {
  async findAll(filters?: CustomerFilters): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/api/v1/customers?${queryString}` : "/api/v1/customers";

    const response = await HttpClient.get(url);
    const data = await response.json();
    const parsed = paginatedCustomersSchema.parse(data);
    return parsed.items;
  }

  async findByDocument(documentNumber: string): Promise<Customer | undefined> {
    const response = await HttpClient.get(`/api/v1/customers?document_number=${documentNumber}`);
    const data = await response.json();
    const parsed = paginatedCustomersSchema.parse(data);
    return parsed.items[0];
  }

  async save(customer: Customer): Promise<void> {
    await HttpClient.post("/api/v1/customers", customer);
  }
}

export const customerRepository = new HttpCustomerRepository();
