import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import cors from "cors";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";

import { healthRouter } from "./routes/health.js";
import { iposRouter } from "./routes/ipos.js";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = existsSync(resolve(moduleDirectory, "../frontend"))
  ? resolve(moduleDirectory, "..")
  : resolve(moduleDirectory, "../..");
dotenv.config({ path: resolve(projectRoot, ".env") });

export const app = express();

const configuredOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : ["http://localhost:3000", "https://gmp-api.vercel.app"];

app.disable("x-powered-by");
app.use((_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "32kb" }));

app.get("/api", (_request, response) => {
  response.json({ message: "IPO GMP Tracker API" });
});
app.use("/api", healthRouter);
app.use("/api/ipos", iposRouter);
app.use("/api", (_request, response) => {
  response.status(404).json({ detail: "Not found" });
});

const frontendDist = resolve(projectRoot, "frontend/dist");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { index: false, maxAge: "1h" }));
  app.use((request, response, next) => {
    if (request.method === "GET" && !request.path.startsWith("/api")) {
      response.sendFile(resolve(frontendDist, "index.html"));
      return;
    }
    next();
  });
}

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error("[API] Unhandled request error", error instanceof Error ? error.message : "unknown error");
  response.status(500).json({ detail: "Internal server error" });
});

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMainModule) {
  const parsedPort = Number(process.env.PORT ?? 8001);
  const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 8001;
  app.listen(port, "0.0.0.0", () => {
    console.log(`[API] IPO GMP Tracker listening on port ${port}`);
  });
}