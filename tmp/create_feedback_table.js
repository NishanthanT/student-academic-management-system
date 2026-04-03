const db = require("./server/src/config/db");

const sql = `
CREATE TABLE IF NOT EXISTS feedbacks (
  id int NOT NULL AUTO_INCREMENT,
  student_id int NOT NULL,
  staff_id int NOT NULL,
  subject_id int NOT NULL,
  description text NOT NULL,
  status enum('pending', 'resolved') NOT NULL DEFAULT 'pending',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (staff_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

db.query(sql, (err) => {
  if (err) {
    console.error("Error creating feedbacks table:", err);
    process.exit(1);
  }
  console.log("Feedbacks table created successfully.");
  process.exit(0);
});
