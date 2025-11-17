const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  title: { type: String, required: true },
  description: { type: String, required: true },
  goalAmount: { type: Number, required: true },
  raisedAmount: { type: Number, default: 0 },

  image: { type: String }, // Cloudinary image URL

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Campaign", CampaignSchema);
