const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const referralCodeGenerator = require("referral-code-generator");
const { searchQuery } = require("../utils/helper");
const contentModel = require("../models/contentModel");
const userModel = require("../models/userModel");
const commentModel = require("../models/commentModel");
const { default: axios } = require("axios");
const { CRYPTO_TRACKER_URL } = require("../config/config");
// YlVbbd6pzYTJaXI3ocDvqVajEC32

exports.userOnboarding = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { inviteReferralCode } = req.body;

  let referralCode = referralCodeGenerator.alphaNumeric("uppercase", 2, 4);

  let invitedBy;
  let referrerUser = await User.findOne({ referralCode: inviteReferralCode });
  if (referrerUser) {
    invitedBy = referrerUser._id;
  }

  let currentUser = await User.findByIdAndUpdate(user._id, {
    invitedBy: invitedBy,
    referralCode: referralCode,
    userIdCardImage: req.body.userIdCardImage,
    userIdCardNumber: req.body.userIdCardNumber,
  });

  res.status(200).json({
    status: true,
    message: "User onboarded.",
    user: currentUser,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    status: true,
    message: "User details",
    user: user,
  });
});

//update user
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = req.user;
  const userId = req.params.userId;

  if (
    user.userType === "admin" ||
    JSON.stringify(user._id) === JSON.stringify(userId)
  ) {
    let updatedUser = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
    });
    return res.status(200).json({
      status: true,
      message: "User updated",
      user: updatedUser,
    });
  } else {
    return next(new AppError("You don't have permission to edit user", 400));
  }
});

//get a user
exports.getAUser = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;

  let user = await User.findById(userId);
  return res.status(200).json({
    status: true,
    message: "get user details",
    user: user,
  });
});

//get all users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  let users;
  let search = req.query.search;
  if (search) {
    let QStringName = searchQuery(search, "name");
    let QStringEmail = searchQuery(search, "email");
    users = await User.find({ $or: QStringName.concat(QStringEmail) });
    return res.status(200).json({
      status: true,
      results: users.length,
      message: "all users",
      users,
    });
  }
  users = new APIFeatures(User.find(), req.query).filter();
  const doc = await users.query;

  res.status(200).json({
    status: true,
    results: doc.length,
    message: "all users",
    users: doc,
  });
});

//add user
exports.addUser = catchAsync(async (req, res, next) => {
  req.user = await userModel.findById(req.body.userId);
  const { name, email, image } = req.body;
  const user = await User.create({
    name,
    email,
    image,
    firebaseUid: Date.now(),
  });
  return res
    .status(200)
    .json({ status: true, message: "User created", user: user });
});

// add comments
exports.addComment = catchAsync(async (req, res, next) => {
  const comment = await commentModel.create(req.body);
  if (!comment) return next(new AppError("Something went wrong", 500));

  return res.status(200).json({ status: true, comment: comment });
});

// crypto tracker
exports.cryptoTracker = catchAsync(async (req, res, next) => {
  let chains = "bitcoin,solana,ethereum,polygon,fantom";
  const data = await axios.get(
    `${CRYPTO_TRACKER_URL}/coins/markets?vs_currency=usd&ids=${chains}&order=market_cap_desc&per_page=100&page=1&sparkline=false`
  );
  return res.status(200).json({ status: true, cryptoData: data.data });
});
