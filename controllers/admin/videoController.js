const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const {
  disableFunction,
  generateDate,
} = require("../../utils/helper");

const videoModel = require("../../models/videoModel");

const topContentModel = require("../../models/topContentModel");



// add video
exports.addVideo = catchAsync(async (req, res, next) => {
    const newVideo = await videoModel.create({ ...req.body, author: req.user._id });
  
    if (!newVideo) {
      return next(new AppError("Something went wrong.", 500));
    }
  
    const existingVideos = (
      await topContentModel.find({ type: "video" })
    ).length;

    const saveToTopContentModel = await topContentModel.create({
      type: "video",
      contentId: newVideo._id,
      priority: existingVideos + 1,
    });

    if (!saveToTopContentModel) {
      return next("Unable to save to top model", 500);
    }
  
    return res.status(200).json({
      status: true,
      message: "video added",
      video: newVideo,
    });
  
    //return res
    //   .status(200)
    //   .json({ status: true, message: "Video has been added", video: video });
  });

  // edit video
exports.editVideo = catchAsync(async (req, res, next) => {
    const { _id } = req.body;
  
    const updatedVideo = await videoModel.findOneAndUpdate(
      { _id },
      { $set: req.body },
      { new: true }
    );
    if (!updatedVideo) {
      return next(new AppError("Something went wrong", 500));
    }
    return res.status(200).json({
      status: true,
      message: "Video has been Updated.",
      video: updatedVideo,
    });
  });

  
// get all videos
exports.allVideos = catchAsync(async (req, res, next) => {
   
    const { _id, duration, status } = req.query;
    if (_id) {
      const test = await topContentModel
        .findOne({ type: "video", contentId: _id })
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
    let filter = {
      $and: [
        { createdAt: { $gte: firstDay } },
        { createdAt: { $lt: lastDay } },
        { type: "video" },
      ],
    };
    if (status && status !== "all") {
      filter.isActive = status;
    }
  
    const videos = await topContentModel.find(filter)
    .populate({
        path: 'contentId',
        populate: {
            path: 'author',
            select:['name', 'email', 'image']
            }
        })
    .sort({ priority: -1 })
  
    return res.status(200).json({
      status: true,
      message: "videos found.",
      allVideos: videos,
    });
  });


exports.changeVideoStatus = disableFunction(videoModel);
  
//delete video
exports.deleteVideo = catchAsync(async (req, res, next) => {
    const { _id } = req.query;

    const deletedVideoTop = await topContentModel.findOne({contentId: _id,type:"video"});
    if(!deletedVideoTop){
      return next(new AppError("invalid _id", 500));
    }
    const deletedVideo = await videoModel.findById(_id)
    if(!deletedVideo){
      return next(new AppError("invalid _id", 500));
    };

    // Get the priority of the document that is being deleted
    const deletedPriority = deletedVideoTop.priority;
  
    // Delete the video
    const deleteVideo = await videoModel.deleteOne({ _id: _id });
  
    if (!deleteVideo.acknowledged || deleteVideo.deletedCount !== 1){
        return next(new AppError("Something went wrong", 500));
    }
  
    // Update the priorities of the remaining documents
    const updatePromises = [];
  
    // Decrease the values
    updatePromises.push(
      topContentModel.updateMany(
        { type:"video", priority: { $gt: deletedPriority } },
        { $inc: { priority: -1 } }
      )
    );
  
    await Promise.all(updatePromises);
  
    // Delete the document from topContentModel
    const deleteFromTopModel = await topContentModel.deleteOne({
      contentId: _id,
    });
  
    return res.status(200).json({
      status: true,
      message: "Video deleted",
      video: deleteVideo,
    });
  });