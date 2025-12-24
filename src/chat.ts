import { type Message, Ollama } from "ollama";
import { PassThrough } from "stream";
import {
  imageGenerationTool,
  analyzeStartupCostTool,
  analyzeStartupCosts,
  calculateBreakEvenTool,
  calculateBreakEven,
  competitiveAnalysisTool,
  competitiveAnalysis,
  fundingStrategyTool,
  fundingStrategy,
  generateBusinessPlanTool,
  generateBusinessPlan,
  type AnalyzeStartupCostsArgs,
  type CalculateBreakEvenArgs,
  type CompetitiveAnalysisArgs,
  type GenerateBusinessPlanArgs,
  type FundingStrategyArgs,
  type GenerateImageArgs,
  TOOLS,
} from "./mcp.ts";
import { type User } from "stytch";
import { redisClient } from "./redis.ts";
import { processor } from "./shared/rehype.ts";
import { getImageRef } from "./image-generation.ts";

const OLLAMA_API_URL =
  process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3";

type Entry = { messages: Message[] };

const ollama = new Ollama({
  host: OLLAMA_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

async function getEntry(sessionId: string): Promise<Entry> {
  const entry = await redisClient().get(
    `${sessionId}-messages`
  );

  if (entry) {
    return JSON.parse(entry) as Entry;
  }

  const newEntry: Entry = {
    messages: [],
  };

  saveEntry(sessionId, newEntry);

  return newEntry;
}

function saveEntry(sessionId: string, e: Entry) {
  redisClient().set(
    `${sessionId}-messages`,
    JSON.stringify(e)
  );
}

export async function getMessages(
  sessionId: string
): Promise<Message[]> {
  const json = await redisClient().get(
    `${sessionId}-messages`
  );
  const entry = JSON.parse(json ?? "{}") as Entry;
  return getMessageHtml(entry?.messages ?? []);
}

async function getMarkdown(content: string) {
  const file = await processor.process(content);

  return String(file);
}

export async function getMessageHtml(
  messages: Message[]
): Promise<Message[]> {
  return Promise.all(
    messages.map(async (m) => {
      const thinking =
        m.thinking && (await getMarkdown(m.thinking));
      const content =
        m.content && (await getMarkdown(m.content));
      return { ...m, thinking, content };
    })
  );
}

export async function chat(
  prompt: string,
  sessionId: string,
  user: User,
  writeStream: NodeJS.WritableStream
) {
  let [thinking, content] = ["", ""];

  const stream = new PassThrough();
  stream.pipe(writeStream);

  const entry = await getEntry(sessionId);
  entry.messages.push({
    role: "user",
    content: prompt,
  });

  saveEntry(sessionId, entry);

  const introMessage = {
    role: "system",
    content: `
Your name is Alfred and you can think of yourself as a digital butler for the user, ${user.emails[0].email}.
Your job is to serve the user's every request, in a polite and dignified manner befitting of a butler.

You are also an expert in business, and you're learning to produce business plans. You currently have access
to some tools that help you analyze costs and revenues in order to create the plan. Users will have to provide
some information in order for you to use these tools.

If a user asks you to generate an image, feed the user's prompt into your generate_image tool. Make sure to add
a new line in your output before displaying the result of this tool. If the output of the tool doesn't contain
a URL, explain to the user that something went wrong and the image couldn't be generated.
`,
  };

  while (true) {
    const answer = await ollama.chat({
      stream: true,
      model: OLLAMA_MODEL,
      messages: [introMessage, ...entry.messages],
      tools: TOOLS,
    });

    let isThinking = true;

    const toolCalls = [];

    for await (const part of answer) {
      if (part.message.thinking) {
        thinking += part.message.thinking;
        stream.write(part.message.thinking);
      }
      if (part.message.content) {
        if (isThinking) {
          isThinking = false;
          stream.write("\n\n");
        }
        content += part.message.content;
        stream.write(part.message.content);
      }
      if (part.message.tool_calls?.length) {
        toolCalls.push(...part.message.tool_calls);
      }
    }

    if (thinking || content || toolCalls.length) {
      entry.messages.push({
        role: "assistant",
        thinking,
        content,
        tool_calls: toolCalls,
      } as any);
      saveEntry(sessionId, entry);
    }

    if (!toolCalls.length) {
      break;
    }

    for (const call of toolCalls) {
      if (
        call.function.name ===
        analyzeStartupCostTool.function.name
      ) {
        entry.messages.push({
          role: "tool",
          tool_name: call.function.name,
          content: analyzeStartupCosts(
            call.function
              .arguments as AnalyzeStartupCostsArgs
          ),
        });
      } else if (
        call.function.name ===
        imageGenerationTool.function.name
      ) {
        const args = call.function
          .arguments as GenerateImageArgs;
        const result = await getImageRef(args.prompt);
        if (result) {
          entry.messages.push({
            role: "tool",
            tool_name: call.function.name,
            content: `![${args.prompt}](${result})`,
          });
        }
      } else if (
        call.function.name ===
        calculateBreakEvenTool.function.name
      ) {
        const args = call.function
          .arguments as CalculateBreakEvenArgs;
        const result = calculateBreakEven(args);
        entry.messages.push({
          role: "tool",
          tool_name: call.function.name,
          content: result,
        });
      } else if (
        call.function.name ===
        competitiveAnalysisTool.function.name
      ) {
        const args = call.function
          .arguments as CompetitiveAnalysisArgs;
        const result = competitiveAnalysis(args);
        entry.messages.push({
          role: "tool",
          tool_name: call.function.name,
          content: result,
        });
      } else if (
        call.function.name ===
        fundingStrategyTool.function.name
      ) {
        const args = call.function
          .arguments as FundingStrategyArgs;
        const result = fundingStrategy(args);
        entry.messages.push({
          role: "tool",
          tool_name: call.function.name,
          content: result,
        });
      } else if (
        call.function.name ===
        generateBusinessPlanTool.function.name
      ) {
        const args = call.function
          .arguments as GenerateBusinessPlanArgs;
        const result = generateBusinessPlan(args);
        entry.messages.push({
          role: "tool",
          tool_name: call.function.name,
          content: result,
        });
      }
    }

    saveEntry(sessionId, entry);
  }

  stream.write(content);
  stream.end();
}
