import mysql, { Pool } from "mysql2/promise";

const myPool: Pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "SSR2002#cc99",
  database: "crud",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default myPool;
