import express, { type Handler } from "express";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { chat, getMessages } from "./chat.ts";
import multiparty from "multiparty";
import stytch from "stytch";
import { type Request } from "express";
import { config } from "dotenv";
import { redisClient } from "./redis.ts";
import cookieParser from "cookie-parser";
import puppeteer, { type CookieData } from "puppeteer";
import morgan from "morgan";

const env = process.env.NODE_ENV ?? "development";

const envPath = process.env.DOCKER_LOCAL
  ? "docker-local"
  : env;

config({ path: `.env.${envPath}` });

process.on("SIGTERM", () => {
  process.exit(0);
});

const app = express();
const port = 3000;
const sessionLife = 1000 * 60 * 60 * 6; // 6 hours

redisClient()
  .connect()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

app.set("view engine", "pug");
app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: new RedisStore({
      client: redisClient(),
      prefix: "alfred",
    }),
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: sessionLife },
  })
);

const authMiddleware: Handler = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (user) {
      req.session.user = user;
      return next();
    }
  } catch (e) {
    console.error(e);
  }

  res.redirect("/");
};

const stytchClient = new stytch.Client({
  project_id: process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
});

app.get("/history", authMiddleware, async (req, res) => {
  const messages = (
    await getMessages(req.session.id)
  ).filter((m) => ["user", "assistant"].includes(m.role));

  const limit = req.query["limit"];

  if (typeof limit === "string") {
    const numericLimit = parseInt(limit, 10);
    if (!isNaN(numericLimit)) {
      messages.splice(0, messages.length - numericLimit);
    }
  }

  res.render("history", {
    messages,
    user: req.session.user,
  });
});

app.get("/print", authMiddleware, async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      headless: true,
      executablePath:
        process.env.DOCKER_LOCAL && "/usr/bin/chromium",
    });
    const page = await browser.newPage();
    const cookies: CookieData[] = Object.entries(
      req.cookies
    ).map(([k, v]) => ({
      name: k,
      value: v as string,
      domain: req.hostname,
    }));

    await page.browserContext().setCookie(...cookies);

    const query = new URL(
      `${req.protocol}://${req.host}${req.originalUrl}`
    ).searchParams;

    await page.goto(
      `${req.protocol}://${
        req.host
      }/history?${query.toString()}`,
      {}
    );

    const stream = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="chat.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(stream);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
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
    console.log("session token not found");
    return null;
  }

  const resp = await stytchClient.sessions.authenticate({
    session_token: sessionToken,
  });
  if (
    resp.status_code !== 200 ||
    !resp.session_token ||
    !resp.user
  ) {
    console.log("Session invalid or expired");
    req.session.StytchSessionToken = undefined;
    return null;
  }

  req.session.StytchSessionToken = resp.session_token;
  return resp.user;
}

app.get("/", async (req, resp) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (user) {
      return resp.redirect("/chat");
    }
  } catch (e) {
    console.error(e);
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
  try {
    var form = new multiparty.Form();

    form.parse(req, function (_err, fields, files) {
      const f = files["file"]?.[0];

      chat(
        {
          prompt:
            fields.prompt?.[0] ??
            "Tell me something interesting",
          type: fields.type?.[0],
          imagePath: f ? f.path : undefined,
        },
        req.session.id,
        req.session.user!,
        res
      );
    });
  } catch (e) {
    console.error(e);
    res.send(500);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
