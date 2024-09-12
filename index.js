const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

app.use("/auth", authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
