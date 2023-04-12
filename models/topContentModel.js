const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const contentModel = require("./contentModel");
const testimonialModel = require("./testimonials");
const videoModel = require("./videoModel");

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["blog", "news", "video", "testimonial"],
      required: true,
    },
    contentId: {
      type: mongoose.Types.ObjectId,
      refPath: "onModel",
    },
    onModel: {
      type: String,
      enum: ["Video", "Content", "Testimonial"],
    },
    priority: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

schema.pre("save", async function (next) {
  if (await contentModel.findById(this.contentId)) {
    this.onModel = "Content";
  } else if (await videoModel.findById(this.contentId)) {
    this.onModel = "Video";
  } else if (await testimonialModel.findById(this.contentId)) {
    this.onModel = "Testimonial";
  } else {
    return next(new AppError("Invalid content", 500));
  }
  return next();
});

const topContentModel = mongoose.model("TopContent", schema, "TopContent");

module.exports = topContentModel;
