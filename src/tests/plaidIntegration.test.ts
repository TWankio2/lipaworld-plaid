import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import plaidRoutes from '../routes/plaidRoutes';

vi.stubEnv('PLAID_CLIENT_ID', 'test-client-id');
vi.stubEnv('PLAID_SECRET', 'test-secret');
vi.stubEnv('PLAID_ENV', 'sandbox');


vi.mock('../config/plaid', () => ({
  createPlaidClient: vi.fn(() => ({
    // Mock client methods as needed
    categoriesGet: vi.fn(),
    linkTokenCreate: vi.fn(),
    itemPublicTokenExchange: vi.fn()
  })),
  getPlaidConfig: vi.fn(() => ({
    clientId: 'test-client-id',
    secret: 'test-secret',
    env: 'sandbox'
  }))
}));

// Mock the entire service
vi.mock('../services/plaidService');
vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next()
}));
vi.mock('../middleware/validation', () => ({
  linkTokenValidation: (req: any, res: any, next: any) => next(),
  exchangeTokenValidation: (req: any, res: any, next: any) => next(),
  accessTokenValidation: (req: any, res: any, next: any) => next(),
  transactionsValidation: (req: any, res: any, next: any) => next()
}));

describe('Plaid Routes Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/plaid', plaidRoutes);
  });

  it('should have health endpoint', async () => {
    const response = await request(app)
      .get('/api/plaid/health')
      .expect(200);
    
    // The actual response will depend on your mock
    expect(response.status).toBe(200);
  });

  it('should have webhook endpoint', async () => {
    const response = await request(app)
      .post('/api/plaid/webhook')
      .send({ webhook_type: 'TRANSACTIONS' })
      .expect(200);
    
    expect(response.status).toBe(200);
  });
});