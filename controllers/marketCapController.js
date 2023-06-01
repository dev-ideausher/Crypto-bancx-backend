const catchAsync = require("../utils/catchAsync");
const { default: axios } = require("axios");
const { CRYPTO_TRACKER_URL } = require("../config/config");
const watchListModel = require("../models/watchlistModel");
const CC = require('currency-converter-lt')

const marketCapModel = require("../models/marketCapModel")


const MAX_MARKET_LIMIT = 250

// crypto tracker
exports.cryptoMarketsApi = catchAsync(async (req, res, next) => {
  const { page, limit } = req.query;

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

  return res.status(200).json({
        status: true, 
        totalPages: totalPages, 
        cryptoData: cryptoData
  });
})

//single coin auth
exports.singleCryptoMarket = catchAsync(async (req, res, next) => {
  let id = req.params.id

  let marketCap = await marketCapModel.findOne({marketCapId:id}).lean();
  if (!marketCap.description){
    let id = marketCap._id
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
    marketCap = await marketCapModel.findByIdAndUpdate(id,{
      description:descriptionString,
      homepageUrl:response.data.links.homepage,
    },{new:true})
  }

  const watchListedId = await watchListModel.findOne({id:id, userId: req.user._id }).distinct('id');
  if (watchListedId){
    marketCap.isWishListed=true;
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

  return res.status(200).json({
    status: true, 
    marketCap: marketCap,
    similarCoins:similarCoins,
  });
})

//single coin no auth
exports.singleCryptoMarketNoAuth = catchAsync(async (req, res, next) => {
  let id = req.params.id

  let marketCap = await marketCapModel.findOne({marketCapId:id});
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
    marketCap.description=descriptionString;
    marketCap.homepageUrl=response.data.links.homepage;
    await marketCap.save();
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

  return res.status(200).json({
    status: true, 
    marketCap: marketCap,
    similarCoins: similarCoins,
  });
})


exports.searchListSuggestion = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  const regexQuery = {
      marketCapId: new RegExp(search, 'i')
  };

  let suggestion = await marketCapModel
    .find({...regexQuery})
    .select("marketCapId")
    .limit(5);

  return res.status(200).json({ status: true, message: "", data: suggestion });
})

// crypto tracker
exports.cryptoMarketsNoAuth = catchAsync(async (req, res, next) => {
  const { page, limit ,currecncy} = req.query;
  let isUsd 
  // let currencyConverter
  //USD GBP INR EUR
 const currencyUC = currecncy.toUpperCase();
if (currencyUC == "USD"){
  isUsd=true;
}else{
  isUsd=false;
  // currencyConverter = new CC({from:"USD", to:"INR" })
}
let currencyConverter = new CC({from:"USD", to:"INR" })
  // "current_price": 26307,
  // "price_change_percentage_24h": -3.49518,
  // "market_cap": 512341577581
  // "total_supply": 21000000,
  // "circulating_supply": 19382418,

  const orderLImitMax = page * limit
  const orderLImitMin = (page * limit)-limit
  let filter = { order:{ $gt: orderLImitMin , $lte: orderLImitMax } }

  let totalPages = Math.ceil(MAX_MARKET_LIMIT / limit)

  let marketCap = await marketCapModel.find(filter).sort({order:1}).lean();

  // if(!isUsd){
  //   marketCap.forEach(async e=>{
  //     const current_price = await currencyConverter.amount(e.data.current_price).convert();
  //     e.data.current_price = current_price;
  //     const price_change_percentage_24h = await currencyConverter.amount(e.data.price_change_percentage_24h).convert();
  //     e.data.price_change_percentage_24h=price_change_percentage_24h;
  //     const market_cap = await currencyConverter.amount(e.data.market_cap).convert();
  //     e.data.market_cap = market_cap;
  //     const total_supply = await currencyConverter.amount(e.data.total_supply).convert();
  //     e.data.total_supply = total_supply;
  //     const circulating_supply = await currencyConverter.amount(e.data.circulating_supply).convert();
  //     e.data.circulating_supply = circulating_supply;
  //   })
  // }

  // const convertToInteger = async (converter, value) => {
  //   const convertedValue = await converter.amount(value).convert();
  //   return parseInt(convertedValue, 10);
  // };

  
  // if (!isUsd) {
  //   for (const e of marketCap) {
  //     e.data.current_price = await convertToInteger(currencyConverter, e.data.current_price);
  //     e.data.price_change_percentage_24h = await convertToInteger(currencyConverter, e.data.price_change_percentage_24h);
  //     e.data.market_cap = await convertToInteger(currencyConverter, e.data.market_cap);
  //     e.data.total_supply = await convertToInteger(currencyConverter, e.data.total_supply);
  //     e.data.circulating_supply = await convertToInteger(currencyConverter, e.data.circulating_supply);
  //   }
  // }

let i=0
let convertedMarketCap = []
// if (!isUsd) {
//   console.log("worling")
//   convertedMarketCap = marketCap.map(async (e) => {
//     console.log("e.data.current_price",typeof e.data.current_price)
//     let i= 45
//     console.log("i",typeof i)
//     const current_price = await currencyConverter.amount(400).convert();
//     console.log("current_price",current_price)
//     e.data.current_price = current_price; // Convert back to an integer

//     let price_change_percentage_24h = e.data.price_change_percentage_24h;
//     if (price_change_percentage_24h < 0) {
//       // Convert negative percentage to positive for conversion
//       price_change_percentage_24h = Math.abs(price_change_percentage_24h);
//     }
//     const converted_price_change_percentage_24h = await currencyConverter.amount(price_change_percentage_24h).convert();
//     e.data.price_change_percentage_24h = Math.round(converted_price_change_percentage_24h); // Convert back to an integer

//     let market_cap = e.data.market_cap;
//     if (market_cap < 0) {
//       // Convert negative percentage to positive for conversion
//       market_cap = Math.abs(market_cap);
//     }
//     const converted_market_cap = await currencyConverter.amount(market_cap).convert();
//     e.data.market_cap = Math.round(converted_market_cap); // Convert back to an integer

//     // const total_supply = await currencyConverter.amount(Math.abs(e.data.total_supply)).convert();
//     // e.data.total_supply = Math.round(total_supply); // Convert back to an integer

//     // const circulating_supply = await currencyConverter.amount(e.data.circulating_supply).convert();
//     // e.data.circulating_supply = Math.round(circulating_supply); // Convert back to an integer
//     if(e.order==1){
//       console.log("e",e)
//     }

//     return e;
//   });
// }


  return res.status(200).json({
        status: true, 
        totalPages: totalPages, 
        cryptoData: convertedMarketCap
  });
})


// const marketCapController = async () => {

//     const totalLimitGiven = 250;//200 vvvvv
//     // const totalPages = 43;
//     let page = 1;
//     let order = 0;
  
//     const bulkOps = [];
//     while (page) {
//       try {
//         const response = await axios.get(`${CRYPTO_TRACKER_URL}/coins/markets`, {
//           params: {
//             vs_currency: 'usd',
//             order: 'market_cap_desc',
//             per_page: totalLimitGiven,
//             page: page,
//             sparkline: false,
//             price_change_percentage: '1h,24h,7d',
//             locale: 'en',
//           },
//         });
  
//         const marketCapData = response.data.map((item) => ({
//           order: ++order,
//           marketCapId: item.id,
//           data: item,
//         }));
  
//         // Upsert the data
//         await Promise.all(
//           marketCapData.map(async (item) => {
//             await marketCapModel.findOneAndUpdate(
//               { marketCapId: item.marketCapId },
//               item,
//               { upsert: true }
//             );
//           })
//         );
  
//         // if (page % 6 === 0) {
//         //   await new Promise((resolve) => {
//         //     setTimeout(resolve, 60 * 1000);
//         //   });
//         // }
  
//         // Move to the next page
//         // console.log(page)
//         // if (page == 43){
//         //   console.log(finished)
//         // }
//         // page++;
//       } catch (error) {
//         // Wait for 1 minute before retrying the same page
//         console.log(error.response.status,error.response.statusText)
//         await new Promise((resolve) => {
//           setTimeout( resolve, 1 * 60 * 1000);
//         });
//       }
//     }
//   };



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


  exports.graphOhlc = catchAsync(async (req, res, next) => {
    let {id,days,currency} = req.query
  
    let ohlc = await axios.get(
      `${CRYPTO_TRACKER_URL}/coins/${id}/ohlc?vs_currency=${currency}&days=${days}`
    )
  
    return res.status(200).json({
      status: true, 
      cryptoData:  ohlc.data
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


// // crypto tracker
// exports.cryptoMarketsApi = catchAsync(async (req, res, next) => {
//   const { page, limit } = req.query;

//   const totalPagesGiven = 108
//   const totalLimitGiven = 100

//   axios.get(`${CRYPTO_TRACKER_URL}/coins/markets`, {
//     params: {
//       vs_currency: 'usd',
//       order: 'market_cap_desc',
//       per_page: totalLimitGiven,
//       page: page,
//       sparkline: false,
//       price_change_percentage: '1h,24h,7d',
//       locale: 'en',
//     },
//   }).then(async (response) => {
//     const data = response.data;
//     const watchListedIds = await watchListModel.find({ userId: req.user._id }).distinct('id');
//     const cryptoData = data.map((item) => {
//       const isWishListed = watchListedIds.includes(item.id);
//       return {
//         ...item,
//         isWishListed,
//       };
//     });
  
//     console.log("data")

//     // store the data in the database
//     const marketCap = await marketCapModel.create({
//       page,
//       data: data,
//     });
//     console.log("data1111",marketCap._id)

//     return res.status(200).json({
//       status: true, 
//       totalPages:totalPagesGiven, 
//       cryptoData: cryptoData 
//     });

//   }).catch(async (error) => {

//     console.log("def")
//     // check if there is any stored data for the given page and limit
//     const cachedData = await marketCapModel.find({page:page}).sort({ createdAt: -1 }).limit(1).lean();
//     if (cachedData) {
//       const watchListedIds = await watchListModel.find({ userId: req.user._id }).distinct('id');
//       const updatedData = cachedData[0].data.map((item) => {
//         const isWishListed = watchListedIds.includes(item.id);
//         return {
//           ...item,
//           isWishListed,
//         };
//       });

//       return res.status(200).json({
//         status: true, 
//         totalPages: totalPagesGiven, 
//         cryptoData: updatedData
//       });
//     }else{
//       console.log("no cachedDAta")
//       return res.status(200).json({
//         status: true, 
//         totalPages: totalPagesGiven, 
//         cryptoData: []
//       });
//     }
//   });
// });

  // const totalPagesGiven = 108
  // const totalLimitGiven = 100
  // const totalData = await axios.get(
  //   `${CRYPTO_TRACKER_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${totalLimitGiven}&page=${totalPagesGiven}&sparkline=false&price_change_percentage=1h%2C24h%2C7d&locale=en`
  // );
  // //found from the market cap
  // let totalItems = totalPagesGiven * totalLimitGiven // 10,800
  // let remainingVal = 100 - totalData.data.length
  // totalItems = totalItems - remainingVal 
  // let totalPages = Math.ceil(totalItems / limit)

// // crypto tracker
// exports.cryptoMarketsNoAuth = catchAsync(async (req, res, next) => {
//   const { page, limit } = req.query;
//   // limit =100
//   const totalPagesGiven = 108
//   const totalLimitGiven = 100
//   axios.get(
//     `${CRYPTO_TRACKER_URL}/coins/markets`, {
//       params: {
//         vs_currency: 'usd',
//         order: 'market_cap_desc',
//         per_page: totalLimitGiven,
//         page: page,
//         sparkline: false,
//         price_change_percentage: '1h,24h,7d',
//         locale: 'en',
//       },
//     }).then(async (response) => {
//       const data = response.data;
//       console.log("data")

//       // store the data in the database
//       const marketCap = await marketCapModel.create({
//         page,
//         data: data,
//       });
//       console.log("data1111",marketCap)

//       return res.status(200).json({
//         status: true, 
//         totalPages:totalPagesGiven, 
//         cryptoData: data 
//       });

//     }).catch(async (error) => {
//       console.log("def")
//         // check if there is any stored data for the given page and limit
//         const cachedData = await marketCapModel.find({page:page}).sort({ createdAt: -1 }).limit(1).lean();
//         if (cachedData) {
//           console.log("cachedDAta",cachedData)
//           return res.status(200).json({
//             status: true, 
//             totalPages: totalPagesGiven, 
//             cryptoData: cachedData[0].data 
//           });
//         }else{
//           console.log("no cachedDAta")
//           return res.status(200).json({
//             status: true, 
//             totalPages: totalPagesGiven, 
//             cryptoData: []
//           });
//         }
//     });
// });



// const marketCapController = async () => {
//   const totalPages = 43;
//   let order = 0;
//   for (let page = 1; page <= totalPages; page++) {
//     const response = await axios.get(`${CRYPTO_TRACKER_URL}/coins/markets`, {
//       params: {
//         vs_currency: 'usd',
//         order: 'market_cap_desc',
//         per_page: 250,
//         page: page,
//         sparkline: false,
//         price_change_percentage: '1h,24h,7d',
//         locale: 'en',
//       },
//     });

//     const marketCapData = response.data.map((item) => ({
//       order : ++order,
//       marketCapId: item.id,
//       data: item,
//     }));

//     // Upsert the data
//     await Promise.all(
//       marketCapData.map(async (item) => {
//         await marketCapModel.findOneAndUpdate(
//           { marketCapId: item.marketCapId },
//           item,
//           { upsert: true }
//         );
//       })
//     );

//     if (page % 6 === 0) {
//       await new Promise((resolve) => {
//         setTimeout(resolve, 60 * 1000);
//       });
//     }
//   }
// };





// exports.graph = catchAsync(async (req, res, next) => {
//   let {id,days,currency,type,from,to,outputType} = req.query

//   let data ={}

//   if(outputType == 1){
//     let totalData = await axios.get(
//       `${CRYPTO_TRACKER_URL}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`
//     )
//     data.totalData=totalData
//   }else if (outputType == 2){
//     //from = 1682595000
//     //to = 1682596227
//     let marketRange = await axios.get(
//       `${CRYPTO_TRACKER_URL}/coins/${id}/market_chart/range?vs_currency=${currency}&from=${from}&to=${to}`
//     )
//     data.marketRange=marketRange
//   }else if (outputType== 3){
//     let ohlc = await axios.get(
//     `${CRYPTO_TRACKER_URL}/coins/${id}/ohlc?vs_currency=${currency}&days=${days}`
//     )
//     data.ohlc=ohlc
//   }

//   return res.status(200).json({
//     status: true, 
//     cryptoData:  data
//   });
// })




