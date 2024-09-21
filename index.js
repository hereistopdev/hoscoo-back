const express = require("express");
const mongoose = require("mongoose");
const WebSocket = require("ws");

require("dotenv").config();

const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const accountsRoutes = require("./routes/accounts");

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/accounts", accountsRoutes);

// Connect to MongoDB without deprecated options
mongoose.connect(process.env.MONGO_URI);

// Connection events
mongoose.connection.on("connected", () => {
  console.log("MongoDB successfully connected");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Use the same port for both HTTP and WebSocket
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// WebSocket server setup
const wss = new WebSocket.Server({ server });

let sharedText = ""; // Shared text state to be broadcast to all clients

const broadcastTextUpdate = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ text: data }));
    }
  });
};

wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");

  // Send current shared text to the newly connected client
  ws.send(JSON.stringify({ text: sharedText }));

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.text) {
        sharedText = parsedMessage.text;
        broadcastTextUpdate(sharedText);
      }

      if (parsedMessage.typing) {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ typing: parsedMessage.typing, user: parsedMessage.user }));
          }
        });
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});

console.log("WebSocket server running on the same port as HTTP");
