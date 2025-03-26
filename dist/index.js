"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cluster_1 = __importDefault(require("cluster"));
const http_proxy_1 = __importDefault(require("http-proxy"));
const body_parser_1 = __importDefault(require("body-parser"));
const controller_1 = __importDefault(require("./controller/controller"));
const db_1 = __importDefault(require("./db"));
const CONFIG = {
    basePort: 3000,
    numberOfWorkers: 50,
};
const activePorts = new Set();
if (cluster_1.default.isPrimary) {
    console.log("Primary process is running");
    const proxy = http_proxy_1.default.createProxyServer();
    const app = (0, express_1.default)();
    let workerIndex = 0;
    const workerPorts = [];
    for (let i = 0; i < CONFIG.numberOfWorkers; i++) {
        const port = CONFIG.basePort + i;
        workerPorts.push(port);
        cluster_1.default.fork({ PORT: port });
        activePorts.add(port);
        console.log("Worker started on port", port);
    }
    app.all("*", (req, res) => {
        const targetPort = workerPorts[workerIndex];
        workerIndex = (workerIndex + 1) % workerPorts.length;
        proxy.web(req, res, { target: `http://localhost:${targetPort}` });
    });
    app.listen(8000, () => console.log("Load balancer running on port 8000"));
    cluster_1.default.on("exit", (worker) => {
        console.log("Worker died, restarting...");
        cluster_1.default.fork();
    });
    console.log("Active Ports:", [...activePorts].join(", "));
}
else {
    const app = (0, express_1.default)();
    const port = Number(process.env.PORT) || 3000;
    app.use(body_parser_1.default.json());
    app.use("/api/user", controller_1.default);
    app.get("/debug", (_, res) => {
        res.json({ message: "Debug info", activePorts: [...activePorts] });
    });
    db_1.default.query("SELECT 1")
        .then(() => {
        console.log("DB Connected, Worker started on port", port);
        app.listen(port, () => console.log("Server running on port", port));
    })
        .catch((err) => {
        console.error("DB connection failed:", err);
        process.exit(1);
    });
}
