import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectToDb from "./config/connectToDb.js";
import router from "./routers/authRouter.js";
import resumeRouter from "./routers/resumeRouter.js";
import aiRouter from "./routers/aiRouter.js";
dotenv.config();
connectToDb();

const app = express();
const PORT = process.env.PORT || 4005;

// middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// routes
app.get("/api/v1", ...);
app.use("/api/v1/auth", router);
app.use("/api/v1/resumes", resumeRouter);
app.use("/api/v1/ai", aiRouter);

// error handler
app.use((err, req, res, next) => { ... });

// start server
app.listen(PORT, () => { ... });

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error"
  });
});
