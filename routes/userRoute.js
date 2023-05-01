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

// router.get("/all-users",userController.getAllUsers);
// router.patch("/:userId",requiresAuth,userController.updateUser);
router.get("/single", requiresAuth, userController.getAUser);
router.get("/logout", requiresAuth, userController.logout);



//--------------------------------------
router.get("/get-crypto-market", requiresAuth,userController.cryptoMarketsApi);
router.get("/no-auth/get-crypto-market", userController.cryptoMarketsNoAuth);
// router.get("/graph", userController.graph);
router.get("/graph-ohlc", userController.graphOhlc);
router.get("/graph-chart", userController.graphMarketChart);
router.get("/graph-range", userController.graphMarketRange);

module.exports = router;
