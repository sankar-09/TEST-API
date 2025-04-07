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
const logger_1 = __importDefault(require("./logger"));
const CONFIG = {
    basePort: 3000,
    numberOfWorkers: 50,
};
const activePorts = new Set();
if (cluster_1.default.isPrimary) {
    console.log("🧠 Primary process started");
    const proxy = http_proxy_1.default.createProxyServer();
    const app = (0, express_1.default)();
    let workerIndex = 0;
    const workerPorts = [];
    // Create workers
    for (let i = 0; i < CONFIG.numberOfWorkers; i++) {
        const port = CONFIG.basePort + i;
        cluster_1.default.fork({ PORT: port });
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
            (0, logger_1.default)("Proxy Error", `Target: ${targetUrl}`, "Failed", err, req);
            res.status(502).json({ error: "Bad Gateway", details: errorMsg });
        });
    });
    app.listen(8000, () => {
        console.log(`🔁 Load balancer running on port 8000`);
        console.log("✅ Active worker ports:", [...activePorts].join(", "));
    });
    cluster_1.default.on("exit", (worker) => {
        console.log("⚠️ Worker crashed. Restarting...");
        cluster_1.default.fork();
    });
}
else {
    // Worker logic
    const app = (0, express_1.default)();
    const port = Number(process.env.PORT) || 3000;
    app.use(body_parser_1.default.json());
    app.use("/api/user", controller_1.default);
    app.get("/debug", (_, res) => {
        res.json({ message: "Debug info", port });
    });
    db_1.default.query("SELECT 1")
        .then(() => {
        console.log(`✅ DB Connected. Worker ready on port ${port}`);
        app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
    })
        .catch((err) => {
        console.error("❌ DB connection failed:", err);
        (0, logger_1.default)("DB Startup", "SELECT 1", "Failed", err);
        process.exit(1);
    });
}
