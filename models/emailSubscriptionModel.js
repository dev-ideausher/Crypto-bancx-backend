const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
});

const employeeModel = mongoose.model("EmailSubscription", schema, "EmailSubscription");

module.exports = employeeModel;