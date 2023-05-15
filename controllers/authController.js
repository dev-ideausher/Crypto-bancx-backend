const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { JWT_SECRETE_KEY } = require("../config/config");
const AppError = require("../utils/appError");
const userModel = require("../models/userModel");
const adminModel = require("../models/adminModel");

// exports.validateToken = (model) => {
//   return catchAsync(async (req, res, next) => {
//     const token = req.cookies.token;
//     console.log(token)
//     if (!token) return next(new AppError("Token is not present.", 400));
//     const { userId } = jwt.verify(token, JWT_SECRETE_KEY);
//     const user = await model.findById(userId);
//     if (!user) return next(new AppError("Invalid token", 400));
//     req.user = user;
//     next();
//   });
// };
exports.checkRole = (model) => {
  return catchAsync(async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return next(new AppError("Token is not present.", 400));
    const { userId } = jwt.verify(token, JWT_SECRETE_KEY);
    let user;
    if (await userModel.findById(userId)){
      user = await userModel.findById(userId);
      req.userType = "user";
    }else if (await adminModel.findById(userId)){
      user = await adminModel.findById(userId);
      req.userType = "admin";
    }
    if (!user) return next(new AppError("Invalid token", 400));
    req.user = user;
    next();
  });
};



// exports.validateToken = (model) => {
//   return (req, res, next) => {
//     const token = req.cookies.token || '';

//     if (!token) {
//       return next(new AppError("Token is not present.", 400));
//     }

//     return new Promise((resolve, reject) => {
//       jwt.verify(token, JWT_SECRETE_KEY, async (err, decoded) => {
//         if (err) {
//           if (err.name === "TokenExpiredError") {
//             return reject(new AppError("Token has expired", 401));
//           }
//           return reject(new AppError("Invalid token", 401));
//         }

//         const { userId } = decoded;

//         try {
//           const user = await model.findById(userId);

//           if (!user) {
//             return reject(new AppError("Invalid token", 401));
//           }

//           req.user = user;
//           resolve();
//         } catch (error) {
//           reject(new AppError("Error while validating token", 500));
//         }
//       });
//     })
//       .then(() => {
//         next();
//       })
//       .catch((error) => {
//         next(error);
//       });
//   };
// };


exports.validateToken = (model) => {
    return catchAsync(async (req, res, next) => {
  const token = req.cookies.token || '';

  if (!token) {
    return next(new AppError("Token is not present.", 400));
  }

  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, JWT_SECRETE_KEY, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });

    const { userId } = decoded;
    const user = await model.findById(userId);

    if (!user) {
      return next(new AppError("Invalid token", 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Token has expired", 401));
    }
    return next(new AppError("Invalid token", 401));
  }

  });
};

