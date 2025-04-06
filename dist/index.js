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
let vercelHandler = (req, res) => {
    res.status(404).send("Not available");
};
if (process.env.VERCEL) {
    // ✅ For Vercel deployment (no clustering or manual port listening)
    const app = (0, express_1.default)();
    app.use(body_parser_1.default.json());
    app.use("/api/user", controller_1.default);
    db_1.default.query("SELECT 1")
        .then(() => {
        console.log("✅ DB Connected on Vercel");
    })
        .catch((err) => {
        console.error("❌ DB connection failed on Vercel:", err);
    });
    vercelHandler = (req, res) => {
        app(req, res);
    };
}
else if (cluster_1.default.isPrimary) {
    // ✅ Load balancer for local development
    console.log("Primary process is running");
    const proxy = http_proxy_1.default.createProxyServer();
    const app = (0, express_1.default)();
    let workerIndex = 0;
    const workerPorts = [];
    for (let i = 0; i < CONFIG.numberOfWorkers; i++) {
        const port = CONFIG.basePort + i;
        workerPorts.push(port);
        cluster_1.default.fork({ PORT: port });
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
}
else {
    // ✅ Worker logic (local)
    const app = (0, express_1.default)();
    const port = Number(process.env.PORT) || 3000;
    app.use(body_parser_1.default.json());
    app.use("/api/user", controller_1.default);
    db_1.default.query("SELECT 1")
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
exports.default = vercelHandler;
