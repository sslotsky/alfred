import { type Message, Ollama } from "ollama";
import { PassThrough } from "stream";
import highlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { tools } from "./mcp.ts";
import { visit } from "unist-util-visit";
import { isElement } from "hast-util-is-element";
import { toText } from "hast-util-to-text";
import { type User } from "stytch";

const OLLAMA_API_URL =
  process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3";

type Entry = { ollama: Ollama; messages: Message[] };
type ChatMap = Map<string, Entry>;

const map: ChatMap = new Map();

function getEntry(sessionId: string) {
  const entry = map.get(sessionId);
  if (entry) {
    return entry;
  }

  const newEntry: Entry = {
    ollama: new Ollama({
      host: OLLAMA_API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    }),
    messages: [],
  };

  map.set(sessionId, newEntry);
  return newEntry;
}

export async function getMessages(
  sessionId: string
): Promise<Message[]> {
  const entry = map.get(sessionId);
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

  const entry = getEntry(sessionId);
  entry.messages.push({
    role: "user",
    content: prompt,
  });

  const answer = await entry.ollama.chat({
    stream: true,
    model: OLLAMA_MODEL,
    messages: [
      {
        role: "user",
        content: `I'm an authenticated user and my email address is ${user.emails[0].email}`,
      },
      ...entry.messages,
    ],
    tools: tools.slice(0, 1),
  });

  stream.pipe(writeStream);
  let isThinking = true;

  for await (const part of answer) {
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
  });

  stream.write(content);
  stream.end();
}
