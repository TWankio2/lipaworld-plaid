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
        const result = await plaidService.exchangePublicToken(req.body as unknown as ExchangeTokenRequest);
      res.json(result);
    } catch (error: any) {
      logger.error('Token exchange failed', { error: error.message });
      res.status(500).json({ 
        error: 'Failed to exchange token',
        details: error.response?.data || error.message 
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
      const result = await plaidService.handleWebhook(req.body);
      res.json(result);
    } catch (error: any) {
      logger.error('Webhook processing failed', { error: error.message });
      res.status(500).json({ 
        error: 'Failed to process webhook',
        details: error.message 
      });
    }
  }

  async healthCheck(req: Request, res: Response) {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'lipaworld-plaid-service',
      version: '1.0.0'
    });
  }
}

export default new PlaidController();