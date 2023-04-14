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
const testimonialModel = require("../models/testimonials");
const tagModel = require("../models/tagModel");
const watchListModel = require("../models/watchlistModel");
// YlVbbd6pzYTJaXI3ocDvqVajEC32

exports.userOnboarding = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: true,
    message: "User onboarded.",
    user: req.user,
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
  let user = await User.findById(req.user._id);
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
  const { type, page, limit } = req.query;
  let chains = "bitcoin,solana,ethereum,polygon,fantom";
  const { id } = req.query;
  if (id) {
    chains = id;
  }
  if (type === "all") {
    chains = "";
  }
  const data = await axios.get(
    `${CRYPTO_TRACKER_URL}/coins/markets?vs_currency=usd&ids=${chains}&order=market_cap_desc&per_page=${limit}&page=${page}&sparkline=false`
  );
  return res.status(200).json({ status: true, cryptoData: data.data });
});

// get all testimonials
exports.getAllTestimonials = catchAsync(async (req, res, next) => {
  const testimonials = await testimonialModel.find({ isActive: true });
  return res
    .status(200)
    .json({ status: true, message: "", data: testimonials });
});

// get all tags
exports.getAllTags = catchAsync(async (req, res, next) => {
  const { limit } = req.query;
  const tags = await tagModel.find().sort({ views: -1 }).limit(limit);
  return res.status(200).json({ status: true, message: "", data: tags });
});

// add to watchList
exports.addToWatchList = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const isExits = await watchListModel.findOne({ id, userId: req.user._id });
  if (isExits) {
    const removeFromWatchList = await watchListModel.deleteOne({
      id,
      userId: req.user._id,
    });
    if (
      !removeFromWatchList.acknowledged ||
      removeFromWatchList.deletedCount !== 1
    ) {
      return next(new AppError("Something went wrong", 500));
    }
    return res
      .status(200)
      .json({ status: true, message: "Successfully removed from watch list" });
  }

  const addToWatchList = await watchListModel.create({
    id,
    userId: req.user._id,
  });
  if (!addToWatchList) {
    return next(new AppError("Something went wrong", 500));
  }
  return res
    .status(200)
    .json({ status: true, message: "Successfully added to watch list" });
});

// get all from watchList
exports.getAllWatchListCoins = catchAsync(async (req, res, next) => {
  const data = await watchListModel.find({ userId: req.user._id });
  let chains = "";
  data.forEach((coin) => (chains = chains + coin.id + ","));
  console.log(chains);
  const url = `${CRYPTO_TRACKER_URL}/coins/markets?vs_currency=usd&ids=${chains}&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
  console.log(url);
  const finalData = await axios.get(url);
  return res.status(200).json({ status: true, message: "", data: finalData });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie("token");
  return res.status(200).json({ status: true });
});
