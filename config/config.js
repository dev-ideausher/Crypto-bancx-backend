require("dotenv").config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_DATABASE_DEV: process.env.MONGO_DATABASE_DEV,
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
  API_VERSION: process.env.API_VERSION,
  JWT_SECRETE_KEY: process.env.JWT_SECRETE_KEY,
  CRYPTO_TRACKER_URL: process.env.CRYPTO_TRACKER_URL,
};
