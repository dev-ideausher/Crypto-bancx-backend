const router = require("express").Router();
const adminController = require("../controllers/admin/adminController");
const authController = require("../controllers/authController");
const adminModel = require("../models/adminModel");

router.post("/create", adminController.register);
router.post("/login", adminController.login);

router.post(
  "/add",
  authController.validateToken(adminModel),
  adminController.addAdmin
);

router.post(
  "/add-about-us",
  authController.validateToken(adminModel),
  adminController.addAboutUs
);
router.post(
  "/add-employee",
  authController.validateToken(adminModel),
  adminController.addEmployees
);

router.patch(
  "/edit",
  authController.validateToken(adminModel),
  adminController.editAdmin
);
router.patch(
  "/edit-about-us",
  authController.validateToken(adminModel),
  adminController.editAboutUs
);
router.patch(
  "/edit-employee",
  authController.validateToken(adminModel),
  adminController.updateEmployee
);

router.patch(
  "/change-status",
  authController.validateToken(adminModel),
  adminController.changeAdminStatus
);

router.delete(
  "/delete",
  authController.validateToken(adminModel),
  adminController.deleteAdmin
);

router.get(
  "/all",
  authController.validateToken(adminModel),
  adminController.getAllAdmins
);
router.get(
  "/single",
  authController.validateToken(adminModel),
  adminController.getSingleAdmin
);
router.get("/about-us", adminController.getAboutUs);
router.get(
  "/all-employee",
  authController.validateToken(adminModel),
  adminController.getEmployees
);
router.get(
  "/all-comments",
  authController.validateToken(adminModel),
  adminController.getComments
);
router.patch(
  "/change-comment-status",
  authController.validateToken(adminModel),
  adminController.changeCommentStatus
);
router.get(
  "/search-blog",
  authController.validateToken(adminModel),
  adminController.searchBlogs
);
router.delete(
  "/delete-blog",
  authController.validateToken(adminModel),
  adminController.deleteBlogs
);
router.get(
  "/content",
  authController.validateToken(adminModel),
  adminController.getNewsOrBlogs
);
router.get(
  "/videos",
  authController.validateToken(adminModel),
  adminController.getVideos
);
router.get(
  "/search-news",
  authController.validateToken(adminModel),
  adminController.searchNews
);
router.get(
  "/search-video",
  authController.validateToken(adminModel),
  adminController.searchVideos
);
router.get(
  "/search-blog",
  authController.validateToken(adminModel),
  adminController.searchBlogs
);
router.patch(
  "/change-content-status",
  authController.validateToken(adminModel),
  adminController.changeContentStatus
);
router.patch(
  "/change-video-status",
  authController.validateToken(adminModel),
  adminController.changeVideoStatus
);
router.post(
  "/add-user",
  authController.validateToken(adminModel),
  adminController.createNewUser
);
router.get(
  "/all-users",
  authController.validateToken(adminModel),
  adminController.getAllUsers
);
router.get(
  "/single-user",
  authController.validateToken(adminModel),
  adminController.getSingleUser
);
router.patch(
  "/change-user-status",
  authController.validateToken(adminModel),
  adminController.disableUser
);
router.patch(
  "/change-content-order",
  authController.validateToken(adminModel),
  adminController.changeOrder
);
router.patch(
  "/save-top",
  authController.validateToken(adminModel),
  adminController.saveTopContent
);
router.get(
  "/logout",
  authController.validateToken(adminModel),
  adminController.logout
);

module.exports = router;
