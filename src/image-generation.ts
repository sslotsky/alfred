import { Runware } from "@runware/sdk-js";

export async function getImageRef(
  prompt = "A serene mountain landscape at sunset"
) {
  const runware = new Runware({
    apiKey: process.env.RUNWARE_API_KEY,
  });

  console.log(process.env.RUNWARE_API_KEY);
  console.log("generating image");
  try {
    const images = await runware.requestImages({
      positivePrompt: prompt,
      model: "runware:101@1",
      width: 1024,
      height: 1024,
    });
    console.log("generated images");
    return images?.[0].imageURL;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
