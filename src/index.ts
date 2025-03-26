import express from "express";
import cluster from "cluster";
import os from "os";
import httpProxy from "http-proxy";
import bodyParser from "body-parser";
import UserRoutes from "./controller/controller";
import db from "./db";

const CONFIG = {
  basePort: 3000,
  numberOfWorkers: 50,
};

const activePorts = new Set<number>();

if (cluster.isPrimary) {
  console.log("Primary process is running");

  const proxy = httpProxy.createProxyServer();
  const app = express();
  let workerIndex = 0;

  const workerPorts: number[] = [];
  for (let i = 0; i < CONFIG.numberOfWorkers; i++) {
    const port = CONFIG.basePort + i;
    workerPorts.push(port);
    cluster.fork({ PORT: port });
    activePorts.add(port);
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

  console.log("Active Ports:", [...activePorts].join(", "));
} else {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(bodyParser.json());
  app.use("/api/user", UserRoutes);

  app.get("/debug", (_, res) => {
    res.json({ message: "Debug info", activePorts: [...activePorts] });
  });

  db.query("SELECT 1")
    .then(() => {
      console.log("DB Connected, Worker started on port", port);
      app.listen(port, () => console.log("Server running on port", port));
    })
    .catch((err) => {
      console.error("DB connection failed:", err);
      process.exit(1);
    });
}
