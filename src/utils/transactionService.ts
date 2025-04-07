import db from "../db";
import { PoolConnection } from "mysql2/promise";

export default class TransactionService {
  private connection!: PoolConnection;

  public async start(): Promise<PoolConnection> {
    this.connection = await db.getConnection();
    await this.connection.beginTransaction();
    return this.connection;
  }

  public async commit(): Promise<void> {
    try {
      await this.connection.commit();
    } finally {
      this.connection.release();
    }
  }

  public async rollback(): Promise<void> {
    try {
      await this.connection.rollback();
    } finally {
      this.connection.release();
    }
  }

  public getConnection(): PoolConnection {
    return this.connection;
  }
}
