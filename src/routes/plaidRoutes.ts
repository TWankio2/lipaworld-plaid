import { Router } from 'express';
import plaidController from '../controllers/plaidController';
import { authenticate } from '../middleware/auth';
import {
  linkTokenValidation,
  exchangeTokenValidation,
  accessTokenValidation,
  transactionsValidation
} from '../middleware/validation'

/**
 * @swagger
 * /link-token:
 *   post:
 *     tags: [Link Flow]
 *     summary: Create Link Token
 *     description: Creates a temporary token to initialize Plaid Link on the frontend
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkTokenRequest'
 *     responses:
 *       200:
 *         description: Link token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LinkTokenResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /exchange-token:
 *   post:
 *     tags: [Link Flow]
 *     summary: Exchange Public Token
 *     description: Exchanges temporary public token for permanent access token
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExchangeTokenRequest'
 *     responses:
 *       200:
 *         description: Token exchanged successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExchangeTokenResponse'
 */

/**
 * @swagger
 * /accounts:
 *   post:
 *     tags: [Data Retrieval]
 *     summary: Get Accounts
 *     description: Retrieves all linked bank accounts and their metadata
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccessTokenRequest'
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health & Monitoring]
 *     summary: Health Check
 *     description: Checks service health and Plaid API connectivity
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */

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
router.get('/validate-connection', plaidController.validateConnection);

// Webhook endpoint (public, temporarily)
router.post('/webhook', plaidController.handleWebhook);

// Health check (public)
router.get('/health', plaidController.healthCheck);

export default router;