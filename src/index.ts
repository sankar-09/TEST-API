import express from "express";
import cluster from "cluster";
import os from "os";
import httpProxy from "http-proxy";
import bodyParser from "body-parser";
import UserRoutes from "./controller/controller";
import db from "./db";
import { VercelRequest, VercelResponse } from '@vercel/node';

const CONFIG = {
  basePort: 3000,
  numberOfWorkers: 50,
};

let vercelHandler: (req: VercelRequest, res: VercelResponse) => void = (req, res) => {
  res.status(404).send("Not available");
};

if (process.env.VERCEL) {
  // ✅ For Vercel deployment (no clustering or manual port listening)
  const app = express();
  app.use(bodyParser.json());
  app.use("/api/user", UserRoutes);

  db.query("SELECT 1")
    .then(() => {
      console.log("✅ DB Connected on Vercel");
    })
    .catch((err) => {
      console.error("❌ DB connection failed on Vercel:", err);
    });

  vercelHandler = (req: VercelRequest, res: VercelResponse) => {
    app(req, res);
  };
} else if (cluster.isPrimary) {
  // ✅ Load balancer for local development
  console.log("Primary process is running");

  const proxy = httpProxy.createProxyServer();
  const app = express();
  let workerIndex = 0;

  const workerPorts: number[] = [];
  for (let i = 0; i < CONFIG.numberOfWorkers; i++) {
    const port = CONFIG.basePort + i;
    workerPorts.push(port);
    cluster.fork({ PORT: port });
    console.log("Worker started on port", port);
  }

  app.all("*", (req, res) => {
    const targetPort = workerPorts[workerIndex];
    workerIndex = (workerIndex + 1) % workerPorts.length;
    proxy.web(req, res, { target: `http://localhost:${targetPort}` });
  });

  app.listen(8000, () => console.log("Load balancer running on port 8000"));

  cluster.on("exit", (worker) => {
    console.log("Worker died, restarting...");
    cluster.fork();
  });
} else {
  // ✅ Worker logic (local)
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(bodyParser.json());
  app.use("/api/user", UserRoutes);

  db.query("SELECT 1")
    .then(() => {
      console.log("DB Connected, Worker running on port", port);
      app.listen(port, () => console.log("Server running on port", port));
    })
    .catch((err) => {
      console.error("DB connection failed:", err);
      process.exit(1);
    });
}

// ✅ Required by Vercel
export default vercelHandler;
