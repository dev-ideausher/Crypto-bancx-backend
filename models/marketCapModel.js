const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const schema = new mongoose.Schema(
  {
    page:{
        type:Number,
        required:true
    },
    data:[Object]
  },
  { timestamps: true }
);


const marketCapModel = mongoose.model("MarketCap", schema, "MarketCap");

module.exports = marketCapModel;