const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      maxLength: 50,
    },
    position: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    testimonial: {
      type: String,
      required: true,
      maxLength: 200,
    },
  },
  { timestamps: true }
);

const testimonialModel = mongoose.model("Testimonial", schema, "Testimonial");
module.exports = testimonialModel;
