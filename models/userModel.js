const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "Unknown",
    },
    phone: {
      type: String,
      default: "+910000000000",
    },
    email: {
      type: String,
      default: "testuser@gmail.com",
    },
    image: {
      type: String,
      default: null,
    },
    // userType: {
    //   type: String,
    //   enum: ["user", "owner", "admin"],
    //   default: "user",
    // },

    password:{
      type: String,
      
    }
    ,
  
    // firebaseUid: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
    // firebaseSignInProvider: {
    //   type: String,
    //   required: true,
    // },
    // invitedBy: {
    //   type: String,
    // },
    referralCode: {
      type: String,
    },
    userIdCardImage: {
      type: String,
    },
    userIdCardNumber: {
      type: String,
    },
 
    isDeleted: {
      // to soft delete user. if(isDeleted = true), then user is deleted.
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

const userModel = mongoose.model("User", userSchema, "User");
module.exports = userModel
