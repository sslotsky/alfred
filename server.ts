import express from "express";
import session from "express-session";
import { chat } from "./chat.ts";
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

app.get("/", (req, res) => {
  res.render("index");
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
