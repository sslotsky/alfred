import { type Message, Ollama } from "ollama";
import { PassThrough } from "stream";
import highlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

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
    messages: entry.messages,
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
