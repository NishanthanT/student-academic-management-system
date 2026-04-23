const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "uniexammes",
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
    process.exit(1);
  }
  console.log("✅ MySQL Connected");

  const sql = `
    CREATE TABLE IF NOT EXISTS exam_notices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Error creating table:", err);
      process.exit(1);
    }
    console.log("✅ Table 'exam_notices' created or already exists.");
    db.end();
    process.exit(0);
  });
});
