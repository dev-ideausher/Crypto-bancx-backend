const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxLength: 100,
  },
  image: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
    maxLength: 100,
  },
});

const employeeModel = mongoose.model("Employee", schema, "Employee");

module.exports = employeeModel;
