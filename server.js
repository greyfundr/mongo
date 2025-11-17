const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();  // <-- load .env

const authRoute = require("./routes/auth");
const campaignRoute = require("./routes/campaign");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/campaign", campaignRoute);

// MongoDB Atlas Connection (use env variable)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// Routes
app.use("/auth", authRoute);

// Required for Render !!
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
