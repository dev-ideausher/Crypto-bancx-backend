const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["blog", "news"],
    required: true,
  },
  contentId: {
    type: mongoose.Types.ObjectId,
    ref: "onModel",
    required: true,
  },
  onModel: {
    type: String,
    enum: ["Blog", "News"],
    required: true,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const favoriteModel = mongoose.model("Favorite", schema, "Favorite");

module.exports = favoriteModel;
