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

module.exports = router;
