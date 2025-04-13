"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditService = exports.addService = exports.getServiceById = exports.getAllServices = void 0;
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../logger"));
const transactionService_1 = __importDefault(require("../utils/transactionService"));
const handleError = (action, query, err, req) => {
    const error = err instanceof Error ? err : new Error("Unknown error");
    // Custom logging for ECONNRESET
    if (err?.code === "ECONNRESET") {
        console.error("ECONNRESET detected. Connection was reset by peer.");
    }
    (0, logger_1.default)(action, query, "Failed", error, req);
    throw error;
};
const shouldLock = (req) => req?.query?.lock === "true";
const formatId = (num) => num.toString().padStart(3, "0");
// GET ALL SERVICES
const getAllServices = async (req) => {
    const query = "SELECT CITY_ID, NAME, DESCRIPTION, STATUS, IMAGE_URL FROM SERVICES";
    const start = Date.now();
    try {
        const [records] = await db_1.default.execute(query);
        (0, logger_1.default)("Fetch All Services", query, "Success", null, req, Date.now() - start);
        return records;
    }
    catch (err) {
        return handleError("Fetch All Services", query, err, req);
    }
};
exports.getAllServices = getAllServices;
// GET SERVICE BY ID
const getServiceById = async (id, req) => {
    const lock = shouldLock(req) ? " FOR UPDATE" : "";
    const query = `SELECT CITY_ID, NAME, DESCRIPTION, STATUS, IMAGE_URL FROM SERVICES WHERE ID = ?${lock}`;
    const start = Date.now();
    try {
        const [records] = await db_1.default.execute(query, [id]);
        const found = Array.isArray(records) && records.length > 0;
        (0, logger_1.default)(`Fetch Service ID ${id}`, query, found ? "Success" : "Failed", found ? null : new Error(`No records for ID ${id}`), req, Date.now() - start);
        return found ? records[0] : null;
    }
    catch (err) {
        return handleError(`Fetch Service ID ${id}`, query, err, req);
    }
};
exports.getServiceById = getServiceById;
// ADD SERVICE
const addService = async (obj, req) => {
    const trx = new transactionService_1.default();
    const query = `
    INSERT INTO SERVICES (ID, CITY_ID, NAME, DESCRIPTION, STATUS, IMAGE_URL, CREATED_AT, CREATED_BY)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
  `;
    const start = Date.now();
    try {
        const conn = await trx.start();
        // Generate new ID
        const [rows] = await conn.query("SELECT MAX(CAST(ID AS UNSIGNED)) as maxId FROM SERVICES");
        const currentMax = rows[0].maxId || 0;
        const nextId = formatId(currentMax + 1);
        const [result] = await conn.query(query, [
            nextId,
            obj.cityid,
            obj.servname,
            obj.servdesc,
            obj.status,
            obj.imgurl,
            "USR001",
        ]);
        try {
            await trx.commit();
        }
        catch { }
        (0, logger_1.default)("Insert Service", query, "Success", null, req, Date.now() - start);
        return {
            insertId: parseInt(nextId, 10),
            affectedRows: result.affectedRows,
        };
    }
    catch (err) {
        try {
            await trx.rollback();
        }
        catch { }
        return handleError("Insert Service", query, err, req);
    }
};
exports.addService = addService;
// EDIT SERVICE
const EditService = async (obj, id, req) => {
    const trx = new transactionService_1.default();
    const lock = shouldLock(req) ? " FOR UPDATE" : "";
    const checkQuery = `SELECT ID FROM SERVICES WHERE ID = ?${lock}`;
    const updateQuery = `
    UPDATE SERVICES
    SET CITY_ID = ?, NAME = ?, DESCRIPTION = ?, STATUS = ?, IMAGE_URL = ?, UPDATED_AT = NOW(), UPDATED_BY = ?
    WHERE ID = ?
  `;
    const start = Date.now();
    try {
        const conn = await trx.start();
        const [existing] = await conn.query(checkQuery, [id]);
        if (existing.length === 0) {
            await trx.rollback().catch(() => { });
            (0, logger_1.default)(`Update Service ID ${id}`, updateQuery, "Failed", "Service not found", req, Date.now() - start);
            throw new Error("Service not found");
        }
        const [result] = await conn.query(updateQuery, [
            obj.cityid,
            obj.servname,
            obj.servdesc,
            obj.status,
            obj.imgurl,
            "USR001",
            id,
        ]);
        await trx.commit().catch(() => { });
        (0, logger_1.default)(`Update Service ID ${id}`, updateQuery, "Success", null, req, Date.now() - start);
        return result;
    }
    catch (err) {
        await trx.rollback().catch(() => { });
        return handleError(`Update Service ID ${id}`, updateQuery, err, req);
    }
};
exports.EditService = EditService;
