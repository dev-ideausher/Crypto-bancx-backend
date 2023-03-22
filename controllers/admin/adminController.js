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
} = require("../../utils/helper");
const aboutUsModel = require("../../models/aboutUs");
const employeeModel = require("../../models/employeeModel");
const commentModel = require("../../models/commentModel");
const contentModel = require("../../models/contentModel");
const userModel = require("../../models/userModel");
const videoModel = require("../../models/videoModel");

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

exports.searchBlogs = catchAsync(async (req, res, next) => {
  const { query, type } = req.query;
  const data = await contentModel.aggregate([
    { $match: { type } },
    {
      $lookup: {
        from: "User",
        localField: "author",
        foreignField: "_id",
        as: "authors",
      },
    },
    {
      $lookup: {
        from: "Admin",
        localField: "author",
        foreignField: "_id",
        as: "admins",
      },
    },
    { $unwind: { path: "$authors", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$admins", preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { "authors.name": { $regex: query, $options: "i" } },
          { "authors.email": { $regex: query, $options: "i" } },
          { "admins.name": { $regex: query, $options: "i" } },
          { "admins.email": { $regex: query, $options: "i" } },
        ],
      },
    },
    {
      $group: {
        _id: null,
        data: { $push: "$$ROOT" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        data: 1,
        count: 1,
      },
    },
  ]);

  const result = data.length ? data[0] : { data: [], count: 0 };
  res.status(200).json({
    status: "success",
    data: result.data,
    count: result.count,
  });
});

// get all blogs or news
exports.getNewsOrBlogs = getData(contentModel);

// get videos
exports.getVideos = getData(videoModel);
