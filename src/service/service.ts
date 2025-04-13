import db from "../db";
import logTransaction from "../logger";
import { Request } from "express";
import TransactionService from "../utils/transactionService";
import { ResultSetHeader } from "mysql2";

interface QueryResult {
  insertId: number;
  affectedRows: number;
}

const handleError = (
  action: string,
  query: string,
  err: unknown,
  req?: Request
): never => {
  const error = err instanceof Error ? err : new Error("Unknown error");

  // Custom logging for ECONNRESET
  if ((err as any)?.code === "ECONNRESET") {
    console.error("ECONNRESET detected. Connection was reset by peer.");
  }

  logTransaction(action, query, "Failed", error, req);
  throw error;
};

const shouldLock = (req?: Request): boolean => req?.query?.lock === "true";

const formatId = (num: number): string => num.toString().padStart(3, "0");

// GET ALL SERVICES
export const getAllServices = async (req?: Request) => {
  const query = "SELECT CITY_ID, NAME, DESCRIPTION, STATUS, IMAGE_URL FROM SERVICES";
  const start = Date.now();
  try {
    const [records] = await db.execute(query);
    logTransaction("Fetch All Services", query, "Success", null, req, Date.now() - start);
    return records;
  } catch (err) {
    return handleError("Fetch All Services", query, err, req);
  }
};

// GET SERVICE BY ID
export const getServiceById = async (id: string, req?: Request) => {
  const lock = shouldLock(req) ? " FOR UPDATE" : "";
  const query = `SELECT CITY_ID, NAME, DESCRIPTION, STATUS, IMAGE_URL FROM SERVICES WHERE ID = ?${lock}`;
  const start = Date.now();
  try {
    const [records] = await db.execute(query, [id]);
    const found = Array.isArray(records) && records.length > 0;
    logTransaction(
      `Fetch Service ID ${id}`,
      query,
      found ? "Success" : "Failed",
      found ? null : new Error(`No records for ID ${id}`),
      req,
      Date.now() - start
    );
    return found ? records[0] : null;
  } catch (err) {
    return handleError(`Fetch Service ID ${id}`, query, err, req);
  }
};

// ADD SERVICE
export const addService = async (
  obj: { cityid: string; servname: string; servdesc: string; status: string; imgurl: string },
  req?: Request
): Promise<QueryResult> => {
  const trx = new TransactionService();
  const query = `
    INSERT INTO SERVICES (ID, CITY_ID, NAME, DESCRIPTION, STATUS, IMAGE_URL, CREATED_AT, CREATED_BY)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
  `;
  const start = Date.now();
  try {
    const conn = await trx.start();

    // Generate new ID
    const [rows] = await conn.query("SELECT MAX(CAST(ID AS UNSIGNED)) as maxId FROM SERVICES");
    const currentMax = (rows as any)[0].maxId || 0;
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
    } catch {}

    logTransaction("Insert Service", query, "Success", null, req, Date.now() - start);

    return {
      insertId: parseInt(nextId, 10),
      affectedRows: (result as ResultSetHeader).affectedRows,
    };
  } catch (err) {
    try {
      await trx.rollback();
    } catch {}
    return handleError("Insert Service", query, err, req);
  }
};

// EDIT SERVICE
export const EditService = async (
  obj: { cityid: string; servname: string; servdesc: string; status: string; imgurl: string },
  id: string,
  req?: Request
): Promise<QueryResult> => {
  const trx = new TransactionService();
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

    if ((existing as any[]).length === 0) {
      await trx.rollback().catch(() => {});
      logTransaction(
        `Update Service ID ${id}`,
        updateQuery,
        "Failed",
        "Service not found",
        req,
        Date.now() - start
      );
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

    await trx.commit().catch(() => {});
    logTransaction(`Update Service ID ${id}`, updateQuery, "Success", null, req, Date.now() - start);

    return result as QueryResult;
  } catch (err) {
    await trx.rollback().catch(() => {});
    return handleError(`Update Service ID ${id}`, updateQuery, err, req);
  }
};
