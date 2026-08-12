const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { connectToDatabase } = require("./config/db");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "inspectme-api" });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  const port = Number(process.env.PORT || 5000);

  await connectToDatabase();

  app.listen(port, () => {
    console.log(`InspectMe API running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
