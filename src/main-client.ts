// main-client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import OpenAI from "openai";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

interface MCPClient {
  name: string;
  client: Client;
  transport: StreamableHTTPClientTransport;
}

interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

class MainApplication {
  private clients: Map<string, MCPClient> = new Map();
  private openai: OpenAI;
  private availableTools: ToolDefinition[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async initialize() {
    console.log("🔌 Connecting to MCP servers via HTTP...");

    const customerUrl = process.env.CUSTOMER_SERVER_URL || "http://localhost:3001";
    const invoiceUrl = process.env.INVOICE_SERVER_URL || "http://localhost:3002";

    // Connect to Customer Server
    try {
      const customerClient = new Client(
        {
          name: "main-app-customer-client",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      const customerTransport = new StreamableHTTPClientTransport(
        new URL(`${customerUrl}/mcp`)
      );

      await customerClient.connect(customerTransport);
      this.clients.set("customer", {
        name: "customer",
        client: customerClient,
        transport: customerTransport,
      });

      console.log(`✅ Connected to Customer Server: ${customerUrl}`);
    } catch (error) {
      console.error(`❌ Failed to connect to Customer Server: ${error}`);
      throw error;
    }

    // Connect to Invoice Server
    try {
      const invoiceClient = new Client(
        {
          name: "main-app-invoice-client",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      const invoiceTransport = new StreamableHTTPClientTransport(
        new URL(`${invoiceUrl}/mcp`)
      );

      await invoiceClient.connect(invoiceTransport);
      this.clients.set("invoice", {
        name: "invoice",
        client: invoiceClient,
        transport: invoiceTransport,
      });

      console.log(`✅ Connected to Invoice Server: ${invoiceUrl}`);
    } catch (error) {
      console.error(`❌ Failed to connect to Invoice Server: ${error}`);
      throw error;
    }

    // Load available tools from servers
    await this.loadAvailableTools();

    console.log(`📋 Loaded ${this.availableTools.length} tools\n`);
  }

  async loadAvailableTools() {
    this.availableTools = [];

    for (const [serverName, mcpClient] of this.clients) {
      const tools = await mcpClient.client.listTools();

      for (const tool of tools.tools) {
        this.availableTools.push({
          type: "function",
          function: {
            name: `${serverName}_${tool.name}`,
            description: `[${serverName.toUpperCase()}] ${tool.description}`,
            parameters: tool.inputSchema,
          },
        });
      }
    }
  }

  async analyzePromptWithLLM(userPrompt: string, conversationHistory: any[] = []) {
    console.log("🤖 Analyzing request with OpenAI...\n");

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI assistant managing a Customer and Invoice system.
Task: Analyze user requests and call appropriate tools.

INSTRUCTIONS:
- When user wants to create a customer, use customer_create_customer tool
- When user wants to list customers, use customer_list_customers tool
- When user wants to create an invoice, use invoice_create_invoice tool (requires customer ID)
- When user wants to list invoices, use invoice_list_invoices tool
- If information is missing, ask the user before calling tools
- Respond in English, be friendly and clear`,
      },
      ...conversationHistory,
      {
        role: "user",
        content: userPrompt,
      },
    ];

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
        messages: messages,
        tools: this.availableTools,
        tool_choice: "auto",
      });

      const assistantMessage = response.choices[0].message;

      // If LLM wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log("🔧 Executing actions...\n");

        const toolResults = [];

        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(`📞 Calling: ${toolName}`);
          console.log(`   Args: ${JSON.stringify(toolArgs, null, 2)}`);

          // Parse server name and tool name
          const [serverName, ...toolNameParts] = toolName.split("_");
          const actualToolName = toolNameParts.join("_");

          const mcpClient = this.clients.get(serverName);
          if (!mcpClient) {
            console.error(`❌ Server not found: ${serverName}`);
            continue;
          }

          // Call MCP tool
          const result = await mcpClient.client.callTool({
            name: actualToolName,
            arguments: toolArgs,
          });

          if (!result.content || !Array.isArray(result.content)) {
            console.error(`❌ Invalid result from ${toolName}`);
            continue;
          }

          const firstContent = result.content[0];
          if (!firstContent || typeof firstContent !== 'object' || !('text' in firstContent)) {
            console.error(`❌ Invalid content format from ${toolName}`);
            continue;
          }

          const resultText = firstContent.text as string;
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: resultText,
          });

          console.log(`✅ Result: ${resultText.substring(0, 100)}...\n`);
        }

        // Call LLM again with tool results to generate final response
        const finalResponse = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
          messages: [
            ...messages,
            assistantMessage,
            ...toolResults,
          ],
        });

        const finalMessage = finalResponse.choices[0].message.content;
        console.log("💬 Assistant:", finalMessage, "\n");

        return {
          message: finalMessage,
          history: [
            ...conversationHistory,
            { role: "user", content: userPrompt },
            assistantMessage,
            ...toolResults,
            { role: "assistant", content: finalMessage },
          ],
        };
      } else {
        // LLM responds directly without calling tools
        const content = assistantMessage.content;
        console.log("💬 Assistant:", content, "\n");

        return {
          message: content,
          history: [
            ...conversationHistory,
            { role: "user", content: userPrompt },
            { role: "assistant", content: content },
          ],
        };
      }
    } catch (error: any) {
      console.error("❌ Error calling OpenAI:", error.message);
      return {
        message: "Sorry, an error occurred while processing your request.",
        history: conversationHistory,
      };
    }
  }

  async close() {
    for (const [name, client] of this.clients) {
      await client.client.close();
      console.log(`Closed connection to ${name}`);
    }
  }

  async startInteractive() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("🚀 Main Application - AI-Powered MCP Client");
    console.log("Enter your request (or 'exit' to quit):\n");

    let conversationHistory: any[] = [];

    const prompt = () => {
      rl.question("👉 ", async (input) => {
        if (input.trim().toLowerCase() === "exit") {
          await this.close();
          rl.close();
          process.exit(0);
        }

        if (!input.trim()) {
          prompt();
          return;
        }

        const result = await this.analyzePromptWithLLM(input, conversationHistory);
        conversationHistory = result.history;

        console.log("─".repeat(60), "\n");
        prompt();
      });
    };

    prompt();
  }
}

// Start application
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: OPENAI_API_KEY is not configured!");
    console.error("Please create .env file and add: OPENAI_API_KEY=your_key_here");
    process.exit(1);
  }

  const app = new MainApplication();
  
  try {
    await app.initialize();
    await app.startInteractive();
  } catch (error) {
    console.error("❌ Failed to start application:", error);
    console.error("\nMake sure Customer and Invoice servers are running:");
    console.error("  Terminal 1: npm run start:customer");
    console.error("  Terminal 2: npm run start:invoice");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Application error:", error);
  process.exit(1);
});