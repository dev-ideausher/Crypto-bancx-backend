const contentModel = require("../models/contentModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");
const viewsModel = require("../models/viewsModel");
const tagModel = require("../models/tagModel");
const favoriteModel = require("../models/favoriteModel");
const redis = require("redis");
const redisClient = require("../config/redis");

const EXPIRY_TIME = 3600;
// add content
exports.addContent = catchAsync(async (req, res, next) => {
  const { title, description, content, type, tags } = req.body;

  const newContent = await contentModel.create({
    title,
    description,
    content,
    author: req.user._id,
    type,
    tags,
  });
  if (!newContent) return next(new AppError("Couldn't create content", 500));
  return res.status(200).json({
    status: true,
    message: "Content has been created",
    content: newContent,
  });
});

// update content
exports.updateContent = catchAsync(async (req, res, next) => {
  const { title, description, content, contentId, author, type, tags } =
    req.body;
  const findContent = await contentModel.findById(contentId);
  if (!findContent) return next(new AppError("Invalid content", 403));
  const updatedContent = await contentModel.findOneAndUpdate(
    { _id: contentId },
    {
      $set: {
        title,
        description,
        content,
        author,
        type,
        tags,
      },
    },
    { new: true }
  );
  if (!updatedContent)
    return next(new AppError("Couldn't update content.", 500));
  return res.status(200).json({
    status: true,
    content: updatedContent,
    message: "content has been updated",
  });
});

// delete content
exports.deleteContent = catchAsync(async (req, res, next) => {
  const { contentId } = req.query;
  const findContent = await contentModel.findById(contentId);
  if (!findContent) return next(new AppError("Invalid content", 403));
  const updatedContent = await contentModel.findOneAndUpdate(
    { _id: contentId },
    {
      $set: {
        isDeleted: true,
      },
    },
    { new: true }
  );
  if (!updatedContent)
    return next(new AppError("Couldn't delete content.", 500));
  return res.status(200).json({
    status: true,
    content: updatedContent,
    message: "content has been deleted",
  });
});

// add views
exports.addViews = catchAsync(async (req, res, next) => {
  const { type, itemId, userId } = req.body;
  const content = await contentModel.findById(itemId);

  if (!content) return next(new AppError("Invalid item id ", 403));
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    await viewsModel.create({
      type,
      itemId,
      userId: req?.user?._id || userId,
    });
    await contentModel
      .findOneAndUpdate(
        { _id: itemId },
        {
          $set: { ViewCount: content.ViewCount + 1 },
        }
      )
      .session(session);
  });

  return res
    .status(200)
    .json({ status: true, message: `View added to ${type}` });
});

// add to favorite
exports.addFavorite = catchAsync(async (req, res, next) => {
  const { type, contentId } = req.body;
  const isFavorite = await favoriteModel.findOne({
    contentId,
    userId: req.user._id,
  });
  if (isFavorite) {
    const removeFavorite = await favoriteModel.deleteOne({
      contentId,
      userId: req.user._id,
    });
    if (removeFavorite.acknowledged && removeFavorite.deletedCount === 1)
      return res.status(200).json({
        status: true,
        message: "Content Removed from favorite",
        rem: removeFavorite,
      });
  }

  // check if contentId is valid
  if (type === "blog") {
    const findBlog = await contentModel.findOne({ type, _id: contentId });
    if (!findBlog) return next(new AppError("Invalid blog id", 404));
  } else {
    const findNews = await contentModel.findOne({ type, _id: contentId });
    if (!findNews) return next(new AppError("Invalid news id", 404));
  }

  // add content ot favorite
  const addToFavorite = await favoriteModel.create({
    contentId,
    type,
    userId: req.user._id,
  });
  if (!addToFavorite)
    return next(new AppError(`Unable to add ${type} to favorite`, 500));
  return res.status(200).json({
    status: true,
    message: ` ${type} Added to favorite`,
    fav: addToFavorite,
  });
});

// add tags
exports.addTag = catchAsync(async (req, res, next) => {
  const { tag } = req.body;
  const newTag = await tagModel.create({ name: tag });
  return res
    .status(200)
    .json({ status: true, message: "New tag added", tag: newTag });
});

// get latest news
exports.latestContent = catchAsync(async (req, res, next) => {

  const { page, type, pageSize, contentId } = req.query;
  if (contentId) {
    const dataExists = await redisClient.get(`latest?contentId=${contentId}`);
    if (dataExists) {
      return res.status(200).json({
        status: true,
        message: "Data found",
        content: JSON.parse(dataExists),
      });
    }
    const content = await contentModel.findById(contentId);
    if (!content) return next(new AppError("Content not found", 404));
    await redisClient.SETEX(
      `latest?contentId=${contentId}`,
      EXPIRY_TIME,
      JSON.stringify(content?._doc)
    );
    await redisClient.quit();

    return res
      .status(200)
      .json({ status: true, message: "Content found", content: content });
  }
  if (page < 0 || pageSize <= 0)
    return next(new AppError("Invalid page number or page size", 403));

  const dataExists = await redisClient.get(
    `latest?page=${page}&pageSize=${pageSize}`
  );
  if (dataExists) {
    return res.status(200).json({
      status: true,
      message: "Data found",
      content: JSON.parse(dataExists),
    });
  }
  const content = await contentModel
    .find({ type })
    .sort({ createdAt: -1 })
    .skip(pageSize * (page - 1))
    .limit(pageSize);

  await redisClient.SETEX(
    `latest?page=${page}&pageSize=${pageSize}`,
    EXPIRY_TIME,
    JSON.stringify(content)
  );
  await redisClient.quit();
  return res
    .status(200)
    .json({ status: true, message: "Content", content: content });
});

// search
exports.search = catchAsync(async (req, res, next) => {
  const { query, type } = req.query;
  const resultExists = await redisClient.get(
    `search?query=${query}&type=${type}`
  );
  if (resultExists) {
    await redisClient.quit();
    return res.status(200).json({
      status: true,
      message: "Result found",
      searchResult: JSON.parse(resultExists),
    });
  }
  const searchResult = await contentModel.find({
    type,
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  });
  await redisClient.SETEX(
    `search?query=${query}&type=${type}`,
    EXPIRY_TIME,
    JSON.stringify(searchResult)
  );
  await redisClient.quit();
  return res
    .status(200)
    .json({ status: 200, message: "", searchResult: searchResult });
});

// trending content
exports.trending = catchAsync(async (req, res, next) => {
  const { type, pageNo, pageSize } = req.query;
  const resultExists = await redisClient.get(
    `trending?pageNo=${pageNo}&type=${type}&pageSize=${pageSize}`
  );
  if (resultExists) {
    await redisClient.quit();
    return res.status(200).json({
      status: true,
      message: "Result found",
      result: JSON.parse(resultExists),
    });
  }
  const PAGE_SIZE = pageSize || 5;
  const all = await viewsModel
    .find({ type })
    .sort({ createdAt: -1 })
    .skip((pageNo - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate({
      path: "itemId",
      populate: {
        path: "author",
        select: "name image email",
      },
    });

  all.forEach((doc, idx) => {
    all[idx] = { ...doc.itemId._doc };
    all[idx].onModel = null;
  });

  await redisClient.SETEX(
    `trending?pageNo=${pageNo}&type=${type}&pageSize=${pageSize}`,
    EXPIRY_TIME,
    JSON.stringify(all)
  );
  await redisClient.quit();
  return res
    .status(200)
    .json({ status: true, message: `Trending ${type} found`, result: all });
});
