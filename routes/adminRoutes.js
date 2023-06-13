const router = require("express").Router();
const adminController = require("../controllers/admin/adminController");
const authController = require("../controllers/authController");
const adminModel = require("../models/adminModel");
const adminDashboardController = require("../controllers/admin/adminDashboardController")
const adminVideoController = require("../controllers/admin/videoController")

router.post("/create", adminController.register);
router.post("/login", adminController.login);

router.get("/resetPassword",adminController.getResetPassword);
router.post("/resetPassword",adminController.postResetPassword);
router.post("/forgotPassword",adminController.forgotPassword);

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

router.delete(
  "/delete-news",
  authController.validateToken(adminModel),
  adminController.deleteNews
);
router.get(
  "/content",
  authController.validateToken(adminModel),
  adminController.getNewsOrBlogs
);
router.get(
  "/videos",
  authController.validateToken(adminModel),
  adminVideoController.allVideos
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
// router.get(
//   "/search-blog",
//   authController.validateToken(adminModel),
//   adminController.searchBlogs
// );
router.patch(
  "/change-content-status",
  authController.validateToken(adminModel),
  adminController.changeContentStatus
);
router.patch(
  "/change-video-status",
  authController.validateToken(adminModel),
  adminVideoController.changeVideoStatus
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
  "/change-content-order-desc",
  authController.validateToken(adminModel),
  adminController.decreaseOrder
);
router.patch(
  "/save-top",
  authController.validateToken(adminModel),
  adminController.saveTopContent
);
router.post(
  "/add-top",
  authController.validateToken(adminModel),
  adminController.addToTopContent
);
router.delete(
  "/delete-top",
  authController.validateToken(adminModel),
  adminController.deleteTopContent
);
router.get(
  "/all-top",
  authController.validateToken(adminModel),
  adminController.getAllTopContentData
);
router.get(
  "/logout",
  authController.validateToken(adminModel),
  adminController.logout
);
router.patch(
  "/edit-video",
  authController.validateToken(adminModel),
  adminVideoController.editVideo
);
router.delete(
  "/delete-video",
  authController.validateToken(adminModel),
  adminVideoController.deleteVideo
);
router.post(
  "/add-video",
  authController.validateToken(adminModel),
  adminVideoController.addVideo
);
router.get(
  "/user-blogs",
  authController.validateToken(adminModel),
  adminController.approveUserBlogs
);
router.patch(
  "/change-display-status",
  authController.validateToken(adminModel),
  adminController.changeBlogStatus
);
router.get(
  "/analytics",
  authController.validateToken(adminModel),
  adminDashboardController.analytics
);

router.get(
  "/feature-requests",
  authController.validateToken(adminModel),
  adminController.allfeatureRequests
);

router.patch(
  "/feature-requests/:id",
  authController.validateToken(adminModel),
  adminController.approveOrRejectFeature
);

router.delete(
  "/feature-request",
  authController.validateToken(adminModel),
  adminController.deleteFeatureRequest
);

router.get(
  "/feature-request/:id",
  authController.validateToken(adminModel),
  adminController.getSingleFeatureRequest
);


module.exports = router;
