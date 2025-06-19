#  Plaid Microservice API Documentation

Test Interface: http://localhost:3000/test
Swagger UI: http://localhost:3000/api-docs
Health Check: http://localhost:3000/health

##  Authentication

All endpoints (except `/webhook` and `/health`) require authentication using either:
- **API Key**: `X-API-Key: your-api-key` (header)
- **JWT Token**: `Authorization: Bearer your-jwt-token` (header)

##  Complete Plaid Integration Flow

### Step 1: Initialize Link Flow
**Purpose**: Start the bank connection process for a user

#### `POST /link-token`
Creates a temporary token to initialize Plaid Link on the frontend.

**Request Body:**
```json
{
  "user_id": "user123",
  "client_name": "LipaWorld App",
  "country_codes": ["US"],
  "language": "en",
  "products": ["transactions", "identity"]
}
```

**Response:**
```json
{
  "link_token": "link-sandbox-abc123...",
  "expiration": "2024-06-15T12:00:00Z",
  "request_id": "req_abc123"
}
```

**Frontend Usage:**
```javascript
// Use this link_token to open Plaid Link UI
const { open } = usePlaidLink({
  token: linkToken,
  onSuccess: (public_token) => {
    // Send public_token to Step 2
  }
});
```
### Testing with Plaid Sandbox
Test Bank: First Platypus Bank
Username: user_good
Password: pass_good
The sandbox returns 12 test accounts with realistic banking data for development.
---

### Step 2: Exchange Tokens
**Purpose**: Convert temporary public token to permanent access token

#### `POST /exchange-token`
Exchanges the public token from Plaid Link for a permanent access token.

**Request Body:**
```json
{
  "public_token": "public-sandbox-abc123...",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "access_token": "access-sandbox-xyz789...",
  "item_id": "item_123",
  "request_id": "req_def456"
}
```

**⚠️ Security Note**: Store the `access_token` securely on your backend. Never expose it to the frontend.

---

## 📊 Data Retrieval Endpoints

### Account Information

#### `POST /accounts`
Retrieves all linked bank accounts and their metadata.

**Request Body:**
```json
{
  "access_token": "access-sandbox-xyz789..."
}
```

**Response:**
```json
{
  "accounts": [
    {
      "account_id": "account123",
      "balances": {
        "available": 1500.50,
        "current": 1500.50,
        "iso_currency_code": "USD"
      },
      "mask": "0000",
      "name": "Plaid Checking",
      "official_name": "Plaid Gold Standard 0% Interest Checking",
      "subtype": "checking",
      "type": "depository"
    }
  ],
  "item": {
    "item_id": "item_123",
    "institution_id": "ins_3"
  }
}
```

#### `POST /accounts/balance`
Retrieves real-time account balances (more current than `/accounts`).

**Use Case**: When you need the most up-to-date balance information.

---

### Transaction Data

#### `POST /transactions`
Retrieves historical transactions within a date range.

**Request Body:**
```json
{
  "access_token": "access-sandbox-xyz789...",
  "start_date": "2024-01-01",
  "end_date": "2024-06-15",
  "count": 100,
  "offset": 0
}
```

**Response:**
```json
{
  "transactions": [
    {
      "transaction_id": "txn123",
      "account_id": "account123",
      "amount": 12.34,
      "date": "2024-06-14",
      "name": "Coffee Shop",
      "merchant_name": "Starbucks",
      "category": ["Food and Drink", "Restaurants"],
      "transaction_type": "place"
    }
  ],
  "total_transactions": 250,
  "accounts": [...],
  "item": {...}
}
```

#### `POST /transactions-sync` ⭐ **Recommended**
Efficiently retrieves incremental transaction updates using cursors.

**Request Body:**
```json
{
  "access_token": "access-sandbox-xyz789...",
  "cursor": "cursor_abc123" // Optional: for pagination
}
```

**Response:**
```json
{
  "added": [/* new transactions */],
  "modified": [/* updated transactions */],
  "removed": [/* deleted transaction IDs */],
  "next_cursor": "cursor_def456",
  "has_more": false
}
```

**Benefits over `/transactions`:**
- More efficient (only returns changes)
- Better for real-time updates
- Recommended by Plaid for production apps

---

### Identity & KYC

#### `POST /identity`
Retrieves user identity information for KYC/verification purposes.

**Response Data:**
- Full name
- Phone numbers
- Email addresses
- Physical addresses
- Account holder information

**Use Cases:**
- Customer onboarding
- Identity verification
- Fraud detection
- Compliance checks

#### `POST /income`
Retrieves income verification data (currently placeholder implementation).

**Current Status**: Returns account-based income estimation
**Future**: Will integrate with Plaid's Income Verification product

---

## 🔧 Item Management

### `POST /item`
Retrieves metadata about the connected financial institution.

**Response:**
```json
{
  "item": {
    "item_id": "item_123",
    "institution_id": "ins_3",
    "available_products": ["transactions", "identity"],
    "billed_products": ["transactions"],
    "error": null
  }
}
```

**Use Cases:**
- Check item health status
- Verify available products
- Debug connection issues

### `POST /item/remove`
Permanently disconnects a user's bank account.

**⚠️ Warning**: This action cannot be undone. All associated data becomes inaccessible.

**Use Cases:**
- User requests account disconnection
- Compliance requirements
- Account cleanup

---

## 🔄 Update & Re-authentication

### `POST /link-token/update`
Creates a Link token for re-authentication when credentials change.

**Request Body:**
```json
{
  "access_token": "access-sandbox-xyz789...",
  "user_id": "user123"
}
```

**When to Use:**
- User changed their bank password
- Bank requires re-authentication
- Webhook indicates `ITEM_LOGIN_REQUIRED`
- Connection errors occur

**Frontend Flow:**
```javascript
// Use returned link_token in update mode
const { open } = usePlaidLink({
  token: updateLinkToken,
  onSuccess: () => {
    // Connection restored, no new tokens needed
  }
});
```

---

## 📡 Webhook Processing

### `POST /webhook` (Public Endpoint)
Receives real-time updates from Plaid about account changes.

**Security**: Automatically verifies JWT signatures from Plaid

**Webhook Types Handled:**
- **TRANSACTIONS**: New transactions available
- **ITEM**: Connection errors, re-auth needed
- **AUTH**: Account verification status
- **ASSETS**: Asset report completion
- **HOLDINGS**: Investment updates
- **LIABILITIES**: Loan/credit updates

**Example Webhook:**
```json
{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "SYNC_UPDATES_AVAILABLE",
  "item_id": "item_123",
  "new_transactions": 5
}
```

**Response**: Always returns `200 OK` with processing status

---

## 🏥 Health & Monitoring

### `GET /health` (Public Endpoint)
Checks service health and Plaid API connectivity.

**Response:**
```json
{
  "status": "healthy",
  "plaid_environment": "sandbox",
  "timestamp": "2024-06-15T10:30:00Z",
  "service": "lipaworld-plaid-service",
  "version": "1.0.0"
}
```

**Use Cases:**
- Load balancer health checks
- Monitoring/alerting systems
- Service discovery
- Debugging connectivity issues

---

## 🔍 Error Handling

### Common Error Responses

#### Authentication Errors (401)
```json
{
  "error": "Invalid API key"
}
```

#### Validation Errors (400)
```json
{
  "errors": [
    {
      "msg": "Invalid value",
      "param": "user_id",
      "location": "body"
    }
  ]
}
```

#### Plaid API Errors (500)
```json
{
  "error": "Failed to get accounts",
  "details": {
    "error_type": "ITEM_ERROR",
    "error_code": "ITEM_LOGIN_REQUIRED",
    "error_message": "the login details of this item have changed"
  }
}
```

### Important Plaid Error Codes

- **ITEM_LOGIN_REQUIRED**: User needs to re-authenticate
- **RATE_LIMIT_EXCEEDED**: Too many API calls
- **INSTITUTION_DOWN**: Bank's systems are temporarily unavailable
- **INSUFFICIENT_CREDENTIALS**: Invalid bank login
- **INVALID_REQUEST**: Malformed API request

---

## 🚦 Rate Limits

**Current Limits:**
- 100 requests per 15 minutes per IP
- Configurable via environment variables

**Best Practices:**
- Implement exponential backoff
- Cache responses when possible
- Use webhooks instead of polling
- Use `/transactions-sync` over `/transactions`

---

## 🔗 Integration Examples

### Complete Flow Example

```javascript
// 1. Create link token
const linkTokenResponse = await fetch('/plaid/link-token', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key' },
  body: JSON.stringify({
    user_id: 'user123',
    client_name: 'Your App',
    country_codes: ['US'],
    language: 'en',
    products: ['transactions', 'identity']
  })
});

// 2. Open Plaid Link (frontend)
const { open } = usePlaidLink({
  token: linkToken,
  onSuccess: async (public_token) => {
    // 3. Exchange tokens
    await fetch('/plaid/exchange-token', {
      method: 'POST',
      headers: { 'X-API-Key': 'your-key' },
      body: JSON.stringify({
        public_token,
        user_id: 'user123'
      })
    });
  }
});

// 4. Retrieve data
const accountsResponse = await fetch('/plaid/accounts', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key' },
  body: JSON.stringify({
    access_token: 'stored-access-token'
  })
});
```

---

## 🛡️ Security Best Practices

1. **Never expose access tokens** to frontend applications
2. **Always encrypt access tokens** at rest in your database
3. **Use HTTPS** for all API communication
4. **Validate webhook signatures** (automatically handled)
5. **Implement proper token storage** with access controls
6. **Monitor for suspicious activity** using request logs
7. **Rotate API keys** regularly

---

## 🔄 Webhook Integration Guide

### Setting Up Webhooks

1. **Configure webhook URL** in your Plaid dashboard
2. **Ensure public accessibility** (use ngrok for local testing)
3. **Handle webhook processing** asynchronously
4. **Implement idempotency** for duplicate webhooks
5. **Respond within 10 seconds** to avoid retries

### Example Webhook Handler

```javascript
// Your app's webhook handler
app.post('/your-webhook-handler', async (req, res) => {
  const webhookData = req.body;
  
  if (webhookData.webhook_type === 'TRANSACTIONS') {
    // Trigger background job to sync transactions
    await queueTransactionSync(webhookData.item_id);
  }
  
  if (webhookData.webhook_code === 'ITEM_LOGIN_REQUIRED') {
    // Notify user to re-authenticate
    await notifyUserReauth(webhookData.item_id);
  }
  
  res.status(200).json({ received: true });
});
```

---


## Common Issues

1. **Link token expired**: Tokens expire quickly, generate new ones as needed
2. **Item login required**: Guide users through re-authentication flow
3. **Rate limits**: Implement proper backoff and caching
4. **Institution downtime**: Handle gracefully with user messaging

### Debug Information

All responses include `request_id` for debugging with Plaid support.


