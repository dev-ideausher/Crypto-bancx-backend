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
const marketCapModel = require("../models/marketCapModel");
const currencyModel = require('../models/currencyModel');

const {auth} = require('firebase-admin');
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
  const {name , image} = req.body

  let updatedUser = await User.findByIdAndUpdate(user._id,{
    name:name,
    image:image
  },{new: true});

  return res.status(200).json({
    status: true,
    message: "User updated",
    user: updatedUser,
  });
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
exports.addOrRemoveToWatchList = catchAsync(async (req, res, next) => {
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

// // get all from watchList
// exports.getAllWatchListCoins = catchAsync(async (req, res, next) => {
//   // const page = 1;
//   const {limit,page} = req.query;
//   const data = await watchListModel.find({ userId: req.user._id });
//   if(data.length == 0){
//     return res.status(400).json({ status: false, message: "no data found", data: "" });
//   }
//   let chains = "";
//   data.forEach((coin) =>{
//     const finalData = await marketCapModel.find({marketCapId:coin.id})
//   });
 
//   // console.log("Chains",chains);
//   // const url = `${CRYPTO_TRACKER_URL}/coins/markets?vs_currency=usd&ids=${chains}&order=market_cap_desc&per_page=${limit || 10}&page=${page || 1}&sparkline=false`;
//   // console.log(url);
//   // const finalData = await axios.get(url);
//   return res.status(200).json({ status: true, message: "", data: finalData.data });
// });


//get all watchlist coins
exports.getAllWatchListCoins = catchAsync(async (req, res, next) => {
  const { limit = 10, page = 1 , currency} = req.query;

  const watchListCoins = await watchListModel
    .find({ userId: req.user._id })
    .select('id');

  // if (watchListCoins.length === 0) {
  //   return res.status(400).json({ status: false, message: "no data found", data: "" });
  // }

  const coinIds = watchListCoins.map((coin) => coin.id);
  const count = await marketCapModel.countDocuments({ marketCapId: { $in: coinIds } });
  const totalPages = Math.ceil(count / limit);
  const skip = (page - 1) * limit;
  const finalData = await marketCapModel.find({ marketCapId: { $in: coinIds } })
    .skip(skip)
    .limit(limit)
    .select('data');
  const data = finalData.map((coin)=> coin.data)  



  if (currency){
    let currencyVal = await currencyModel.findOne({})
    switch (currency) {
      case "INR":
        data.forEach(async e=>{
          e.current_price = e.current_price * currencyVal.INR;
          e.market_cap = e.market_cap * currencyVal.INR;
        })
        
        break;
      case "GBP":      
        data.forEach(async e=>{
          e.current_price = e.current_price * currencyVal.GBP;
          e.market_cap = e.market_cap * currencyVal.GBP;
        })
        break;
      case "EUR":
        data.forEach(async e=>{
            e.current_price = e.current_price * currencyVal.EUR;
            e.market_cap = e.market_cap * currencyVal.EUR;
        })
  
        break;
      default:
        // Handle other currencies here if needed
        break;
    }
  }

  return res.status(200).json({ status: true, message: "", data: data, totalPages: totalPages });
});


exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie("token");
  return res.status(200).json({ status: true });
});

exports.deleteUser = catchAsync(async(req , res , next) => {

  const user = req.user;
  let err;

  await auth()
      .deleteUser(user.firebaseUid)
      .then((result) => {
          console.log('Successfully deleted user');
      })
      .catch((error) => {
          err = 'Error deleting user:'+ error;
          console.log(err);
          console.log('Error deleting user:', error);
      });

  if(err){
      console.log(err);
      // console.log(typeof());
      return res.status(500).json({
          status:false,
          msg: err,
      });
  }

  user.isDeleted = 1;
  user.firebaseUid = null;
  await user.save();

  console.log('User deleted successfully');
  return res.status(200).json({
      status:true,
      msg: 'User deleted successfully',
  });
})
