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
const likeModel = require("../Models/like.model");
const followModel = require("../Models/follow.model");
const profileModel = require("../Models/profile.model");
const postLikeModel = require("../Models/postLike.model");
const userLogin = require("../Models/userLogin.model");
const uploads = require("../Middlewares/multer/multer.middleware");

const commonFunctions = require("../Utils/commonFunctions.utils");
const twilioSmsService = require("../Utils/twilloSmsService.utils");

// Profile Like Api
const profileLike = async (req, res, next) => {
  try {
    const { fromUserId, toUserId, commentMessage } = req.body;

    const fromUser = await userLogin.findOne({
      where: {
        id: fromUserId,
        isActive: true,
      },
      attributes: {
        exclude: ["passwordHash"],
      },
    });

    if (!fromUser) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    const toUser = await userLogin.findOne({
      where: {
        id: toUserId,
        isActive: true,
      },
      attributes: {
        exclude: ["passwordHash"],
      },
    });

    if (!toUser) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Check if a like already exists for the given fromUserId and toUserId
    let existingLike = await likeModel.findOne({
      where: {
        fromUserId: fromUserId,
        toUserId: toUserId,
      },
    });

    if (existingLike) {
      // If like exists, toggle isActive to unlike
      await existingLike.update({
        isActive: !existingLike.isActive,
        commentMessage: commentMessage, // You may want to update the commentMessage as well
        likeDate: new Date(),
      });
      return res.status(200).json({
        message: `User ${
          existingLike.isActive ? "liked" : "unliked"
        } successfully`,
      });
    } else {
      // If like doesn't exist, create a new one
      await likeModel.create({
        fromUserId: fromUserId,
        toUserId: toUserId,
        commentMessage: commentMessage,
        likeDate: new Date(),
        isActive: true,
      });
      return res.status(200).json({
        message: "Profile liked successfully",
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

// Profile Follow Api
const profileFollow = async (req, res, next) => {
  try {
    const { fromUserId, toUserId } = req.body;

    const fromUser = await userLogin.findOne({
      where: {
        id: fromUserId,
        isActive: true,
      },
      attributes: {
        exclude: ["passwordHash"],
      },
    });

    if (!fromUser) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    const toUser = await userLogin.findOne({
      where: {
        id: toUserId,
        isActive: true,
      },
      attributes: {
        exclude: ["passwordHash"],
      },
    });

    if (!toUser) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Check if a like already exists for the given fromUserId and toUserId
    let existingLike = await followModel.findOne({
      where: {
        fromUserId: fromUserId,
        toUserId: toUserId,
      },
    });

    if (existingLike) {
      // If like exists, toggle isActive to unlike
      await existingLike.update({
        isActive: !existingLike.isActive,
        followDate: new Date(),
      });
      return res.status(200).json({
        message: `User ${
          existingLike.isActive ? "followed" : "unfollowed"
        } successfully`,
      });
    } else {
      // If like doesn't exist, create a new one
      await followModel.create({
        fromUserId: fromUserId,
        toUserId: toUserId,
        followDate: new Date(),
        isActive: true,
      });
      return res.status(200).json({
        message: "Profile followed successfully",
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

// Profile Post
const profilePost = async (req, res, next) => {
  const fileCategory = "TikTik/ProfileImage";
  const t = await sequelize.transaction();

  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await t.rollback(); // Rollback the transaction
      return res.status(400).send(errors.errors[0].msg);
    }

    // Check if a file is uploaded
    if (!req.file) {
      await t.rollback(); // Rollback the transaction
      return res.status(400).json({
        errorCode: ERROR_CODES.NO_FILE_SELECTED,
        message: ERROR_MESSAGES.NO_FILE_SELECTED,
      });
    }

    // Upload file to S3
    const uploadedFilePath = await uploads.uploadToS3(req.file, fileCategory);
    if (uploadedFilePath instanceof Error) {
      await t.rollback(); // Rollback the transaction
      return res.status(400).send(uploadedFilePath.message);
    }

    // Construct file path for the uploaded file
    const filePath = process.env.S3_STORAGE_PATH + uploadedFilePath;

    const message = req.body.message;

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
      await t.rollback(); // Rollback the transaction
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Create a new profile post using Sequelize within the transaction
    await profileModel.create(
      {
        message: message,
        userLoginId: req.currentUserObj.userID,
        postImage: filePath,
      },
      { transaction: t }
    );

    await t.commit(); // Commit the transaction

    return res.status(200).json({ message: "Profile added successfully" });
  } catch (error) {
    console.log(error, "98u7yt6r5");
    await t.rollback(); // Rollback the transaction in case of an error
    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};

// Update Profile Post
const updateProfilePost = async (req, res, next) => {
  const fileCategory = "TikTik/ProfileImage";
  const t = await sequelize.transaction();
  let filePath;

  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await t.rollback(); // Rollback the transaction
      return res.status(400).send(errors.errors[0].msg);
    }

    // Upload file to S3
    if (req.file) {
      const uploadedFilePath = await uploads.uploadToS3(req.file, fileCategory);
      if (uploadedFilePath instanceof Error) {
        await t.rollback(); // Rollback the transaction
        return res.status(400).send(uploadedFilePath.message);
      }

      // Construct file path for the uploaded file
      filePath = process.env.S3_STORAGE_PATH + uploadedFilePath;
    }

    const message = req.body.message;
    const postId = req.params.id; // Extract postId from params

    // Find the existing post using postId
    const existingPost = await profileModel.findOne({
      where: {
        id: postId,
        userLoginId: req.currentUserObj.userID, // Ensure the post belongs to the current user
      },
    });

    // If the post is not found or doesn't belong to the user, return an error
    if (!existingPost) {
      await t.rollback(); // Rollback the transaction
      return res.status(400).json({
        errorCode: ERROR_CODES.POST_NOT_FOUND,
        message: ERROR_MESSAGES.POST_NOT_FOUND,
      });
    }

    // Update the existing post using Sequelize within the transaction
    await existingPost.update(
      {
        message: message || existingPost.message,
        postImage: filePath || existingPost.postImage,
      },
      { transaction: t }
    );

    await t.commit(); // Commit the transaction

    return res
      .status(200)
      .json({ message: "Profile post updated successfully" });
  } catch (error) {
    console.log(error, "98u7yt6r5");
    await t.rollback(); // Rollback the transaction in case of an error
    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};
// Profile Post Like Api
const profilePostLike = async (req, res, next) => {
  try {
    // const { toUserId, postId } = req.body;
    const postId = req.params.id;
    const userDetails = await userLogin.findOne({
      where: { id: req.currentUserObj.userID },
    });
    if (!userDetails) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }
    const postDetails = await profileModel.findOne({
      where: { id: postId },

      include: [userLogin],
    });
    if (!postDetails) {
      return res.status(400).json({
        errorCode: ERROR_CODES.POST_NOT_FOUND,
        message: ERROR_MESSAGES.POST_NOT_FOUND,
      });
    }
    const fromUserId = userDetails.id;

    const fromUser = await userLogin.findOne({
      where: {
        id: fromUserId,
        isActive: true,
      },
      attributes: {
        exclude: ["passwordHash"],
      },
    });

    if (!fromUser) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Check if a like already exists for the given fromUserId and toUserId
    let existingLike = await postLikeModel.findOne({
      where: {
        fromUserId: fromUserId,
        toUserId: postDetails.userLoginId,
        profileId: postId,
      },
    });

    if (existingLike) {
      // If like exists, toggle isActive to unlike
      await existingLike.update({
        isActive: !existingLike.isActive,
        likeDate: new Date(),
      });
      return res.status(200).json({
        message: `User ${
          existingLike.isActive ? "liked" : "unliked"
        } successfully`,
      });
    } else {
      // If like doesn't exist, create a new one
      await postLikeModel.create({
        fromUserId: fromUserId,
        toUserId: postDetails.userLoginId,
        profileId: postId,
        likeDate: new Date(),
        isActive: true,
      });
      return res.status(200).json({
        message: "User liked successfully",
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

// get users profile by id
const getUserProfileById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const userDetails = await userLogin.findOne({ where: { id: userId } });
    if (!userDetails) {
      return res.status(400).json({
        errorCode: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }
    const profiles = await profileModel.findAll({
      where: { userLoginId: userId },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).send(profiles);
  } catch (error) {
    return res.status(500).json({
      errorCode: ERROR_CODES.UNEXPECTED_ERROR,
      message: ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
};

module.exports = {
  profileLike,
  profileFollow,
  profilePost,
  updateProfilePost,
  profilePostLike,
  getUserProfileById,
};
