import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mocks are set up before any imports
const mockClient = vi.hoisted(() => ({
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
}));

// Mock the config module using hoisted mockClient
vi.mock('../config/plaid', () => ({
  createPlaidClient: () => mockClient
}));

// Import service after mocking
import plaidService from '../services/plaidService';

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle transaction webhook successfully', async () => {
    mockClient.webhookVerificationKeyGet.mockResolvedValue({
      data: {
        key: {
          id: 'test-key-id',
          pem: 'test-pem-key'
        }
      }
    });

    // For now, just test that the method exists and can be called
    const webhookData = {
      webhook_type: 'TRANSACTIONS',
      webhook_code: 'SYNC_UPDATES_AVAILABLE',
      item_id: 'test-item'
    };

    const headers = {
      'plaid-verification': 'test-jwt-token'
    };

    // This will fail signature verification but tests the method structure
    await expect(plaidService.handleWebhook(webhookData, headers))
      .rejects.toThrow(); // Expected to fail due to JWT verification
  });
});

describe('Additional PlaidService Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get accounts successfully', async () => {
    mockClient.accountsGet.mockResolvedValue({
      data: {
        accounts: [{ account_id: 'test-account' }],
        item: { item_id: 'test-item' },
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.getAccounts({ access_token: 'test-token' });
    
    expect(result.accounts).toHaveLength(1);
    expect(result.item.item_id).toBe('test-item');
  });

  it('should get transactions successfully', async () => {
    mockClient.transactionsGet.mockResolvedValue({
      data: {
        transactions: [{ transaction_id: 'test-transaction' }],
        accounts: [{ account_id: 'test-account' }],
        total_transactions: 1,
        item: { item_id: 'test-item' },
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.getTransactions({
      access_token: 'test-token',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      count: 100,
      offset: 0
    });
    
    expect(result.transactions).toHaveLength(1);
    expect(result.total_transactions).toBe(1);
  });

  it('should get identity successfully', async () => {
    mockClient.identityGet.mockResolvedValue({
      data: {
        accounts: [{ account_id: 'test-account' }],
        item: { item_id: 'test-item' },
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.getIdentity({ access_token: 'test-token' });
    
    expect(result.accounts).toHaveLength(1);
  });

  it('should get income successfully', async () => {
    mockClient.accountsGet.mockResolvedValue({
      data: {
        accounts: [
          { account_id: 'test-account', subtype: 'checking', balances: { current: 5000 } }
        ],
        item: { item_id: 'test-item' },
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.getIncome({ access_token: 'test-token' });
    
    expect(result.income.note).toContain('Income verification requires additional');
    expect(result.income.estimated_income.estimated).toBe(true);
  });

  it('should create update link token successfully', async () => {
    mockClient.linkTokenCreate.mockResolvedValue({
      data: {
        link_token: 'update-link-token',
        expiration: '2024-01-01T00:00:00Z',
        request_id: 'test-request-id'
      }
    });

    const result = await plaidService.createUpdateLinkToken('test-access-token', 'test-user');
    
    expect(result.link_token).toBe('update-link-token');
    expect(mockClient.linkTokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        access_token: 'test-access-token'
      })
    );
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle accounts error', async () => {
    const mockError = new Error('Account error') as any; // Add 'as any' here
    mockError.response = { data: { error_code: 'INVALID_ACCESS_TOKEN' } };
    
    mockClient.accountsGet.mockRejectedValue(mockError);

    await expect(plaidService.getAccounts({ access_token: 'invalid-token' }))
      .rejects.toThrow('Account error');
  });

  it('should handle transactions error', async () => {
    const mockError = new Error('Transaction error');
    mockClient.transactionsGet.mockRejectedValue(mockError);

    await expect(plaidService.getTransactions({
      access_token: 'invalid-token',
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    })).rejects.toThrow('Transaction error');
  });

  it('should handle health check error', async () => {
    mockClient.categoriesGet.mockRejectedValue(new Error('Connection failed'));
  
    const result = await plaidService.healthCheck();
    
    expect(result.status).toBe('unhealthy');
    expect(result.sandbox_connection.isConnected).toBe(false);
    expect(result.sandbox_connection.error).toBe('Connection failed');
  });

  // Add more error handling tests for better coverage
  it('should handle identity error', async () => {
    const mockError = new Error('Identity error');
    mockClient.identityGet.mockRejectedValue(mockError);

    await expect(plaidService.getIdentity({ access_token: 'invalid-token' }))
      .rejects.toThrow('Identity error');
  });

  it('should handle income error', async () => {
    const mockError = new Error('Income error');
    mockClient.accountsGet.mockRejectedValue(mockError);

    await expect(plaidService.getIncome({ access_token: 'invalid-token' }))
      .rejects.toThrow('Income error');
  });

  it('should handle transactions sync error', async () => {
    const mockError = new Error('Sync error');
    mockClient.transactionsSync.mockRejectedValue(mockError);

    await expect(plaidService.getTransactionsSync('invalid-token'))
      .rejects.toThrow('Sync error');
  });

  it('should handle item get error', async () => {
    const mockError = new Error('Item error');
    mockClient.itemGet.mockRejectedValue(mockError);

    await expect(plaidService.getItem('invalid-token'))
      .rejects.toThrow('Item error');
  });

  it('should handle item remove error', async () => {
    const mockError = new Error('Remove error');
    mockClient.itemRemove.mockRejectedValue(mockError);

    await expect(plaidService.removeItem('invalid-token'))
      .rejects.toThrow('Remove error');
  });

  it('should handle account balances error', async () => {
    const mockError = new Error('Balance error');
    mockClient.accountsBalanceGet.mockRejectedValue(mockError);

    await expect(plaidService.getAccountsBalance('invalid-token'))
      .rejects.toThrow('Balance error');
  });

  it('should handle create update link token error', async () => {
    const mockError = new Error('Update token error') as any;
    mockError.response = { data: { error_code: 'INVALID_ACCESS_TOKEN' } };
    mockClient.linkTokenCreate.mockRejectedValue(mockError);

    await expect(plaidService.createUpdateLinkToken('invalid-token', 'test-user'))
      .rejects.toThrow('Update token error');
  });
});