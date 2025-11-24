// invoice-server.ts
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

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Invoice {
  id: string;
  customerId: string;
  customerName?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  status: "draft" | "sent" | "paid";
}

// In-memory database
const invoices: Map<string, Invoice> = new Map();

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Create server instance
const server = new Server(
  {
    name: "invoice-server",
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
        name: "create_invoice",
        description: "Create a new invoice for a customer with items",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Customer ID from customer-server",
            },
            customerName: {
              type: "string",
              description: "Customer name (optional)",
            },
            items: {
              type: "array",
              description: "List of items in the invoice",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  price: { type: "number" },
                },
                required: ["description", "quantity", "price"],
              },
            },
            taxRate: {
              type: "number",
              description: "Tax rate (%, default 10%)",
            },
          },
          required: ["customerId", "items"],
        },
      },
      {
        name: "get_invoice",
        description: "Get invoice information by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Invoice ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "list_invoices",
        description: "List all invoices, optionally filter by customerId",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Filter by customer ID (optional)",
            },
          },
        },
      },
      {
        name: "update_invoice_status",
        description: "Update invoice status",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: {
              type: "string",
              enum: ["draft", "sent", "paid"],
            },
          },
          required: ["id", "status"],
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
    case "create_invoice": {
      const id = `INV-${Date.now()}`;
      const items = (args.items as any[]).map((item) => ({
        ...item,
        total: item.quantity * item.price,
      }));

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = (args.taxRate as number) || 10;
      const tax = (subtotal * taxRate) / 100;
      const total = subtotal + tax;

      const invoice: Invoice = {
        id,
        customerId: args.customerId as string,
        customerName: args.customerName as string,
        items,
        subtotal,
        tax,
        total,
        createdAt: new Date().toISOString(),
        status: "draft",
      };

      invoices.set(id, invoice);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(invoice, null, 2),
          },
        ],
      };
    }

    case "get_invoice": {
      const invoice = invoices.get(args.id as string);
      if (!invoice) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "Invoice not found" }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(invoice, null, 2),
          },
        ],
      };
    }

    case "list_invoices": {
      let allInvoices = Array.from(invoices.values());

      if (args.customerId) {
        allInvoices = allInvoices.filter(
          (inv) => inv.customerId === args.customerId
        );
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(allInvoices, null, 2),
          },
        ],
      };
    }

    case "update_invoice_status": {
      const invoice = invoices.get(args.id as string);
      if (!invoice) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "Invoice not found" }),
            },
          ],
          isError: true,
        };
      }

      invoice.status = args.status as "draft" | "sent" | "paid";
      invoices.set(args.id as string, invoice);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(invoice, null, 2),
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
  const PORT = process.env.INVOICE_PORT || 3002;

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
    console.log(`✅ Invoice MCP Server running on http://localhost:${PORT}`);
    console.log(`   MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
  });
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});