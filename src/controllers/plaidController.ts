import { Request, Response } from 'express';
import plaidService from '../services/plaidService';
import logger from '../utils/logger';
import { 
  AuthRequest,
  LinkTokenRequest,
  ExchangeTokenRequest,
  AccountsRequest,
  TransactionsRequest,
  IdentityRequest,
  IncomeRequest
} from '../types';

class PlaidController {
  async createLinkToken(req: AuthRequest, res: Response) {
    try {
        const result = await plaidService.createLinkToken(req.body as unknown as LinkTokenRequest);
      res.json(result);
    } catch (error: any) {
      logger.error('Link token creation failed', { error: error.message });
      res.status(500).json({ 
        error: 'Failed to create link token',
        details: error.response?.data || error.message 
      });
    }
  }

  async exchangeToken(req: AuthRequest, res: Response) {
    try {
      console.log('🔄 Exchange Token Request Body:', JSON.stringify(req.body, null, 2));
      console.log('🔄 Request Headers:', JSON.stringify(req.headers, null, 2));
      
      const result = await plaidService.exchangePublicToken(req.body as unknown as ExchangeTokenRequest);
      
      console.log('✅ Exchange Success Result:', JSON.stringify(result, null, 2));
      res.json(result);
    } catch (error: any) {
      console.error('❌ Exchange Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      logger.error('Token exchange failed', { 
        error: error.message,
        errorCode: error.response?.data?.error_code,
        errorType: error.response?.data?.error_type,
        requestBody: req.body
      });
      
      res.status(500).json({ 
        error: 'Failed to exchange token',
        details: error.response?.data || error.message,
        plaidError: {
          code: error.response?.data?.error_code,
          type: error.response?.data?.error_type,
          message: error.response?.data?.error_message
        }
      });
    }
  }

  async getAccounts(req: AuthRequest, res: Response) {
    try {
      const result = await plaidService.getAccounts(req.body as unknown as AccountsRequest);
      res.json(result);
    } catch (error: any) {
      logger.error('Get accounts failed', { error: error.message });
      res.status(500).json({ 
        error: 'Failed to get accounts',
        details: error.response?.data || error.message 
      });
    }
  }

  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const result = await plaidService.getTransactions(req.body as unknown as TransactionsRequest);
      res.json(result);
    } catch (error: any) {
      logger.error('Get transactions failed', { error: error.message });
      res.status(500).json({ 
        error: 'Failed to get transactions',
        details: error.response?.data || error.message 
      });
    }
  }

  async getIdentity(req: AuthRequest, res: Response) {
    try {
      const result = await plaidService.getIdentity(req.body as unknown as IdentityRequest);
      res.json(result);
    } catch (error: any) {
      logger.error('Get identity failed', { error: error.message });
      res.status(500).json({ 
        error: 'Failed to get identity',
        details: error.response?.data || error.message 
      });
    }
  }

  async getIncome(req: AuthRequest, res: Response) {
    try {
      const result = await plaidService.getIncome(req.body as unknown as IncomeRequest);
      res.json(result);
    } catch (error: any) {
      logger.error('Get income failed', { error: error.message });
      res.status(500).json({ 
        error: 'Failed to get income',
        details: error.response?.data || error.message 
      });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      const result = await plaidService.handleWebhook(req.body, req.headers);
      res.json(result);
    } catch (error: any) {
      logger.error('Webhook processing failed', { error: error.message });
      
   
      if (error.message === 'Invalid webhook signature') {
        return res.status(401).json({ 
          error: 'Unauthorized webhook',
          details: 'Webhook signature verification failed' 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to process webhook',
        details: error.message 
      });
    }
  }



async getTransactionsSync(req: AuthRequest, res: Response) {
  try {
    const { access_token, cursor } = req.body;
    const result = await plaidService.getTransactionsSync(access_token, cursor);
    res.json(result);
  } catch (error: any) {
    logger.error('Transactions sync failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to sync transactions',
      details: error.response?.data || error.message 
    });
  }


}

async getItem(req: AuthRequest, res: Response) {
  try {
    const { access_token } = req.body;
    const result = await plaidService.getItem(access_token);
    res.json(result);
  } catch (error: any) {
    logger.error('Get item failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to get item',
      details: error.response?.data || error.message 
    });
  }
}

async removeItem(req: AuthRequest, res: Response) {
  try {
    const { access_token } = req.body;
    const result = await plaidService.removeItem(access_token);
    res.json(result);
  } catch (error: any) {
    logger.error('Remove item failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to remove item',
      details: error.response?.data || error.message 
    });
  }
}

async getAccountsBalance(req: AuthRequest, res: Response) {
  try {
    const { access_token } = req.body;
    const result = await plaidService.getAccountsBalance(access_token);
    res.json(result);
  } catch (error: any) {
    logger.error('Get account balances failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to get account balances',
      details: error.response?.data || error.message 
    });
  }
}

async createUpdateLinkToken(req: AuthRequest, res: Response) {
  try {
    const { access_token, user_id } = req.body;
    const result = await plaidService.createUpdateLinkToken(access_token, user_id);
    res.json(result);
  } catch (error: any) {
    logger.error('Create update link token failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to create update link token',
      details: error.response?.data || error.message 
    });
  }
}

async healthCheck(req: Request, res: Response) {
  try {
    const result = await plaidService.healthCheck();
    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      service: 'lipaworld-plaid-service',
      version: '1.0.0'
    });
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

async validateConnection(req: Request, res: Response) {
  try {
    const result = await plaidService.validateSandboxConnection();
    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      client_id_prefix: process.env.PLAID_CLIENT_ID?.substring(0, 8) + '...'
    });
  } catch (error: any) {
    logger.error('Connection validation failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to validate connection',
      details: error.message 
    });
  }
}
}

export default new PlaidController();