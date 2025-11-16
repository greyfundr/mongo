const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();  // <-- load .env

const authRoute = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());


 // MongoDB Atlas Connection (now using env variable)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));



app.use("/auth", authRoute);

app.listen(5000, () => console.log("Server running on port 5000"));
