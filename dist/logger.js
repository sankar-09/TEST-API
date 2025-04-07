"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const geoip_lite_1 = __importDefault(require("geoip-lite"));
// Enable hourly logging
const useHourlyLogs = false;
const baseLogDir = path_1.default.join(process.cwd(), "LogFiles");
// Ensure base directory exists
if (!fs_1.default.existsSync(baseLogDir)) {
    fs_1.default.mkdirSync(baseLogDir, { recursive: true });
}
// Create folder paths for daily and hourly logs
const getLogFilePath = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const hour = now.getHours().toString().padStart(2, "0");
    const dailyDir = path_1.default.join(baseLogDir, "daily");
    const hourlyDir = path_1.default.join(baseLogDir, "hourly");
    if (!fs_1.default.existsSync(dailyDir))
        fs_1.default.mkdirSync(dailyDir, { recursive: true });
    if (!fs_1.default.existsSync(hourlyDir))
        fs_1.default.mkdirSync(hourlyDir, { recursive: true });
    return useHourlyLogs
        ? path_1.default.join(hourlyDir, `log-${date}-${hour}.log`)
        : path_1.default.join(dailyDir, `log-${date}.log`);
};
const getRequestDetails = (req) => {
    const headers = req?.headers || {};
    const connection = req?.connection;
    const socket = req?.socket;
    let ip = headers["x-forwarded-for"]?.toString().split(",")[0] ||
        connection?.remoteAddress ||
        socket?.remoteAddress ||
        "Unknown";
    if (ip === "::1" || ip === "127.0.0.1")
        ip = "127.0.0.1 (Localhost)";
    const geo = geoip_lite_1.default.lookup(ip || "") || { city: "Unknown", country: "Unknown" };
    const location = `${geo.city}, ${geo.country}`;
    const port = socket?.localPort || connection?.localPort || process.env.PORT || "Unknown";
    const deviceId = headers["user-agent"] || "Unknown Device";
    return { ip, location, port, deviceId };
};
function logTransaction(action, query, status, error = null, req) {
    const { ip, location, port, deviceId } = getRequestDetails(req);
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const localTime = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const logFilePath = getLogFilePath();
    const logContent = `
=========================
📅 Timestamp (UTC): ${isoTimestamp}
⏰ Local Time (IST): ${localTime}
🔹 Action: ${action}
🔍 Query: ${query}
✅ Status: ${status}
🌐 IP Address: ${ip}
📍 Location: ${location}
📥 Port: ${port}
💻 Device ID: ${deviceId}
${error ? `❌ Error: ${typeof error === "string" ? error : error.message}` : "✅ No Errors"}
=========================\n`;
    fs_1.default.appendFileSync(logFilePath, logContent, "utf8");
}
// Capture console logs into log files too
function captureConsoleLogs() {
    const originalLog = console.log;
    const originalError = console.error;
    const writeToLogFile = (message, type = "LOG") => {
        const logFilePath = getLogFilePath();
        const prefix = `[${new Date().toISOString()}] ${type}: `;
        const logMessage = prefix + message + "\n";
        fs_1.default.appendFileSync(logFilePath, logMessage, "utf8");
    };
    console.log = (...args) => {
        const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)).join(" ");
        writeToLogFile(message, "LOG");
        originalLog(...args);
    };
    console.error = (...args) => {
        const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)).join(" ");
        writeToLogFile(message, "ERROR");
        originalError(...args);
    };
}
captureConsoleLogs();
exports.default = logTransaction;
