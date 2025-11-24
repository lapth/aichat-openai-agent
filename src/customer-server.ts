// customer-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { randomUUID } from "node:crypto";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

// In-memory database
const customers: Map<string, Customer> = new Map();

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Create server instance
const server = new Server(
  {
    name: "customer-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
  return {
    tools: [
      {
        name: "create_customer",
        description: "Create a new customer with name, email, and phone",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Customer name",
            },
            email: {
              type: "string",
              description: "Customer email",
            },
            phone: {
              type: "string",
              description: "Phone number",
            },
          },
          required: ["name", "email"],
        },
      },
      {
        name: "get_customer",
        description: "Get customer information by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Customer ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "list_customers",
        description: "List all customers",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error("Missing arguments");
  }

  switch (name) {
    case "create_customer": {
      const id = `CUST-${Date.now()}`;
      const customer: Customer = {
        id,
        name: args.name as string,
        email: args.email as string,
        phone: (args.phone as string) || "",
        createdAt: new Date().toISOString(),
      };
      customers.set(id, customer);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(customer, null, 2),
          },
        ],
      };
    }

    case "get_customer": {
      const customer = customers.get(args.id as string);
      if (!customer) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "Customer not found" }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(customer, null, 2),
          },
        ],
      };
    }

    case "list_customers": {
      const allCustomers = Array.from(customers.values());
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(allCustomers, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start HTTP server
async function main() {
  const app = express();
  const PORT = process.env.CUSTOMER_PORT || 3001;

  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    console.log("Received MCP request");

    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId: string) => {
          transports[newSessionId] = transport;
          console.log(`New session initialized: ${newSessionId}`);
        },
      });

      await server.connect(transport);
    } else {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({ error: "Invalid session" });
      return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && transports[sessionId]) {
      delete transports[sessionId];
      console.log(`Session terminated: ${sessionId}`);
    }

    res.status(200).json({ message: "Session terminated" });
  });

  app.listen(PORT, () => {
    console.log(`✅ Customer MCP Server running on http://localhost:${PORT}`);
    console.log(`   MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
  });
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});