const homepageSection1Model = require("../../models/homepageSection1");
const reasonsModel = require("../../models/reasonsToChooseBancxModel");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// add reasons
exports.addReasons = catchAsync(async (req, res, next) => {
  const { icon, title, description } = req.body;
  const newReasons = await reasonsModel.create({
    icon,
    title,
    description,
  });

  if (!newReasons) return next(new AppError("Something went wrong", 500));
  return res.status(200).json({
    status: true,
    message: "Reason added",
    testimonial: newReasons,
  });
});

// update reasons
exports.updateReasons = catchAsync(async (req, res, next) => {
  const { icon, title, description, _id } = req.body;
  const updateReason = await reasonsModel.findOneAndUpdate(
    { _id: _id },
    {
      icon,
      title,
      description,
    },
    { new: true }
  );

  if (!updateReason) return next(new AppError("Something went wrong", 500));
  return res.status(200).json({
    status: true,
    message: "Reason updated",
    testimonial: updateReason,
  });
});

// delete reason
exports.deleteReasons = catchAsync(async (req, res, next) => {
  const { _id } = req.query;
  const deleteReason = await reasonsModel.deleteOne({ _id: _id });

  if (!deleteReason.acknowledged || deleteReason.deletedCount !== 1)
    return next(new AppError("Something went wrong", 500));
  return res.status(200).json({
    status: true,
    message: "Reason deleted",
    testimonial: deleteReason,
  });
});

// get all reasons
exports.allReasons = catchAsync(async (req, res, next) => {
  const reasons = await reasonsModel.find({});

  return res.status(200).json({
    status: true,
    message: "Reasons found.",
    allReasons: reasons,
  });
});

// add homepage section 1 part 1
exports.addSectionI = catchAsync(async (req, res, next) => {
  const { header, subHeader, picture, type } = req.body;
  const sectionI = await homepageSection1Model.create({
    header,
    subHeader,
    picture,
    type,
  });

  if (!sectionI) return next(new AppError("Something went wrong", 500));
  return res.status(200).json({
    status: true,
    message: "Section I has added",
    section1: sectionI,
  });
});

// update section
exports.updateSectionI = catchAsync(async (req, res, next) => {
  const { header, subHeader, picture, type, _id } = req.body;
  const sectionI = await homepageSection1Model.findOneAndUpdate(
    { _id: _id },
    {
      header,
      subHeader,
      picture,
      type,
    },
    { new: true }
  );

  if (!sectionI) return next(new AppError("Something went wrong", 500));
  return res.status(200).json({
    status: true,
    message: "Section I has updated",
    sectionIPartI: sectionI,
  });
});
