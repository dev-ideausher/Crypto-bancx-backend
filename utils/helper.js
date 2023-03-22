//for making regex search query
const jwt = require("jsonwebtoken");
const { JWT_SECRETE_KEY } = require("../config/config");
const AppError = require("./appError");
const catchAsync = require("./catchAsync");

const searchQuery = (query, fieldName) => {
  let QStringList = query.split(" ").map((s) => {
    var o = {};
    o[fieldName] = {
      $regex: s,
      $options: "i",
    };
    return o;
  });

  return QStringList;
};

const generateJWTToken = (userId, initialTime, refreshTime) => {
  const token = jwt.sign({ userId: userId }, JWT_SECRETE_KEY, {
    expiresIn: initialTime,
  });
  // const refreshToken = jwt.sign({ userId: userId }, JWT_SECRETE_KEY, {
  //   expiresIn: refreshTime,
  // });

  return {
    token,
    // refreshToken,
  };
};

const disableFunction = (model) => {
  return catchAsync(async (req, res, next) => {
    const { _id } = req.body;
    const disableData = await model.findOneAndUpdate(
      { _id },
      { $set: { isActive: false } }
    );
    if (!disableData) {
      return next(new AppError("Something went wrong.", 500));
    }
    return res
      .status(200)
      .json({ status: true, message: "Successfully disabled." });
  });
};
const isDate = (str) => {
  // Attempt to create a Date object from the string
  const date = new Date(str);

  // Check if the Date object is valid
  return !isNaN(date.getTime());
};

const searchNewsOrVideos = (model) => {
  return catchAsync(async (req, res, next) => {
    const { query, type, userId } = req.query;

    let filter = {};
    if (userId) {
      filter.author = userId;
    }
    if (type) {
      filter.type = type;
    }
    if (isDate(query)) {
      let date = new Date(query);
      filter["$or"] = [{ createdAt: date }];
    } else {
      filter["$or"] = [
        { title: { $regex: query, $options: "i" } },
        // { description: { $regex: query, $options: "i" } },
      ];
    }
    const searchResult = await model
      .find(filter)
      .populate("author", "name email image");
    return res
      .status(200)
      .json({ status: 200, message: "", searchResult: searchResult });
  });
};

const generateDate = (duration) => {
  var curr = new Date();
  var last = curr.getDate();
  if (duration == "day") {
    var first = last - 1;
    var firstDay = new Date(new Date().setDate(first));
    var lastDay = new Date(new Date().setDate(last));
  } else if (duration == "week" || duration === "wholeWeek") {
    var first = last - 6;
    var firstDay = new Date(new Date().setDate(first));
    var lastDay = new Date(new Date().setDate(last));
  } else if (duration == "month" || duration == "months") {
    var first = last - 30;
    var firstDay = new Date(new Date().setDate(first));
    var lastDay = new Date(new Date().setDate(last));
  } else {
    return { status: false };
  }
  return { firstDay, lastDay, status: true };
};

const getData = (model) => {
  return catchAsync(async (req, res, next) => {
    const { type, status, duration } = req.query;
    const { status: isSuccess, firstDay, lastDay } = generateDate(duration);
    if (!isSuccess) {
      return next(new AppError("Invalid duration", 500));
    }
    let filter = {
      $and: [
        { createdAt: { $gte: firstDay } },
        { createdAt: { $lt: lastDay } },
      ],
    };
    if (type) {
      filter.type = type;
    }
    if (status && status !== "all") {
      filter.isActive = status;
    }

    const data = await model
      .find(filter)
      .populate("author", "name image email");
    return res.status(200).json({ status: true, data: data });
  });
};

module.exports = {
  searchQuery,
  generateJWTToken,
  disableFunction,
  isDate,
  searchNewsOrVideos,
  getData,
  generateDate,
};
