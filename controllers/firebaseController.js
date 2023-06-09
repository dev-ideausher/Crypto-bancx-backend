const admin = require("firebase-admin");
const serviceAccount = require("../firebase/serviceAccountKey.json");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
// const Notification = require("../models/notificationModel");
const { getAuth, signInWithCustomToken } = require("firebase/auth");
require("../firebase/firebaseConfig");

const requiresAuth = async (req, res, next) => {
  const idToken = req.header("token");
  if (!idToken) {
    return next(new AppError("Please pass firebase auth token ", 400));
  }
  let decodedIdToken;
  try {
    decodedIdToken = await admin.auth().verifyIdToken(idToken, true);
  } catch (error) {
    next(error);
    return;
  }
  let user = await User.findOne({ firebaseUid: decodedIdToken.uid });
  if(user.isActive != true){
    return next(new AppError("Error: Suspended user account", 401));
  }
  if (!user) {
    if (req.path === "/onboarding") {
      if (decodedIdToken.firebase.sign_in_provider === "phone") {
        user = await User.create({
          phone: decodedIdToken.phone_number,
          firebaseUid: decodedIdToken.uid,
          firebaseSignInProvider: decodedIdToken.firebase.sign_in_provider,
          name: req.body.name,
          email: req.body.email,
          image: req.body.image,
        });
      } else {
        user = await User.create({
          name: decodedIdToken.name,
          email: decodedIdToken.email,
          image: decodedIdToken.picture,
          firebaseUid: decodedIdToken.uid,
          firebaseSignInProvider: decodedIdToken.firebase.sign_in_provider,
        });
      }
    } else {
      return next(new AppError("User not found", 404));
    }
  }
  user.userType = "user";
  req.user = user;
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return next(
        new AppError("You do not have permission ot perform this action", 403)
      );
    }
    next();
  };
};

//Only for backend developer to generate token to call APIS
const generateToken = async (req, res, next) => {
  try {
    const token = await admin.auth().createCustomToken(req.params.uid);
    const user = await signInWithCustomToken(getAuth(), token);
    const idToken = user._tokenResponse.idToken;

    return res.status(200).json({
      status: true,
      token: idToken,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: false,
      msg: err.message,
    });
  }
};

const sendNotification = async (
  topic,
  reciever,
  title,
  message,
  image,
  notificationType,
  notificationTypeId
) => {
  const messaging = admin.messaging();
  var payload = {
    notification: {
      title,
      body: message,
      image: image,
    },
    topic: topic,
  };

  messaging.send(payload).then((result) => {
    console.log(result);
  });
  await Notification.create({
    reciever: reciever,
    title: title,
    body: message,
    image: image,
    notificationType: notificationType, // booking a bike, admin create
    notificationTypeId: notificationTypeId,
  });
};

module.exports = {
  requiresAuth,
  restrictTo,
  generateToken,
  sendNotification,
};
