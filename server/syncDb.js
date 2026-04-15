const mysql = require('mysql2/promise');
async function syncDb() {
  try {
    const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root12', database: 'uniexammes' });
    await db.query(`CREATE TABLE IF NOT EXISTS password_resets (id int NOT NULL AUTO_INCREMENT, user_id int NOT NULL, token_hash varchar(255) NOT NULL, expires_at datetime NOT NULL, used tinyint(1) DEFAULT 0, created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY user_id (user_id), KEY token_hash (token_hash)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
    console.log("Table created");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
syncDb();
