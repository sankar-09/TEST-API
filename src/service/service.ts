import db from "../db";
import logTransaction from "../logger";
import { Request } from "express";
import TransactionService from "../utils/transactionService";

interface QueryResult {
  insertId?: number;
  affectedRows?: number;
}

// GET ALL USERS
export const getAllUsers = async (req?: Request) => {
  const query = "SELECT id, fullname, email, mobile FROM TESTAPI";
  try {
    const [records] = await db.execute(query);
    logTransaction("Fetch All Users", query, "Success", null, req);
    return records;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    logTransaction("Fetch All Users", query, "Failed", error, req);
    throw error;
  }
};

// GET USER BY ID
export const getUserById = async (id: string, req?: Request) => {
  const query = "SELECT id, fullname, email, mobile FROM TESTAPI WHERE id = @id";
  try {
    const [record] = await db.execute(query, { id });
    logTransaction(`Fetch User ID ${id}`, query, "Success", null, req);
    return Array.isArray(record) && record.length > 0 ? record[0] : null;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    logTransaction(`Fetch User ID ${id}`, query, "Failed", error, req);
    throw error;
  }
};

// ADD USER
export const addUser = async (
  obj: { id: string; fullname: string; email: string; mobile: string },
  req?: Request
): Promise<QueryResult> => {
  const query = `
    INSERT INTO TESTAPI (id, fullname, email, mobile)
    VALUES (@id, @fullname, @email, @mobile)
  `;
  try {
    const [result] = await db.execute(query, obj);
    logTransaction("Insert User", query, "Success", null, req);
    return result as QueryResult;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    logTransaction("Insert User", query, "Failed", error, req);
    throw error;
  }
};

// EDIT USER (WITH TRANSACTION SERVICE)
export const EditUser = async (
  obj: { fullname: string; email: string; mobile: string },
  id: string,
  req?: Request
): Promise<QueryResult> => {
  const trx = new TransactionService();
  try {
    const conn = await trx.start();

    const checkQuery = "SELECT id FROM TESTAPI WHERE id = @id FOR UPDATE";
    const [existing] = await conn.query(checkQuery, { id });
    if ((existing as any[]).length === 0) {
      throw new Error("User not found");
    }

    const query = `
      UPDATE TESTAPI
      SET fullname = @fullname, email = @email, mobile = @mobile
      WHERE id = @id
    `;
    const [result] = await conn.query(query, { ...obj, id });

    await trx.commit();
    logTransaction(`Update User ID ${id}`, query, "Success", null, req);
    return result as QueryResult;
  } catch (err: unknown) {
    await trx.rollback();
    const error = err instanceof Error ? err : new Error("Unknown error");
    const query = `
      UPDATE TESTAPI
      SET fullname = @fullname, email = @email, mobile = @mobile
      WHERE id = @id
    `;
    logTransaction(`Update User ID ${id}`, query, "Failed", error, req);
    throw error;
  }
};

// DELETE USER (WITH TRANSACTION SERVICE)
export const deleteUserById = async (
  id: string,
  req?: Request
): Promise<QueryResult> => {
  const trx = new TransactionService();
  try {
    const conn = await trx.start();

    const checkQuery = "SELECT id FROM TESTAPI WHERE id = @id FOR UPDATE";
    const [existing] = await conn.query(checkQuery, { id });
    if ((existing as any[]).length === 0) {
      throw new Error("User not found");
    }

    const query = "DELETE FROM TESTAPI WHERE id = @id";
    const [result] = await conn.query(query, { id });

    await trx.commit();
    logTransaction(`Delete User ID ${id}`, query, "Success", null, req);
    return result as QueryResult;
  } catch (err: unknown) {
    await trx.rollback();
    const error = err instanceof Error ? err : new Error("Unknown error");
    const query = "DELETE FROM TESTAPI WHERE id = @id";
    logTransaction(`Delete User ID ${id}`, query, "Failed", error, req);
    throw error;
  }
};
