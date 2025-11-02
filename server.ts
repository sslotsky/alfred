import express from "express";
import { chat } from "./chat.ts";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.set("view engine", "pug");
app.use(express.static("public"));
app.use(bodyParser.json());

app.get("/", (_req, res) => {
  res.render("index");
});

app.post("/chat", (req, res) => {
  console.log("starting chat");
  chat(
    req.body.prompt ?? "Tell me something interesting",
    res
  );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
