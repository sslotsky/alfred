import ollama from "ollama";

const imagePath =
  "/Users/samslotsky/Downloads/saxymofo-logo.png";

async function getVision() {
  const response = await ollama.chat({
    model: "qwen3-vl",
    messages: [
      {
        role: "user",
        content: "What is in this image?",
        images: [imagePath],
      },
    ],
    stream: false,
  });

  console.log(response.message.content, response.message);
}

getVision();
