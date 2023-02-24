//for making regex search query
const jwt = require("jsonwebtoken");
const { JWT_SECRETE_KEY } = require("../config/config");

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

const generateJWTToken = (userId, initialTime, refreshTime) => {
  const token = jwt.sign({ userId: userId }, JWT_SECRETE_KEY, {
    expiresIn: initialTime,
  });
  // const refreshToken = jwt.sign({ userId: userId }, JWT_SECRETE_KEY, {
  //   expiresIn: refreshTime,
  // });

  return {
    token,
    // refreshToken,
  };
};
module.exports = {
  searchQuery,
  generateJWTToken,
};
