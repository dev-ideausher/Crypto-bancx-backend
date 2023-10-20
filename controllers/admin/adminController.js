const adminModel = require("../../models/adminModel");
const catchAsync = require("../../utils/catchAsync");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const AppError = require("../../utils/appError");
const { JWT_EXPIRY_TIME, API_VERSION } = require("../../config/config");
const {
  generateJWTToken,
  generateRefreshToken,
  isDate,
  disableOnEnableFunction,
  searchNewsOrVideos,
  getData,
  generateDate,
  changeOrder,
  setTop,
  permanentDelTopContentFunc,
  permanentDeleteTopContent,
  addToTopContent,
  decreaseContentOrder,
  generateRandomString,
} = require("../../utils/helper");
const Email = require("../../utils/email")
const aboutUsModel = require("../../models/aboutUs");
const employeeModel = require("../../models/employeeModel");
const commentModel = require("../../models/commentModel");
const contentModel = require("../../models/contentModel");
const userModel = require("../../models/userModel");
const videoModel = require("../../models/videoModel");
const firebase = require("firebase-admin");
const topContentModel = require("../../models/topContentModel");
const redisClient = require("../../config/redis");
require("../../firebase/firebaseConfig");

// admin register
exports.register = catchAsync(async (req, res, next) => {
  console.log("In admin register");
  const { name, email, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);
  const admin = await adminModel.create({
    name: name,
    email: email,
    password: hashedPassword,
    role: "superAdmin",
  });
  console.log("admin created = ", admin);
  return res.status(200).json({
    status: true,
    user: admin,
  });
});

// admin login
exports.login = catchAsync(async (req, res, next) => {
  console.log("in login");
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Provide email and password", 400));
  }

  const err = "Email or password does not exists.";

  const isAdminExists = await adminModel.findOne({ email: email });
  if (!isAdminExists) {
    console.log("email is wrong");
    return next(new AppError(err, 400));
  }
  const isPasswordCorrect = bcrypt.compareSync(
    password,
    isAdminExists.password
  );
  if (!isPasswordCorrect) {
    console.log("password is wrong");
    return next(new AppError(err, 400));
  }
  const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
  const expirationInMilliseconds = parseInt(JWT_EXPIRY_TIME) * millisecondsPerDay;
  const { token } = generateJWTToken(isAdminExists._id);
  return res
    .status(200)
    .cookie("token", token, {
      expires: new Date(Date.now() + expirationInMilliseconds),
      httpOnly: true,
      sameSite: "none",
      // sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: true,
    })
    .json({ status: true, user: isAdminExists, token: token, });
});

// // admin login
// exports.login = catchAsync(async (req, res, next) => {
//   console.log("in login");
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return next(new AppError("Provide email and password", 400));
//   }

//   const err = "Email or password does not exists.";

//   const isAdminExists = await adminModel.findOne({ email: email });
//   if (!isAdminExists) {
//     console.log("email is wrong");
//     return next(new AppError(err, 400));
//   }
//   const isPasswordCorrect = bcrypt.compareSync(
//     password,
//     isAdminExists.password
//   );
//   if (!isPasswordCorrect) {
//     console.log("password is wrong");
//     return next(new AppError(err, 400));
//   }
//   // const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
//   // const expirationInMilliseconds = parseInt(JWT_EXPIRY_TIME) * millisecondsPerDay;
//   const { token } = generateJWTToken(isAdminExists._id);
//   const { refreshToken, expirationInMilliseconds } = generateRefreshToken(isAdminExists._id)
//   return res
//     .status(200)
//     .cookie("token", token, {
//       expires: new Date(Date.now() + expirationInMilliseconds),
//       httpOnly: true,
//       sameSite: "none",
//       // sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//       secure: true,
//     })
//     .cookie('refreshToken', refreshToken, {
//       expires: new Date(Date.now() + expirationInMilliseconds),
//       httpOnly: true,
//       sameSite: 'none',
//       secure: true,
//     })
//     .json({ status: true, user: isAdminExists, token: token, refreshToken:refreshToken });
// });

// add admin
exports.addAdmin = catchAsync(async (req, res, next) => {
  if (req.user.role !== "superAdmin")
    return next(
      new AppError("You don't have the permission to do this activity.", 403)
    );
  const { email, password, name, role } = req.body;
  if (!email || !password || !name)
    return next(
      new AppError("Provide all necessary details to add the admin", 402)
    );
  const isAdminExists = await adminModel.findOne({ email: email });
  if (isAdminExists) {
    return next(new AppError("Admin with given email already exists", 403));
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const admin = await adminModel.create({
    email: email,
    password: hashedPassword,
    name,
    role,
  });

  return res.status(200).json({
    status: true,
    admin: admin,
  });
});

// delete admin
exports.deleteAdmin = catchAsync(async (req, res, next) => {
  const { adminId } = req.query;
  if (req.user.role !== "superAdmin")
    return next(
      new AppError("You don't have the permission to do this activity.", 403)
    );
  const findAdmin = await adminModel.findById(adminId);
  if (!findAdmin) {
    return next(new AppError("Invalid Admin", 500));
  }
  if(findAdmin.role =="superAdmin"){
    return next(new AppError("Error: you are not authorised to delete a super admin", 403));
  }
  const randomString = generateRandomString(8);
  const softDeleteAdmin = await adminModel.findOneAndUpdate(
    { _id: adminId },
    { $set: { isDeleted: true, email: findAdmin.email + randomString } }
  );
  if (!softDeleteAdmin) return next(new AppError("Server Error.", 500));

  return res.status(200).json({
    status: true,
  });
});

// get all admins
exports.getAllAdmins = catchAsync(async (req, res, next) => {
  const { adminId } = req.query;
  if (adminId) {
    const admin = await adminModel.findOne({
      _id: adminId,
      // role: { $ne: "admin" },
    });
    if (!admin) return next(new AppError("Invalid admin", 500));
    return res.status(200).json({ status: true, admin: admin });
  }

  const allAdmins = await adminModel.find({
    _id: { $ne: req.user._id },
    isDeleted: { $ne: true },
  });

  return res.status(200).json({
    status: true,
    allAdmins: allAdmins,
  });
});

// get single super admin info
exports.getSingleAdmin = catchAsync(async (req, res, next) => {
  const admin = await adminModel.findById(req.user._id);
  if (!admin) {
    return next(new AppError("Invalid user", 500));
  }
  return res.status(200).json({ status: true, message: "", admin: admin });
});

// edit admin
exports.editAdmin = catchAsync(async (req, res, next) => {
  const { name, image, adminId, role } = req.body;

  if(adminId){
    const admin = await adminModel.findById(adminId);
    if (!admin) return next(new AppError("Invalid admin", 500));
    if(admin.role="superAdmin" && req.user.role !== "superAdmin"){
      return next(new AppError("You are not authorized to perform this action", 403));
    }
  }

  if (role){
    if (req.user.role !== "superAdmin"){
      return next(
        new AppError("You don't have the permission to change role.", 403)
      );
    }
  }

  const updatedAdmin = await adminModel.findOneAndUpdate(
    { _id: adminId || req.user._id },
    {
      $set: {
        name: name,
        image: image,
        role: role,
      },
    },
    { new: true }
  );




  return res.status(200).json({
    status: true,
    updatedAdmin: updatedAdmin,
  });
});

// change admin status
exports.changeAdminStatus = catchAsync(async (req, res, next) => {
  if (req.user.role !== "superAdmin")
    return next(
      new AppError("You don't have permission to perform this operation.", 403)
    );
  const { adminId } = req.query;
  const isAdminExists = await adminModel.findById(adminId);
  if (!isAdminExists) return next(new AppError("Invalid admin id", 500));
  const updateStatus = await adminModel.findOneAndUpdate(
    { _id: adminId },
    {
      $set: {
        isActive: isAdminExists.isActive ? false : true,
      },
    }
  );
  if (!updateStatus) return next(new AppError("Server Error. ", 500));
  return res.status(200).json({ status: true });
});

// change password
exports.changePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword, reEnterPassword } = req.body;
  if (newPassword !== reEnterPassword) {
    return next(new AppError("Entered passwords should be matched", 403));
  }
  const matchPassword = bcrypt.compareSync(oldPassword, req.user.password);
  if (!matchPassword) {
    return next(new AppError("Password is wrong.", 403));
  }

  // const salt = bcrypt.genSaltSync(10);

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  const updatedAdmin = await adminModel.findOneAndUpdate(
    { _id: req.user._id },
    {
      $set: {
        password: hashedPassword,
      },
    },
    { new: true }
  );

  return res.status(200).json({ status: true, admin: updatedAdmin });
});


exports.forgotPassword = async (req, res, next) => {
  try {
      const { email } = req.body;
      let checkAdmin = await adminModel.findOne({ email: email });
      console.log(checkAdmin)
      if (!checkAdmin) {
          return res.status(404).json({
              status: false,
              msg: "No user found with this email."
          })
      }
      const resetToken = checkAdmin.createPasswordResetToken();
      console.log("resetToken",resetToken)
      await checkAdmin.save()
      try {
          const resetLink = req.protocol + "://" + req.get('host') +`${API_VERSION}/admin/resetPassword?token=` + resetToken;
          console.log("reset link",resetLink);
          await new Email(checkAdmin, { resetLink }).forgotPassword();
          return res.status(200).json({
              status: true,
              msg: `A email verification link sent to ${email}.`
          });

      } catch (err) {
        console.log(err)
          await checkAdmin.save({ validateBeforeSave: false });
          return res.status(500).json({
              status: false,
              msg: "There was an error sending the email. Try again later!"
          })
      }

  } catch (err) {
      console.log(err)
      return res.status(500).json({
          status: false,
          msg: err.message
      })
  }
}

exports.getResetPassword = async(req , res , next) => {

  const {token} = req.query;

  const url = "https://" + req.get('host')+`${API_VERSION}/admin/resetPassword`;

  res.render('forgotPassword', {
    pageTitle: 'Reset Password',
    url: url,
    resetToken: token,
  });

}

// router.get("/resetPassword/",(req , res , next) => {


// router.post("/resetPassword/",async(req , res , next) => {
exports.postResetPassword = async(req , res , next) => {
try{
    const {resetToken,new_password,confirm_password} = req.body;
    // 1) Get user based on the token
    console.log(resetToken)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log(hashedToken)
    const checker = await adminModel.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()}});
    console.log(checker)
    if(!checker){
        return res.render('forgotPasswordMsg', {
            msg:"Token is invalid or has expired"
        });
    }
    if(new_password !== confirm_password){
        return res.render('forgotPasswordMsg', {
            msg:"Password does not match."
        });
    }

    // 2) if token has not expired, and there is user, set the new password
    checker.password = await bcrypt.hashSync(req.body.new_password,10);
    checker.passwordResetToken = undefined;
    checker.passwordResetExpires = undefined;
    await checker.save();

    return res.render('forgotPasswordMsg', {
        msg:"Password updated. Please login to continue"
    });

}catch(err){
    console.log(err)
    return res.render('forgotPasswordMsg', {
        msg:err.message
    });
}

};

// add about us
exports.addAboutUs = catchAsync(async (req, res, next) => {
  const { subHeader, title, image, paragraph } = req.body;

  const add = await aboutUsModel.create({ subHeader, title, image, paragraph });
  if (!add) return next(new AppError("Something went wrong", 500));
  return res
    .status(200)
    .json({ status: true, message: "About us content added", content: add });
});

// edit about us
exports.editAboutUs = catchAsync(async (req, res, next) => {
  const { subHeader, title, image, paragraph, _id } = req.body;

  const [previous] = await aboutUsModel.find({});
  if (!previous) return next(new AppError("Add content before editing.", 500));

  const update = await aboutUsModel.findOneAndUpdate(
    { _id: previous._id },
    { subHeader, title, image, paragraph },
    { new: true }
  );
  if (!update) return next(new AppError("Something went wrong", 500));
  return res.status(200).json({
    status: true,
    message: "About us content updated",
    content: update,
  });
});

// get about us
exports.getAboutUs = catchAsync(async (req, res, next) => {
  const about = (await aboutUsModel.find({})).at(-1);
  return res
    .status(200)
    .json({ status: true, message: "Found", aboutUs: about });
});

// add employees
exports.addEmployees = catchAsync(async (req, res, next) => {
  const emp = await employeeModel.create(req.body);
  if (!emp) return next(new AppError("Something went wrong", 500));
  return res.status(200).json({
    status: true,
    message: "Employee has been added successfully",
    emp: emp,
  });
});

// update employee
exports.updateEmployee = catchAsync(async (req, res, next) => {
  const { name, image, position, _id } = req.body;

  const update = await employeeModel.findOneAndUpdate(
    { _id },
    { name, position, image },
    { new: true }
  );
  if (!update) return next(new AppError("Something went wrong", 500));
  return res.status(200).json({
    status: true,
    message: "Employee has been updated",
    content: update,
  });
});

// get all employees
exports.getEmployees = catchAsync(async (req, res, next) => {
  const about = await employeeModel.find({});
  return res
    .status(200)
    .json({ status: true, message: "Found Employee", aboutUs: about });
});

// get all comments
exports.getComments = catchAsync(async (req, res, next) => {
  const { isApproved } = req.query;
  let filter = {};
  if (isApproved !== undefined) filter.isApproved = isApproved;
  const allComments = await commentModel.find(filter).populate("itemId");
  return res
    .status(200)
    .json({ status: true, message: "", comments: allComments });
});

// change status of comments
exports.changeCommentStatus = catchAsync(async (req, res, next) => {
  const { commentId } = req.query;

  const comment = await commentModel.findById(commentId);
  if (!comment) return next(new AppError("Invalid comment", 500));

  const updateComment = await commentModel.findOneAndUpdate(
    { _id: commentId },
    {
      $set: {
        isApproved: comment.isApproved ? false : true,
      },
    },
    { new: true }
  );

  if (!updateComment)
    return next(new AppError("Unable to update comment", 500));
  return res.status(200).json({
    status: true,
    message: "Comment status updated",
    comment: updateComment,
  });
});

exports.searchNews = searchNewsOrVideos(contentModel);
exports.searchVideos = searchNewsOrVideos(videoModel);
exports.changeContentStatus = disableOnEnableFunction(contentModel,"content");
// exports.changeVideoStatus = disableOnEnableFunction(videoModel);

// // add video
// exports.addVideo = catchAsync(async (req, res, next) => {
//   const video = await videoModel.create({ ...req.body, author: req.user._id });

//   if (!video) {
//     return next(new AppError("Something went wrong.", 500));
//   }
//   return res
//     .status(200)
//     .json({ status: true, message: "Video has been added", video: video });
// });

// // edit video
// exports.editVideo = catchAsync(async (req, res, next) => {
//   const { _id } = req.body;

//   const updatedVideo = await videoModel.findOneAndUpdate(
//     { _id },
//     { $set: req.body },
//     { new: true }
//   );
//   if (!updatedVideo) {
//     return next(new AppError("Something went wrong", 500));
//   }
//   return res.status(200).json({
//     status: true,
//     message: "Video has been Updated.",
//     video: updatedVideo,
//   });
// });

// delete blogs
exports.deleteBlogs = catchAsync(async (req, res, next) => {
  const { _id } = req.query;
  const deleteBlog = await contentModel.deleteOne({ _id });
  if (!deleteBlog.acknowledged || deleteBlog.deletedCount !== 1) {
    return next(new AppError("Unable to delete blog", 500));
  }

  let topContent = await topContentModel.findOne({contentId:_id})
  if(topContent){
    // req.query._id = topContent._id;
    // req.query.type = "blog"
    // await new Promise((resolve, reject) => {
    //   permanentDeleteTopContent(topContentModel)(req, res, (error) => {
    //     if (error) {
    //       console.log(error);
    //       reject(error);
    //     } else {
    //       resolve();
    //     }
    //   });
    // });
    let permDel = await permanentDelTopContentFunc(topContent._id,"blog")
    if(!permDel.status){
      return next(new AppError("Something went wrong.", 500));
    }
  }

  const options = {
    TYPE: 'string', // `SCAN` only
    MATCH: 'latest?*',
    COUNT: 100
  };


  const scanIterator = redisClient.scanIterator(options);
  let keysToDelete = [];

  (async () => {
    for await (const key of scanIterator) {
      keysToDelete.push(key);
    }
  
    console.log('Keys to delete:', keysToDelete);
  
    const deletedCount = await redisClient.del(keysToDelete);
    console.log(`Deleted ${deletedCount} keys.`);

    if(topContent){
      let contentKey = 'top-content/blog';
  
      const deletedContent = await redisClient.del(contentKey);
      console.log(`Deleted ${deletedContent} keys.`);
    }
  })();



  return res
    .status(200)
    .json({ status: true, message: "Blog has been deleted." });
});

exports.deleteNews = catchAsync(async (req, res, next) => {
  const { _id } = req.query;
  const deleteNews = await contentModel.deleteOne({ _id });
  if (!deleteNews.acknowledged || deleteNews.deletedCount !== 1) {
    return next(new AppError("Unable to delete News", 500));
  }

  let topContent = await topContentModel.findOne({contentId:_id})
  if(topContent){
    // req.query._id = topContent._id;
    // req.query.type = "news";
    // await new Promise((resolve, reject) => {
    //   permanentDeleteTopContent(topContentModel)(req, res, (error) => {
    //     if (error) {
    //       console.log(error);
    //       reject(error);
    //     } else {
    //       resolve();
    //     }
    //   });
    // });
    let permDel = await permanentDelTopContentFunc(topContent._id,"news")
    if(!permDel.status){
      return next(new AppError("Something went wrong.", 500));
    }
  }

  const options = {
    TYPE: 'string', // `SCAN` only
    MATCH: 'latest?*',
    COUNT: 100
  };

  const scanIterator = redisClient.scanIterator(options);
  let keysToDelete = [];

  (async () => {
    for await (const key of scanIterator) {
      keysToDelete.push(key);
    }
  
    console.log('Keys to delete:', keysToDelete);
  
    const deletedCount = await redisClient.del(keysToDelete);
    console.log(`Deleted ${deletedCount} keys.`);
    if(topContent){
      let contentKey = 'top-content/news';
        
      const deletedContent = await redisClient.del(contentKey);
      console.log(`Deleted ${deletedContent} keys.`);
    }
  })();

  return res
    .status(200)
    .json({ status: true, message: "News has been deleted." });
});

// search blog function, its working.
// exports.searchBlogs = catchAsync(async (req, res, next) => {
//   const { query, type, status, duration } = req.query;
//   const filter = { $and: [{ type : "blog"}] };
//   if (status && status !== "all") {
//     filter["$and"] = [...filter["$and"], { isActive: status }];
//   }
//   const { status: isValidDuration, firstDay, lastDay } = generateDate(duration);
//   if (!isValidDuration) {
//     return next(new AppError("Invalid Duration", 500));
//   }
//   filter["$and"].push(
//     ...[{ createdAt: { $gte: firstDay } }, { createdAt: { $lt: lastDay } }]
//   );

//   console.log({ firstDay });
//   console.log({ lastDay });
//   console.log({ filter });
//   const data = await contentModel.aggregate([
//     { $match: filter },
//     {
//       $lookup: {
//         from: "User",
//         localField: "author",
//         foreignField: "_id",
//         as: "authors",
//       },
//     },
//     {
//       $lookup: {
//         from: "Admin",
//         localField: "author",
//         foreignField: "_id",
//         as: "admins",
//       },
//     },
//     { $unwind: { path: "$authors", preserveNullAndEmptyArrays: true } },
//     { $unwind: { path: "$admins", preserveNullAndEmptyArrays: true } },
//     {
//       $match: {
//         $or: [
//           { title: { $regex: query, $options: "i" } },
//           { description: { $regex: query, $options: "i" } },
//           { "authors.name": { $regex: query, $options: "i" } },
//           { "authors.email": { $regex: query, $options: "i" } },
//           { "admins.name": { $regex: query, $options: "i" } },
//           { "admins.email": { $regex: query, $options: "i" } },
//         ],
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         data: { $push: "$$ROOT" },
//         count: { $sum: 1 },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         data: 1,
//         count: 1,
//       },
//     },
//   ]);

//   const result = data.length ? data[0] : { data: [], count: 0 };
//   res.status(200).json({
//     status: true,
//     data: result.data,
//     count: result.count,
//   });
// });

// get blogs but dont search
exports.searchBlogs = catchAsync(async (req, res, next) => {
  const { status, duration, _id } = req.query;
  if (_id) {
    const blog = await contentModel.findOne({ _id }).populate("tags").populate("author", "name email image");
    if (!blog) {
      return next(new AppError("Invalid content", 500));
    }
    return res.status(200).json({ status: true, blog: blog });
  }
  const filter = { $and: [{ type: "blog" },{ isApproved: true }] };
  if (status !== "all") {
    filter["$and"].push({ isActive: status === "true" ? true : false });
  }
  if( duration != "all"){
    const { status: isValidDuration, firstDay, lastDay } = generateDate(duration);
    if (!isValidDuration) {
      return next(new AppError("Invalid Duration", 500));
    }
    filter["$and"].push(
      ...[{ createdAt: { $gte: firstDay } }, { createdAt: { $lt: lastDay } }]
    );
  }
  const [data, total] = await Promise.all([
    contentModel
      .find(filter)
      .populate("author", "name email image")
      .populate("tags")
      .sort({ createdAt: -1 }),
    (await contentModel.find(filter)).length,
  ]);

  res.status(200).json({
    status: true,
    data: data,
    count: total,
  });
});

// get all blogs or news
exports.getNewsOrBlogs = getData(contentModel);

// // get videos
// exports.getVideos = getData(videoModel);

// // delete video
// exports.deleteVideo = catchAsync(async (req, res, next) => {
//   const { _id } = req.query;
//   const deleted = await videoModel.deleteOne({ _id });
//   if (!deleted || !deleted.acknowledged || deleted.deletedCount !== 1) {
//     return next(new AppError("Something went wrong,", 500));
//   }
//   return res.status(200).json({ status: true, message: "Video deleted" });
// });

// create user
exports.createNewUser = catchAsync(async (req, res, next) => {
  const { email, password, name, image } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  let user
  if (image != ""){
    user = await firebase.auth().createUser({
      email: email,
      password: hashedPassword,
      displayName: name,
      photoURL: image,
    });
    if (!user) {
      return next(new AppError("Unable to create user", 500));
    }
  }else{
    user = await firebase.auth().createUser({
      email: email,
      password: hashedPassword,
      displayName: name,
    });
    if (!user) {
      return next(new AppError("Unable to create user", 500));
    }
  }
  const verifyEmail = await firebase
    .auth()
    .updateUser(user.uid, { emailVerified: true });
  if (!verifyEmail) {
    return next(new AppError("Unable to verify email"));
  }
  const saveUserInDB = await userModel.create({
    ...req.body,
    firebaseUid: user.uid,
    // firebaseSignInProvider: user.providerData,
    password: hashedPassword,
  });
  if (!saveUserInDB) {
    return next(new AppError("Unable to save user", 500));
  }
  return res
    .status(200)
    .json({ status: true, message: "User has been created.." });
});

// get all users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { duration, status } = req.query;

  let filter = {}
  if(duration != "all"){
    const { status: isSuccess, firstDay, lastDay } = generateDate(duration);
    if (!isSuccess) {
      return next(new AppError("Invalid duration", 500));
    }
    filter = {
      $and: [{ createdAt: { $gte: firstDay } }, { createdAt: { $lt: lastDay } }],
    };
  }


  if (status && status !== "all") {
    filter.isActive = status;
  }
  const users = await userModel.find(filter);
  const posts = await Promise.all(
    users.map((user) => contentModel.find({ type: "blog", author: user._id }))
  );
  users.forEach((user, idx) => {
    users[idx] = { ...user._doc, totalPosts: posts[idx] };
  });
  return res.status(200).json({ status: true, message: "", allUsers: users });
});

// get single user
exports.getSingleUser = catchAsync(async (req, res, next) => {
  const { _id, duration, query } = req.query;
  const filter = {
    type: "blog",
    author: _id,
  };
  if(duration != "all"){
    const { status, firstDay, lastDay } = generateDate(duration);
    if (!status) {
      return next(new AppError("Invalid duration", 500));
    }
    filter.createdAt = { $gte: firstDay, $lt: lastDay };
  }
  
  if (query) {
    filter["$or"] = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
    ];
  }
  const [user, blogs] = await Promise.all([
    userModel.findById(_id),
    contentModel.find(filter).populate("author", "name image email"),
  ]);
  return res
    .status(200)
    .json({ status: true, message: "", user: user, blogs: blogs });
});

// disable user
exports.disableUser = disableOnEnableFunction(userModel);

// change order
exports.changeOrder = changeOrder();

// decrease order
exports.decreaseOrder = decreaseContentOrder();

// save as top content
exports.saveTopContent = setTop(topContentModel);

// delete top content
exports.deleteTopContent = permanentDeleteTopContent(topContentModel);

// add to top content
exports.addToTopContent = addToTopContent(topContentModel);

// get all top content data
exports.getAllTopContentData = catchAsync(async (req, res, next) => {
  const data = await topContentModel
    .find({ type: req.query.type })
    .populate({ path: "contentId", populate: { path: "author" } })
    .sort({ priority: -1 })
    .limit(5);
  return res.status(200).json({ status: true, data: data });
});

// approve blogs
exports.approveUserBlogs = getData(
  contentModel,
  "author",
  "name image email",
  "User"
);

// change blog status
exports.changeBlogStatus = catchAsync(async (req, res, next) => {
  const { _id } = req.body;
  const findBlog = await contentModel.findById(_id);
  if (!findBlog) {
    return next(new AppError("Invalid blog", 500));
  }
  const disableData = await contentModel.findOneAndUpdate(
    { _id },
    { $set: { isApproved: !findBlog.isApproved } }
  );
  if (!disableData) {
    return next(new AppError("Something went wrong.", 500));
  }
  return res
    .status(200)
    .json({ status: true, message: "Successfully disabled." });
});

// logout
exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie("token");
  return res.status(200).json({ status: true });
});

// get all feature Requests
exports.allfeatureRequests = catchAsync(async (req, res, next) => {

  const {duration, status } = req.query;

  let filter = {
    type: "blog",
    onModel:"User",
  };

  if( duration != "all"){
      const { status: isSuccess, firstDay, lastDay } = generateDate(duration);
      if (!isSuccess) {
        return next(new AppError("Invalid duration", 500));
      }
   filter.createdAt = { $gte: firstDay , $lt: lastDay };
  }


  if (status && status !== "all") {
    filter.featureStatus = status;
  }

  let featureRequests = await contentModel.find(filter).populate("author", "name email image").sort({createdAt:-1})

  return res.status(200).json({ status: true, result: featureRequests.length , featureRequests: featureRequests });
});


// update feature Requests
exports.approveOrRejectFeature = catchAsync(async (req, res, next) => {
  const featureId = req.params.id
  const {status} = req.body;

  let featureStatus
  if(status==true){
    featureStatus = "published";
  }else{
    featureStatus = "rejected";
  }
  let featureRequests = await contentModel.findByIdAndUpdate(featureId,{
    featureStatus: featureStatus,
    isApproved: status,
    isActive: status,
  },{new:true})

  return res.status(200).json({ status: true, message:"updated", featureRequests: featureRequests });
})

exports.deleteFeatureRequest = catchAsync(async (req, res, next) => {
  const {_id} = req.query

  const featureRequestCheck = await contentModel.findById(_id)
  if(!featureRequestCheck){
    return next(new AppError("invalid _id", 500));
  };

  // Delete the feature Request
  const deleteFeatureRequest = await contentModel.deleteOne({ _id: _id });

  if (!deleteFeatureRequest.acknowledged || deleteFeatureRequest.deletedCount !== 1){
      return next(new AppError("Something went wrong", 500));
  }

  return res.status(200).json({ status: true, message:"deleted", featureRequests: deleteFeatureRequest });
})

exports.getSingleFeatureRequest = catchAsync(async (req, res, next) => {
  const id = req.params.id

  let featureRequest = await contentModel.findById(id).populate("author", "name email image").populate("tags")

  return res.status(200).json({ status: true, featureRequest: featureRequest });
});
