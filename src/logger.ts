import fs from "fs";
import path from "path";
import geoip from "geoip-lite";
import { Request } from "express";

// Enable hourly logging
const useHourlyLogs: boolean = false;

const baseLogDir = path.join(process.cwd(), "LogFiles");

if (!fs.existsSync(baseLogDir)) {
  fs.mkdirSync(baseLogDir, { recursive: true });
}

const getLogFilePath = (): string => {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const hour = now.getHours().toString().padStart(2, "0");

  const dailyDir = path.join(baseLogDir, "daily");
  const hourlyDir = path.join(baseLogDir, "hourly");

  if (!fs.existsSync(dailyDir)) fs.mkdirSync(dailyDir, { recursive: true });
  if (!fs.existsSync(hourlyDir)) fs.mkdirSync(hourlyDir, { recursive: true });

  return useHourlyLogs
    ? path.join(hourlyDir, `log-${date}-${hour}.log`)
    : path.join(dailyDir, `log-${date}.log`);
};

const getRequestDetails = (req?: Request) => {
  const headers = req?.headers || {};
  const connection = req?.connection;
  const socket = req?.socket;

  let ip =
    headers["x-forwarded-for"]?.toString().split(",")[0] ||
    connection?.remoteAddress ||
    socket?.remoteAddress ||
    "Unknown";

  // Normalize localhost
  if (ip === "::1" || ip === "127.0.0.1") ip = "127.0.0.1";

  const geo = ip.includes("127.0.0.1")
    ? { city: "Localhost", country: "Dev Machine" }
    : geoip.lookup(ip || "") || { city: "Unknown", country: "Unknown" };

  const location = `${geo.city}, ${geo.country}`;
  const port = socket?.localPort || connection?.localPort || process.env.PORT || "Unknown";
  const deviceId = headers["user-agent"] || "Unknown Device";

  return { ip, location, port, deviceId };
};

function logTransaction(
  action: string,
  query: string,
  status: "Success" | "Failed",
  error: Error | string | null = null,
  req?: Request,
  durationMs?: number
): void {
  const { ip, location, port, deviceId } = getRequestDetails(req);
  const now = new Date();
  const isoTimestamp = now.toISOString();
  const localTime = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const logFilePath = getLogFilePath();
  const durationLine = durationMs !== undefined ? `⏱ Query Time: ${durationMs} ms` : "";
  // 📍 Location: ${location}
  const logContent = `
=========================
📅 Timestamp (UTC): ${isoTimestamp}
⏰ Local Time (IST): ${localTime}
🔹 Action: ${action}
🔍 Query: ${query}
✅ Status: ${status}
🌐 IP Address: ${ip}
📥 Port: ${port}
💻 Device ID: ${deviceId}
${durationLine}
${error ? `❌ Error: ${typeof error === "string" ? error : error.message}` : "✅ No Errors"}
=========================\n`;

  fs.appendFileSync(logFilePath, logContent, "utf8");
}

function captureConsoleLogs(): void {
  const originalLog = console.log;
  const originalError = console.error;

  const writeToLogFile = (message: string, type: "LOG" | "ERROR" = "LOG") => {
    const logFilePath = getLogFilePath();
    const prefix = `[${new Date().toISOString()}] ${type}: `;
    const logMessage = prefix + message + "\n";
    fs.appendFileSync(logFilePath, logMessage, "utf8");
  };

  console.log = (...args: any[]) => {
    const message = args
      .map(arg => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(" ");
    writeToLogFile(message, "LOG");
    originalLog(...args);
  };

  console.error = (...args: any[]) => {
    const message = args
      .map(arg => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(" ");
    writeToLogFile(message, "ERROR");
    originalError(...args);
  };
}

captureConsoleLogs();

export default logTransaction;
