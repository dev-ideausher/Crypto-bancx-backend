const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const EmailSubscriptionModel = require("../models/emailSubscriptionModel");
const Email = require("../../utils/email");

exports.addEmailSubscription = catchAsync(async (req, res, next) => {
    const {email}= req.body

    let emailSubscription = await EmailSubscriptionModel.findOne({email:email})
    if(!emailSubscription){
        emailSubscription = await EmailSubscriptionModel.create({email:email})
    }
    let user = {email:email}

    await new Email(user, {}).emailSubscription();

    return res.status(200).json({
        status: true,
        message: "Email Subscribed",
        emailSubscription: emailSubscription,
      });
})

// need to send confirmation mail . 
// make sendgrid account use api key
// confirmition mail pug file
// need email component