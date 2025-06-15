// 📁 src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Lipaworld Plaid Microservice API',
    version: '1.0.0',
    description: `
# Plaid Integration Microservice

This API supports two authentication methods:

### API Key Authentication
Include the API key in the request header:
\`\`\`
X-API-Key: your-api-key-here
\`\`\`

### JWT Bearer Token
Include the JWT token in the authorization header:
\`\`\`
Authorization: Bearer your-jwt-token-here
\`\`\`

## Integration Flow

1. **Create Link Token** → Initialize Plaid Link on frontend
2. **User connects bank** → Plaid Link UI handles authentication  
3. **Exchange Token** → Convert public token to access token
4. **Retrieve Data** → Get accounts, transactions, identity data
5. **Handle Webhooks** → Process real-time updates

## Rate Limits

- **100 requests per 15 minutes** per IP address
- Rate limits are configurable via environment variables

##  Useful Links

- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid Link Guide](https://plaid.com/docs/link/)
- [Webhook Documentation](https://plaid.com/docs/api/webhooks/)
    `,
    contact: {
      name: 'Lipaworld API Support',
      email: 'api-support@lipaworld.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://plaid-api.lipaworld.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for microservice authentication'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from user authentication system'
      }
    },
    schemas: {
      // Error schemas
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Failed to create link token'
          },
          details: {
            oneOf: [
              { type: 'string' },
              { 
                type: 'object',
                properties: {
                  error_type: { type: 'string', example: 'INVALID_REQUEST' },
                  error_code: { type: 'string', example: 'MISSING_FIELDS' },
                  error_message: { type: 'string', example: 'Required field is missing' }
                }
              }
            ],
            description: 'Additional error details from Plaid or validation'
          }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                msg: { type: 'string', example: 'Invalid value' },
                param: { type: 'string', example: 'user_id' },
                location: { type: 'string', example: 'body' }
              }
            }
          }
        }
      },

      // Request schemas
      LinkTokenRequest: {
        type: 'object',
        required: ['user_id', 'client_name', 'country_codes', 'language', 'products'],
        properties: {
          user_id: {
            type: 'string',
            description: 'Unique identifier for the user in your system',
            example: 'user_12345',
            minLength: 1
          },
          client_name: {
            type: 'string',
            description: 'Name of your application (shown to users)',
            example: 'Boomlet App',
            maxLength: 30
          },
          country_codes: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['US', 'CA', 'GB', 'FR', 'ES', 'NL', 'IE', 'DE']
            },
            description: 'Countries for which institutions will be available',
            example: ['US'],
            minItems: 1
          },
          language: {
            type: 'string',
            enum: ['en', 'fr', 'es', 'nl'],
            description: 'Language for Plaid Link interface',
            example: 'en'
          },
          products: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['transactions', 'identity', 'assets', 'liabilities', 'investments', 'auth']
            },
            description: 'Plaid products to enable for this Link session',
            example: ['transactions', 'identity'],
            minItems: 1
          }
        }
      },
      
      ExchangeTokenRequest: {
        type: 'object',
        required: ['public_token', 'user_id'],
        properties: {
          public_token: {
            type: 'string',
            description: 'Temporary public token received from Plaid Link onSuccess callback',
            example: 'public-sandbox-abc123-def456-ghi789',
            pattern: '^public-'
          },
          user_id: {
            type: 'string',
            description: 'Same user_id used when creating the link token',
            example: 'user_12345'
          }
        }
      },

      AccessTokenRequest: {
        type: 'object',
        required: ['access_token'],
        properties: {
          access_token: {
            type: 'string',
            description: 'Permanent access token obtained from token exchange',
            example: 'access-sandbox-xyz789-abc123-def456',
            pattern: '^access-'
          }
        }
      },

      TransactionsRequest: {
        type: 'object',
        required: ['access_token', 'start_date', 'end_date'],
        properties: {
          access_token: {
            type: 'string',
            description: 'Permanent access token',
            pattern: '^access-'
          },
          start_date: {
            type: 'string',
            format: 'date',
            description: 'Start date for transaction history (YYYY-MM-DD)',
            example: '2024-01-01'
          },
          end_date: {
            type: 'string',
            format: 'date',
            description: 'End date for transaction history (YYYY-MM-DD)',
            example: '2024-06-15'
          },
          count: {
            type: 'integer',
            minimum: 1,
            maximum: 500,
            description: 'Number of transactions to retrieve (default: 100)',
            example: 100
          },
          offset: {
            type: 'integer',
            minimum: 0,
            description: 'Number of transactions to skip for pagination (default: 0)',
            example: 0
          }
        }
      },

      TransactionsSyncRequest: {
        type: 'object',
        required: ['access_token'],
        properties: {
          access_token: {
            type: 'string',
            description: 'Permanent access token',
            pattern: '^access-'
          },
          cursor: {
            type: 'string',
            description: 'Cursor for incremental sync (omit for initial sync)',
            example: 'eyJsYXN0X3VwZGF0ZWRfZGF0ZXRpbWUiOiIyMDI0LTA2LTE1VDA5OjAwOjAwWiIsImxhc3RfdXBkYXRlZF9kYXRldGltZSI6IjIwMjQtMDYtMTVUMDk6MDA6MDBaIn0='
          }
        }
      },

      UpdateLinkTokenRequest: {
        type: 'object',
        required: ['access_token', 'user_id'],
        properties: {
          access_token: {
            type: 'string',
            description: 'Current access token that needs re-authentication',
            pattern: '^access-'
          },
          user_id: {
            type: 'string',
            description: 'User identifier',
            example: 'user_12345'
          }
        }
      },

      // Response schemas
      LinkTokenResponse: {
        type: 'object',
        properties: {
          link_token: {
            type: 'string',
            description: 'Token for initializing Plaid Link on frontend',
            example: 'link-sandbox-abc123-def456-ghi789'
          },
          expiration: {
            type: 'string',
            format: 'date-time',
            description: 'Link token expiration time (typically 4 hours)',
            example: '2024-06-15T13:30:00Z'
          },
          request_id: {
            type: 'string',
            description: 'Plaid request ID for debugging purposes',
            example: 'req_abc123def456'
          }
        }
      },

      ExchangeTokenResponse: {
        type: 'object',
        properties: {
          access_token: {
            type: 'string',
            description: 'Permanent access token (store securely on backend)',
            example: 'access-sandbox-xyz789-abc123-def456'
          },
          item_id: {
            type: 'string',
            description: 'Plaid item identifier for this connection',
            example: 'item_abc123def456'
          },
          request_id: {
            type: 'string',
            description: 'Plaid request ID',
            example: 'req_def456ghi789'
          }
        }
      },

      Account: {
        type: 'object',
        properties: {
          account_id: {
            type: 'string',
            description: 'Unique account identifier',
            example: 'account_abc123def456'
          },
          balances: {
            type: 'object',
            properties: {
              available: {
                type: 'number',
                nullable: true,
                description: 'Available balance (may be null for some account types)',
                example: 1500.50
              },
              current: {
                type: 'number',
                description: 'Current balance',
                example: 1500.50
              },
              limit: {
                type: 'number',
                nullable: true,
                description: 'Credit limit (for credit accounts)',
                example: 5000.00
              },
              iso_currency_code: {
                type: 'string',
                description: 'ISO currency code',
                example: 'USD'
              }
            }
          },
          mask: {
            type: 'string',
            description: 'Last 2-4 digits of account number',
            example: '0000'
          },
          name: {
            type: 'string',
            description: 'Account name',
            example: 'Plaid Checking'
          },
          official_name: {
            type: 'string',
            nullable: true,
            description: 'Official account name from financial institution',
            example: 'Plaid Gold Standard 0% Interest Checking'
          },
          subtype: {
            type: 'string',
            description: 'Account subtype',
            example: 'checking'
          },
          type: {
            type: 'string',
            description: 'Account type',
            enum: ['depository', 'credit', 'loan', 'investment', 'other'],
            example: 'depository'
          }
        }
      },

      Transaction: {
        type: 'object',
        properties: {
          transaction_id: {
            type: 'string',
            description: 'Unique transaction identifier',
            example: 'txn_abc123def456'
          },
          account_id: {
            type: 'string',
            description: 'Account ID this transaction belongs to',
            example: 'account_abc123def456'
          },
          amount: {
            type: 'number',
            description: 'Transaction amount (positive = money out, negative = money in)',
            example: 12.34
          },
          date: {
            type: 'string',
            format: 'date',
            description: 'Transaction date',
            example: '2024-06-14'
          },
          name: {
            type: 'string',
            description: 'Transaction description/name',
            example: 'Starbucks Store #1234'
          },
          merchant_name: {
            type: 'string',
            nullable: true,
            description: 'Merchant name if available',
            example: 'Starbucks'
          },
          category: {
            type: 'array',
            items: { type: 'string' },
            description: 'Transaction categories (hierarchical)',
            example: ['Food and Drink', 'Restaurants', 'Coffee Shop']
          },
          transaction_type: {
            type: 'string',
            description: 'Transaction type',
            enum: ['place', 'online', 'digital'],
            example: 'place'
          },
          iso_currency_code: {
            type: 'string',
            description: 'ISO currency code',
            example: 'USD'
          }
        }
      },

      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy'],
            description: 'Overall service health status'
          },
          plaid_environment: {
            type: 'string',
            enum: ['sandbox', 'development', 'production'],
            description: 'Current Plaid environment'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Health check timestamp'
          },
          service: {
            type: 'string',
            description: 'Service name',
            example: 'lipaworld-plaid-service'
          },
          version: {
            type: 'string',
            description: 'Service version',
            example: '1.0.0'
          }
        }
      },

      WebhookPayload: {
        type: 'object',
        properties: {
          webhook_type: {
            type: 'string',
            enum: ['TRANSACTIONS', 'ITEM', 'AUTH', 'ASSETS', 'HOLDINGS', 'LIABILITIES'],
            description: 'Type of webhook event'
          },
          webhook_code: {
            type: 'string',
            description: 'Specific webhook event code',
            example: 'SYNC_UPDATES_AVAILABLE'
          },
          item_id: {
            type: 'string',
            description: 'Plaid item ID associated with this webhook',
            example: 'item_abc123def456'
          },
          new_transactions: {
            type: 'integer',
            description: 'Number of new transactions (for TRANSACTIONS webhooks)',
            example: 5
          },
          removed_transactions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of removed transaction IDs',
            example: ['txn_removed123', 'txn_removed456']
          }
        },
        required: ['webhook_type', 'webhook_code']
      }
    }
  },
  tags: [
    {
      name: 'Link Flow',
      description: 'Core Plaid Link integration endpoints for connecting bank accounts'
    },
    {
      name: 'Data Retrieval', 
      description: 'Endpoints for fetching financial data from connected accounts'
    },
    {
      name: 'Item Management',
      description: 'Endpoints for managing connected financial institution items'
    },
    {
      name: 'Webhooks',
      description: 'Real-time webhook processing for account updates'
    },
    {
      name: 'Health & Monitoring',
      description: 'Service health checks and monitoring endpoints'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts'] // Path to route files with annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

