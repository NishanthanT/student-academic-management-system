const db = require("../config/db");

const run = async () => {
  console.log("Adding staff_reply column to feedbacks table...");
  const sql = "ALTER TABLE feedbacks ADD COLUMN staff_reply TEXT NULL AFTER status";
  
  db.query(sql, (err) => {
    if (err) {
      if (err.errno === 1060) {
        console.log("Column already exists. Skipping.");
      } else {
        console.error("Error adding column:", err);
      }
    } else {
      console.log("Column 'staff_reply' added successfully!");
    }
    process.exit();
  });
};

run();
