const catchAsync = require("../utils/catchAsync");
const { default: axios } = require("axios");
const { CRYPTO_TRACKER_URL } = require("../config/config");
const watchListModel = require("../models/watchlistModel");

const marketCapModel = require("../models/marketCapModel")


const MAX_MARKET_LIMIT = 10704

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

// crypto tracker
exports.cryptoMarketsNoAuth = catchAsync(async (req, res, next) => {
  const { page, limit } = req.query;

  const orderLImitMax = page * limit
  const orderLImitMin = (page * limit)-limit
  let filter = { order:{ $gt: orderLImitMin , $lte: orderLImitMax } }

  let totalPages = Math.ceil(MAX_MARKET_LIMIT / limit)

  let marketCap = await marketCapModel.find(filter).sort({order:1});

  return res.status(200).json({
        status: true, 
        totalPages: totalPages, 
        cryptoData: marketCap
  });
})

const marketCapController = async () => {
    const totalLimitGiven = 250;
    const totalPages = 43;
    let page = 1;
    let order = 0;
  
    while (page <= totalPages) {
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
  
        // Upsert the data
        await Promise.all(
          marketCapData.map(async (item) => {
            await marketCapModel.findOneAndUpdate(
              { marketCapId: item.marketCapId },
              item,
              { upsert: true }
            );
          })
        );
  
        // if (page % 6 === 0) {
        //   await new Promise((resolve) => {
        //     setTimeout(resolve, 60 * 1000);
        //   });
        // }
  
        // Move to the next page
        console.log(page)
        if (page == 43){
          console.log(finished)
        }
        page++;
      } catch (error) {
        // Wait for 1 minute before retrying the same page
        console.log(error.response.status,error.response.statusText)
        await new Promise((resolve) => {
          setTimeout( resolve, 1 * 60 * 1000);
        });
      }
    }
  };
  
  marketCapController()
  // Run the controller every 30 minutes
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




