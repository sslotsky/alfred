import { type Message, Ollama } from "ollama";
import { PassThrough } from "stream";

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
  stream.write("Just thinking out loud here...\n\n");
  let isThinking = true;

  for await (const part of answer) {
    if (part.message.thinking) {
      thinking += part.message.thinking;
      stream.write(part.message.thinking);
    } else if (part.message.content) {
      if (isThinking) {
        isThinking = false;
        stream.write("\nAnswer:\n\n");
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
