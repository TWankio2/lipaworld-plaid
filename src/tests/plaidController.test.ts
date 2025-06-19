import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import plaidController from '../controllers/plaidController';
import plaidService from '../services/plaidService';

// Mock the plaid service
vi.mock('../services/plaidService', () => ({
  default: {
    createLinkToken: vi.fn(),
    exchangePublicToken: vi.fn(),
    getAccounts: vi.fn(),
    getTransactions: vi.fn(),
    getIdentity: vi.fn(),
    getIncome: vi.fn(),
    handleWebhook: vi.fn(),
    getTransactionsSync: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    getAccountsBalance: vi.fn(),
    createUpdateLinkToken: vi.fn(),
    healthCheck: vi.fn(),
    validateSandboxConnection: vi.fn()
  }
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('PlaidController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;


  beforeEach(() => {
    vi.clearAllMocks();
    
    mockReq = {
      body: {},
      headers: {}
    };
    
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
    
 
  });

  describe('createLinkToken', () => {
    it('should create link token successfully', async () => {
      const mockResult = {
        link_token: 'test-token',
        expiration: '2024-01-01T00:00:00Z',
        request_id: 'test-request-id'
      };

      mockReq.body = {
        user_id: 'test-user',
        client_name: 'Test App',
        country_codes: ['US'],
        language: 'en',
        products: ['transactions']
      };

      vi.mocked(plaidService.createLinkToken).mockResolvedValue(mockResult);

      await plaidController.createLinkToken(mockReq as any, mockRes as Response);

      expect(plaidService.createLinkToken).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle create link token error', async () => {
        const mockError = new Error('Plaid API error') as any; // Add 'as any' here
        mockError.response = {
          data: { error_code: 'INVALID_REQUEST' }
        };
      
        vi.mocked(plaidService.createLinkToken).mockRejectedValue(mockError);
      
        await plaidController.createLinkToken(mockReq as any, mockRes as Response);
      
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Failed to create link token',
          details: { error_code: 'INVALID_REQUEST' }
        });
      });
  });

  describe('exchangeToken', () => {
    it('should exchange token successfully', async () => {
      const mockResult = {
        access_token: 'test-access-token',
        item_id: 'test-item-id',
        request_id: 'test-request-id'
      };

      mockReq.body = {
        public_token: 'test-public-token',
        user_id: 'test-user'
      };

      vi.mocked(plaidService.exchangePublicToken).mockResolvedValue(mockResult);

      await plaidController.exchangeToken(mockReq as any, mockRes as Response);

      expect(plaidService.exchangePublicToken).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle exchange token error', async () => {
      const mockError = new Error('Invalid token');
      vi.mocked(plaidService.exchangePublicToken).mockRejectedValue(mockError);

      await plaidController.exchangeToken(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to exchange token',
        details: 'Invalid token'
      });
    });
  });

  describe('getAccounts', () => {
    it('should get accounts successfully', async () => {
      const mockResult = {
        accounts: [{ 
          account_id: 'test-account',
          balances: { current: 1000, available: 950 },
          mask: '0000',
          name: 'Test Account',
          official_name: 'Test Official Account',
          type: 'depository',
          subtype: 'checking'
        }],
        item: { 
          item_id: 'test-item',
          institution_id: 'test-institution',
          webhook: 'https://test.com/webhook',
          error: null,
          available_products: ['transactions'],
          billed_products: ['transactions'],
          consent_expiration_time: null,
          update_type: 'background'
        },
        request_id: 'test-request-id'
      } as any; // Use 'as any' to bypass strict typing
  
      mockReq.body = { access_token: 'test-token' };
      vi.mocked(plaidService.getAccounts).mockResolvedValue(mockResult);
  
      await plaidController.getAccounts(mockReq as any, mockRes as Response);
  
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });
  
  describe('getTransactions', () => {
    it('should get transactions successfully', async () => {
      const mockResult = {
        transactions: [{ 
          transaction_id: 'test-transaction',
          pending_transaction_id: null,
          category_id: 'test-category',
          category: ['Transfer', 'Deposit'],
          location: {},
          payment_meta: {},
          account_id: 'test-account',
          amount: 100,
          iso_currency_code: 'USD',
          unofficial_currency_code: null,
          date: '2024-01-01',
          name: 'Test Transaction',
          merchant_name: null,
          payment_channel: 'online',
          authorized_date: null,
          authorized_datetime: null,
          datetime: null,
          transaction_code: null,
          personal_finance_category: null
        }],
        accounts: [{ 
          account_id: 'test-account',
          balances: { current: 1000, available: 950 },
          mask: '0000',
          name: 'Test Account',
          official_name: 'Test Official Account',
          type: 'depository',
          subtype: 'checking'
        }],
        total_transactions: 1,
        item: { 
          item_id: 'test-item',
          institution_id: 'test-institution',
          webhook: 'https://test.com/webhook',
          error: null,
          available_products: ['transactions'],
          billed_products: ['transactions'],
          consent_expiration_time: null,
          update_type: 'background'
        },
        request_id: 'test-request-id'
      } as any; // Use 'as any' to bypass strict typing
  
      mockReq.body = {
        access_token: 'test-token',
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      };
  
      vi.mocked(plaidService.getTransactions).mockResolvedValue(mockResult);
  
      await plaidController.getTransactions(mockReq as any, mockRes as Response);
  
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook successfully', async () => {
      const mockResult = {
        status: 'processed',
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'SYNC_UPDATES_AVAILABLE'
      };

      mockReq.body = {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'SYNC_UPDATES_AVAILABLE',
        item_id: 'test-item'
      };

      mockReq.headers = {
        'plaid-verification': 'test-jwt-token'
      };

      vi.mocked(plaidService.handleWebhook).mockResolvedValue(mockResult);

      await plaidController.handleWebhook(mockReq as Request, mockRes as Response);

      expect(plaidService.handleWebhook).toHaveBeenCalledWith(mockReq.body, mockReq.headers);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle invalid webhook signature', async () => {
      const mockError = new Error('Invalid webhook signature');
      vi.mocked(plaidService.handleWebhook).mockRejectedValue(mockError);

      await plaidController.handleWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized webhook',
        details: 'Webhook signature verification failed'
      });
    });

    it('should handle general webhook error', async () => {
      const mockError = new Error('Processing failed');
      vi.mocked(plaidService.handleWebhook).mockRejectedValue(mockError);

      await plaidController.handleWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to process webhook',
        details: 'Processing failed'
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const mockResult = {
        status: 'healthy',
        plaid_environment: 'sandbox',
        sandbox_connection: { isConnected: true }
      };

      vi.mocked(plaidService.healthCheck).mockResolvedValue(mockResult);

      await plaidController.healthCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        ...mockResult,
        timestamp: expect.any(String),
        service: 'lipaworld-plaid-service',
        version: '1.0.0'
      });
    });

    it('should handle health check error', async () => {
      const mockError = new Error('Health check failed');
      vi.mocked(plaidService.healthCheck).mockRejectedValue(mockError);

      await plaidController.healthCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'unhealthy',
        timestamp: expect.any(String),
        error: 'Health check failed'
      });
    });
  });

  describe('validateConnection', () => {
    it('should validate connection successfully', async () => {
      const mockResult = {
        isConnected: true,
        environment: 'sandbox'
      };

      vi.mocked(plaidService.validateSandboxConnection).mockResolvedValue(mockResult);

      await plaidController.validateConnection(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        ...mockResult,
        timestamp: expect.any(String),
        client_id_prefix: expect.any(String)
      });
    });
  });

  describe('Additional Methods', () => {
    it('should sync transactions successfully', async () => {
      const mockResult = {
        added: [{ transaction_id: 'test1' }],
        modified: [],
        removed: [],
        next_cursor: 'cursor123',
        has_more: false,
        request_id: 'test-request-id'
      } as any; // Bypass strict typing
  
      mockReq.body = { access_token: 'test-token', cursor: 'test-cursor' };
      vi.mocked(plaidService.getTransactionsSync).mockResolvedValue(mockResult);
  
      await plaidController.getTransactionsSync(mockReq as any, mockRes as Response);
  
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  
    it('should get item successfully', async () => {
      const mockResult = {
        item: { 
          item_id: 'test-item',
          institution_id: 'test-institution',
          webhook: 'https://test.com/webhook',
          error: null,
          available_products: ['transactions'],
          billed_products: ['transactions'],
          consent_expiration_time: null,
          update_type: 'background'
        },
        status: {},
        request_id: 'test-request-id'
      } as any;
  
      mockReq.body = { access_token: 'test-token' };
      vi.mocked(plaidService.getItem).mockResolvedValue(mockResult);
  
      await plaidController.getItem(mockReq as any, mockRes as Response);
  
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  
    it('should get account balances successfully', async () => {
      const mockResult = {
        accounts: [{ 
          account_id: 'test-account', 
          balances: { current: 1000 },
          mask: '0000',
          name: 'Test Account',
          official_name: 'Test Official Account',
          type: 'depository',
          subtype: 'checking'
        }],
        item: { 
          item_id: 'test-item',
          institution_id: 'test-institution',
          webhook: 'https://test.com/webhook',
          error: null,
          available_products: ['transactions'],
          billed_products: ['transactions'],
          consent_expiration_time: null,
          update_type: 'background'
        },
        request_id: 'test-request-id'
      } as any;
  
      mockReq.body = { access_token: 'test-token' };
      vi.mocked(plaidService.getAccountsBalance).mockResolvedValue(mockResult);
  
      await plaidController.getAccountsBalance(mockReq as any, mockRes as Response);
  
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });
});