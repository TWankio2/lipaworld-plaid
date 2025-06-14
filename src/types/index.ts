import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    service: string;
  };
}

export interface PlaidConfig {
    clientId: string;
    secret: string;
    env: 'sandbox' | 'development' | 'production';
  }
  
  export interface AuthRequest extends Request {
    user?: {
      id: string;
      service: string;
    };
  }
  
  export interface LinkTokenRequest {
    user_id: string;
    client_name: string;
    country_codes: string[];
    language: string;
    products: string[];
  }
  
  export interface ExchangeTokenRequest {
    public_token: string;
    user_id: string;
  }
  
  export interface AccountsRequest {
    access_token: string;
  }
  
  export interface TransactionsRequest {
    access_token: string;
    start_date: string;
    end_date: string;
    count?: number;
    offset?: number;
  }
  
  export interface IdentityRequest {
    access_token: string;
  }
  
  export interface IncomeRequest {
    access_token: string;
  }