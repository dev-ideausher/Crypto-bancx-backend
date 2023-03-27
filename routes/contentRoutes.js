const router = require("express").Router();
const contentController = require("../controllers/contentController");
const authController = require("../controllers/authController");
const adminModel = require("../models/adminModel");

router.post("/add", authController.checkRole(), contentController.addContent);

router.post(
  "/add-tag",
  authController.validateToken(adminModel),
  contentController.addTag
);
router.get("/all-tags", contentController.getAllTags);

router.post(
  "/add-view",
  authController.validateToken(adminModel),
  contentController.addViews
);

router.patch(
  "/update",
  authController.validateToken(adminModel),
  contentController.updateContent
);

router.delete(
  "/delete",
  authController.validateToken(adminModel),
  contentController.deleteContent
);

router.get("/latest", contentController.latestContent);
router.get("/trending", contentController.trending);

router.get("/search", contentController.search);

module.exports = router;
