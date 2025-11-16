const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// multer memory storage (we send buffer to cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// const uploadBuffer = require("../utils/cloudinaryUpload");
// const result = await uploadBuffer(req.file.buffer, { folder: "avatars", resource_type: "image" });


// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if(!name || !email || !password) return res.status(400).json({ msg: "Please provide all fields" });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ msg: "Please provide email and password" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET PROFILE
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE PROFILE: name + email
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ msg: "Name and email are required" });

    // check if email used by other user
    const existing = await User.findOne({ email, _id: { $ne: req.user } });
    if (existing) return res.status(400).json({ msg: "Email already in use by another account" });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.name = name;
    user.email = email;
    await user.save();

    res.json({ msg: "Profile updated", user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// CHANGE PASSWORD
router.put("/profile/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ msg: "Provide current and new password" });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UPLOAD AVATAR - expects multipart form with field 'avatar'
// UPLOAD AVATAR
router.post(
  "/profile/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ msg: "No file uploaded" });

      // upload file buffer to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "avatars", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const user = await User.findById(req.user);
      user.avatar = uploadResult.secure_url;
      await user.save();

      res.json({ msg: "Avatar uploaded", avatar: user.avatar });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ msg: "Upload failed", error: err.message });
    }
  }
);


module.exports = router;
