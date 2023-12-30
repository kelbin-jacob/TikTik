const ERROR_CODES = require("../Utils/errorCodes.utils");
const ERROR_MESSAGES = require("../Utils/errormessages.utils");
require("dotenv").config();
const superAdmin = require("../Models/superAdmin.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { Sequelize, Op } = require("sequelize");
const sequelize = require("../DbConfiguration/databaseConnection");
const refferalTable = require("../Models/refferal.model");
const userDetails = require("../Models/userDetails.model");
const refferalIncomeHistory = require("../Models/refferalIncomeHistory.model");
const userLogin = require("../Models/userLogin.model");
const uploads = require("../Middlewares/multer/multer.middleware");

const commonFunctions = require("../Utils/commonFunctions.utils");
const twilioSmsService = require("../Utils/twilloSmsService.utils");

// SUPERADMIN LOGIN
const login = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorResponse = {
        errorCode: errors.errors[0].msg.errorCode,
        message: errors.errors[0].msg.message,
      };
      return next(res.status(errorResponse.errorCode).json(errorResponse));
    }

    const user = await superAdmin.findOne({
      where: {
        email: req.body.email,
      },
      transaction: transaction,
    });

    if (!user) {
      const userNotFoundResponse = {
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      };
      return res.status(404).json(userNotFoundResponse);
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.passwordHash
    );

    if (validPassword) {
      const token = generateAccessToken(user.id, user.email, req.body.password);
      const refreshToken = generateRefreshToken(
        user.id,
        user.email,
        req.body.password
      );

      const successResponse = {
        Name: user.userName,
        email: user.email,
        status: user.isActive,
        accessToken: token,
        refreshToken: refreshToken,
      };

      res.status(200).json(successResponse);
      await transaction.commit();
    } else {
      const incorrectPasswordResponse = {
        errorCode: ERROR_CODES.INCORRECT_PASSWORD,
        message: ERROR_MESSAGES.INCORRECT_PASSWORD,
      };
      return next(res.status(401).json(incorrectPasswordResponse));
    }
  } catch (error) {
    console.error(error); // Use console.error for error logging
    await transaction.rollback();
    const unexpectedErrorResponse = {
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    };
    return res.status(500).json(unexpectedErrorResponse);
  }
};

// GENERATE ACCESSTOKEN
function generateAccessToken(id, email, password) {
  return jwt.sign(
    { id: id, email: email, password: password },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "600h",
    }
  );
}

// GENERATE REFERSHTOKEN
function generateRefreshToken(id, email, password) {
  return jwt.sign(
    { id: id, email: email, password: password },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "1d",
    }
  );
}

// TOKENEXPIRY-REFERSHTOKEN

const tokenRefresh = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { refreshToken } = req.body;

    const transaction = await sequelize.transaction();

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const { id, email } = decoded;

    const user = await superAdmin.findOne({
      where: {
        id,
        email,
      },
      transaction, // Use the transaction for this query
    });

    if (!user) {
      await transaction.rollback(); // Rollback the transaction if user not found
      return res.status(401).json({
        errorCode: ERROR_CODES.INVALID_TOKEN,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
    }

    const accessToken = generateAccessToken(id, email, user.password);
    const newRefreshToken = generateRefreshToken(id, email, user.password);

    await transaction.commit(); // Commit the transaction if everything is successful

    res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        errorCode: ERROR_CODES.TOKEN_EXPIRED,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
      });
    } else {
      return res.status(401).json({
        errorCode: ERROR_CODES.INVALID_TOKEN,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
    }
  }
};

//ADD SUPERADMIN
const addSuperAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(res.status(400).send(errors.errors[0].msg));
  }

  try {
    const unique = await superAdmin.findAll({
      where: { email: { [Sequelize.Op.eq]: req.body.email } },
    });
    if (unique.length > 0) {
      return res.status(400).send({
        errorCode: ERROR_CODES.EMAIL_ALREADY_EXIST,
        message: ERROR_MESSAGES.EMAIL_ALREADY_EXIST,
      });
    }

    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = await superAdmin.create({
      email: req.body.email,
      userName: req.body.userName,
      passwordHash: hashedPassword,
      refferalCode: "ADMIN",
      isActive: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return res.status(200).send(user);
  } catch (error) {
    console.log(error, "123");
    return next(
      res.status(500).json({
        errorCode: ERROR_CODES.UNEXPECTED_ERROR,
        message: ERROR_MESSAGES.UNEXPECTED_ERROR,
      })
    );
  }
};

//User Registeration
const userRegistration = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let refferalCode = req.body.refferalCode || "";
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).send(errors.errors[0].msg);
    }

    const phoneNumber = req.body.phoneNumber;

    let refferedUserType = 0;
    let refferalId = null;
    let refferal;

    const admin = await superAdmin.findOne({
      transaction, // Pass the transaction object to the query
    });

    if (!refferalCode) {
      refferalCode = admin?.refferalCode;
      refferalId = admin?.id;
    } else {
      const user = await userDetails.findOne({
        where: { refferalCode: refferalCode },
        transaction, // Pass the transaction object to the query
      });
      if (user) {
        refferedUserType = 1;
        refferalId = vendor.id;
      }
      // else {
      //   const customer = await customerUserDetails.findOne({
      //     where: { refferalCode: refferalCode },
      //     transaction, // Pass the transaction object to the query
      //   });
      //   if (customer) {
      //     refferedUserType = 2;
      //     refferalId = customer.id;
      //   } else {
      //     refferalId = admin?.id;
      //   }
      // }
    }

    if (refferalId !== null) {
      refferal = await refferalTable.create(
        {
          refferalType: refferedUserType,
          refferalCode: refferalCode,
          refferedUserId: refferalId,
          refferalDate: new Date(),
          isActive: true,
        },
        {
          transaction, // Pass the transaction object to the query
        }
      );
    }

    const phoneNumberExists = await userLogin.count({
      where: { phoneNumber: phoneNumber },
      transaction, // Pass the transaction object to the query
    });
    // const phoneNoExist = await customerUser.count({
    //   where: { phoneNumber: phoneNumber },
    //   transaction, // Pass the transaction object to the query
    // });

    if (phoneNumberExists > 0) {
      await transaction.rollback(); // Rollback the transaction
      return res.status(400).json({
        errorCode: ERROR_CODES.PHONENUMBER_ALREADY_EXIST,
        message: ERROR_MESSAGES.PHONENUMBER_ALREADY_EXIST,
      });
    }

    const userAdd = await userLogin.create(
      {
        phoneNumber: phoneNumber,
        isActive: false,
      },
      {
        transaction, // Pass the transaction object to the query
      }
    );

    const findPhoneNumber = await userLogin.findOne({
      where: { phoneNumber: phoneNumber },
      transaction, // Pass the transaction object to the query
    });

    // Call the function to generate an OTP
    const otp = await commonFunctions.generateOTP();

    const result = await twilioSmsService.twilioSendOTP(phoneNumber, otp); // // Sending SMS

    // Handle the error here
    if (result instanceof Error) {
      return res
        .status(400)
        .json({ error: "Error sending OTP", message: result.message });
    } else {
      findPhoneNumber.otp = otp;
      await findPhoneNumber.save({
        transaction, // Pass the transaction object to the query
      });
      await userDetails.create(
        {
          refferalCode: findPhoneNumber.phoneNumber,
          refferedUserType: refferedUserType,
          refferalId: refferal.id,
          userLoginId: userAdd.id,
        },
        {
          transaction, // Pass the transaction object to the query
        }
      );
      // Commit the transaction if all operations are successful
      await transaction.commit();
      return res.status(200).json({
        successCode: 200,
        message: "otp is sent to the registered phone number given",
      });
    }
  } catch (error) {
    console.log(error);
    // Roll back the transaction if an error occurs
    if (transaction) {
      await transaction.rollback();
    }
    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};

// USER REGISTER OTP VERIFICATION

const userRegisterOtpVerification = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).send(errors.errors[0].msg);
    }
    const { otp, phoneNumber } = req.body;
    const user = await userLogin.findOne({
      where: {
        phoneNumber: phoneNumber,
        isActive: false,
      },
      attributes: {
        exclude: ["passwordHash"],
      },
    });
    if (!user) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }
    if (otp != user.otp) {
      return res.status(400).json({
        errorCode: ERROR_CODES.INVALID_OTP,
        message: ERROR_MESSAGES.INVALID_OTP,
      });
    } else {
      user.isActive = true;
      await user.save();
      const token = generateAccessToken(user.id, phoneNumber);
      const refreshToken = generateRefreshToken(user.id, phoneNumber);

      res.status(200).json({
        id: user.id,
        status: user.isActive,
        role: 1,
        accessToken: token,
        refreshToken: refreshToken,
      });
    }
  } catch (error) {}
};

// USER REGISTER OTP RESEND
const userRegisterOtpResend = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (errors.errors[0].msg.errorCode === ERROR_CODES.USER_NOT_FOUND) {
      return next(res.status(404).json(errors.errors[0].msg));
    } else {
      return next(res.status(400).json(errors.errors[0].msg));
    }
  }
  try {
    const user = await userLogin.findOne({
      where: {
        phoneNumber: req.body.phoneNumber,
      },
      attributes: {
        exclude: ["passwordHash"],
      },
    });
    if (!user) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }
    if (user.isActive == true) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_IS_ALREADY_REGISTERED,
        message: ERROR_MESSAGES.USER_IS_ALREADY_REGISTERED,
      });
    }

    // Call the function to generate an OTP
    const otp = await commonFunctions.generateOTP();

    const result = await twilioSmsService.twilioSendOTP(
      req.body.phoneNumber,
      otp
    ); // // Sending SMS

    // Handle the error here
    if (result instanceof Error) {
      return res
        .status(400)
        .json({ error: "Error sending OTP", message: result.message });
    } else {
      user.otp = otp;
      await user.save();
      return res.status(200).json({
        successCode: 200,
        message: "otp is send to the registered phonenumber given",
      });
    }
  } catch (error) {
    console.log(error, "98u7yt6r5");
    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};

// USER LOGIN
const userLoginData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (errors.errors[0].msg.errorCode === ERROR_CODES.USER_NOT_FOUND) {
      return next(res.status(404).json(errors.errors[0].msg));
    } else {
      return next(res.status(400).json(errors.errors[0].msg));
    }
  }
  try {
    const user = await userLogin.findOne({
      where: {
        phoneNumber: req.body.phoneNumber,
        isActive: true,
      },
      attributes: {
        exclude: ["passwordHash"],
      },
    });
    if (!user) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }
    // Call the function to generate an OTP
    const otp = await commonFunctions.generateOTP();

    const result = await twilioSmsService.twilioSendOTP(
      req.body.phoneNumber,
      otp
    ); // // Sending SMS

    // Handle the error here
    if (result instanceof Error) {
      return res
        .status(400)
        .json({ error: "Error sending OTP", message: result.message });
    } else {
      user.otp = otp;
      await user.save();
      return res.status(200).json({
        successCode: 200,
        message: "otp is send to the registered phonenumber given",
      });
    }
  } catch (error) {
    console.log(error, "98u7yt6r5");
    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};

//USER LOGIN OTP
const userLoginOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).send(errors.errors[0].msg);
    }
    const { otp, phoneNumber } = req.body;
    const user = await userLogin.findOne({
      where: {
        phoneNumber: phoneNumber,
        isActive: true,
      },
      attributes: {
        exclude: ["passwordHash"],
      },
    });
    if (!user) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }
    if (otp != user.otp) {
      return res.status(400).json({
        errorCode: ERROR_CODES.INVALID_OTP,
        message: ERROR_MESSAGES.INVALID_OTP,
      });
    } else {
      const token = generateAccessToken(user.id, phoneNumber);
      const refreshToken = generateRefreshToken(user.id, phoneNumber);

      res.status(200).json({
        id: user.id,
        role: 1,
        status: user.isActive,
        accessToken: token,
        refreshToken: refreshToken,
      });
    }
  } catch (error) {
    console.log(error, "98u7yt6r5");
    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};

//ADD USER DETAILS
const addUserDetails = async (req, res, next) => {
  const fileCategory = "TikTik/ProfileImage";

  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors.errors[0].msg);
    }

    // Check if a file is uploaded
    if (!req.file) {
      return res.status(400).json({
        errorCode: ERROR_CODES.NO_FILE_SELECTED,
        message: ERROR_MESSAGES.NO_FILE_SELECTED,
      });
    }

    // Upload file to S3
    const uploadedFilePath = await uploads.uploadToS3(req.file, fileCategory);
    if (uploadedFilePath instanceof Error) {
      // Handle the error if file upload fails
      return res.status(400).send(uploadedFilePath.message);
    }

    // Construct file path for the uploaded file
    const filePath = process.env.S3_STORAGE_PATH + uploadedFilePath;

    // Destructure user details from request body
    const {
      firstName,
      lastName,
      gender,
      age,
      email,
      userName,
      city,
      language,
    } = req.body;

    // Find user details using the current user's ID
    const userData = await userDetails.findOne({
      where: {
        userLoginId: req.currentUserObj.userID,
        isActive: true,
      },
      include: [userLogin], // Include associations if necessary
    });

    // If user data not found, return an error
    if (!userData) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Construct updated user details object
    const updatedUserDetails = {
      firstName: firstName,
      lastName: lastName,
      gender: gender,
      age: age,
      email: email,
      userName: userName,
      city: city,
      language: language,
      profilePhoto: filePath,
    };

    // Start a Sequelize transaction
    const transaction = await userDetails.sequelize.transaction();

    try {
      // Update user details within the transaction
      await userDetails.update(updatedUserDetails, {
        where: {
          id: userData.id,
        },
        transaction, // Pass transaction to ensure atomicity
      });

      // Commit the transaction
      await transaction.commit();

      // Reload user data after update
      await userData.reload();

      // Send updated user data in response
      return res.status(200).send(userData);
    } catch (error) {
      // Rollback transaction if an error occurs
      await transaction.rollback();
      throw error; // Throw the error to the outer catch block
    }
  } catch (error) {
    console.log(error, "98u7yt6r5");

    // Handle unexpected errors
    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};

//EDIT USER DETAILS
const editUserDetails = async (req, res, next) => {
  const fileCategory = "TikTik/ProfileImage";
  let filePath;

  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors.errors[0].msg);
    }

    // Check if a file is uploaded
    // if (!req.file) {
    //   return res.status(400).json({
    //     errorCode: ERROR_CODES.NO_FILE_SELECTED,
    //     message: ERROR_MESSAGES.NO_FILE_SELECTED,
    //   });
    // }
    if (req.file) {
      // Upload file to S3
      const uploadedFilePath = await uploads.uploadToS3(req.file, fileCategory);
      if (uploadedFilePath instanceof Error) {
        // Handle the error if file upload fails
        return res.status(400).send(uploadedFilePath.message);
      }

      // Construct file path for the uploaded file
      filePath = process.env.S3_STORAGE_PATH + uploadedFilePath;
    }

    // Destructure user details from request body
    const {
      firstName,
      lastName,
      gender,
      age,
      email,
      userName,
      city,
      language,
    } = req.body;

    // Find user details using the current user's ID
    const userData = await userDetails.findOne({
      where: {
        userLoginId: req.currentUserObj.userID,
        isActive: true,
      },
      include: [userLogin], // Include associations if necessary
    });

    // If user data not found, return an error
    if (!userData) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Construct updated user details object
    const updatedUserDetails = {
      firstName: firstName || userData.firstName,
      lastName: lastName || userData.lastName,
      gender: gender || userData.gender,
      age: age || userData.age,
      email: email || userData.email,
      userName: userName || userData.userName,
      city: city || userData.city,
      language: language || userData.language,

      if(filePath) {
        profilePhoto = filePath;
      },
    };

    // Start a Sequelize transaction
    const transaction = await userDetails.sequelize.transaction();

    try {
      // Update user details within the transaction
      await userDetails.update(updatedUserDetails, {
        where: {
          id: userData.id,
        },
        transaction, // Pass transaction to ensure atomicity
      });

      // Commit the transaction
      await transaction.commit();

      // Reload user data after update
      await userData.reload();

      // Send updated user data in response
      return res.status(200).send(userData);
    } catch (error) {
      // Rollback transaction if an error occurs
      await transaction.rollback();
      throw error; // Throw the error to the outer catch block
    }
  } catch (error) {
    console.log(error, "98u7yt6r5");

    // Handle unexpected errors
    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};
//USER ADD BANK DETAILS
const userAddBankDetails = async (req, res, next) => {
  try {
    const { bankAccountNumber, bankIfscCode, pancardNumber } = req.body;
    // const bankAccountDetails = {
    //   name: accountHoldersname,
    //   ifsc: ifscCode,
    //   account_number: accountNumber,
    //   contact: accountHolderPhoneNumber,
    //   pancardNumber,
    // };

    // const virtualAccount = await razorpay.virtualAccounts.create({
    //   account_type: "bank_account",
    //   bank_account: bankAccountDetails,
    // });
    // console.log(virtualAccount, "11111111111");

    // if (virtualAccount && virtualAccount.id) {

    // console.log("Bank account is valid.");
    const customerDetails = await userDetails.findOne({
      where: { userLoginId: req.currentUserObj.userID, isActive: true },
    });
    if (!customerDetails) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }
    customerDetails.pancardNumber =
      pancardNumber || customerDetails.pancardNumber;
    customerDetails.bankAccountNumber =
      bankAccountNumber || customerDetails.bankAccountNumber;
    customerDetails.bankIfscCode = bankIfscCode || customerDetails.bankIfscCode;
    await customerDetails.save();

    return res.status(200).send(customerDetails);
    // } else {
    //   console.log("Bank account is not valid.");
    //   return res.status(400).send("Bank account is not valid.");
    // }
  } catch (error) {
    console.log(error, "09876543");
    // Handle different types of errors, and return an appropriate response

    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};

module.exports = {
  addSuperAdmin,
  login,
  tokenRefresh,
  userRegistration,
  userRegisterOtpVerification,
  userRegisterOtpResend,
  userLoginData,
  userLoginOtp,
  addUserDetails,
  editUserDetails,
  userAddBankDetails,
};
