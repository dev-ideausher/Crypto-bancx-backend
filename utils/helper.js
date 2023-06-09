//for making regex search query
const jwt = require("jsonwebtoken");
const { JWT_SECRETE_KEY, JWT_EXPIRY_TIME, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY} = require("../config/config");
const topContentModel = require("../models/topContentModel");

const contentModel = require("../models/contentModel");
const testimonialModel = require("../models/testimonials");
const videoModel = require("../models/videoModel");

const AppError = require("./appError");
const catchAsync = require("./catchAsync");
const redisClient = require("../config/redis");



const searchQuery = (query, fieldName) => {
  let QStringList = query.split(" ").map((s) => {
    var o = {};
    o[fieldName] = {
      $regex: s,
      $options: "i",
    };
    return o;
  });

  return QStringList;
};

const generateJWTToken = (userId) => {
  const token = jwt.sign({ userId: userId }, JWT_SECRETE_KEY, {
    expiresIn: JWT_EXPIRY_TIME,
  });

  const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
  const expirationInMilliseconds = parseInt(REFRESH_TOKEN_EXPIRY) * millisecondsPerDay;

  return {
    token,
    expirationInMilliseconds
  };
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  const refreshToken = jwt.sign({ userId: userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
  const expirationInMilliseconds = parseInt(REFRESH_TOKEN_EXPIRY) * millisecondsPerDay;

  return {
    refreshToken,
    expirationInMilliseconds
  };
};



const disableOnEnableFunction = (model, modelType) => {
  return catchAsync(async (req, res, next) => {
    const { _id } = req.body;

    const data = await model.findById(_id)
    if (!data) {
      return next(new AppError("Something went wrong.", 500));
    }

    let done 
    if(data.isActive==true){
      const data = await model.findByIdAndUpdate(_id,{isActive:false},{new:true})
      done = "disabled"
    }else{
      const data = await model.findByIdAndUpdate(_id,{isActive:true},{new:true})
      done = "enabled"
    }
    console.log("modelType",modelType)
    switch (modelType) {
      case 'content':
        if(done == 'disabled'){
          let topContent = await topContentModel.findOne({contentId:_id})
          if(topContent){
            req.query._id = topContent._id;
            req.query.type = data.type
            await new Promise((resolve, reject) => {
              permanentDeleteTopContent(topContentModel)(req, res, (error) => {
                if (error) {
                  console.log(error);
                  reject(error);
                } else {
                  resolve();
                }
              });
            });
          }
        }


        const options = {
          TYPE: 'string', // `SCAN` only
          MATCH: 'latest?*',
          COUNT: 100
        };
  
        const scanIterator = await redisClient.scanIterator(options);
        let keysToDelete = [];
  
        (async () => {
          for await (const key of scanIterator) {
            keysToDelete.push(key);
          }
        
          console.log('Keys to delete:', keysToDelete);

          if(keysToDelete.length){
            const deletedCount = await redisClient.del(keysToDelete);
            console.log(`Deleted ${deletedCount} keys.`);
          }

          let contentKey = ['top-content/blog','top-content/news'];
        
          const deletedContent = await redisClient.del(contentKey);
          console.log(`Deleted cont ${deletedContent} keys.`);
        })();

        break;
      case 'video':
        // if(done == 'disabled'){
        //   let topContent = await topContentModel.findOne({contentId:_id})
        //   if(topContent){
        //     req.query._id = topContent._id;
        //     req.query.type = 'video'
        //     await new Promise((resolve, reject) => {
        //       permanentDeleteTopContent(topContentModel)(req, res, (error) => {
        //         if (error) {
        //           console.log(error);
        //           reject(error);
        //         } else {
        //           resolve();
        //         }
        //       });
        //     });
        //   }
        // }

        (async () => {
          let keysToDelete = 'top-content/video';
        
          const deletedCount = await redisClient.del(keysToDelete);
          console.log(`Deleted ${deletedCount} keys.`);
        })();

        break;
      case 'testimonial':
        // if(done == 'disabled'){
        //   let topContent = await topContentModel.findOne({contentId:_id})
        //   if(topContent){
        //     req.query._id = topContent._id;
        //     req.query.type = 'testimonial'
        //     await new Promise((resolve, reject) => {
        //       permanentDeleteTopContent(topContentModel)(req, res, (error) => {
        //         if (error) {
        //           console.log(error);
        //           reject(error);
        //         } else {
        //           resolve();
        //         }
        //       });
        //     });
        //   }
        // }
        (async () => {
          let keysToDelete = 'top-content/testimonial';
        
          const deletedCount = await redisClient.del(keysToDelete);
          console.log(`Deleted ${deletedCount} keys.`);
        })();

        break;
      default:
        break;
    }
    

    return res
      .status(200)
      .json({ status: true, message: `Successfully ${done}.` });
  });
};

const isDate = (str) => {
  // Attempt to create a Date object from the string
  const date = new Date(str);

  // Check if the Date object is valid
  return !isNaN(date.getTime());
};

const searchNewsOrVideos = (model) => {
  return catchAsync(async (req, res, next) => {
    const { query, type, userId, status, duration, _id } = req.query;
    if (_id) {
      const blog = await model.findOne({ _id }).populate("tags").populate("author", "name email image");
      if (!blog) {
        return next(new AppError("Invalid content", 500));
      }
      return res.status(200).json({ status: true, blog: blog });
    }
    const {
      status: isValidDuration,
      firstDay,
      lastDay,
    } = generateDate(duration);
    if (!isValidDuration) {
      return next(new AppError("Invalid Duration", 500));
    }
    let filter = {};
    if (userId) {
      filter.author = userId;
    }
    if (!type) {
      filter.type = "news";
    } else {
      filter.type = type;
    }
    if (status && status !== "all") {
      filter.isActive = status === "true" ? true : false;
    }
    filter.createdAt = {
      $gte: firstDay,
      $lt: lastDay,
    };

    // uncomment if u need search part
    // if (isDate(query)) {
    //   let date = new Date(query);
    //   filter["$or"] = [{ createdAt: date }];
    // } else {
    //   filter["$or"] = [
    //     { title: { $regex: query, $options: "i" } },
    //     // { description: { $regex: query, $options: "i" } },
    //   ];
    // }
    const searchResult = await model
      .find(filter)
      .populate("author", "name email image")
      .populate("tags")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ status: 200, message: "", searchResult: searchResult });
  });
};

const generateDate = (duration) => {
  var curr = new Date();
  var last = curr.getDate();
  if (duration == "day") {
    var first = last - 1;
    var firstDay = new Date(new Date().setDate(first));
    var lastDay = new Date(new Date().setDate(last));
  } else if (duration == "week" || duration === "wholeWeek") {
    var first = last - 6;
    var firstDay = new Date(new Date().setDate(first));
    var lastDay = new Date(new Date().setDate(last));
  } else if (duration == "month" || duration == "months") {
    var first = last - 30;
    var firstDay = new Date(new Date().setDate(first));
    var lastDay = new Date(new Date().setDate(last));
  } else if (duration === "year") {
    let curr = new Date();
    var firstDay = new Date(curr.getFullYear(), 01, 01);
    var lastDay = new Date(curr.getFullYear(), 12, 31);
  } else {
    return { status: false };
  }
  return { firstDay, lastDay, status: true };
};

const getData = (
  model,
  populateFieldKey = "author",
  populateFieldValue = "name email image",
  userType
) => {
  return catchAsync(async (req, res, next) => {
    const { type, status, duration, _id } = req.query;
    if (_id) {
      const singleData = await model.findById(_id);
      if (!singleData) {
        return next(new AppError("Invalid Id", 403));
      }
      return res
        .status(200)
        .json({ status: true, message: "", data: singleData });
    }
    const { status: isSuccess, firstDay, lastDay } = generateDate(duration);
    if (!isSuccess) {
      return next(new AppError("Invalid duration", 500));
    }
    let filter = {
      $and: [
        { createdAt: { $gte: firstDay } },
        { createdAt: { $lt: lastDay } },
      ],
    };
    if (type) {
      filter.type = type;
    }
    if (status && status !== "all") {
      filter.isActive = status;
    }
    if (userType === "User") {
      filter.onModel = "User";
      if (status && status !== "all") {
        filter.isApproved = status;
      }
    }

    const data = await model
      .find(filter)
      .populate(populateFieldKey, populateFieldValue);
    return res.status(200).json({ status: true, data: data });
  });
};

// // change order
// const changeOrder = () => {
//   return catchAsync(async (req, res, next) => {
//     const { _id, type, changeType } = req.body;
//     const current = await topContentModel.findById(_id);
//     if (!current) {
//       return next(new AppError("Invalid data", 500));
//     }
//     if (current.priority <= 1) {
//       return next(new AppError("Can not reduce priority any more", 500));
//     }
//     const previous = await topContentModel.findOne({
//       priority: current.priority - 1,
//       type,
//     });

//     const updatedData = await Promise.all([
//       topContentModel.findOneAndUpdate(
//         { _id: current._id },
//         { $set: { priority: current.priority - 1 } }
//       ),
//       topContentModel.findOneAndUpdate(
//         { _id: previous._id },
//         { $set: { priority: previous.priority + 1 } }
//       ),
//     ]);
//     if (updatedData.length < 2) {
//       return next(new AppError("something went wrong", 500));
//     }
//     return res
//       .status(200)
//       .json({ status: true, message: "Priority has been updated" });
//   });
// };

const changeOrder = () => {
  return catchAsync(async (req, res, next) => {
    const { _id, type, changeType } = req.body;
    const current = await topContentModel.findById(_id);
    const allTopContent = await topContentModel.find({type:type}).count();
    if (!current) {
      return next(new AppError("Invalid data", 500));
    }
    console.log("all",allTopContent)
    console.log(current.priority)
    if (changeType === "+1" && current.priority >= allTopContent) {
      return next(new AppError("Can not increase priority any more", 500));
    }
    if (changeType === "-1" && current.priority <= 1) {
      return next(new AppError("Can not reduce priority any more", 500));
    }

    let targetPriority = current.priority;
    if (changeType === "+1") {
      targetPriority++;
    } else if (changeType === "-1") {
      targetPriority--;
    } else {
      return next(new AppError("Invalid change type", 500));
    }

    let updateOps = [];
    if (changeType === "+1") {
      const next = await topContentModel.findOne({
        priority: targetPriority,
        type,
      });
      if (next) {
        updateOps.push(
          topContentModel.findOneAndUpdate(
            { _id: next._id },
            { $set: { priority: current.priority } }
          )
        );
      }
    } else if (changeType === "-1") {
      const previous = await topContentModel.findOne({
        priority: targetPriority,
        type,
      });
      if (previous) {
        updateOps.push(
          topContentModel.findOneAndUpdate(
            { _id: previous._id },
            { $set: { priority: current.priority } }
          )
        );
      }
    }
    updateOps.push(
      topContentModel.findOneAndUpdate(
        { _id: current._id },
        { $set: { priority: targetPriority } }
      )
    );

    const updatedData = await Promise.all(updateOps);
    if (updatedData.length < updateOps.length) {
      return next(new AppError("something went wrong", 500));
    }

    //redis data delete
    (async () => {
      let keysToDelete = `top-content/${type}`;
    
      const deletedCount = await redisClient.del(keysToDelete);
      console.log(`Deleted ${deletedCount} keys.`);
    })();

    return res
      .status(200)
      .json({ status: true, message: "Priority has been updated" });
  });
};

// set top blog or news or video
const setTop = () => {
  return catchAsync(async (req, res, next) => {
    const { _id, type } = req.body;
    const current = await topContentModel.findOne({ _id, type });
    if (current) {
      return next(new AppError(" Content Already present", 500));
    }
    const otherDocs = await topContentModel.find({
      _id: { $ne: _id },
      type,
    });
    const update = await Promise.all([
      ...otherDocs.map((doc) =>
        topContentModel.findOneAndUpdate(
          { _id: doc._id },
          { $set: { priority: doc.priority + 1 } },
          { new: true }
        )
      ),
      topContentModel.findOneAndUpdate(
        { _id: current._id },
        { $set: { priority: 1 } },
        { new: true }
      ),
    ]);
    if (update.length < (await topContentModel.find()).length) {
      return next(new AppError("Something went wrong", 500));
    }
    return res
      .status(200)
      .json({ status: true, message: "Priority has been updated." });
  });
};

// delete
const permanentDeleteTopContent = (model) => {
  return catchAsync(async (req, res, next) => {
    const { _id, type } = req.query;
    console.log("top req query _id",_id)
    console.log("top req query type",type)
    const current = await model.findById(_id);
    if (!current) {
      return next(new AppError("Invalid data", 500));
    }
    // const isDeleted = await model.deleteOne({ _id: current._id });
    // if (!isDeleted.acknowledged || isDeleted.deletedCount !== 1) {
    //   return next(new AppError("Unable to Delete", 500));
    // }
    const otherDocs = await model.find({
      priority: { $gt: current.priority },
      type,
    });
    const data = await Promise.all([
      model.deleteOne({ _id: current._id }),
      ...otherDocs.map((doc) => {
        return model.findOneAndUpdate(
          { _id: doc._id },
          { $set: { priority: doc.priority - 1 } },
          { new: true }
        );
      }),
    ]);

    return res
      .status(200)
      .json({ status: true, message: "Successfully Delete. ", data: data });
  });
};

// add to top content
const addToTopContent = (model) => {
  return catchAsync(async (req, res, next) => {

    const { type, contentId } = req.body;

    // "blog", "news", "video", "testimonial"

    //contentId validation

    let content;
    switch (type) {
      case 'blog':
        content = await contentModel.findById(contentId);
        break;
      case 'news':
        content = await contentModel.findById(contentId);
        break;
      case 'video':
        content = await contentModel.findById(contentId);
        break;
      case 'testimonial':
        content = await contentModel.findById(contentId);
        break;
      default:
        return next(new AppError('Error: Invalid content type.', 400));
    }
    if (!content) {
      return next(new AppError('Error: Invalid content Id.', 400));
    }else if(content.isActive != true){
      return next(new AppError(`Error: Can't make inActive ${type} as top post`, 400));
    }else{
      let topContent = await model.findOne({contentId:contentId})
      if(topContent){
        return next(new AppError(`Error: top post already added`, 400));
      }
    }

  
    let [leastPriority] = await model
      .find({ type })
      .sort({ priority: -1 })
      .limit(1);


    if (!leastPriority) {
      leastPriority = { priority: 0 };
    }

    const addContent = await model.create({
      contentId,
      type,
      priority: leastPriority.priority + 1,
    });
    if (!addContent) {
      return next(new AppError("Unable to save data", 500));
    }

    (async () => {
      let keysToDelete = `top-content/${type}`;
    
      const deletedCount = await redisClient.del(keysToDelete);
      console.log(`Deleted ${deletedCount} keys.`);
    })();

    return res.status(200).json({ status: true, message: "data saved" });
  });
};

// decrease order
const decreaseContentOrder = (model) => {
  return catchAsync(async (req, res, next) => {
    const { _id, type } = req.body;
    const current = await topContentModel.findOne({ _id, type });
    if (!current) {
      return next(new AppError("Invalid data", 500));
    }
    const nextEle = await topContentModel.findOne({
      priority: current.priority + 1,
      type,
    });
    if (!nextEle) {
      return next(new AppError("last element, can not go more deep", 500));
    }

    const updatedData = await Promise.all([
      topContentModel.findOneAndUpdate(
        { _id: current._id },
        { $set: { priority: nextEle.priority } },
        { new: true }
      ),
      topContentModel.findOneAndUpdate(
        { _id: nextEle._id },
        { $set: { priority: current.priority } },
        { new: true }
      ),
    ]);
    if (updatedData.length < 2) {
      return next(new AppError("something went wrong", 500));
    }
    return res
      .status(200)
      .json({ status: true, message: "Priority has been updated" });
  });
};

module.exports = {
  searchQuery,
  generateJWTToken,
  generateRefreshToken,
  disableOnEnableFunction,
  isDate,
  searchNewsOrVideos,
  getData,
  generateDate,
  changeOrder,
  setTop,
  permanentDeleteTopContent,
  addToTopContent,
  decreaseContentOrder,
};
