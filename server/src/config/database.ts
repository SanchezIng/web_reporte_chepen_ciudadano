import mysql from 'mysql2/promise';

const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_ADDON_URI || '';

let pool: mysql.Pool;

if (connectionUrl) {
  pool = mysql.createPool(connectionUrl);
} else {
  const host = process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || '3306');
  const user = process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'security_system';

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export default pool;
