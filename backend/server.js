const express = require("express");
const connectDB = require("./config/db");
let dotenv;
try {
  dotenv = require("dotenv");
} catch (error) {
  console.error("dotenv module not found. Please install it using 'npm install dotenv'");
  console.error("Require stack:", error.stack); // Debug log for require stack
  process.exit(1);
}
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const debug = require("debug")("app:server");

dotenv.config();
connectDB();
const app = express();

app.use(express.json()); // to accept json data

// app.get("/", (req, res) => {
//   res.send("API Running!");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

const server = app.listen(
  PORT,
  () => {
    console.log(`Server running on PORT ${PORT}...`.yellow.bold);
    debug(`Server running on PORT ${PORT}...`);
  }
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  debug("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
    debug(`User ${userData._id} connected`);
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
    debug(`User joined room: ${room}`);
  });
  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
    debug(`User typing in room: ${room}`);
  });
  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
    debug(`User stopped typing in room: ${room}`);
  });

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
      debug(`Message received in user ${user._id}`);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    debug("User disconnected");
    socket.leave(userData._id);
  });
});
