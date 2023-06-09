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
      required: [true, "Provide title of the news"],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, "description should be less than 301 characters."],
    },

    content: {
      type: String,
      required: [true, "Provide  news to add"],
      trim: true,
    },
    author: {
      type: mongoose.Types.ObjectId,
      required: [true, "Provide author of the news"],
      refPath: "onModel",
    },

    thumbnail: {
      type: String,
      required: true,
    },
    onModel: {
      type: String,
      enum: ["User", "Admin"],
      // required: [true, "Provide user/admin model for blog"],
    },
    type: {
      type: String,
      enum: ["blog", "news"],
      required: [true, "Provide type of content"],
    },
    ViewCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [mongoose.Types.ObjectId],
      ref: "Tag",
      validate: [tagSizeLimit, "tags should be unique and less than 5"],
    },
    featureStatus:{
      type: String,
      enum:["published","request","rejected"]
    },
    isApproved: {
      type: Boolean,
    },
    isDraft:{
      type: Boolean,
      default:false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      // to soft delete user. if(isDeleted = true), then user is deleted.
      type: Boolean,
      default: false,
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

schema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

schema.pre("save", async function (next) {
  let check;
  if (await userModel.findById(this.author)) {
    check = true;
    this.onModel = "User";
    this.isApproved = false;
  } else if (await adminModel.findById(this.author)) {
    check = true;
    this.onModel = "Admin";
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

  for (let i = 0; i < this.tags.length; i++) {
    const isTagValid = await tagModel.findById(this.tags[i]);
    if (!isTagValid) {
      return next(new AppError("Invalid tag", 404));
    }
  }
  next();
});
const contentModel = mongoose.model("Content", schema, "Content");

module.exports = contentModel;
