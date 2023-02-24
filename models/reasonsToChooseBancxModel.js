const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    icon: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxLength: 100,
    },
    description: {
      type: String,
      required: true,
      maxLength: 300,
    },
  },
  { timestamps: true }
);

const reasonsModel = mongoose.model("Reasons", schema, "Reasons");
module.exports = reasonsModel;
