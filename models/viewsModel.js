const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const contentModel = require("./contentModel");
const tagModel = require("./tagModel");

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Provide type for views"],
      enum: ["news", "blog", "tag"],
    },
    itemId: {
      type: mongoose.Types.ObjectId,
      refPath: "onModel",
      required: [true, "Provide type.."],
    },
    onModel: {
      type: String,
      enum: ["Content", "Tag"],
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

schema.pre("save", async function (next) {
  if (await contentModel.findById(this.itemId)) {
    this.onModel = "Content";
  } else if (await tagModel.findById(this.itemId)) {
    this.onModel = "Tag";
  } else {
    next(new AppError("Invalid Data", 500));
  }
});

const viewsModel = mongoose.model("Views", schema, "Views");
module.exports = viewsModel;
