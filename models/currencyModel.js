const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const schema = new mongoose.Schema({
    INR:{
        type:Number,
        required:true
    },
    GBP:{
        type:Number,
        required:true
    },
    EUR:{
        type:Number,
        required:true 
    },
},
  { timestamps: true }
);

const currencyModel = mongoose.model("Currency", schema, "Currency");

module.exports = currencyModel;