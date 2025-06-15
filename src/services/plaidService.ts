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
import { WebhookVerificationKeyGetResponse } from 'plaid';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { CountryCode } from 'plaid';

interface WebhookVerificationCache {
  keys: WebhookVerificationKeyGetResponse | null;
  lastFetched: number;
  ttl: number; 
}

class PlaidService {
  private client = createPlaidClient();
  private webhookKeyCache: WebhookVerificationCache = {
    keys: null,
    lastFetched: 0,
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  };

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
        // Add additional security and configuration options
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
      });

      logger.info('Link token created successfully', { 
        user_id: data.user_id,
        client_name: data.client_name,
        link_token_id: response.data.link_token.substring(0, 12) + '...' // Log partial token for debugging
      });

      return {
        link_token: response.data.link_token,
        expiration: response.data.expiration,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to create link token', { 
        error: error.message, 
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type,
        user_id: data.user_id 
      });
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
        item_id: response.data.item_id,
        access_token_id: response.data.access_token.substring(0, 12) + '...' // Log partial token for debugging
      });

      return {
        access_token: response.data.access_token,
        item_id: response.data.item_id,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to exchange public token', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type,
        user_id: data.user_id 
      });
      throw error;
    }
  }

  async getAccounts(data: AccountsRequest) {
    try {
      const response = await this.client.accountsGet({
        access_token: data.access_token,
      });

      logger.info('Accounts retrieved successfully', { 
        accounts_count: response.data.accounts.length,
        item_id: response.data.item.item_id
      });

      return {
        accounts: response.data.accounts,
        item: response.data.item,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to get accounts', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type
      });
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
        total_transactions: response.data.total_transactions,
        start_date: data.start_date,
        end_date: data.end_date
      });
  
      return {
        transactions: response.data.transactions,
        accounts: response.data.accounts,
        total_transactions: response.data.total_transactions,
        item: response.data.item,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to get transactions', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type
      });
      throw error;
    }
  }

  async getTransactionsSync(accessToken: string, cursor?: string) {
    try {
      const response = await this.client.transactionsSync({
        access_token: accessToken,
        cursor: cursor || undefined,
      });

      logger.info('Transactions sync completed', {
        added_count: response.data.added.length,
        modified_count: response.data.modified.length,
        removed_count: response.data.removed.length,
        has_more: response.data.has_more
      });

      return {
        added: response.data.added,
        modified: response.data.modified,
        removed: response.data.removed,
        next_cursor: response.data.next_cursor,
        has_more: response.data.has_more,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to sync transactions', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type
      });
      throw error;
    }
  }

  async getIdentity(data: IdentityRequest) {
    try {
      const response = await this.client.identityGet({
        access_token: data.access_token,
      });

      logger.info('Identity retrieved successfully', {
        accounts_count: response.data.accounts.length
      });

      return {
        accounts: response.data.accounts,
        item: response.data.item,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to get identity', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type
      });
      throw error;
    }
  }

  async getIncome(data: IncomeRequest) {
    try {
      // For now, use accounts endpoint as placeholder
      // TODO: Replace with proper income verification when Plaid products are configured
      const response = await this.client.accountsGet({
        access_token: data.access_token,
      });
  
      logger.info('Income data retrieved (using accounts endpoint)', {
        accounts_count: response.data.accounts.length
      });
  
      return {
        income: {
          accounts: response.data.accounts,
          note: 'Income verification requires additional Plaid product setup. Currently returning account information.',
          estimated_income: this.estimateIncomeFromAccounts(response.data.accounts),
        },
        item: response.data.item,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to get income', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type
      });
      throw error;
    }
  }

  async getItem(accessToken: string) {
    try {
      const response = await this.client.itemGet({
        access_token: accessToken,
      });

      logger.info('Item retrieved successfully', {
        item_id: response.data.item.item_id,
        institution_id: response.data.item.institution_id,
        available_products: response.data.item.available_products,
        billed_products: response.data.item.billed_products
      });

      return {
        item: response.data.item,
        status: response.data.status,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to get item', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type
      });
      throw error;
    }
  }

  async removeItem(accessToken: string) {
    try {
      const response = await this.client.itemRemove({
        access_token: accessToken,
      });

      logger.info('Item removed successfully', {
        removed: response.data.removed
      });

      return {
        removed: response.data.removed,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to remove item', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type
      });
      throw error;
    }
  }

  async getAccountsBalance(accessToken: string) {
    try {
      const response = await this.client.accountsBalanceGet({
        access_token: accessToken,
      });

      logger.info('Account balances retrieved successfully', {
        accounts_count: response.data.accounts.length
      });

      return {
        accounts: response.data.accounts,
        item: response.data.item,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to get account balances', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type
      });
      throw error;
    }
  }

  // Create link token for update mode (when users need to re-authenticate)
  async createUpdateLinkToken(accessToken: string, userId: string) {
    try {
      const response = await this.client.linkTokenCreate({
        user: {
          client_user_id: userId,
        },
        client_name: process.env.PLAID_CLIENT_NAME || 'Lipaworld',
        country_codes: [CountryCode.Us],// Configure as needed
        language: 'en',
        access_token: accessToken, // This makes it an update mode token
        webhook: process.env.WEBHOOK_URL,
      });

      logger.info('Update link token created successfully', { 
        user_id: userId,
        link_token_id: response.data.link_token.substring(0, 12) + '...'
      });

      return {
        link_token: response.data.link_token,
        expiration: response.data.expiration,
        request_id: response.data.request_id,
      };
    } catch (error: any) {
      logger.error('Failed to create update link token', { 
        error: error.message,
        error_code: error.response?.data?.error_code,
        error_type: error.response?.data?.error_type,
        user_id: userId 
      });
      throw error;
    }
  }

  // Webhook verification and handling
  async verifyWebhookSignature(requestBody: any, headers: any): Promise<boolean> {
    try {
      const webhookJWT = headers['plaid-verification'];
      if (!webhookJWT) {
        logger.warn('No Plaid-Verification header found in webhook request');
        return false;
      }

      // Get or fetch webhook verification keys
      const keys = await this.getWebhookVerificationKeys();
      if (!keys) {
        logger.error('Unable to retrieve webhook verification keys');
        return false;
      }

      // Verify JWT signature
      const decodedJWT = jwt.verify(webhookJWT, keys.key.pem, {
        algorithms: ['ES256']
      }) as any;

      // Verify request body hash
      const bodyHash = crypto.createHash('sha256')
        .update(JSON.stringify(requestBody))
        .digest('hex');

      const isValid = decodedJWT.request_body_sha256 === bodyHash;
      
      if (!isValid) {
        logger.warn('Webhook signature verification failed - body hash mismatch', {
          expected: decodedJWT.request_body_sha256,
          actual: bodyHash
        });
      }

      return isValid;
    } catch (error: any) {
      logger.error('Webhook signature verification failed', { 
        error: error.message,
        headers: Object.keys(headers)
      });
      return false;
    }
  }

  private async getWebhookVerificationKeys(): Promise<WebhookVerificationKeyGetResponse | null> {
    try {
      const now = Date.now();
      
      // Return cached keys if still valid
      if (this.webhookKeyCache.keys && 
          (now - this.webhookKeyCache.lastFetched) < this.webhookKeyCache.ttl) {
        return this.webhookKeyCache.keys;
      }
  
      // Fetch new keys from Plaid - add the required key_id parameter
      const response = await this.client.webhookVerificationKeyGet({
        key_id: 'current' // Use 'current' to get the current active key
      });
      
      // Update cache
      this.webhookKeyCache = {
        keys: response.data,
        lastFetched: now,
        ttl: this.webhookKeyCache.ttl
      };
  
      logger.info('Webhook verification keys updated', {
        key_id: response.data.key.id
      });
  
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get webhook verification keys', { 
        error: error.message,
        error_code: error.response?.data?.error_code
      });
      return null;
    }
  }

  async handleWebhook(webhookData: any, headers: any) {
    try {
      // Verify webhook signature first
      const isValid = await this.verifyWebhookSignature(webhookData, headers);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      logger.info('Processing verified Plaid webhook', { 
        webhook_type: webhookData.webhook_type,
        webhook_code: webhookData.webhook_code,
        item_id: webhookData.item_id
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
        case 'ASSETS':
          await this.handleAssetsWebhook(webhookData);
          break;
        case 'HOLDINGS':
          await this.handleHoldingsWebhook(webhookData);
          break;
        case 'LIABILITIES':
          await this.handleLiabilitiesWebhook(webhookData);
          break;
        default:
          logger.warn('Unknown webhook type received', { 
            webhook_type: webhookData.webhook_type,
            webhook_code: webhookData.webhook_code
          });
      }

      return { 
        status: 'processed',
        webhook_type: webhookData.webhook_type,
        webhook_code: webhookData.webhook_code
      };
    } catch (error: any) {
      logger.error('Failed to process webhook', { 
        error: error.message,
        webhook_type: webhookData.webhook_type,
        webhook_code: webhookData.webhook_code,
        item_id: webhookData.item_id
      });
      throw error;
    }
  }

  private async handleTransactionWebhook(data: any) {
    logger.info('Processing transaction webhook', { 
      item_id: data.item_id,
      webhook_code: data.webhook_code,
      new_transactions: data.new_transactions || 0,
      removed_transactions: data.removed_transactions || []
    });

    switch (data.webhook_code) {
      case 'SYNC_UPDATES_AVAILABLE':
        // Recommend using transactions/sync for efficiency
        logger.info('Transaction sync updates available', {
          item_id: data.item_id,
          historical_update_complete: data.historical_update_complete
        });
        break;
      case 'DEFAULT_UPDATE':
      case 'INITIAL_UPDATE':
        // Legacy webhook codes - consider migrating to SYNC_UPDATES_AVAILABLE
        logger.info('Transaction updates available (legacy)', {
          item_id: data.item_id,
          new_transactions: data.new_transactions
        });
        break;
      case 'TRANSACTIONS_REMOVED':
        logger.info('Transactions removed', {
          item_id: data.item_id,
          removed_transactions: data.removed_transactions
        });
        break;
      default:
        logger.warn('Unknown transaction webhook code', {
          webhook_code: data.webhook_code,
          item_id: data.item_id
        });
    }

    // TODO: Implement your business logic here
    // - Trigger background job to sync transactions
    // - Update user notification systems
    // - Refresh cached transaction data
  }

  private async handleItemWebhook(data: any) {
    logger.info('Processing item webhook', { 
      item_id: data.item_id,
      webhook_code: data.webhook_code,
      error: data.error || null
    });

    switch (data.webhook_code) {
      case 'ERROR':
        logger.error('Item error reported', {
          item_id: data.item_id,
          error: data.error
        });
        // TODO: Handle different error types
        // - ITEM_LOGIN_REQUIRED: User needs to re-authenticate
        // - PENDING_EXPIRATION: Consent expiring soon
        // - USER_PERMISSION_REVOKED: User revoked access
        break;
      case 'PENDING_EXPIRATION':
        logger.warn('Item access expiring soon', {
          item_id: data.item_id,
          consent_expiration_time: data.consent_expiration_time
        });
        // TODO: Trigger re-authentication flow
        break;
      case 'USER_PERMISSION_REVOKED':
        logger.info('User revoked item access', {
          item_id: data.item_id
        });
        // TODO: Clean up stored data and disable features
        break;
      case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
        logger.info('Webhook URL update acknowledged', {
          item_id: data.item_id,
          new_webhook_url: data.new_webhook_url
        });
        break;
      default:
        logger.warn('Unknown item webhook code', {
          webhook_code: data.webhook_code,
          item_id: data.item_id
        });
    }
  }

  private async handleAuthWebhook(data: any) {
    logger.info('Processing auth webhook', { 
      item_id: data.item_id,
      webhook_code: data.webhook_code,
      account_id: data.account_id || null
    });

    switch (data.webhook_code) {
      case 'AUTOMATICALLY_VERIFIED':
        logger.info('Account automatically verified', {
          item_id: data.item_id,
          account_id: data.account_id
        });
        break;
      case 'VERIFICATION_EXPIRED':
        logger.warn('Account verification expired', {
          item_id: data.item_id,
          account_id: data.account_id
        });
        break;
      default:
        logger.warn('Unknown auth webhook code', {
          webhook_code: data.webhook_code,
          item_id: data.item_id
        });
    }
  }

  private async handleAssetsWebhook(data: any) {
    logger.info('Processing assets webhook', {
      webhook_code: data.webhook_code,
      asset_report_id: data.asset_report_id || null
    });
    // TODO: Handle asset report completion/error
  }

  private async handleHoldingsWebhook(data: any) {
    logger.info('Processing holdings webhook', {
      item_id: data.item_id,
      webhook_code: data.webhook_code
    });
    // TODO: Handle investment holdings updates
  }

  private async handleLiabilitiesWebhook(data: any) {
    logger.info('Processing liabilities webhook', {
      item_id: data.item_id,
      webhook_code: data.webhook_code
    });
    // TODO: Handle liabilities updates
  }

  // Helper function to estimate income from account data (placeholder)
  private estimateIncomeFromAccounts(accounts: any[]): any {
    // This is a very basic estimation - replace with proper logic
    const checkingAccounts = accounts.filter(account => 
      account.subtype === 'checking' || account.subtype === 'savings'
    );

    return {
      estimated: true,
      note: 'Estimated based on account balances. Not actual income verification.',
      monthly_estimate: checkingAccounts.reduce((total, account) => {
        return total + (account.balances.current || 0);
      }, 0) * 0.1, // Very rough estimate
      currency: 'USD'
    };
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; plaid_environment: string }> {
    try {
      // Test Plaid connection with a simple API call
      const response = await this.client.categoriesGet({});
      
      return {
        status: 'healthy',
        plaid_environment: process.env.PLAID_ENV || 'unknown'
      };
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
      throw new Error('Plaid service unhealthy');
    }
  }
}

export default new PlaidService();