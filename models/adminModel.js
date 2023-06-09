const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: "Unknown",
  },
  email: {
    type: String,
    default: "testuser@gmail.com",
  },
  password: {
    type: String,
    required: [true, "Provide password"],
    maxLength: 100,
  },
  image: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["admin", "subAdmin"],
    default: "subAdmin",
  },
  lastActive:{
    type:Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    // to soft delete user. if(isDeleted = true), then user is deleted.
    type: Boolean,
    default: false,
  },
});

const adminModel = mongoose.model("Admin", schema, "Admin");

module.exports = adminModel;
