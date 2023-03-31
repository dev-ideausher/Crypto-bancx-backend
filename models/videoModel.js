const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const adminModel = require("./adminModel");
const tagModel = require("./tagModel");
const userModel = require("./userModel");

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      maxLength: [300, "Title should be less than 301 characters."],
      trim: true,
      default: null,
    },

    url: {
      type: String,
      required: [true, "Provide  url of the video"],
      trim: true,
    },
    author: {
      type: mongoose.Types.ObjectId,
      required: [true, "Provide author of the news"],
      //   refPath: "onModel",
      ref: "Admin",
    },

    thumbnail: {
      type: String,
      default: null,
    },
    // onModel: {
    //   type: String,
    //   enum: ["User", "Admin"],
    //   // required: [true, "Provide user/admin model for blog"],
    // },

    ViewCount: {
      type: Number,
      default: 0,
    },
    // tags: {
    //   type: [mongoose.Types.ObjectId],
    //   ref: "Tag",
    //   validate: [tagSizeLimit, "tags should be unique and less than 5"],
    // },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
function tagSizeLimit(val) {
  val = val.map((item) => `${item}`);
  const unique = [...new Set(val)];
  if (unique.length < val.length || val.length >= 5) return false;
  return true;
}

schema.pre("save", async function (next) {
  let check;
  //   if (await userModel.findById(this.author)) {
  //     check = true;
  //     this.onModel = "User";
  //     this.isApproved = false;
  //   } else
  if (await adminModel.findById(this.author)) {
    check = true;
    // this.onModel = "Admin";
    this.isApproved = true;
  }
  if (!check) {
    return next(new AppError("Author should either be admin or user"));
  }
  // let isValidAuthor;
  // if (this.onModel === "User") {
  //   isValidAuthor = await userModel.findById(this.author);
  // } else if (this.onModel === "Admin") {
  //   isValidAuthor = await adminModel.findById(this.author);
  // }
  // if (!isValidAuthor) {
  //   return next(new AppError("Author should either be admin or user"));
  // }

  //   for (let i = 0; i < this.tags.length; i++) {
  //     const isTagValid = await tagModel.findById(this.tags[i]);
  //     if (!isTagValid) {
  //       return next(new AppError("Invalid tag", 404));
  //     }
  //   }
  next();
});
const videoModel = mongoose.model("Video", schema, "Video");

module.exports = videoModel;
