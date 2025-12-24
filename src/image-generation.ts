import { Runware } from "@runware/sdk-js";

export async function getImageRef(
  prompt = "A serene mountain landscape at sunset"
) {
  const runware = new Runware({
    apiKey: process.env.RUNWARE_API_KEY,
  });

  try {
    const images = await runware.requestImages({
      positivePrompt: prompt,
      model: "bfl:6@1",
      width: 1024,
      height: 1024,
    });
    return images?.[0].imageURL;
  } catch (e: any) {
    console.error(e);
    return e.message;
  }
}
