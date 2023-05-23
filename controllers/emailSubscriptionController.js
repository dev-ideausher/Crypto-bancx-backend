const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const EmailSubscriptionModel = require("../models/emailSubscriptionModel");

exports.addEmailSubscription = catchAsync(async (req, res, next) => {
    const {email}= req.body

    let emailSubscription = await EmailSubscriptionModel.findOne({email:email})
    if(!emailSubscription){
        emailSubscription = await EmailSubscriptionModel.create({email:email})
    }

    return res.status(200).json({
        status: true,
        message: "Email Subscribed",
        emailSubscription: emailSubscription,
      });
})