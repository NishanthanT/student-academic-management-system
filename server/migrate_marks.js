const mysql = require("mysql2/promise");

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "1234",
      database: "uniexammes",
    });

    console.log("Connected to uniexammes database.");

    const columns = [
      "ADD COLUMN requested_marks DECIMAL(10,2) DEFAULT NULL",
      "ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved'",
      "ADD COLUMN approved_by_admin_id INT DEFAULT NULL",
      "ADD COLUMN admin_comment TEXT DEFAULT NULL",
      "ADD COLUMN approved_at DATETIME DEFAULT NULL"
    ];

    for (const addSql of columns) {
      try {
        await conn.query(`ALTER TABLE exam_result_overrides ${addSql}`);
        console.log(`Successfully added: ${addSql}`);
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
          console.log(`Column already exists, skipping: ${addSql}`);
        } else {
          console.error(`Error adding column: ${addSql}`, err);
        }
      }
    }

    await conn.end();
    console.log("Migration completed.");
    process.exit(0);
  } catch (err) {
    console.error("Database connection failed", err);
    process.exit(1);
  }
})();
