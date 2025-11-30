// src/main-agent.ts
import { run } from "@openai/agents";
import readline from "readline";
import dotenv from "dotenv";
import { mainAgent } from "./agents/system.js";

dotenv.config();

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: OPENAI_API_KEY is not configured!");
    console.error("Please create .env file and add: OPENAI_API_KEY=your_key_here");
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n🚀 Multi-Agent System - AI-Powered Assistant");
  console.log("Enter your request (or 'exit' to quit):\n");

  let history: any[] = [];

  const prompt = () => {
    rl.question("👉 ", async (input) => {
      if (input.trim().toLowerCase() === "exit") {
        rl.close();
        process.exit(0);
      }

      if (!input.trim()) {
        prompt();
        return;
      }

      try {
        console.log("🤖 Processing...");
        const result = await run(mainAgent, [...history, { role: "user", content: input }]);
        history = result.history;

        // Calculate usage
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalTokens = 0;

        const rawResponses = (result as any).rawResponses;
        if (rawResponses && Array.isArray(rawResponses)) {
          for (const response of rawResponses) {
            if (response.usage) {
              totalInputTokens += response.usage.inputTokens || 0;
              totalOutputTokens += response.usage.outputTokens || 0;
              totalTokens += response.usage.totalTokens || 0;
            }
          }
        }

        console.log("\n📊 Usage Statistics:");
        console.log(`  - Input Tokens: ${totalInputTokens}`);
        console.log(`  - Output Tokens: ${totalOutputTokens}`);
        console.log(`  - Total Tokens: ${totalTokens}`);

        console.log("\n📜 Conversation History:");
        console.log(JSON.stringify(history, null, 2));

        console.log("\n💬 Assistant:", result.finalOutput);
      } catch (error) {
        console.error("❌ Error:", error);
      }

      console.log("\n" + "─".repeat(60) + "\n");
      prompt();
    });
  };

  prompt();
}

main().catch((error) => {
  console.error("Application error:", error);
  process.exit(1);
});
