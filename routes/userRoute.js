const {
  getTopContent,
  addContent,
  getVideos,
} = require("../controllers/contentController");
const {
  requiresAuth,
  generateToken,
} = require("../controllers/firebaseController");
const userController = require("../controllers/userController");
const marketCapController = require("../controllers/marketCapController");
const emailSubscriptionController = require("../controllers/emailSubscriptionController")
const router = require("express").Router();

router.post("/onboarding", requiresAuth, userController.userOnboarding);
// router.post("/login",requiresAuth,userController.login);
router.post("/add", userController.addUser);
router.post("/add-comment", requiresAuth, userController.addComment);
router.get("/get-crypto", userController.cryptoTracker);
// router.post("/comments",userController.addComment);
router.post("/generate-token/:uid", generateToken);
router.get("/testimonials", userController.getAllTestimonials);
router.get("/tags", userController.getAllTags);
router.post("/add-blog", requiresAuth, addContent);
router.get("/top-content", getTopContent);
router.get("/videos",getVideos);

router.post("/watch-list", requiresAuth, userController.addOrRemoveToWatchList);
router.get(
  "/watch-list-all",
  requiresAuth,
  userController.getAllWatchListCoins
);

router.get("/all-users",userController.getAllUsers);
router.patch("/edit",requiresAuth,userController.updateUser);
router.get("/single", requiresAuth, userController.getAUser);
router.get("/logout", requiresAuth, userController.logout);



//--------------------------------------
router.get("/get-crypto-market", requiresAuth,marketCapController.cryptoMarketsApi);
router.get("/no-auth/get-crypto-market", marketCapController.cryptoMarketsNoAuth);
router.get("/get-crypto-market/:id", requiresAuth,marketCapController.singleCryptoMarket);
router.get("/no-auth/get-crypto-market/:id", marketCapController.singleCryptoMarket);
// router.get("/graph", userController.graph);
router.get("/graph-ohlc", marketCapController.graphOhlc);
router.get("/graph-chart", marketCapController.graphMarketChart);
router.get("/graph-range", marketCapController.graphMarketRange);

router.get("/market/search-suggestion", marketCapController.searchListSuggestion);

router.post("/email-subscription/add", emailSubscriptionController.addEmailSubscription);

module.exports = router;
