import { Ollama } from "ollama";
import { PassThrough } from "stream";

const OLLAMA_API_URL =
  process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3";

const ollama = new Ollama({
  host: OLLAMA_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function chat(
  prompt: string,
  writeStream: NodeJS.WritableStream
) {
  const stream = new PassThrough();

  const answer = await ollama.chat({
    stream: true,
    model: OLLAMA_MODEL,
    messages: [{ role: "user", content: prompt }],
  });

  stream.pipe(writeStream);
  for await (const part of answer) {
    stream.write(part.message.thinking);
  }

  stream.end();
}
