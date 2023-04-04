const router = require("express").Router();
const testimonialController = require("../controllers/admin/testimonialController");
const authController = require("../controllers/authController");
const adminModel = require("../models/adminModel");

router.post(
  "/add",
  authController.validateToken(adminModel),
  testimonialController.addTestimonials
);
router.patch(
  "/update",
  authController.validateToken(adminModel),
  testimonialController.updateTestimonials
);
router.delete(
  "/delete",
  authController.validateToken(adminModel),
  testimonialController.deleteTestimonials
);
router.get(
  "/all",
  authController.validateToken(adminModel),
  testimonialController.allTestimonials
);
router.patch(
  "/disable",
  authController.validateToken(adminModel),
  testimonialController.disableTestimonials
);

module.exports = router;
