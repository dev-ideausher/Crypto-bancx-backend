const mongoose = require("mongoose");
const userModel = require("./userModel");

const schema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Types.ObjectId,
      ref: "Content",
    },
    type: {
      type: String,
      enum: ["blog", "news"],
      required: true
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      validate: async function () {
        const user = await userModel.findById(this.userId);
        return user;
      },
    },
    comment: {
      type: String,
      maxLength: 300,
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    
  },
  { timestamps: true }
);


const commentModel = mongoose.model("Comments", schema, "Comments");

module.exports = commentModel;
