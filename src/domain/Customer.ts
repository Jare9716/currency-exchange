import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().optional(),
  document_type: z.enum(["CC", "NIT", "CE", "PASAPORTE"]),
  document_number: z.string(),
  first_name: z.string(),
  first_surname: z.string().optional(),
  person_type: z.enum(["natural", "juridical"]),
  city: z.string().optional(),
  dane_code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  economic_activity_code: z.string().optional(),
  customer_type: z.literal("customer").default("customer"),
  source_of_funds: z.string().optional(),
  email: z.string().optional(),
  status: z.enum(["Activo", "Reportado"]).optional(),
  isClintonListed: z.boolean().default(false),
});

export type Customer = z.infer<typeof customerSchema>;

export interface CustomerFilters {
  page?: number;
  size?: number;
  name?: string;
  document_number?: string;
  customer_type?: string;
  screening_status?: string;
  branch_code?: string;
  include_inactive?: boolean;
}

export interface CustomerRepository {
  findByDocument(documentNumber: string): Promise<Customer | undefined>;
  save(customer: Customer): Promise<void>;
  findAll(filters?: CustomerFilters): Promise<{ items: Customer[]; total: number }>;
}
