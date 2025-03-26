import fs from "fs";
import path from "path";
import geoip from "geoip-lite";
import { Request } from "express";

// Ensure log directory exists
const logDirectory = path.join(process.cwd(), "LogFiles");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Toggle between daily and hourly logs
const useHourlyLogs: boolean = false; // Set `true` for hourly logs, `false` for daily logs

// Function to get the log file path
const getLogFilePath = (): string => {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const hour = now.getHours();
  return useHourlyLogs
    ? path.join(logDirectory, `transactions-${date}-${hour}.log`) // Hourly log file
    : path.join(logDirectory, `transactions-${date}.log`); // Daily log file
};

// Function to extract request details safely
const getRequestDetails = (req?: Request) => {
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

  let ip =
    headers["x-forwarded-for"]?.toString().split(",")[0] || // Gets real IP if behind a proxy
    connection?.remoteAddress ||
    socket?.remoteAddress ||
    "Unknown";

  if (ip === "::1" || ip === "127.0.0.1") {
    ip = "Unknown (Localhost)"; // Fix localhost IP issue
  }

  const location = geoip.lookup(ip) || { city: "Unknown", country: "Unknown" };
  const port =
    socket?.localPort ||
    connection?.localPort ||
    req.socket?.localPort ||
    process.env.PORT ||
    "Unknown";
  const deviceId = headers["user-agent"] || "Unknown Device";

  return { deviceId, location, port, ip };
};

// Function to log transactions
const logTransaction = (
  action: string,
  query: string,
  status: string,
  error: any = null,
  req?: Request
) => {
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

  fs.appendFileSync(logFilePath, logData, "utf8");
};

// Function to capture console logs and write to file
const captureConsoleLogs = () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  const writeToLogFile = (message: string) => {
    const logFilePath = getLogFilePath();
    const logMessage = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage, "utf8");
  };

  console.log = (...args: any[]) => {
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
      .join(" ");
    writeToLogFile(message);
    originalConsoleLog(...args);
  };

  console.error = (...args: any[]) => {
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
      .join(" ");
    writeToLogFile(`ERROR: ${message}`);
    originalConsoleError(...args);
  };
};

// Start capturing console logs
captureConsoleLogs();

export default logTransaction;
