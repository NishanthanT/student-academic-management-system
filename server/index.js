require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});


// TODO: Review student enrollment logic for performance optimizations

// Note: Grade calculation logic requires further refactoring in the future.
