import { useCustomersStore } from '@/presentation/stores/customers.store';
import { Customer } from '@/domain/Customer';

jest.mock('@/use-cases/GetCustomers', () => ({
  GetCustomers: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue([
      {
        document_number: '123',
        document_type: 'CC',
        first_name: 'Mock Customer',
        person_type: 'natural',
        customer_type: 'customer',
        isClintonListed: false,
      }
    ]),
  })),
}));

describe('useCustomersStore', () => {
  beforeEach(() => {
    useCustomersStore.getState().resetCustomers();
  });

  it('should have empty customers initially', () => {
    const state = useCustomersStore.getState();
    expect(state.customers).toEqual([]);
  });

  it('should add a new customer to the beginning of the list', () => {
    const newCustomer: Customer = {
      document_type: 'CC',
      document_number: '123456789',
      first_name: 'Test Customer',
      person_type: 'natural',
      customer_type: 'customer',
      isClintonListed: false,
    };

    const state = useCustomersStore.getState();
    state.addCustomer(newCustomer);

    const updatedState = useCustomersStore.getState();
    expect(updatedState.customers[0]).toEqual(newCustomer);
    expect(updatedState.customers.length).toBe(1);
  });

  it('should reset customers to empty list', () => {
    const state = useCustomersStore.getState();
    state.setCustomers([{ document_number: '123', document_type: 'CC', first_name: 'Test', person_type: 'natural', customer_type: 'customer', isClintonListed: false }]);
    expect(useCustomersStore.getState().customers.length).toBe(1);
    
    useCustomersStore.getState().resetCustomers();
    expect(useCustomersStore.getState().customers).toEqual([]);
  });

  it('should fetch customers successfully', async () => {
    const state = useCustomersStore.getState();
    await state.fetchCustomers();
    
    const updatedState = useCustomersStore.getState();
    expect(updatedState.customers.length).toBe(1);
    expect(updatedState.customers[0].first_name).toBe('Mock Customer');
  });
});
