const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  header: {
    type: String,
    trim: true,
    maxLength: 150,
    required: true,
  },
  subHeader: {
    type: String,
    trim: true,
    maxLength: 300,
    required: true,
  },
  picture: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["part-1", "part-2"],
    required: true,
  },
});

const homepageSection1Model = mongoose.model(
  "HomepageSection1",
  schema,
  "HomepageSection1"
);

module.exports = homepageSection1Model;
