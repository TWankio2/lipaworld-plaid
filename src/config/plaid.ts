import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { PlaidConfig } from '../types';

const getPlaidConfig = (): PlaidConfig => {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV as 'sandbox' | 'development' | 'production';

  if (!clientId || !secret || !env) {
    throw new Error('Missing required Plaid configuration');
  }

  return { clientId, secret, env };
};

const createPlaidClient = () => {
  const config = getPlaidConfig();
  
  const configuration = new Configuration({
    basePath: PlaidEnvironments[config.env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': config.clientId,
        'PLAID-SECRET': config.secret,
      },
    },
  });

  return new PlaidApi(configuration);
};

export { createPlaidClient, getPlaidConfig };
