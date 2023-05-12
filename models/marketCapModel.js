const mongoose = require("mongoose");
const AppError = require("../utils/appError");

// const schema = new mongoose.Schema(
//   {
//     page:{
//         type:Number,
//         required:true
//     },
//     data:[Object]
//   },
//   { timestamps: true }
// );

const schema = new mongoose.Schema(
  {
    order:{
        type:Number,
        required:true
    },
    marketCapId:{
        type:String,
        required:true
    },
    data:Object,
    description:{
        type:String,
    },
    homepageUrl:[{
        type:String
    }]
  },
  { timestamps: true }
);


const marketCapModel = mongoose.model("MarketCap", schema, "MarketCap");

module.exports = marketCapModel;