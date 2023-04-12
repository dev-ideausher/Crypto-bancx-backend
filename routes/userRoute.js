const { getTopContent } = require("../controllers/contentController");
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
router.get("/top-content", getTopContent);
router.get("/watch-list", requiresAuth, userController.addToWatchList);
router.get(
  "/watch-list-all",
  requiresAuth,
  userController.getAllWatchListCoins
);
// router.get("/all-users",userController.getAllUsers);
// router.patch("/:userId",requiresAuth,userController.updateUser);
// router.get("/:userId",userController.getAUser);

module.exports = router;
