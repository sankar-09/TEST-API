"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const pool = promise_1.default.createPool({
    // host: "localhost",
    // user: "root",
    // password: "SSR2002#cc99",
    // database: "crud",
    host: "193.203.184.98",
    user: "u303037170_projectadmin",
    password: "Locate@2025",
    database: "u303037170_projectadmin",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
async function execute(sql, params = []) {
    console.log("📥 SQL:", sql);
    console.log("📦 Params:", params);
    return pool.execute(sql, params);
}
const db = {
    query: execute,
    execute,
    getPool: () => pool,
    getConnection: () => pool.getConnection(),
};
exports.default = db;
