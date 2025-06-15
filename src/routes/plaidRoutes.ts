import { Router } from 'express';
import plaidController from '../controllers/plaidController';
import { authenticate } from '../middleware/auth';
import {
  linkTokenValidation,
  exchangeTokenValidation,
  accessTokenValidation,
  transactionsValidation
} from '../middleware/validation';

const router = Router();

// Protected routes 
router.post('/link-token', authenticate, linkTokenValidation, plaidController.createLinkToken);
router.post('/exchange-token', authenticate, exchangeTokenValidation, plaidController.exchangeToken);
router.post('/accounts', authenticate, accessTokenValidation, plaidController.getAccounts);
router.post('/transactions', authenticate, transactionsValidation, plaidController.getTransactions);
router.post('/identity', authenticate, accessTokenValidation, plaidController.getIdentity);
router.post('/income', authenticate, accessTokenValidation, plaidController.getIncome);
router.post('/transactions-sync', authenticate, accessTokenValidation, plaidController.getTransactionsSync);
router.post('/item', authenticate, accessTokenValidation, plaidController.getItem);
router.post('/item/remove', authenticate, accessTokenValidation, plaidController.removeItem);
router.post('/accounts/balance', authenticate, accessTokenValidation, plaidController.getAccountsBalance);
router.post('/link-token/update', authenticate, exchangeTokenValidation, plaidController.createUpdateLinkToken);

// Webhook endpoint (public, but should be secured with webhook signature in production)
router.post('/webhook', plaidController.handleWebhook);

// Health check (public)
router.get('/health', plaidController.healthCheck);

export default router;
