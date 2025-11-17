const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Campaign = require("../models/campaign");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const upload = multer({ dest: "uploads/" });

// Create campaign
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    let imageUrl = null;

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path);
      imageUrl = uploadRes.secure_url;
    }

    const newCampaign = new Campaign({
      userId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      goalAmount: req.body.goalAmount,
      image: imageUrl
    });

    await newCampaign.save();
    res.status(201).json(newCampaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error creating campaign" });
  }
});

// Get all campaigns
router.get("/", async (req, res) => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 });
  res.json(campaigns);
});

// Get campaigns created by logged-in user
router.get("/mine", auth, async (req, res) => {
  const campaigns = await Campaign.find({ userId: req.user.id });
  res.json(campaigns);
});

module.exports = router;
