import { Customer, CustomerRepository, CustomerFilters } from "@/domain/Customer";
import { HttpClient } from "@/infrastructure/http/HttpClient";
import { z } from "zod";

const apiCustomerListItemSchema = z.object({
  id: z.string(),
  document_type: z.string(),
  document_number: z.string(),
  full_name: z.string(),
  city: z.string().nullish().transform(val => val ?? undefined),
  customer_type: z.string().nullish().transform(val => val ?? undefined),
  screening_status: z.string().nullish().transform(val => val ?? undefined),
  is_active: z.boolean().optional(),
  branch_code: z.string().nullish().transform(val => val ?? undefined),
  email: z.string().nullish().transform(val => val ?? undefined),
  phone: z.string().nullish().transform(val => val ?? undefined),
});

const paginatedCustomersSchema = z.object({
  items: z.array(apiCustomerListItemSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
});

function mapApiToDomainCustomer(item: z.infer<typeof apiCustomerListItemSchema>): Customer {
  let docType: "CC" | "NIT" | "CE" | "PASAPORTE" = "CC";
  const incomingDoc = String(item.document_type || "").toUpperCase();
  if (incomingDoc === "NIT") {
    docType = "NIT";
  } else if (incomingDoc === "CE") {
    docType = "CE";
  } else if (incomingDoc === "PASAPORTE" || incomingDoc === "PA") {
    docType = "PASAPORTE";
  }

  const parts = (item.full_name || "").trim().split(/\s+/);
  const firstName = parts[0] || "Sin Nombre";
  const firstSurname = parts.slice(1).join(" ") || undefined;
  const personType: "natural" | "juridical" = docType === "NIT" ? "juridical" : "natural";
  const isClintonListed = item.screening_status === "flagged";
  const status: "Activo" | "Reportado" = isClintonListed ? "Reportado" : "Activo";

  return {
    id: item.id,
    document_type: docType,
    document_number: item.document_number,
    first_name: firstName,
    first_surname: firstSurname,
    person_type: personType,
    city: item.city,
    phone: item.phone,
    customer_type: "customer",
    email: item.email,
    status: status,
    isClintonListed: isClintonListed,
  };
}

export class HttpCustomerRepository implements CustomerRepository {
  async findAll(filters?: CustomerFilters): Promise<{ items: Customer[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          // Normalize name parameter to match what the backend's query param expectations might be
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/api/v1/customers?${queryString}` : "/api/v1/customers";

    const response = await HttpClient.get(url);
    const data = await response.json();
    const parsed = paginatedCustomersSchema.parse(data);
    return {
      items: parsed.items.map(mapApiToDomainCustomer),
      total: parsed.total,
    };
  }

  async findByDocument(documentNumber: string): Promise<Customer | undefined> {
    const response = await HttpClient.get(`/api/v1/customers?document_number=${documentNumber}`);
    const data = await response.json();
    const parsed = paginatedCustomersSchema.parse(data);
    if (parsed.items.length === 0) return undefined;
    return mapApiToDomainCustomer(parsed.items[0]);
  }

  async save(customer: Customer): Promise<void> {
    const payload = {
      ...customer,
      document_type: customer.document_type === "PASAPORTE" ? "PA" : customer.document_type,
    };
    await HttpClient.post("/api/v1/customers", payload);
  }

  async findById(customerId: string): Promise<Customer | undefined> {
    try {
      const response = await HttpClient.get(
        `/api/v1/customers/${encodeURIComponent(customerId)}`
      );
      const data = await response.json();
      const parsed = apiCustomerListItemSchema.parse(data);
      return mapApiToDomainCustomer(parsed);
    } catch {
      return undefined;
    }
  }
}

export const customerRepository = new HttpCustomerRepository();
