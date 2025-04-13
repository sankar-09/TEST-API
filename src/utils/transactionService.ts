import db from "../db";
import { PoolConnection } from "mysql2/promise";

export default class TransactionService {
  private connection!: PoolConnection;
  private active: boolean = false;

  public async start(): Promise<PoolConnection> {
    try {
      this.connection = await db.getConnection();
      await this.connection.beginTransaction();
      this.active = true;
      console.log("✅ Transaction started");
      return this.connection;
    } catch (err) {
      console.log("❌ Failed to start transaction:", err);
      throw err;
    }
  }

  public async commit(): Promise<void> {
    if (!this.active) {
      console.log("⚠️ No active transaction to commit.");
      return;
    }
    try {
      await this.connection.commit();
      console.log("✅ Transaction committed");
    } catch (err) {
      console.log("❌ Commit failed, attempting rollback:", err);
      await this.rollback();
    } finally {
      this.release();
    }
  }

  public async rollback(): Promise<void> {
    if (!this.active) {
      console.log("⚠️ No active transaction to rollback.");
      return;
    }
    try {
      await this.connection.rollback();
      console.log("↩️ Transaction rolled back");
    } catch (err) {
      console.log("❌ Rollback failed:", err);
    } finally {
      this.release();
    }
  }

  private release() {
    if (this.connection) {
      this.connection.release();
      console.log("🔓 Connection released");
      this.active = false;
    }
  }

  public getConnection(): PoolConnection {
    if (!this.connection) {
      console.log("⚠️ Attempted to get connection before starting transaction.");
    }
    return this.connection;
  }
}
