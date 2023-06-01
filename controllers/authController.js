const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { JWT_SECRETE_KEY , REFRESH_TOKEN_SECRET } = require("../config/config");
const AppError = require("../utils/appError");
const userModel = require("../models/userModel");
const adminModel = require("../models/adminModel");
const {
  generateJWTToken,
} = require("../utils/helper");
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
    return next(new AppError("Token is not present.", 401));
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


// exports.validateToken = (model) => {
//   return catchAsync(async (req, res, next) => {
//     const token = req.cookies.token || '';

//     if (!token) {
//       return next(new AppError('Token is not present.', 400));
//     }

//     try {
//       const decoded = await new Promise((resolve, reject) => {
//         jwt.verify(token, JWT_SECRETE_KEY, (err, decoded) => {
//           if (err) {
//             reject(err);
//           } else {
//             resolve(decoded);
//           }
//         });
//       });

//       const { userId } = decoded;
//       const user = await model.findById(userId);

//       if (!user) {
//         return next(new AppError('Invalid token', 401));
//       }

//       req.user = user;

//       // Access token is valid, proceed with the protected route logic
//       // ...

//       next();
//     } catch (err) {
//       if (err.name === 'TokenExpiredError') {
//         // Access token has expired, check refresh token and generate new access token

//         const refreshToken = req.cookies.refreshToken;
//         console.log("refreshToken",refreshToken)

//         if (!refreshToken) {
//           return next(new AppError('Missing refresh token', 401));
//         }

//         try {
//           const userId = verifyRefreshToken(refreshToken);
//           console.log("userrId",userId)
//           // Refresh token is valid, generate a new access token and send it to the client
//           const newAccessToken = generateJWTToken(userId);
//           // Clear expired access token from cookies
//           res.clearCookie('token');
//           console.log("cookies token",req.cookies.token)
//           // Set the new access token in the cookie while keeping the refresh token
//           res.cookie('token', newAccessToken.token, {
//             expires: new Date(Date.now() + newAccessToken.expirationInMilliseconds),
//             httpOnly: true,
//             sameSite: 'none',
//             secure: true,
//           });

//           const user = await model.findById(userId);
      
//           if (!user) {
//             return next(new AppError("Invalid token", 401));
//           }
      
//           req.user = user;
//           next();

//           // res.json({ accessToken: newAccessToken });
//         } catch (err) {
//           // Refresh token is invalid or expired, user needs to log in again
//           return next(new AppError('Invalid or expired refresh token', 401));
//         }
//       } else {
//         return next(new AppError('Invalid token', 401));
//       }
//     }
//   });
// };


// const jwt = require('jsonwebtoken');

// // Refresh Token Secret Key
// const REFRESH_TOKEN_SECRET = 'your_refresh_token_secret';

// // Generate Access Token
// const generateAccessToken = (userId) => {
//   const accessToken = jwt.sign({ userId }, 'your_access_token_secret', {
//     expiresIn: '15m', // Set the expiration time for the access token
//   });
//   return accessToken;
// };

// // Generate Refresh Token
// const generateRefreshToken = (userId) => {
//   const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET);
//   return refreshToken;
// };

// // Verify Access Token
// const verifyAccessToken = (token) => {
//   try {
//     const decoded = jwt.verify(token, 'your_access_token_secret');
//     return decoded.userId;
//   } catch (err) {
//     if (err.name === 'TokenExpiredError') {
//       throw new Error('Access token has expired');
//     }
//     throw new Error('Invalid access token');
//   }
// };

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    return decoded.userId;
  } catch (err) {
    throw new Error('Invalid refresh token');
  }
};

// // Example login route
// app.post('/login', (req, res) => {
//   // Authenticate user and check credentials

//   // Assuming user is authenticated and valid

//   const userId = 'user_id'; // Replace with actual user ID
//   const accessToken = generateAccessToken(userId);
//   const refreshToken = generateRefreshToken(userId);

//   // Store the refreshToken in the database or any other secure storage mechanism

//   res.json({ accessToken, refreshToken });
// });

// // Example protected route
// app.get('/protected', (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'Missing or invalid access token' });
//   }

//   const accessToken = authHeader.split(' ')[1];

//   try {
//     const userId = verifyAccessToken(accessToken);
//     // Access token is valid, proceed with the protected route logic
//     // ...
//     res.json({ message: 'Protected route accessed successfully' });
//   } catch (err) {
//     // Access token has expired, check refresh token and generate new access token
//     const refreshToken = req.body.refreshToken;

//     if (!refreshToken) {
//       return res.status(401).json({ message: 'Missing refresh token' });
//     }

//     try {
//       const userId = verifyRefreshToken(refreshToken);
//       // Refresh token is valid, generate a new access token and send it to the client
//       const newAccessToken = generateAccessToken(userId);
//       res.json({ accessToken: newAccessToken });
//     } catch (err) {
//       // Refresh token is invalid or expired, user needs to log in again
//       res.status(401).json({ message: 'Invalid or expired refresh token' });
//     }
//   }
// });

