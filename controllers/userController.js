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

const marketCapModel = require("../models/marketCapModel")
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

// get all from watchList
exports.getAllWatchListCoins = catchAsync(async (req, res, next) => {
  // const page = 1;
  const {limit,page} = req.query;
  const data = await watchListModel.find({ userId: req.user._id });
  if(data.length == 0){
    return res.status(400).json({ status: false, message: "no data found", data: "" });
  }
  let chains = "";
  data.forEach((coin) => (chains = chains + coin.id + ","));
  console.log("Chains",chains);
  const url = `${CRYPTO_TRACKER_URL}/coins/markets?vs_currency=usd&ids=${chains}&order=market_cap_desc&per_page=${limit || 10}&page=${page || 1}&sparkline=false`;
  console.log(url);
  const finalData = await axios.get(url);
  return res.status(200).json({ status: true, message: "", data: finalData.data });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie("token");
  return res.status(200).json({ status: true });
});



// crypto tracker
exports.cryptoMarketsApi = catchAsync(async (req, res, next) => {
  const { page, limit } = req.query;

  const totalPagesGiven = 108
  const totalLimitGiven = 100

  axios.get(`${CRYPTO_TRACKER_URL}/coins/markets`, {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: totalLimitGiven,
      page: page,
      sparkline: false,
      price_change_percentage: '1h,24h,7d',
      locale: 'en',
    },
  }).then(async (response) => {
    const data = response.data;
    const watchListedIds = await watchListModel.find({ userId: req.user._id }).distinct('id');
    const cryptoData = data.map((item) => {
      const isWishListed = watchListedIds.includes(item.id);
      return {
        ...item,
        isWishListed,
      };
    });
  
    console.log("data")

    // store the data in the database
    const marketCap = await marketCapModel.create({
      page,
      data: data,
    });
    console.log("data1111",marketCap._id)

    return res.status(200).json({
      status: true, 
      totalPages:totalPagesGiven, 
      cryptoData: cryptoData 
    });

  }).catch(async (error) => {

    console.log("def")
    // check if there is any stored data for the given page and limit
    const cachedData = await marketCapModel.find({page:page}).sort({ createdAt: -1 }).limit(1).lean();
    if (cachedData) {
      const watchListedIds = await watchListModel.find({ userId: req.user._id }).distinct('id');
      const updatedData = cachedData[0].data.map((item) => {
        const isWishListed = watchListedIds.includes(item.id);
        return {
          ...item,
          isWishListed,
        };
      });

      return res.status(200).json({
        status: true, 
        totalPages: totalPagesGiven, 
        cryptoData: updatedData
      });
    }else{
      console.log("no cachedDAta")
      return res.status(200).json({
        status: true, 
        totalPages: totalPagesGiven, 
        cryptoData: []
      });
    }
  });
});

  // const totalPagesGiven = 108
  // const totalLimitGiven = 100
  // const totalData = await axios.get(
  //   `${CRYPTO_TRACKER_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${totalLimitGiven}&page=${totalPagesGiven}&sparkline=false&price_change_percentage=1h%2C24h%2C7d&locale=en`
  // );
  // //found from the market cap
  // let totalItems = totalPagesGiven * totalLimitGiven // 10,800
  // let remainingVal = 100 - totalData.data.length
  // totalItems = totalItems - remainingVal 
  // let totalPages = Math.ceil(totalItems / limit)

// crypto tracker
exports.cryptoMarketsNoAuth = catchAsync(async (req, res, next) => {
  const { page, limit } = req.query;
  // limit =100
  const totalPagesGiven = 108
  const totalLimitGiven = 100
  axios.get(
    `${CRYPTO_TRACKER_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: totalLimitGiven,
        page: page,
        sparkline: false,
        price_change_percentage: '1h,24h,7d',
        locale: 'en',
      },
    }).then(async (response) => {
      const data = response.data;
      console.log("data")

      // store the data in the database
      const marketCap = await marketCapModel.create({
        page,
        data: data,
      });
      console.log("data1111",marketCap)

      return res.status(200).json({
        status: true, 
        totalPages:totalPagesGiven, 
        cryptoData: data 
      });

    }).catch(async (error) => {
      console.log("def")
        // check if there is any stored data for the given page and limit
        const cachedData = await marketCapModel.find({page:page}).sort({ createdAt: -1 }).limit(1).lean();
        if (cachedData) {
          console.log("cachedDAta",cachedData)
          return res.status(200).json({
            status: true, 
            totalPages: totalPagesGiven, 
            cryptoData: cachedData[0].data 
          });
        }else{
          console.log("no cachedDAta")
          return res.status(200).json({
            status: true, 
            totalPages: totalPagesGiven, 
            cryptoData: []
          });
        }
    });
});


// exports.graph = catchAsync(async (req, res, next) => {
//   let {id,days,currency,type,from,to,outputType} = req.query

//   let data ={}

//   if(outputType == 1){
//     let totalData = await axios.get(
//       `${CRYPTO_TRACKER_URL}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`
//     )
//     data.totalData=totalData
//   }else if (outputType == 2){
//     //from = 1682595000
//     //to = 1682596227
//     let marketRange = await axios.get(
//       `${CRYPTO_TRACKER_URL}/coins/${id}/market_chart/range?vs_currency=${currency}&from=${from}&to=${to}`
//     )
//     data.marketRange=marketRange
//   }else if (outputType== 3){
//     let ohlc = await axios.get(
//     `${CRYPTO_TRACKER_URL}/coins/${id}/ohlc?vs_currency=${currency}&days=${days}`
//     )
//     data.ohlc=ohlc
//   }

//   return res.status(200).json({
//     status: true, 
//     cryptoData:  data
//   });
// })


exports.graphOhlc = catchAsync(async (req, res, next) => {
  let {id,days,currency} = req.query

  let ohlc = await axios.get(
    `${CRYPTO_TRACKER_URL}/coins/${id}/ohlc?vs_currency=${currency}&days=${days}`
  )

  return res.status(200).json({
    status: true, 
    cryptoData:  ohlc.data
  });
})

exports.graphMarketRange = catchAsync(async (req, res, next) => {
  let {id,from,to,currency} = req.query

  let marketRange = await axios.get(
    `${CRYPTO_TRACKER_URL}/coins/${id}/market_chart/range?vs_currency=${currency}&from=${from}&to=${to}`
  )

  return res.status(200).json({
    status: true, 
    cryptoData:  marketRange.data
  });
})



exports.graphMarketChart = catchAsync(async (req, res, next) => {
  let {id,days,currency} = req.query

  let totalData = await axios.get(
    `${CRYPTO_TRACKER_URL}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`
  )

  return res.status(200).json({
    status: true, 
    cryptoData:  totalData.data
  });
})

