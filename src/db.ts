import mysql, {
  Pool,
  PoolConnection,
  RowDataPacket,
  ResultSetHeader,
  FieldPacket,
} from "mysql2/promise";

const pool: Pool = mysql.createPool({
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

async function execute<
  T extends RowDataPacket[] | ResultSetHeader = RowDataPacket[] | ResultSetHeader
>(
  sql: string,
  params: any[] = []
): Promise<[T, FieldPacket[]]> {
  console.log("📥 SQL:", sql);
  console.log("📦 Params:", params);
  return pool.execute<T>(sql, params);
}

const db = {
  query: execute,
  execute,
  getPool: () => pool,
  getConnection: () => pool.getConnection(),
};

export default db;
