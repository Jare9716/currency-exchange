import { Client } from "@/domain/Client";

export const initialClients: Client[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "Jane@Doe.com",
    cc: "44509984",
    phone: "3167897678",
    status: "Activo",
    isClintonListed: false,
  },
  {
    id: "2",
    name: "John Smith",
    email: "John@Smith.com",
    cc: "44509985",
    phone: "3167897679",
    status: "Activo",
    isClintonListed: false,
  },
  {
    id: "3",
    name: "Emily Johnson",
    email: "Emily@Johnson.com",
    cc: "44509986",
    phone: "3167897680",
    status: "Reportado",
    isClintonListed: true,
  },
  {
    id: "4",
    name: "David Martinez",
    email: "David@Martinez.com",
    cc: "44509989",
    phone: "3167897683",
    status: "Reportado",
    isClintonListed: false,
  },
];
