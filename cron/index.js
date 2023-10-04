const adminModel = require("../models/adminModel");
const contentModel = require("../models/contentModel");
const { get_news, get_crypto_news } = require("../utils/newsApi");
const redisClient = require("../config/redis");
const cron = require('node-cron');
const catchAsync = require("../utils/catchAsync");
const { ADMIN_EMAIL } = require("../config/config");
const tagModel = require("../models/tagModel");

console.log("test1");

const task = cron.schedule('0 */12 * * *', catchAsync(async() => {
  await getNews();
}));
const getNews = async()=>{

    const getNews = await get_crypto_news();

    console.log(getNews)

    const user = await adminModel.findOne({email:ADMIN_EMAIL});

    const updateNews = getNews.map(async element => {
      const {
        title,
        text,
        news_url,
        topics,
        image_url
      } = element;



      let tags = [];
      // console.log("topics",topics);
      if(Array.isArray(topics) && topics.length > 0){
        let get_topics = topics.map(async topic => {  
          let tag  = await tagModel.findOne({name:topic});
          if(!tag){
            tag = new tagModel;
            tag.name = topic;
            await tag.save();
          }
          if(tag){
            tags.push(tag._id);
          }
        });

        const get_topic = await Promise.all(get_topics)
      }

      const findContent = await contentModel.findOne({title:title});
      let updatedContent;
    if (!findContent) {
      updatedContent = await contentModel.create(
          {
            title,
            description:text,
            url:news_url,
            thumbnail:image_url,
            author: user._id,
            newsType:'api',
            type:"news",
            tags:tags,
            isApproved:true,
            isActive:true,
            content:"null"
          }
        );
    }else{
      updatedContent = await contentModel.findOneAndUpdate(
        { _id: findContent._id },
        {
          $set: {
            title,
            description:text,
            url:news_url,
            thumbnail:image_url,
            tags:tags,
          },
        },
        { new: true }
      );
    }
    if (!updatedContent){
      return next(new AppError("Couldn't update content.", 500));
    }

    const options = {
      TYPE: 'string', // `SCAN` only
      MATCH: `latest?type=${updatedContent.type}*`,
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

      let contentKey = `top-content/${updatedContent.type}`;
    
      const deletedContent = await redisClient.del(contentKey);
      console.log(`Deleted ${deletedContent} keys.`);
    });

  });
  const update = await Promise.all(updateNews);
  console.log(`all news are updated ${new Date()}`)
  return  "all news are updated" ;
}
const getNews1 = async()=>{
    console.log("test");
    const getNews = await get_news();
    console.log("getNews");

    const user = await adminModel.findOne({email:ADMIN_EMAIL});
    console.log("get user");

    const updateNews = await getNews.map(async element => {
      const {
        title,
        description,
        url,
        thumbnail
      } = element;

      let newDescription = description.replace( /(<([^>]+)>)/ig, '');
      newDescription = newDescription.replace("Continue reading...","");

      const findContent = await contentModel.findOne({title:title});
      let updatedContent;

    if (!findContent) {
      updatedContent = await contentModel.create(
          {
            title,
            description:newDescription,
            url,
            thumbnail,
            author: user._id,
            newsType:'api',
            type:"news",
            isApproved:true,
            isActive:true,
            content:"null"
          }
        );
    }else{
      // console.log(findContent.title);

      updatedContent = await contentModel.findOneAndUpdate(
        { _id: findContent._id },
        {
          $set: {
            title,
            description:newDescription,
            url,
            thumbnail
          },
        },
        { new: true }
      );
    }
    if (!updatedContent){
      return next(new AppError("Couldn't update content.", 500));
    }

    const options = {
      TYPE: 'string', // `SCAN` only
      MATCH: `latest?type=${updatedContent.type}*`,
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

      let contentKey = `top-content/${updatedContent.type}`;
    
      const deletedContent = await redisClient.del(contentKey);
      console.log(`Deleted ${deletedContent} keys.`);
    });

  });
  const update = await Promise.all(updateNews);
  console.log(`all news are updated ${new Date()}`)
  return  "all news are updated" ;
}

task.start();