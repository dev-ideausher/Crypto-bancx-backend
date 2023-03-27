const adminModel = require("../../models/adminModel");
const catchAsync = require("../../utils/catchAsync");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/appError");
const {
  generateJWTToken,
  isDate,
  disableFunction,
  searchNewsOrVideos,
  getData,
  generateDate,
  changeOrder,
  setTop,
} = require("../../utils/helper");
const aboutUsModel = require("../../models/aboutUs");
const employeeModel = require("../../models/employeeModel");
const commentModel = require("../../models/commentModel");
const contentModel = require("../../models/contentModel");
const userModel = require("../../models/userModel");
const videoModel = require("../../models/videoModel");
const firebase = require("firebase-admin");
const topContentModel = require("../../models/topContentModel");
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
    role: "admin",
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

  const { token } = generateJWTToken(isAdminExists._id, "3h");
  return res
    .status(200)
    .cookie("token", token, {
      expires: new Date(Date.now() + 1800000),
      httpOnly: true,
      sameSite: "none",
      // sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: true,
    })
    .json({ status: true, user: isAdminExists, token: token });
});

// add admin
exports.addAdmin = catchAsync(async (req, res, next) => {
  if (req.user.role !== "admin")
    return next(
      new AppError("You don't have the permission to do this activity.", 403)
    );
  const { email, password, name } = req.body;
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
  });

  return res.status(200).json({
    status: true,
    admin: admin,
  });
});

// delete admin
exports.deleteAdmin = catchAsync(async (req, res, next) => {
  const { adminId } = req.query;
  if (req.user.role !== "admin")
    return next(
      new AppError("You don't have the permission to do this activity.", 403)
    );

  const softDeleteAdmin = await adminModel.findOneAndUpdate(
    { _id: adminId },
    { $set: { isDeleted: true } }
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
      role: { $ne: "admin" },
    });
    if (!admin) return next(new AppError("Invalid admin", 500));
    return res.status(200).json({ status: true, admin: admin });
  }
  const allAdmins = await adminModel.find({
    _id: { $ne: req.user._id },
    role: { $ne: "admin" },
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
  const { name, email, image } = req.body;
  const findAdmin = await adminModel.findOne({ email: email });
  if (findAdmin && String(findAdmin._id) !== String(req.user._id)) {
    return next(new AppError("Email is already taken, Enter new Email", 403));
  }

  const updatedAdmin = await adminModel.findOneAndUpdate(
    { _id: req.user._id },
    {
      $set: {
        email: email,
        name: name,
        image: image,
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
  if (req.user.role !== "admin")
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
        isActive: isAdminExists.active ? false : true,
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
exports.changeContentStatus = disableFunction(contentModel);
exports.changeVideoStatus = disableFunction(videoModel);

// delete blogs
exports.deleteBlogs = catchAsync(async (req, res, next) => {
  const { _id } = req.query;
  const deleteBlog = await contentModel.deleteOne({ _id });
  if (!deleteBlog.acknowledged || deleteBlog.deletedCount !== 1) {
    return next(new AppError("Unable to delete blog", 500));
  }
  return res
    .status(200)
    .json({ status: true, message: "Blog has been deleted." });
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
  const { status, duration } = req.query;
  const filter = { $and: [{ type: "blog" }] };
  if (status !== "all") {
    filter["$and"].push({ isActive: status === "true" ? true : false });
  }
  const { status: isValidDuration, firstDay, lastDay } = generateDate(duration);
  if (!isValidDuration) {
    return next(new AppError("Invalid Duration", 500));
  }
  filter["$and"].push(
    ...[{ createdAt: { $gte: firstDay } }, { createdAt: { $lt: lastDay } }]
  );
  const [data, total] = await Promise.all([
    contentModel.find(filter).populate("author", "name email image"),
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

// get videos
exports.getVideos = getData(videoModel);

// create user
exports.createNewUser = catchAsync(async (req, res, next) => {
  const { email, password, name } = req.body;
  const user = await firebase.auth().createUser({
    email: email,
    password,
    displayName: name,
  });
  if (!user) {
    return next(new AppError("Unable to create user", 500));
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
    firebaseSignInProvider: user.providerData,
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
  const users = await userModel.find({});
  const posts = await Promise.all(
    users.map(
      async (user) =>
        await contentModel.find({ type: "blog", author: user._id })
    ).length
  );
  users.forEach((user, idx) => {
    users[idx] = { ...user._doc, totalPosts: posts[idx] };
  });
  return res.status(200).json({ status: true, message: "", allUsers: users });
});

// get single user
exports.getSingleUser = catchAsync(async (req, res, next) => {
  const { _id, duration, query } = req.query;
  const { status, firstDay, lastDay } = generateDate(duration);
  if (!status) {
    return next(new AppError("Invalid duration", 500));
  }
  const filter = {
    type: "blog",
    author: _id,
    createdAt: { $gte: firstDay, $lt: lastDay },
  };
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
exports.disableUser = disableFunction(userModel);

// change order
exports.changeOrder = changeOrder(topContentModel);

// save as top content
exports.saveTopContent = setTop(topContentModel);

// logout
exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie("token");
});
