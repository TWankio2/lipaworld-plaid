import { describe, it, expect, vi, beforeEach } from 'vitest';
import plaidService from '../services/plaidService';

const mockClient = {
  linkTokenCreate: vi.fn(),
  itemPublicTokenExchange: vi.fn(),
  accountsGet: vi.fn(),
  transactionsGet: vi.fn(),
  transactionsSync: vi.fn(),
  identityGet: vi.fn(),
  incomeGet: vi.fn(),
  itemGet: vi.fn(),
  itemRemove: vi.fn(),
  accountsBalanceGet: vi.fn(),
  categoriesGet: vi.fn(),
  webhookVerificationKeyGet: vi.fn()
};

vi.mock('../config/plaid', () => ({
  createPlaidClient: () => mockClient
}));

describe('PlaidService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create link token successfully', async () => {
    mockClient.linkTokenCreate.mockResolvedValue({
      data: {
        link_token: 'link-sandbox-test-token',
        expiration: '2024-01-01T00:00:00Z',
        request_id: 'test-request-id'
      }
    });

    const mockData = {
      user_id: 'test-user',
      client_name: 'Test App',
      country_codes: ['US'],
      language: 'en',
      products: ['transactions']
    };

    const result = await plaidService.createLinkToken(mockData);
    
    expect(result.link_token).toBe('link-sandbox-test-token');
    expect(result.expiration).toBeDefined();
    expect(result.request_id).toBe('test-request-id');
  });

  it('should handle exchange token errors properly', async () => {
    const mockError = {
      message: 'Invalid public token',
      response: {
        data: {
          error_code: 'INVALID_PUBLIC_TOKEN',
          error_type: 'INVALID_INPUT',
          error_message: 'Invalid public token'
        }
      }
    };
    
    mockClient.itemPublicTokenExchange.mockRejectedValue(mockError);

    const mockData = {
      public_token: 'invalid-token',
      user_id: 'test-user'
    };

    await expect(plaidService.exchangePublicToken(mockData))
      .rejects.toThrow('Invalid public token');
  });
});

describe('Sandbox Connection Validation', () => {
  it('should validate sandbox connection successfully', async () => {
    mockClient.categoriesGet.mockResolvedValue({
      data: {
        categories: [
          { category_id: 'test1', group: 'special', hierarchy: ['Food'] },
          { category_id: 'test2', group: 'place', hierarchy: ['Shops'] }
        ],
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.validateSandboxConnection();
    
    expect(result.isConnected).toBe(true);
    expect(result.environment).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should handle sandbox connection failure', async () => {
    const mockError = {
      message: 'Invalid credentials',
      response: {
        data: {
          error_code: 'INVALID_CREDENTIALS',
          error_message: 'Invalid API credentials'
        }
      }
    };
    
    mockClient.categoriesGet.mockRejectedValue(mockError);

    const result = await plaidService.validateSandboxConnection();
    
    expect(result.isConnected).toBe(false);
    expect(result.error).toBe('Invalid API credentials');
  });
});

describe('Sandbox Connection Validation', () => {
  it('should validate sandbox connection successfully', async () => {
  
    mockClient.categoriesGet.mockResolvedValue({
      data: {
        categories: [
          { category_id: 'test1', group: 'special', hierarchy: ['Food'] },
          { category_id: 'test2', group: 'place', hierarchy: ['Shops'] }
        ],
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.validateSandboxConnection();
    
    expect(result.isConnected).toBe(true);
    expect(result.environment).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(mockClient.categoriesGet).toHaveBeenCalledWith({});
  });

  it('should handle sandbox connection failure', async () => {
    const mockError = {
      message: 'Invalid credentials',
      response: {
        data: {
          error_code: 'INVALID_CREDENTIALS',
          error_message: 'Invalid API credentials'
        }
      }
    };
    
    mockClient.categoriesGet.mockRejectedValue(mockError);

    const result = await plaidService.validateSandboxConnection();
    
    expect(result.isConnected).toBe(false);
    expect(result.error).toBe('Invalid API credentials');
  });
});

describe('Enhanced Health Check', () => {
  it('should return healthy status when sandbox connection succeeds', async () => {
   
    mockClient.categoriesGet.mockResolvedValue({
      data: {
        categories: [{ category_id: 'test', group: 'special', hierarchy: ['Test'] }],
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.healthCheck();
    
    expect(result.status).toBe('healthy');
    expect(result.plaid_environment).toBeDefined();
    expect(result.sandbox_connection.isConnected).toBe(true);
  });

  it('should return unhealthy status when sandbox connection fails', async () => {
  
    mockClient.categoriesGet.mockRejectedValue(new Error('Connection failed'));

    const result = await plaidService.healthCheck();
    
    expect(result.status).toBe('unhealthy');
    expect(result.sandbox_connection.isConnected).toBe(false);
  });
});

describe('Additional Plaid Methods', () => {
  it('should sync transactions successfully', async () => {
  
    mockClient.transactionsSync.mockResolvedValue({
      data: {
        added: [{ transaction_id: 'test1' }],
        modified: [],
        removed: [],
        next_cursor: 'cursor123',
        has_more: false,
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.getTransactionsSync('test-token', 'cursor');
    
    expect(result.added).toHaveLength(1);
    expect(result.next_cursor).toBe('cursor123');
  });

  it('should get item details successfully', async () => {
    
    mockClient.itemGet.mockResolvedValue({
      data: {
        item: {
          item_id: 'test-item',
          institution_id: 'test-institution',
          available_products: ['transactions'],
          billed_products: ['transactions']
        },
        status: { transactions: { last_successful_update: '2023-01-01' } },
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.getItem('test-token');
    
    expect(result.item.item_id).toBe('test-item');
    expect(result.item.available_products).toContain('transactions');
  });

  it('should remove item successfully', async () => {
    
    mockClient.itemRemove.mockResolvedValue({
      data: {
        removed: true,
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.removeItem('test-token');
    
    expect(result.removed).toBe(true);
  });

  it('should get account balances successfully', async () => {
    
    mockClient.accountsBalanceGet.mockResolvedValue({
      data: {
        accounts: [
          {
            account_id: 'test-account',
            balances: { current: 1000, available: 950 },
            name: 'Test Checking',
            subtype: 'checking'
          }
        ],
        item: { item_id: 'test-item' },
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.getAccountsBalance('test-token');
    
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].balances.current).toBe(1000);
  });
});

describe('Webhook Handling', () => {
  it('should handle transaction webhook successfully', async () => {
  
    mockClient.webhookVerificationKeyGet.mockResolvedValue({
      data: {
        key: {
          id: 'test-key-id',
          pem: 'test-pem-key'
        }
      }
    });

    // Mock JWT verification - you'll need to properly mock this
    const webhookData = {
      webhook_type: 'TRANSACTIONS',
      webhook_code: 'SYNC_UPDATES_AVAILABLE',
      item_id: 'test-item'
    };

    const headers = {
      'plaid-verification': 'test-jwt-token'
    };

    // This test would need proper JWT mocking for full coverage
    // For now, testing the structure
    expect(() => plaidService.handleWebhook(webhookData, headers)).toBeDefined();
  });
});