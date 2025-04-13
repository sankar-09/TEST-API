import express from "express";
import cluster from "cluster";
import httpProxy from "http-proxy";
import bodyParser from "body-parser";
import os from "os";
import UserRoutes from "./controller/controller";
import db from "./db";
import logTransaction from "./logger";
import { Request, Response, NextFunction } from "express";

const CONFIG = {
  basePort: 3000,
  numberOfWorkers: 50,
};

const activePorts = new Set<number>();

// Global error handlers
process.on("uncaughtException", (err) => {
  logTransaction("Uncaught Exception", "Process", "Failed", err);
  console.error("Uncaught Exception: ", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logTransaction("Unhandled Rejection", "Promise", "Failed", reason instanceof Error ? reason : new Error(String(reason)));
  console.error("Unhandled Rejection: ", reason);
});

if (cluster.isPrimary) {
  console.log("🧠 Primary process started");

  const proxy = httpProxy.createProxyServer();
  const app = express();
  let workerIndex = 0;

  const workerPorts: number[] = [];

  // Create workers
  for (let i = 0; i < CONFIG.numberOfWorkers; i++) {
    const port = CONFIG.basePort + i;
    cluster.fork({ PORT: port });
    workerPorts.push(port);
    activePorts.add(port);
    console.log(`🧵 Worker forked for port ${port}`);
  }

  // Load balancer logic
  app.all("*", (req, res) => {
    const targetPort = workerPorts[workerIndex];
    const targetUrl = `http://localhost:${targetPort}`;
    workerIndex = (workerIndex + 1) % workerPorts.length;

    proxy.web(req, res, { target: targetUrl }, (err) => {
      const errorMsg = `Proxy error forwarding to ${targetUrl}: ${err.message}`;
      logTransaction("Proxy Error", `Target: ${targetUrl}`, "Failed", err, req);
      res.status(502).json({ error: "Bad Gateway", details: errorMsg });
    });
  });

  app.listen(8000, () => {
    console.log(`🔁 Load balancer running on port 8000`);
    console.log("✅ Active worker ports:", [...activePorts].join(", "));
  });

  cluster.on("exit", (worker) => {
    console.log("⚠️ Worker crashed. Restarting...");
    cluster.fork();
  });
} else {
  // Worker logic
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(bodyParser.json());
  app.use("/api/service", UserRoutes);

  app.get("/debug", (_, res) => {
    res.json({ message: "Debug info", port });
  });

  db.query("SELECT 1")
    .then(() => {
      console.log(`✅ DB Connected. Worker ready on port ${port}`);
      app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
    })
    .catch((err) => {
      console.error("❌ DB connection failed:", err);
      logTransaction("DB Startup", "SELECT 1", "Failed", err);
      process.exit(1);
    });

  // Express global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logTransaction("Unhandled Express Error", "Middleware", "Failed", err, req);
    res.status(500).json({ error: "Internal server error", details: err.message || err });
  });
}
