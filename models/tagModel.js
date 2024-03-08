const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const schema = new mongoose.Schema(
  {
    name: {
      type: "String",
      trim: true,
      unique: true,
      required: true,
      // validate: [convertToLowerCase,""]
    },
    show:{
      type:Boolean,
      default:false
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

function convertToLowerCase(tag) {
  console.log({tag});
  tag = tag.toLowerCase().trim()
  console.log({tag})
  return true
}

// schema.pre("save", async function (next) {
//   const findSimilar = await tagModel.findOne({
//     name: { $regex: this.name.trim(), $options: "i" },
//   });
//   if (findSimilar) return next(new AppError("Tag already exists", 500));
//   next();
// });

const tagModel = mongoose.model("Tag", schema, "Tag");
module.exports = tagModel;
