const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  subHeader: {
    type: String,
    required: true,
    maxLength: 300,
  },
  title: {
    type: String,
    required: true,
    maxLength: 150,
  },
  image: {
    type: String,
    required: true,
  },
  paragraph: {
    type: String,
    required: true,
    maxLength: 1000,
  },
});

const aboutUsModel = mongoose.model("AboutUs", schema, "AboutUs");
module.exports = aboutUsModel;
