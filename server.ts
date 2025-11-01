import express from "express";
import { chat } from "./chat.ts";

const app = express();
const port = 3000;

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.get("/chat", (_req, res) => {
  console.log("starting chat");
  chat("Describe a tree in ten words", res);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
