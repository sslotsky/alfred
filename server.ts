import express, { type Handler } from "express";
import session from "express-session";
import { chat, getMessages } from "./chat.ts";
import bodyParser from "body-parser";
import multiparty from "multiparty";
import stytch from "stytch";
import { type Request } from "express";
import "dotenv/config";

const app = express();
const port = 3000;

app.set("view engine", "pug");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);

const authMiddleware: Handler = async (req, res, next) => {
  const user = await getAuthenticatedUser(req);

  if (user) {
    req.session.user = user;
    return next();
  }

  res.redirect("/");
};

const stytchClient = new stytch.Client({
  project_id: process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
});

app.post("/login", (req, res) => {
  var form = new multiparty.Form();

  form.parse(req, function (_err, fields) {
    const { email } = fields;
    stytchClient.magicLinks.email
      .loginOrCreate({
        email: email?.[0] ?? "",
      })
      .then((response) => {
        res.json(response);
      })
      .catch((err) => {
        res.status(500).send(err.toString());
      });
  });
});

app.get("/authenticate", (req, res) => {
  const token = req.query.token;
  if (typeof token !== "string" || !token) {
    throw new Error("No token provided");
  }

  const tokenType = req.query.stytch_token_type;

  // Distinct token_type for each auth flow
  // so you know which authenticate() method to use
  if (tokenType !== "magic_links") {
    console.error(`Unsupported token type: '${tokenType}'`);
    res.status(400).send();
    return;
  }

  stytchClient.magicLinks
    .authenticate({
      token: token,
      session_duration_minutes: 60,
    })
    .then((response) => {
      // Using express sessions to store the returned session cookie
      req.session.StytchSessionToken =
        response.session_token;
      res.redirect("/chat");
    })
    .catch((err) => {
      res.status(401).send(err.toString());
    });
});

async function getAuthenticatedUser(req: Request) {
  const sessionToken = req.session.StytchSessionToken;
  if (!sessionToken) {
    return null;
  }

  const resp = await stytchClient.sessions.authenticate({
    session_token: sessionToken,
  });
  if (resp.status_code !== 200) {
    console.log("Session invalid or expired");
    req.session.StytchSessionToken = undefined;
    return null;
  }

  req.session.StytchSessionToken = resp.session_token;
  return resp.user;
}

app.get("/", async (req, resp) => {
  const user = await getAuthenticatedUser(req);
  if (user) {
    return resp.redirect("/chat");
  }

  resp.render("login");
});

app.get("/chat", authMiddleware, async (req, res) => {
  res.render("index", {
    messages: await getMessages(req.session.id),
    user: req.session.user,
  });
});

app.post("/chat", authMiddleware, (req, res) => {
  chat(
    req.body.prompt ?? "Tell me something interesting",
    req.session.id,
    req.session.user!,
    res
  );
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
