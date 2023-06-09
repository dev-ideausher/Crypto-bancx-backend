const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

const watchListModel = mongoose.model("WatchList", schema, "WatchList");

module.exports = watchListModel;
