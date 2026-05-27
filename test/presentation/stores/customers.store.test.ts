import { useCustomersStore } from '@/presentation/stores/customers.store';

jest.mock('@/use-cases/GetCustomers', () => ({
  GetCustomers: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      items: [
        {
          id: '1',
          document_number: '123',
          document_type: 'CC',
          first_name: 'Mock Customer',
          person_type: 'natural',
          status: 'Activo',
          customer_type: 'customer',
          isClintonListed: false,
        }
      ],
      total: 1,
    }),
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

  it('should reset customers to empty list', () => {
    useCustomersStore.setState({
      customers: [{ 
        id: '3', 
        document_number: '123', 
        document_type: 'CC', 
        first_name: 'Test', 
        person_type: 'natural', 
        status: 'Activo',
        customer_type: 'customer',
        isClintonListed: false,
      }],
      total: 1,
    });
    expect(useCustomersStore.getState().customers.length).toBe(1);
    
    useCustomersStore.getState().resetCustomers();
    expect(useCustomersStore.getState().customers).toEqual([]);
    expect(useCustomersStore.getState().total).toBe(0);
  });

  it('should fetch customers successfully', async () => {
    const state = useCustomersStore.getState();
    await state.fetchCustomers();
    
    const updatedState = useCustomersStore.getState();
    expect(updatedState.customers.length).toBe(1);
    expect(updatedState.total).toBe(1);
    expect(updatedState.customers[0].first_name).toBe('Mock Customer');
  });
});
