const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { default: axios } = require("axios");
const { CRYPTO_TRACKER_URL, CRYPTO_CANDLE_URL } = require("../config/config");
const watchListModel = require("../models/watchlistModel");
const CC = require('currency-converter-lt')
const currencyModel = require('../models/currencyModel')

const marketCapModel = require("../models/marketCapModel");


const MAX_MARKET_LIMIT = 250

// crypto tracker with auth
exports.cryptoMarketsApi = catchAsync(async (req, res, next) => {
  const { page, limit , currency} = req.query;

  const orderLImitMax = page * limit
  const orderLImitMin = (page * limit)-limit
  let filter = { order:{ $gt: orderLImitMin , $lte: orderLImitMax } }

  let totalPages = Math.ceil(MAX_MARKET_LIMIT / limit)

  let marketCap = await marketCapModel.find(filter).sort({order:1}).lean();

  const watchListedIds = await watchListModel.find({ userId: req.user._id }).distinct('id');
  const cryptoData = marketCap.map((item) => {
      const isWishListed = watchListedIds.includes(item.marketCapId);
      return {
        ...item,
        isWishListed,
      };
    });

  
    let currencyVal = await currencyModel.findOne({})

    switch (currency) {
      case "INR":
        cryptoData.forEach(async e=>{
          e.data.current_price = e.data.current_price * currencyVal.INR;
          // e.data.price_change_percentage_24h=price_change_percentage_24h;
          e.data.market_cap = e.data.market_cap * currencyVal.INR;
          // e.data.total_supply = e.data.total_supply * currencyVal.INR;
          // e.data.circulating_supply = e.data.circulating_supply * currencyVal.INR;
        })
        
        break;
      case "GBP":      
        cryptoData.forEach(async e=>{
          e.data.current_price = e.data.current_price * currencyVal.GBP;
          // e.data.price_change_percentage_24h=price_change_percentage_24h;
          e.data.market_cap = e.data.market_cap * currencyVal.GBP;
          // e.data.total_supply = e.data.total_supply * currencyVal.GBP;
          // e.data.circulating_supply = e.data.circulating_supply * currencyVal.GBP;
        })
        break;
      case "EUR":
        cryptoData.forEach(async e=>{
            e.data.current_price = e.data.current_price * currencyVal.EUR;
            // e.data.price_change_percentage_24h=price_change_percentage_24h;
            e.data.market_cap = e.data.market_cap * currencyVal.EUR;
            // e.data.total_supply = e.data.total_supply * currencyVal.EUR;
            // e.data.circulating_supply = e.data.circulating_supply * currencyVal.EUR;
        })
  
        break;
      default:
        // Handle other currencies here if needed
        break;
    }

  return res.status(200).json({
        status: true, 
        totalPages: totalPages, 
        cryptoData: cryptoData
  });
})



// crypto tracker with no auth
exports.cryptoMarketsNoAuth = catchAsync(async (req, res, next) => {
  const { page, limit ,currency} = req.query;
  //USD GBP INR EUR

  const orderLImitMax = page * limit
  const orderLImitMin = (page * limit)-limit
  let filter = { order:{ $gt: orderLImitMin , $lte: orderLImitMax } }

  let totalPages = Math.ceil(MAX_MARKET_LIMIT / limit)

  let marketCap = await marketCapModel.find(filter).sort({order:1}).lean();

  let currencyVal = await currencyModel.findOne({})

  switch (currency) {
    // case "USD":

    //   break;
    case "INR":
      marketCap.forEach(async e=>{
        e.data.current_price = e.data.current_price * currencyVal.INR;
        // e.data.price_change_percentage_24h=price_change_percentage_24h;
        e.data.market_cap = e.data.market_cap * currencyVal.INR;
        // e.data.total_supply = e.data.total_supply * currencyVal.INR;
        // e.data.circulating_supply = e.data.circulating_supply * currencyVal.INR;
      })
      
      break;
    case "GBP":      
      marketCap.forEach(async e=>{
        e.data.current_price = e.data.current_price * currencyVal.GBP;
        // e.data.price_change_percentage_24h=price_change_percentage_24h;
        e.data.market_cap = e.data.market_cap * currencyVal.GBP;
        // e.data.total_supply = e.data.total_supply * currencyVal.GBP;
        // e.data.circulating_supply = e.data.circulating_supply * currencyVal.GBP;
      })
      break;
    case "EUR":
      marketCap.forEach(async e=>{
          e.data.current_price = e.data.current_price * currencyVal.EUR;
          // e.data.price_change_percentage_24h=price_change_percentage_24h;
          e.data.market_cap = e.data.market_cap * currencyVal.EUR;
          // e.data.total_supply = e.data.total_supply * currencyVal.EUR;
          // e.data.circulating_supply = e.data.circulating_supply * currencyVal.EUR;
      })

      break;
    default:
      // Handle other currencies here if needed
      break;
  }

  return res.status(200).json({
        status: true, 
        totalPages: totalPages, 
        cryptoData: marketCap
  });
})

//single coin auth and no auth
exports.singleCryptoMarket = catchAsync(async (req, res, next) => {
  let id = req.params.id
  let {currency} = req.query

  let marketCap = await marketCapModel.findOne({marketCapId:id}).lean();
  if (!marketCap.description){

    const response = await axios.get(`${CRYPTO_TRACKER_URL}/coins/${id}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: false,
        developer_data: false,
        sparkline: false,
      },
    });
    const descriptionString = response.data.description.en.replace(/<[^>]+>/g, '');
    console.log(descriptionString);
    let _id = marketCap._id
    marketCap = await marketCapModel.findByIdAndUpdate(_id,{
      description:descriptionString,
      homepageUrl:response.data.links.homepage,
    },{new:true})
  }
  if (req.user){
    if(req.user.userType == "user"){
      const watchListedId = await watchListModel.findOne({id:id, userId: req.user._id })
      if (watchListedId){
        marketCap.isWishListed=true;
      }else{
        marketCap.isWishListed=false;
      }
    } 
  }

    // //similiar coins
    let order = [];
    let originOrder = marketCap.order;
    let limit
    if (originOrder === 2) {
      limit = 3;
    } else if (originOrder === 1) {
      limit = 4;
    } else {
      limit = 2;
    }
    // console.log("limit",limit)
    
    
    for (let i = 0; i < limit; i++) {
      originOrder = originOrder + 1;
      // console.log("i",i,"origin",originOrder);
      order.push(originOrder);
    }
    
    originOrder = marketCap.order;
    
    for (let i = 0; i < limit; i++) {
      // console.log("origin",originOrder);
      originOrder = originOrder - 1;
      // console.log("origin",originOrder);
      if (originOrder > 0) {
        // console.log("i",i,"origin",originOrder);
        order.push(originOrder);
      }
    }

    console.log(order)
    let similarCoins = await marketCapModel.find({order:{$in:order}}).limit(4)

    if(currency){
      let currencyVal = await currencyModel.findOne({})
      switch (currency) {
        // case "USD":
    
        //   break;
        case "INR":
          marketCap.data.current_price = marketCap.data.current_price * currencyVal.INR;
            // e.data.price_change_percentage_24h=price_change_percentage_24h;
          marketCap.data.market_cap = marketCap.data.market_cap * currencyVal.INR;
          marketCap.data.high_24h = marketCap.data.high_24h * currencyVal.INR;
          marketCap.data.low_24h = marketCap.data.low_24h * currencyVal.INR;
          
          break;
        case "GBP":      
          marketCap.data.current_price = marketCap.data.current_price * currencyVal.GBP;
            // e.data.price_change_percentage_24h=price_change_percentage_24h;
          marketCap.data.market_cap = marketCap.data.market_cap * currencyVal.GBP;
          marketCap.data.high_24h = marketCap.data.high_24h * currencyVal.GBP;
          marketCap.data.low_24h = marketCap.data.low_24h * currencyVal.GBP;

          break;
        case "EUR":
          marketCap.data.current_price = marketCap.data.current_price * currencyVal.EUR;
              // e.data.price_change_percentage_24h=price_change_percentage_24h;
          marketCap.data.market_cap = marketCap.data.market_cap * currencyVal.EUR;
          marketCap.data.market_cap = marketCap.data.market_cap * currencyVal.EUR;
          marketCap.data.high_24h = marketCap.data.high_24h * currencyVal.EUR;
 
          break;
        default:
          // Handle other currencies here if needed
          break;
      }
    }

  return res.status(200).json({
    status: true, 
    marketCap: marketCap,
    similarCoins:similarCoins,
  });
})



exports.searchListSuggestion = catchAsync(async (req, res, next) => {
  const { search , currency} = req.query;

  const regexQuery ={
      marketCapId: new RegExp(search, 'i')
  }

  let suggestion = await marketCapModel
    .find(regexQuery)
    .select("marketCapId data.price_change_percentage_24h data.market_cap data.current_price data.image data.symbol data.name")
    .limit(5);
  

  
    if(currency){
      let currencyVal = await currencyModel.findOne({})
      switch (currency) {
        // case "USD":
    
        //   break;
        case "INR":
          suggestion.forEach(async e=>{
            e.data.current_price = e.data.current_price * currencyVal.INR;
            // e.data.price_change_percentage_24h=price_change_percentage_24h;
            e.data.market_cap = e.data.market_cap * currencyVal.INR;
            e.data.high_24h = e.data.high_24h * currencyVal.INR;
            e.data.low_24h = e.data.low_24h * currencyVal.INR;
          })
          break;
        case "GBP":      
          suggestion.forEach(async e=>{
            e.data.current_price = e.data.current_price * currencyVal.GBP;
            // e.data.price_change_percentage_24h=price_change_percentage_24h;
            e.data.market_cap = e.data.market_cap * currencyVal.GBP;
            e.data.high_24h = e.data.high_24h * currencyVal.GBP;
            e.data.low_24h = e.data.low_24h * currencyVal.GBP;
          })
          break;
        case "EUR":
          suggestion.forEach(async e=>{
            e.data.current_price = e.data.current_price * currencyVal.EUR;
              // e.data.price_change_percentage_24h=price_change_percentage_24h;
            e.data.market_cap = e.data.market_cap * currencyVal.EUR;
            e.data.market_cap = e.data.market_cap * currencyVal.EUR;
            e.data.high_24h = e.data.high_24h * currencyVal.EUR;
          })
          break;
        default:
          // Handle other currencies here if needed
          break;
      }
    }



  return res.status(200).json({ status: true, message: "", data: suggestion });
})




exports.graphOhlc = catchAsync(async (req, res, next) => {
    let {id,cryptoId,days,currency} = req.query
    let interval
    // 1/7/14/30/90/180/365/max
    let start
    let end = Math.floor(Date.now() / 1000).toString();
    let cryptoData =[]
    let product_id
    if(id){
      if(currency.toUpperCase() == "INR"){
        id = id.toUpperCase() + "-USD"
      }else{
        id =id.toUpperCase() + "-" + currency.toUpperCase();
      }

      
      product_id = id
    }

    // console.log("product_id",product_id)
    switch(days){
      case "1":
        var oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in one day
        var currentDate = new Date(); // Current date and time
        var previousDate = new Date(currentDate.getTime() - oneDay); // Subtract one day from current date
        start = Math.floor(previousDate.getTime() / 1000).toString(); // Convert to timestamp (in seconds)
        interval = "3600";
        break;
      case "7":
        var sevenDays = 7 * 24 * 60 * 60 * 1000; // Number of milliseconds in seven days
        var currentDate = new Date(); // Current date and time
        var previousDate = new Date(currentDate.getTime() - sevenDays); // Subtract seven days from current date
        start = Math.floor(previousDate.getTime() / 1000).toString(); // Convert to timestamp (in seconds)
        interval = "21600";
        break;
      case "30":
        var oneMonth = 30 * 24 * 60 * 60 * 1000; // Number of milliseconds in thirty days
        var currentDate = new Date(); // Current date and time
        var previousDate = new Date(currentDate.getTime() - oneMonth); // Subtract thirty days from current date
        start = Math.floor(previousDate.getTime() / 1000).toString(); // Convert to timestamp (in seconds)
        interval = "86400";
        break;
      case "90":
        var threeMonth = 90 * 24 * 60 * 60 * 1000; // Number of milliseconds in ninty days
        var currentDate = new Date(); // Current date and time
        var previousDate = new Date(currentDate.getTime() - threeMonth); // Subtract ninty days from current date
        start = Math.floor(previousDate.getTime() / 1000).toString(); // Convert to timestamp (in seconds)
        // interval = "259200";
        interval = "86400";

        break;
      case "180":
        var sixMonth = 180 * 24 * 60 * 60 * 1000; // Number of milliseconds in 6 month
        var currentDate = new Date(); // Current date and time
        var previousDate = new Date(currentDate.getTime() - sixMonth); // Subtract 6 month from current date
        start = Math.floor(previousDate.getTime() / 1000).toString(); // Convert to timestamp (in seconds)
        // interval = "518400";
        interval = "86400";
        break;
      case "365":
        var oneYear = 365 * 24 * 60 * 60 * 1000; // Number of milliseconds in 1 year
        var currentDate = new Date(); // Current date and time
        var previousDate = new Date(currentDate.getTime() - oneYear); // Subtract 1 year from current date
        start = Math.floor(previousDate.getTime() / 1000).toString(); // Convert to timestamp (in seconds)
        // interval = "1296000";
        interval = "86400";
        break;
      default:
        var currentDate = new Date(); // Current date and time
        var previousDate = new Date(currentDate.getTime() - oneDay); // Subtract one day from current date
        start = Math.floor(previousDate.getTime() / 1000).toString(); // Convert to timestamp (in seconds)
        interval = "3600"
        break;
    }

    console.log(start)
    console.log(end)

    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    let firstData
    let lastData
    let change

    if(days == '365'){
      let ohlc = await axios.get(
        `${CRYPTO_TRACKER_URL}/coins/${cryptoId}/ohlc?vs_currency=${currency}&days=${days}`
      )
      cryptoData = ohlc.data

      for (const data of cryptoData) {
        const [time, open, highValue, lowValue, close] = data;

        highestHigh = Math.max(highestHigh, highValue);
        lowestLow = Math.min(lowestLow, lowValue);
      }

      firstData = cryptoData[0];
      lastData = cryptoData[cryptoData.length - 1];

      const [firstTime, firstOpen, , , firstClose] = firstData;
      const [lastTime, , , , lastClose] = lastData;

      change = ((lastClose - firstOpen) / firstOpen) * 100;

      cryptoData = cryptoData.map(data => {
        let [time, open, highValue, lowValue, close] = data;
        time = Math.floor(time / 1000);
        return [time, lowValue, highValue, open, close];
      });
    }else{



      let config = {
        method: 'get',
        // url: `${CRYPTO_CANDLE_URL}/products/${product_id}/candles?granularity=${interval}&start=1687338559&end=1687425590`,
        // url: `${CRYPTO_CANDLE_URL}/products/${product_id}/candles?granularity=${interval}&start=${start}&end=${end}`,
        url: `${CRYPTO_CANDLE_URL}/products/${product_id}/candles?granularity=${interval}&start=${start}&end=${end}`,
        headers: { 
          'Content-Type': 'application/json'
        }
      };

      console.log(config);
  
      await axios(config)
        .then((response) => {
          // ohlc = JSON.stringify(response.data);
          cryptoData = response.data
          console.log(JSON.stringify(response.data))
        })
        .catch((error) => {
        console.log(error);
        return next(new AppError("Error: Something went wrong", 400));
      });


      for (const data of cryptoData) {
        const [time, lowValue,highValue, open, close, volume] = data;
    
        highestHigh = Math.max(highestHigh, highValue);
        lowestLow = Math.min(lowestLow, lowValue);
      }
  
      firstData = cryptoData[0];
      lastData = cryptoData[cryptoData.length - 1];
    
      const [firstTime, , , firstOpen, firstClose, ] = firstData;
      const [lastTime, , , , lastClose, ] = lastData;
    
      change = ((lastClose - firstOpen) / firstOpen) * 100;
      
      cryptoData = cryptoData.sort((a, b) => a[0] - b[0]);

      if(currency.toUpperCase() == "INR"){

        let currencyVal = await currencyModel.findOne({})

        cryptoData = cryptoData.map( data => {

          data[1] = data[1] * currencyVal.INR;
          data[2] = data[2] * currencyVal.INR;
          data[3] = data[3] * currencyVal.INR;
          data[4] = data[4] * currencyVal.INR;

          return data;

        })
      }
    }


    // let ohlc = await axios.get(

    // )

    // const cryptoData = ohlc.data;

    // Find the highest high and lowest low


    return res.status(200).json({
      status: true, 
      high: highestHigh,
      low: lowestLow,
      change: change,
      cryptoData:  cryptoData,
    });
  })
  
  exports.graphMarketRange = catchAsync(async (req, res, next) => {
    let {id,from,to,currency} = req.query
  
    let marketRange = await axios.get(
      `${CRYPTO_TRACKER_URL}/coins/${id}/market_chart/range?vs_currency=${currency}&from=${from}&to=${to}`
    )
  
    return res.status(200).json({
      status: true, 
      cryptoData:  marketRange.data
    });
  })
  
  
  exports.graphMarketChart = catchAsync(async (req, res, next) => {
    let {id,days,currency} = req.query
  
    let totalData = await axios.get(
      `${CRYPTO_TRACKER_URL}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`
    )
  
    return res.status(200).json({
      status: true, 
      cryptoData:  totalData.data
    });
  })


  const marketCapController = async () => {
    const totalLimitGiven = 250;
    const MAX_MARKET_LIMIT= 250;
    let page = 1;
    let order = 0;
  
    let bulkOps = [];
    
    while (page) {
      try {
        const response = await axios.get(`${CRYPTO_TRACKER_URL}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: totalLimitGiven,
            page: page,
            sparkline: false,
            price_change_percentage: '1h,24h,7d',
            locale: 'en',
          },
        });
  
        const marketCapData = response.data.map((item) => ({
          order: ++order,
          marketCapId: item.id,
          data: item,
        }));
  
        marketCapData.forEach((item) => {
          bulkOps.push({
            updateOne: {
              filter: { marketCapId: item.marketCapId },
              update: item,
              upsert: true,
            },
          });
        });
  
        // if (page % 6 === 0) {
        //   await new Promise((resolve) => {
        //     setTimeout(resolve, 60 * 1000);
        //   });
        // }
  
        // Move to the next page
        console.log(page)
        // if (page == 43){
        //   console.log(finished)
        // }
        // page++;
      } catch (error) {
        console.log(error.response.status, error.response.statusText);
        await new Promise((resolve) => {
          setTimeout(resolve, 1 * 60 * 1000);
        });
      }
  
      // Insert data in bulk
      if (bulkOps.length > 0) {
        await marketCapModel.bulkWrite(bulkOps);
        bulkOps = [];
        console.log("bulkOps",bulkOps)
      }
  
      // Exit the loop when all data is fetched
      if (order >= MAX_MARKET_LIMIT) {
        break;
      }
    }
  };
  
  
  marketCapController()
  // Run the controller every 60 minutes
  setInterval(marketCapController, 60 * 60 * 1000);


  const currencyChecker = async () => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryInterval = 60 * 60 * 1000; // 1 hour
  
    while (retryCount < maxRetries) {
      try {
        let inrConversion = new CC({ from: "USD", to: "INR" });
        let inr = await inrConversion.amount(1).convert();
        let eurConversion = new CC({ from: "USD", to: "EUR" });
        let eur = await eurConversion.amount(1).convert();
        let gbpConversion = new CC({ from: "USD", to: "GBP" });
        let gbp = await gbpConversion.amount(1).convert();
        console.log("inr", inr, "eur", eur, "gbp", gbp);
  
        let currency = await currencyModel.findOne();
        if (!currency) {
          currency = await currencyModel.create({
            INR: inr,
            EUR: eur,
            GBP: gbp,
          });
        } else {
          currency.INR = inr;
          currency.EUR = eur;
          currency.GBP = gbp;
          await currency.save();
        }
        console.log("finish currency");
  
        // Break the loop if the currency conversion and save are successful
        break;
      } catch (error) {
        retryCount++;
        console.log("Currency conversion failed. Retrying in 1 minute...");
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }
  };
  
  currencyChecker()
  setInterval(currencyChecker, 24 * 60 * 60 * 1000); // Run once per day