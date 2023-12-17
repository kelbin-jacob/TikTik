const router = require("express").Router();
const userController = require("../Controllers/user.controller");
const express = require("express");
const app = express();
const uploads = require("../Middlewares/multer/multer.middleware");
// const uploads = require("../middleware/Multer/multer.middleware");
// const vendorRegisterValidator = require("../middleware/validators/register.validators");
const currentUserInterceptor = require("../Middlewares/auth/currentuserInterceptor.auth");

// const currentUser = require("../Auth/currentuser.auth");
// const maxFileCount = 5; // Set the maximum number of allowed files
// const errorHandlerMiddleware = require("../middleware/Multer/multerErrorHandler.middleware"); // Import your error handler middleware

//Add Admin
router.post("/addSuperAdmin", userController.addSuperAdmin);

// Admin  Login
router.post("/adminLogin", userController.login);

// user Register
router.post("/userRegister", userController.userRegistration);

// user Register Otp Verification
router.post(
  "/userRegisterOtpVerification",
  userController.userRegisterOtpVerification
);

// user Register Otp Resend
router.post(
  "/userRegisterOtpResend",
  userController.userRegisterOtpResend
);

// user Login
router.post(
  "/userLogin",
  userController.userLoginData
);

// user Login Otp Resend
router.post(
  "/userLoginOtpResend",
  userController.userLoginOtp
);

// User Add Details
router.post(
  "/userAddDetails",
  uploads.upload.single("image"),
  currentUserInterceptor.currentUser,
  userController.addUserDetails
);




module.exports = router;
