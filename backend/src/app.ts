import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import emailRoutes from "./routes/email.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/email", emailRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/auth") &&
      !req.path.startsWith("/email") &&
      req.path !== "/health"
    ) {
      return res.sendFile(path.join(frontendDistPath, "index.html"));
    }
    next();
  });
}

export default app;
