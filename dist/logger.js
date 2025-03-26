"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const geoip_lite_1 = __importDefault(require("geoip-lite"));
// Ensure log directory exists
const logDirectory = path_1.default.join(process.cwd(), "LogFiles");
if (!fs_1.default.existsSync(logDirectory)) {
    fs_1.default.mkdirSync(logDirectory, { recursive: true });
}
// Toggle between daily and hourly logs
const useHourlyLogs = false; // Set `true` for hourly logs, `false` for daily logs
// Function to get the log file path
const getLogFilePath = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const hour = now.getHours();
    return useHourlyLogs
        ? path_1.default.join(logDirectory, `transactions-${date}-${hour}.log`) // Hourly log file
        : path_1.default.join(logDirectory, `transactions-${date}.log`); // Daily log file
};
// Function to extract request details safely
const getRequestDetails = (req) => {
    if (!req || typeof req !== "object") {
        return {
            deviceId: "Unknown",
            location: "Unknown",
            port: "Unknown",
            ip: "Unknown",
        };
    }
    const headers = req.headers || {};
    const connection = req.connection;
    const socket = req.socket;
    let ip = headers["x-forwarded-for"]?.toString().split(",")[0] || // Gets real IP if behind a proxy
        connection?.remoteAddress ||
        socket?.remoteAddress ||
        "Unknown";
    if (ip === "::1" || ip === "127.0.0.1") {
        ip = "Unknown (Localhost)"; // Fix localhost IP issue
    }
    const location = geoip_lite_1.default.lookup(ip) || { city: "Unknown", country: "Unknown" };
    const port = socket?.localPort ||
        connection?.localPort ||
        req.socket?.localPort ||
        process.env.PORT ||
        "Unknown";
    const deviceId = headers["user-agent"] || "Unknown Device";
    return { deviceId, location, port, ip };
};
// Function to log transactions
const logTransaction = (action, query, status, error = null, req) => {
    const { deviceId, location, port, ip } = getRequestDetails(req);
    const logFilePath = getLogFilePath();
    const now = new Date();
    const isoTimestamp = now.toISOString(); // UTC format
    const localTime = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }); // Convert to local time
    // 📍 Location: ${JSON.stringify(location)}
    const logData = `
=========================
📅 Timestamp (UTC): ${isoTimestamp}
⏰ Local Time: ${localTime}
🔹 Action: ${action}
🔍 Query: ${query}
✅ Status: ${status}
📥 Received Port: ${port}
💻 Device ID: ${deviceId}
🌐 IP Address: ${ip}
${error ? `❌ Error: ${error.stack || error.message}` : "✅ No Errors"}
=========================\n`;
    fs_1.default.appendFileSync(logFilePath, logData, "utf8");
};
// Function to capture console logs and write to file
const captureConsoleLogs = () => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const writeToLogFile = (message) => {
        const logFilePath = getLogFilePath();
        const logMessage = `[${new Date().toISOString()}] ${message}\n`;
        fs_1.default.appendFileSync(logFilePath, logMessage, "utf8");
    };
    console.log = (...args) => {
        const message = args
            .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
            .join(" ");
        writeToLogFile(message);
        originalConsoleLog(...args);
    };
    console.error = (...args) => {
        const message = args
            .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
            .join(" ");
        writeToLogFile(`ERROR: ${message}`);
        originalConsoleError(...args);
    };
};
// Start capturing console logs
captureConsoleLogs();
exports.default = logTransaction;
