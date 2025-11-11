import { type Message, Ollama } from "ollama";
import { PassThrough } from "stream";
import highlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import {
  tools,
  analyzeStartupCosts,
  type AnalyzeStartupCostsArgs,
} from "./mcp.ts";
import { visit } from "unist-util-visit";
import { isElement } from "hast-util-is-element";
import { toText } from "hast-util-to-text";
import { type User } from "stytch";
import { redisClient } from "./redis.ts";

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
  const entry = await redisClient.get(
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
  redisClient.set(
    `${sessionId}-messages`,
    JSON.stringify(e)
  );
}

export async function getMessages(
  sessionId: string
): Promise<Message[]> {
  const json = await redisClient.get(
    `${sessionId}-messages`
  );
  const entry = JSON.parse(json ?? "{}") as Entry;
  return getMessageHtml(entry?.messages ?? []);
}

async function getMarkdown(content: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(highlight)
    .use(rehypeStringify)
    // @ts-ignore
    .use(() => (tree: Root) => {
      visit(tree, ["element"], (node) => {
        if (!isElement(node, "pre")) {
          return;
        }

        const code = node.children[0];
        if (!isElement(code, "code")) {
          return;
        }

        node.children.push({
          tagName: "alfred-copy-code",
          properties: {
            rawText: toText(code, {
              // @ts-ignore
              whitespace: "preserve",
            }),
          },
          type: "element",
          children: [],
        });
      });
    })
    .process(content);

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
  const stream = new PassThrough();
  let [thinking, content] = ["", ""];

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
to one tool, which provides the user with a startup cost analysis. Users will have to provide some information
in order for you to use this tool.
`,
  };

  const answer = await ollama.chat({
    stream: true,
    model: OLLAMA_MODEL,
    messages: [introMessage, ...entry.messages],
    tools: tools.slice(0, 1),
  });

  stream.pipe(writeStream);
  let isThinking = true;

  const toolCalls = [];

  for await (const part of answer) {
    if (part.message.tool_calls) {
      toolCalls.push(...part.message.tool_calls);
    }

    if (part.message.thinking) {
      thinking += part.message.thinking;
      stream.write(part.message.thinking);
    } else if (part.message.content) {
      if (isThinking) {
        isThinking = false;
      }
      content += part.message.content;
      stream.write(part.message.content);
    }
  }

  entry.messages.push({
    role: "assistant",
    content,
    thinking,
    tool_calls: toolCalls,
  });

  saveEntry(sessionId, entry);

  // const toolMessages = toolCalls.map((call) => {
  //   if (call.function.name !== "analyze_startup_costs") {
  //     throw new Error(
  //       `Unsupported tool ${call.function.name}`
  //     );
  //   }

  //   const result = analyzeStartupCosts(
  //     call.function.arguments as AnalyzeStartupCostsArgs
  //   );
  //   return {
  //     role: "tool",
  //     tool_name: call.function.name,
  //     content: result,
  //   };
  // });

  // entry.messages.push(...toolMessages);

  // if (toolMessages.length) {
  //   const newAnswer = await entry.ollama.chat({
  //     stream: true,
  //     think: true,
  //     model: OLLAMA_MODEL,
  //     messages: [introMessage, ...entry.messages],
  //   });

  //   for await (const part of answer) {
  //     if (part.message.thinking) {
  //       thinking += part.message.thinking;
  //       stream.write(part.message.thinking);
  //     } else if (part.message.content) {
  //       if (isThinking) {
  //         isThinking = false;
  //       }
  //       content += part.message.content;
  //       stream.write(part.message.content);
  //     }
  //   }
  // }

  stream.write(content);
  stream.end();
}
