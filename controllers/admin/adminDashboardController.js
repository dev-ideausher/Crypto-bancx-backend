const adminModel = require("../../models/adminModel");
const catchAsync = require("../../utils/catchAsync");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/appError");

const ViewsModel = require("../../models/viewsModel");
const ContentModel = require("../../models/contentModel");
const {
    generateDate,
  } = require("../../utils/helper");

// admin dashboard analytics
exports.analytics = catchAsync(async (req, res, next) => {

    let {duration,type} = req.query

    const { status: isValidDuration, firstDay, lastDay } = generateDate(duration);
    if (!isValidDuration) {
      return next(new AppError("Invalid Duration", 500));
    }

    let filter = {
        createdAt: {$gte:firstDay,$lt:lastDay},
        type:type
    };

    let views = await ViewsModel.find(filter);

    return res.status(200).json({
      status: true,
      message:"total views",
      result:views.length,
      views:views,
    });
});
