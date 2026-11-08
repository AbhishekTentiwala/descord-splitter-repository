import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { clerkMiddleware, getAuth } from "@clerk/express";
import dotenv from "dotenv";

import serverRoutes from "./routes/servers.js";
import channelRoutes from "./routes/channels.js";
import messageRoutes from "./routes/messages.js";
import directMessageRoutes from "./routes/direct-messages.js";
import memberRoutes from "./routes/members.js";
import livekitRoutes from "./routes/livekit.js";
import profileRoutes from "./routes/profile.js";

dotenv.config();

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT_EXCEPTION]', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  path: "/api/socket/io",
  addTrailingSlash: false,
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
  if (token) {
    socket.data.token = token;
  }
  next();
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());

app.use(cors({
  origin: [process.env.CLIENT_URL || "http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(clerkMiddleware());

app.get("/api/test", (req, res) => {
  console.log("[TEST_ENDPOINT] Hit");
  res.json({ ok: true });
});

app.use("/api/servers", serverRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/direct-messages", directMessageRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/livekit", livekitRoutes);
app.use("/api/profile", profileRoutes);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

io.on("error", (error) => {
  console.error("[SOCKET_IO_ERROR]", error);
});

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, httpServer, io };