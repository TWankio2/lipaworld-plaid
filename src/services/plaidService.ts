import { createPlaidClient } from '../config/plaid';
import {
  LinkTokenRequest,
  ExchangeTokenRequest,
  AccountsRequest,
  TransactionsRequest,
  IdentityRequest,
  IncomeRequest
} from '../types';
import logger from '../utils/logger';

class PlaidService {
  private client = createPlaidClient();

  async createLinkToken(data: LinkTokenRequest) {
    try {
      const response = await this.client.linkTokenCreate({
        user: {
          client_user_id: data.user_id,
        },
        client_name: data.client_name,
        products: data.products as any,
        country_codes: data.country_codes as any,
        language: data.language as any,
        webhook: process.env.WEBHOOK_URL,
      });

      logger.info('Link token created successfully', { 
        user_id: data.user_id,
        client_name: data.client_name 
      });

      return {
        link_token: response.data.link_token,
        expiration: response.data.expiration,
      };
    } catch (error) {
      logger.error('Failed to create link token', { error, user_id: data.user_id });
      throw error;
    }
  }

  async exchangePublicToken(data: ExchangeTokenRequest) {
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: data.public_token,
      });

      logger.info('Public token exchanged successfully', { 
        user_id: data.user_id,
        item_id: response.data.item_id 
      });

      return {
        access_token: response.data.access_token,
        item_id: response.data.item_id,
      };
    } catch (error) {
      logger.error('Failed to exchange public token', { error, user_id: data.user_id });
      throw error;
    }
  }

  async getAccounts(data: AccountsRequest) {
    try {
      const response = await this.client.accountsGet({
        access_token: data.access_token,
      });

      logger.info('Accounts retrieved successfully', { 
        accounts_count: response.data.accounts.length 
      });

      return {
        accounts: response.data.accounts,
        item: response.data.item,
      };
    } catch (error) {
      logger.error('Failed to get accounts', { error });
      throw error;
    }
  }

  async getTransactions(data: TransactionsRequest) {
    try {
      const response = await this.client.transactionsGet({
        access_token: data.access_token,
        start_date: data.start_date,
        end_date: data.end_date,
        options: {
          count: data.count || 100,
          offset: data.offset || 0,
        }
      });
  
      logger.info('Transactions retrieved successfully', { 
        transactions_count: response.data.transactions.length,
        total_transactions: response.data.total_transactions 
      });
  
      return {
        transactions: response.data.transactions,
        accounts: response.data.accounts,
        total_transactions: response.data.total_transactions,
        item: response.data.item,
      };
    } catch (error) {
      logger.error('Failed to get transactions', { error });
      throw error;
    }
  }

  async getIdentity(data: IdentityRequest) {
    try {
      const response = await this.client.identityGet({
        access_token: data.access_token,
      });

      logger.info('Identity retrieved successfully');

      return {
        accounts: response.data.accounts,
        item: response.data.item,
      };
    } catch (error) {
      logger.error('Failed to get identity', { error });
      throw error;
    }
  }

  async getIncome(data: IncomeRequest) {
    try {
      // mock - to be figured out later
      const response = await this.client.accountsGet({
        access_token: data.access_token,
      });
  
      logger.info('Income data retrieved (using accounts endpoint)');
  
      return {
        income: {
          accounts: response.data.accounts,
          note: 'Income verification requires additional Plaid product setup. Currently returning account information.',
        },
        item: response.data.item,
      };
    } catch (error) {
      logger.error('Failed to get income', { error });
      throw error;
    }
  }

  async handleWebhook(webhookData: any) {
    try {
      logger.info('Processing Plaid webhook', { 
        webhook_type: webhookData.webhook_type,
        webhook_code: webhookData.webhook_code 
      });

      // Process different webhook types
      switch (webhookData.webhook_type) {
        case 'TRANSACTIONS':
          await this.handleTransactionWebhook(webhookData);
          break;
        case 'ITEM':
          await this.handleItemWebhook(webhookData);
          break;
        case 'AUTH':
          await this.handleAuthWebhook(webhookData);
          break;
        default:
          logger.warn('Unknown webhook type', { webhook_type: webhookData.webhook_type });
      }

      return { status: 'processed' };
    } catch (error) {
      logger.error('Failed to process webhook', { error, webhookData });
      throw error;
    }
  }

  private async handleTransactionWebhook(data: any) {
    logger.info('Processing transaction webhook', { 
      item_id: data.item_id,
      webhook_code: data.webhook_code 
    });
    // Implement transaction-specific webhook logic
  }

  private async handleItemWebhook(data: any) {
    logger.info('Processing item webhook', { 
      item_id: data.item_id,
      webhook_code: data.webhook_code 
    });
    // Implement item-specific webhook logic
  }

  private async handleAuthWebhook(data: any) {
    logger.info('Processing auth webhook', { 
      item_id: data.item_id,
      webhook_code: data.webhook_code 
    });
    // Implement auth-specific webhook logic
  }
}

export default new PlaidService();