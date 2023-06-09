const testimonialModel = require("../../models/testimonials");
const topContentModel = require("../../models/topContentModel");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const { disableOnEnableFunction, generateDate } = require("../../utils/helper");
const redisClient = require("../../config/redis");

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

  // delete from redis
  (async () => {
    let keysToDelete = 'top-content/testimonial';
      
    const deletedCount = await redisClient.del(keysToDelete);
    console.log(`Deleted ${deletedCount} keys.`);
  })();

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

  if (!updateTestimonial){
    return next(new AppError("Something went wrong", 500));
  }

  // delete from redis
  (async () => {
    let keysToDelete = 'top-content/testimonial';
        
    const deletedCount = await redisClient.del(keysToDelete);
    console.log(`Deleted ${deletedCount} keys.`);
  })();

  return res.status(200).json({
    status: true,
    message: "Testimonial updated",
    testimonial: updateTestimonial,
  });
});

exports.deleteTestimonials = catchAsync(async (req, res, next) => {
  const { _id } = req.query;

  // Get the priority of the document that is being deleted
  const deletedTestimonialtop = await topContentModel.findOne({contentId: _id,type:"testimonial"});
  if(!deletedTestimonialtop){
    return next(new AppError("invalid _id", 500));
  }
  const deletedTestimonial = await testimonialModel.findById(_id)
  if(!deletedTestimonial){
    return next(new AppError("invalid _id", 500));
  };
  const deletedPriority = deletedTestimonialtop.priority;

  // Delete the testimonial
  const deleteTestimonial = await testimonialModel.deleteOne({ _id: _id });

  if (!deleteTestimonial.acknowledged || deleteTestimonial.deletedCount !== 1){
      return next(new AppError("Something went wrong", 500));
  }

  // Update the priorities of the remaining documents
  const updatePromises = [];

  // Decrease the values
  updatePromises.push(
    topContentModel.updateMany(
      { type:"testimonial",priority: { $gt: deletedPriority } },
      { $inc: { priority: -1 } }
    )
  );

  await Promise.all(updatePromises);

  // Delete the document from topContentModel
  const deleteFromTopModel = await topContentModel.deleteOne({
    contentId: _id,
  });

  // delete from redis
  (async () => {
      let keysToDelete = 'top-content/testimonial';
          
      const deletedCount = await redisClient.del(keysToDelete);
      console.log(`Deleted ${deletedCount} keys.`);
  })();

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
    const test = await topContentModel
      .findOne({ type: "testimonial", contentId: _id })
      .populate("contentId");
    if (!test) {
      return next(new AppError("Invalid id", 500));
    }
    return res.status(200).json({ status: true, data: test });
  }
  const { status: isSuccess, firstDay, lastDay } = generateDate(duration);
  if (!isSuccess) {
    return next(new AppError("Invalid duration", 500));
  }
  // let filter = {
  //   $and: [
  //     { createdAt: { $gte: firstDay , $lt: lastDay } },
  //     { type: "testimonial" },
  //   ],
  // };

  let filter = {
    createdAt: { $gte: firstDay , $lt: lastDay },
    type: "testimonial"
  };
  // console.log("status",typeof status)


  const testimonials = await topContentModel.find(filter).populate("contentId").sort({ priority: -1 });

  let filteredTestimonials

  if(status == "all"){
    console.log("status",status);
    filteredTestimonials = testimonials
  }else if(status == "true"){
    filter.isActive = true
    filteredTestimonials = testimonials.filter(testimonial=>{
      return(testimonial.contentId.isActive ==filter.isActive)
    })
  }else if(status == "false"){
    filter.isActive = false
    filteredTestimonials = testimonials.filter(testimonial=>{
      return(testimonial.contentId.isActive ==filter.isActive)
    })
  }
  // if (status !== "all") {
  //   if(status == "true"){
  //     filter.isActive = true
  //   }else if(status == "false"){
  //     filter.isActive = false
  //   }
  //   filteredTestimonials = testimonials.filter(testimonial=>{
  //     return(testimonial.contentId.isActive ==filter.isActive)
  //   })
  // }else if(status == "all"){
  //   filteredTestimonials = testimonials
  // }


  return res.status(200).json({
    status: true,
    result: filteredTestimonials.length,
    message: "Testimonials found.",
    allTestimonials: filteredTestimonials,
  });
});

// disable testimonials
exports.disableTestimonials = disableOnEnableFunction(testimonialModel,"testimonial");
