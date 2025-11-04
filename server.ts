import express from "express";
import session from "express-session";
import { chat, getMessages } from "./chat.ts";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.set("view engine", "pug");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "supersecret",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", async (req, res) => {
  res.render("index", {
    messages: await getMessages(req.session.id),
  });
});

app.post("/chat", (req, res) => {
  chat(
    req.body.prompt ?? "Tell me something interesting",
    req.session.id,
    res
  );
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
