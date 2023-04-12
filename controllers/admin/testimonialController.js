const testimonialModel = require("../../models/testimonials");
const topContentModel = require("../../models/topContentModel");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const { disableFunction, generateDate } = require("../../utils/helper");

exports.addTestimonials = catchAsync(async (req, res, next) => {
  const { name, position, image, testimonial } = req.body;
  const newTestimonial = await testimonialModel.create({
    name,
    position,
    image,
    testimonial,
  });

  if (!newTestimonial) return next(new AppError("Something went wrong", 500));
  const existingTestimonials = (
    await topContentModel.find({ type: "testimonial" })
  ).length;
  const saveToTopContentModel = await topContentModel.create({
    type: "testimonial",
    contentId: newTestimonial._id,
    priority: existingTestimonials + 1,
  });
  if (!saveToTopContentModel) {
    return next("Unable to save to top model", 500);
  }

  return res.status(200).json({
    status: true,
    message: "Testimonial added",
    testimonial: newTestimonial,
  });
});

// update testimonials
exports.updateTestimonials = catchAsync(async (req, res, next) => {
  const { name, position, image, testimonial, _id } = req.body;
  const updateTestimonial = await testimonialModel.findOneAndUpdate(
    { _id: _id },
    {
      name,
      position,
      image,
      testimonial,
    },
    { new: true }
  );

  if (!updateTestimonial)
    return next(new AppError("Something went wrong", 500));
  return res.status(200).json({
    status: true,
    message: "Testimonial updated",
    testimonial: updateTestimonial,
  });
});

// delete testimonial
exports.deleteTestimonials = catchAsync(async (req, res, next) => {
  const { _id } = req.query;
  const deleteTestimonial = await testimonialModel.deleteOne({ _id: _id });

  if (!deleteTestimonial.acknowledged || deleteTestimonial.deletedCount !== 1)
    return next(new AppError("Something went wrong", 500));
  const deleteFromTopModel = await topContentModel.deleteOne({
    contentId: _id,
  });
  return res.status(200).json({
    status: true,
    message: "Testimonial deleted",
    testimonial: deleteTestimonial,
  });
});

// get all testimonials
exports.allTestimonials = catchAsync(async (req, res, next) => {
  const { _id, duration, status } = req.query;
  if (_id) {
    const test = await topContentModel.findById(_id).populate("contentId");
    if (!test) {
      return next(new AppError("Invalid id", 500));
    }
    return res.status(200).json({ status: true, data: test });
  }
  const { status: isSuccess, firstDay, lastDay } = generateDate(duration);
  if (!isSuccess) {
    return next(new AppError("Invalid duration", 500));
  }
  let filter = {
    $and: [
      { createdAt: { $gte: firstDay } },
      { createdAt: { $lt: lastDay } },
      { type: "testimonial" },
    ],
  };
  if (status && status !== "all") {
    filter.isActive = status;
  }

  const testimonials = await topContentModel
    .find(filter)
    .populate("contentId");

  return res.status(200).json({
    status: true,
    message: "Testimonials found.",
    allTestimonials: testimonials,
  });
});

// disable testimonials
exports.disableTestimonials = disableFunction(testimonialModel);
