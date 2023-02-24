const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

//middleware's
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use(cors("*"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Data sanitization against NoSql query injection
app.use(mongoSanitize());

app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    msg: "working...",
  });
});

//routers
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoute");
const contentRouter = require("./routes/contentRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const homepageRoutes = require("./routes/homepageRoutes");
const { API_VERSION } = require("./config/config");

// router middleware's
app.use(`${API_VERSION}/admin`, adminRoutes);
app.use(`${API_VERSION}/user`,  userRoutes);
app.use(`${API_VERSION}/content`, contentRouter);
app.use(`${API_VERSION}/testimonial`, testimonialRoutes);
app.use(`${API_VERSION}/homepage`, homepageRoutes);

// to handled unregister endpoint
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
