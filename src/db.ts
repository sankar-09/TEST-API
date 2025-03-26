import mysql, { Pool } from "mysql2/promise";

const myPool: Pool = mysql.createPool({
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

export default myPool;
