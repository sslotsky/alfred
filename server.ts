import express from "express";
import { RenderResultReadable } from "@lit-labs/ssr/lib/render-result-readable.js";
import { chat } from "./chat.ts";
import { render } from "@lit-labs/ssr";

const app = express();
const port = 3000;

app.set("view engine", "pug");
app.use(express.static("public"));

app.get("/", (_req, res) => {
  // const result = render(chatTemplate());
  // res.type("html");
  // const stream = new RenderResultReadable(result);
  // stream.pipe(res);
  res.render("index");
});

app.get("/chat", (_req, res) => {
  console.log("starting chat");
  chat("Describe a tree in ten words", res);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
