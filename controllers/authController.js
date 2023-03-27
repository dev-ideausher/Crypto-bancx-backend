const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { JWT_SECRETE_KEY } = require("../config/config");
const AppError = require("../utils/appError");
const userModel = require("../models/userModel");
const adminModel = require("../models/adminModel");

exports.validateToken = (model) => {
  return catchAsync(async (req, res, next) => {
    const token = req.header("Authorization").split("Bearer")[1].trim();
    if (!token) return next(new AppError("Token is not present.", 400));
    const { userId } = jwt.verify(token, JWT_SECRETE_KEY);
    const user = await model.findById(userId);
    if (!user) return next(new AppError("Invalid token", 400));
    req.user = user;
    next();
  });
};
exports.checkRole = (model) => {
  return catchAsync(async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return next(new AppError("Token is not present.", 400));
    const { userId } = jwt.verify(token, JWT_SECRETE_KEY);
    let user;
    if (await userModel.findById(userId))
      user = await userModel.findById(userId);
    else if (await adminModel.findById(userId))
      user = await adminModel.findById(userId);
    if (!user) return next(new AppError("Invalid token", 400));
    req.user = user;
    next();
  });
};
