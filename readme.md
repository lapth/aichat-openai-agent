# MCP Invoice System

Customer and Invoice management system using Model Context Protocol (MCP) with client/server architecture.

## Architecture

```
┌──────────────────────────────────────────┐
│    Main Application (Client)             │
│  ┌────────────────────────────────────┐  │
│  │      OpenAI GPT-4 Turbo            │  │
│  │   - Natural language analysis      │  │
│  │   - Function calling for tools     │  │
│  │   - Friendly responses             │  │
│  └────────────────┬───────────────────┘  │
│                   │                       │
│  ┌────────────────▼───────────────────┐  │
│  │  MCP Client (HTTP Transport)       │  │
│  │   - HTTP connections to servers    │  │
│  │   - Execute tool calls             │  │
│  │   - Manage conversation history    │  │
│  └────────┬───────────┬────────────────┘  │
└───────────┼───────────┼───────────────────┘
            │           │
            │   HTTP    │   HTTP
            │           │
    ┌───────▼────┐  ┌───▼────────┐
    │ Customer   │  │ Invoice    │
    │ Server     │  │ Server     │
    │ Port: 3001 │  │ Port: 3002 │
    │ (Express)  │  │ (Express)  │
    └────────────┘  └────────────┘
    Independent      Independent
```

### Transport Protocol:
- **HTTP POST**: Simple request/response for MCP protocol
- **StreamableHTTPClientTransport**: Client-side MCP transport
- **Express REST**: Health checks and standard endpoints
- **MCP Protocol**: Communication between client and servers

## Installation

1. **Initialize project:**
```bash
mkdir mcp-invoice-system
cd mcp-invoice-system
npm init -y
```

2. **Install dependencies:**
```bash
npm install @modelcontextprotocol/sdk openai dotenv express
npm install -D typescript @types/node @types/express
```

3. **Configure OpenAI API Key:**
Create `.env` file in root directory:
```bash
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
CUSTOMER_SERVER_URL=http://localhost:3001
INVOICE_SERVER_URL=http://localhost:3002
CUSTOMER_PORT=3001
INVOICE_PORT=3002
```

4. **Create directory structure:**
```bash
mkdir src
```

5. **Copy files:**
- `src/customer-server.ts` - Customer MCP Server
- `src/invoice-server.ts` - Invoice MCP Server  
- `src/main-client.ts` - Main Application (Client with OpenAI)
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (OPENAI_API_KEY)

6. **Build project:**
```bash
npm run build
```

## Running the Application

### Method 1: Run each service separately (Recommended)

**Terminal 1 - Customer Server:**
```bash
npm run start:customer
# Server runs at http://localhost:3001
```

**Terminal 2 - Invoice Server:**
```bash
npm run start:invoice
# Server runs at http://localhost:3002
```

**Terminal 3 - Main Application (Client):**
```bash
npm run start:main
```

### Method 2: Check server health

```bash
# Check Customer Server
curl http://localhost:3001/health

# Check Invoice Server
curl http://localhost:3002/health
```

### Method 3: Customize ports

In `.env` file:
```env
CUSTOMER_PORT=4001
INVOICE_PORT=4002
CUSTOMER_SERVER_URL=http://localhost:4001
INVOICE_SERVER_URL=http://localhost:4002
```

## Usage

After running the main application, you can communicate naturally with the AI assistant. OpenAI will automatically analyze and call appropriate tools.

### Example natural language commands:

#### 1. Create Customer
```
Create a new customer named John Doe, email john@example.com, phone 0909123456
```
or simply:
```
Add a new customer: Jane Smith, jane@test.com
```

#### 2. List Customers
```
Show me all customers
```
or:
```
How many customers do we have?
```

#### 3. Create Invoice
```
Create an invoice for customer CUST-1234567890
```
or after creating a customer:
```
Create an invoice for the customer I just created
```

#### 4. List Invoices
```
Show me all invoices
```
or:
```
What invoices do we have?
```

### 5. Thoát
```
exit
```

## Example Workflow

```bash
# Terminal 1: Start Customer Server
npm run start:customer
✅ Customer MCP Server running on http://localhost:3001
   MCP endpoint: http://localhost:3001/mcp
   Health check: http://localhost:3001/health

# Terminal 2: Start Invoice Server
npm run start:invoice
✅ Invoice MCP Server running on http://localhost:3002
   MCP endpoint: http://localhost:3002/mcp
   Health check: http://localhost:3002/health

# Terminal 3: Start Main Client
npm run start:main
🔌 Connecting to MCP servers via HTTP...
✅ Connected to Customer Server: http://localhost:3001
✅ Connected to Invoice Server: http://localhost:3002
📋 Loaded 7 tools

🚀 Main Application - AI-Powered MCP Client
Enter your request (or 'exit' to quit):

# 1. Create customer with natural language
👉 Create a new customer named John Doe, email john@example.com, phone 0909123456

🤖 Analyzing request with OpenAI...

🔧 Executing actions...

📞 Calling: customer_create_customer
   Args: {
     "name": "John Doe",
     "email": "john@example.com",
     "phone": "0909123456"
   }
✅ Result: {...}

💬 Assistant: Successfully created customer John Doe with ID CUST-1700000000000. 
Email: john@example.com, Phone: 0909123456

────────────────────────────────────────────────────────────

# 2. Create invoice
👉 Create an invoice for customer CUST-1700000000000

🤖 Analyzing request with OpenAI...

🔧 Executing actions...

📞 Calling: invoice_create_invoice
   Args: {
     "customerId": "CUST-1700000000000",
     "items": [...]
   }
✅ Result: {...}

💬 Assistant: Created invoice INV-1700000000000 for the customer.
Total amount: $440.00 (including 10% tax)

────────────────────────────────────────────────────────────
```

## MCP Structure

### Customer Server Tools
- `create_customer` - Create a new customer
- `get_customer` - Get customer information by ID
- `list_customers` - List all customers

### Invoice Server Tools
- `create_invoice` - Create an invoice for a customer
- `get_invoice` - Get invoice information by ID
- `list_invoices` - List invoices (can filter by customerId)
- `update_invoice_status` - Update invoice status

## Extending

### Add new features:

1. **Add tool to server:**
```typescript
// In ListToolsRequestSchema handler
{
  name: "your_new_tool",
  description: "Tool description",
  inputSchema: { ... }
}
```

2. **Handle tool call:**
```typescript
// In CallToolRequestSchema handler
case "your_new_tool": {
  // Processing logic
  return { content: [...] };
}
```

3. **Call from main client:**
```typescript
const result = await client.callTool({
  name: "your_new_tool",
  arguments: { ... }
});
```

## Notes

- **OpenAI API Key**: Valid API key from OpenAI required
- **Model**: Default is GPT-4 Turbo, can switch to GPT-3.5-turbo to save costs
- **Independent Servers**: Customer and Invoice servers run independently, can be deployed separately
- **HTTP Transport**: Servers use simple HTTP POST for communication
- **StreamableHTTPClientTransport**: Client uses HTTP-based transport for MCP
- **Data Storage**: Stored in memory, will be lost on server restart (can integrate database)
- **Conversation History**: Maintained in session for AI context
- **Natural Language**: Supports English natural language queries
- **Tool Selection**: OpenAI automatically selects appropriate tools based on context
- **Scalability**: Can add more servers and client will automatically load tools

### Advantages of this architecture:
- ✅ **Microservices**: Each server is independent, easy to maintain and scale
- ✅ **HTTP Protocol**: Easy to deploy, can run on different machines
- ✅ **Health Checks**: Easy to monitor servers
- ✅ **Load Balancing**: Can add load balancer in front of servers
- ✅ **Docker Ready**: Easy to containerize each service
- ✅ **Simple Transport**: Standard HTTP POST, no complex SSE setup

### Cost optimization:
```env
# In .env file, switch to GPT-3.5-turbo
OPENAI_MODEL=gpt-3.5-turbo
```

## Reference

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)