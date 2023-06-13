const crypto = require('crypto');
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
    enum: ["superAdmin", "admin"],
    default: "admin",
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
  passwordChangedAt:Date,
  passwordResetToken:String,
  passwordResetExpires:Date,
});

schema.methods.createPasswordResetToken = function(){
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now()+10*60*1000;
  
  return resetToken;
};


const adminModel = mongoose.model("Admin", schema, "Admin");

module.exports = adminModel;
