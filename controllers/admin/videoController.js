const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const {
  disableOnEnableFunction,
  generateDate,
} = require("../../utils/helper");

const videoModel = require("../../models/videoModel");

const topContentModel = require("../../models/topContentModel");
const redisClient = require("../../config/redis");

const EXPIRY_TIME = 3600;



// add video
exports.addVideo = catchAsync(async (req, res, next) => {
    const newVideo = await videoModel.create({ ...req.body, author: req.user._id });
    const type = "video"

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

    // let filter = {
    //     path: "contentId",
    //     populate: {
    //       path: "author",
    //       select: "name image email",
    //     },
    //     options: { strictPopulate: false },
    // };
      
    // const topContent = await topContentModel
    //     .find({ type })
    //     .populate(filter)
    //     .limit(5)
    //     .sort({ priority: -1 });
  
    // // await redisClient.SETEX(
    // //    `top-content/video`,
    // //    EXPIRY_TIME,
    // //    JSON.stringify(topContent)
    // // );


    // delete from redis
    (async () => {
      let keysToDelete = 'top-content/video';
    
      const deletedCount = await redisClient.del(keysToDelete);
      console.log(`Deleted ${deletedCount} keys.`);
    })();



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

    // delete from redis
    (async () => {
      let keysToDelete = 'top-content/video';
    
      const deletedCount = await redisClient.del(keysToDelete);
      console.log(`Deleted ${deletedCount} keys.`);
    })();

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
        createdAt: { $gte: firstDay , $lt: lastDay },
        type: "video" ,
    };
 
    const videos = await topContentModel.find(filter)
    .populate({
        path: 'contentId',
        populate: {
            path: 'author',
            select:['name', 'email', 'image']
            }
        })
    .sort({ priority: -1 })

    let filteredVideos

    if (status && status !== "all") {
      if(status == "true"){
        filter.isActive = true
      }else if(status == "false"){
        filter.isActive = false
      }
      filteredVideos = videos.filter(video=>{
        return(video.contentId.isActive ==filter.isActive)
      })
    }else if(status == "all"){
      filteredVideos = videos
    }
  
    return res.status(200).json({
      status: true,
      result: filteredVideos.length,
      message: "videos found.",
      allVideos: filteredVideos,
    });
  });


exports.changeVideoStatus = disableOnEnableFunction(videoModel,false,true);
  
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