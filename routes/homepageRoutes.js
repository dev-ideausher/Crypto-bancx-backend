const router = require("express").Router();
const reasonController = require("../controllers/admin/reasonsToChooseBancxController");
const authController = require("../controllers/authController");
const adminModel = require("../models/adminModel");

router.post(
  "/add-section1",
  authController.validateToken(adminModel),
  reasonController.addSectionI
);
router.patch(
  "/update-section1",
  authController.validateToken(adminModel),
  reasonController.updateSectionI
);
router.post(
  "/add-reason",
  authController.validateToken(adminModel),
  reasonController.addReasons
);
router.patch(
  "/update-reason",
  authController.validateToken(adminModel),
  reasonController.updateReasons
);
router.delete(
  "/delete-reason",
  authController.validateToken(adminModel),
  reasonController.deleteReasons
);
router.get(
  "/all-reasons",
  authController.validateToken(adminModel),
  reasonController.allReasons
);

module.exports = router;
