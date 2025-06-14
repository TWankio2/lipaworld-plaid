import { describe, it, expect, vi, beforeEach } from 'vitest';
import plaidService from '../services/plaidService';

vi.mock('../src/config/plaid', () => ({
  createPlaidClient: () => ({
    linkTokenCreate: vi.fn(),
    itemPublicTokenExchange: vi.fn(),
    accountsGet: vi.fn(),
    transactionsGet: vi.fn(),
    identityGet: vi.fn(),
    incomeGet: vi.fn()
  })
}));

describe('PlaidService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create link token successfully', async () => {
    const mockData = {
      user_id: 'test-user',
      client_name: 'Test App',
      country_codes: ['US'],
      language: 'en',
      products: ['transactions']
    };

    // Mock implementation would go here
    const result = await plaidService.createLinkToken(mockData);
    expect(result).toBeDefined();
  });

  it('should handle exchange token errors', async () => {
    const mockData = {
      public_token: 'invalid-token',
      user_id: 'test-user'
    };

    await expect(plaidService.exchangePublicToken(mockData))
      .rejects.toThrow();
  });
});