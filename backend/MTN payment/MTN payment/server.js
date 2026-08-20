import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..", "..", "..", "frontend");

const app = express();
dotenv.config();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5000,http://127.0.0.1:5000,http://localhost:5500,http://127.0.0.1:5500")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(frontendDir));

app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "test.html"));
});

app.get("/app", (req, res) => {
  res.sendFile(path.join(frontendDir, "cropcast-2-5-5.html"));
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
