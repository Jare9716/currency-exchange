import { useClientsStore } from '@/presentation/stores/clients.store';
import { Client } from '@/domain/Client';

describe('useClientsStore', () => {
  // We need to reset the store before each test because it's a singleton
  beforeEach(() => {
    useClientsStore.getState().resetClients();
  });

  it('should have initial clients from mock data', () => {
    const { clients } = useClientsStore.getState();
    expect(clients.length).toBeGreaterThan(0);
  });

  it('should add a new client to the beginning of the list', () => {
    const newClient: Client = {
      id: 'test-id',
      name: 'Test Client',
      email: 'test@example.com',
      cc: '12345',
      isClintonListed: false,
      status: 'Activo'
    };

    useClientsStore.getState().addClient(newClient);

    const { clients } = useClientsStore.getState();
    expect(clients[0]).toEqual(newClient);
  });

  it('should reset clients to initial data', () => {
    const initialState = useClientsStore.getState().clients;
    
    useClientsStore.getState().setClients([]);
    expect(useClientsStore.getState().clients.length).toBe(0);

    useClientsStore.getState().resetClients();
    expect(useClientsStore.getState().clients).toEqual(initialState);
  });
});
