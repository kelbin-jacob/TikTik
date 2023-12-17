require("dotenv").config();
const bcrypt = require("bcryptjs");
const superAdmin = require("../../Models/superAdmin.model");
const jwt = require("jsonwebtoken");
const errorCodes = require("../../Utils/errorCodes.utils");
const errorMessages = require("../../Utils/errormessages.utils");
const userDetails = require("../../Models/userDetails.model");
const userLogin = require("../../Models/userLogin.model");

// currentuser interceptor for Super Admin
const currentUserAdmin = async (req, res, next) => {
  try {
    console.log(req.originalUrl, "$$$$$$$$$$$$$$$$$");
    const token = req.headers["authorization"];
    if (!token) {
      return next(
        res.status(401).json({
          errorCode: errorCodes.AUTH_HEADER_MISSING,
          message: errorMessages.AUTH_HEADER_MISSING,
        })
      );
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await superAdmin.findOne({
      where: {
        id: decoded.id,
        isActive: true,
      },
    });
    if (!user) {
      return next(
        res.status(401).json({
          errorCode: errorCodes.INVALID_TOKEN,
          message: errorMessages.INVALID_TOKEN,
        })
      );
    }
    const currentAdminObj = {
      userID: user.id,
      email: user.email,
      userName: user.userName,
      refferalCode: user.refferalCode,
      status: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    req.currentAdminObj = currentAdminObj;

    const validPassword = await bcrypt.compare(decoded.password, user.password);
    if (!validPassword) {
      return next(
        res.status(401).json({
          errorCode: errorCodes.INVALID_TOKEN,
          message: errorMessages.INVALID_TOKEN,
        })
      );
    }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(
        res.status(401).json({
          errorCode: errorCodes.TOKEN_EXPIRED,
          message: errorMessages.TOKEN_EXPIRED,
        })
      );
    }
    return next(
      res.status(401).json({
        errorCode: errorCodes.UNAUTHORISED_ACCESS,
        message: errorMessages.UNAUTHORISED_ACCESS,
      })
    );
  }
};

// currentuser interceptor for User
const currentUser = async (req, res, next) => {
  
    try {
    console.log(req.originalUrl, "$$$$$$$$$$$$$$$$$");
    const token = req.headers["authorization"];
    if (!token) {
      return next(
        res.status(401).json({
          errorCode: errorCodes.AUTH_HEADER_MISSING,
          message: errorMessages.AUTH_HEADER_MISSING,
        })
      );
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log(decoded,"3223");

   const user = await userDetails.findOne({
      where: {
        userLoginId: decoded.id,
        isActive: true,
      },
      include:[userLogin]
    });
    console.log(user.user_login,"fff");
    if (!user) {
      return next(
        res.status(401).json({
          errorCode: errorCodes.INVALID_TOKEN,
          message: errorMessages.INVALID_TOKEN,
        })
      );
    }
    const currentUserObj = {
      userID: user.userLoginId,
      email: user.email,
      userName: user.userName,
      refferalCode: user.refferalCode,
      status: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    req.currentUserObj = currentUserObj;

    // const validPassword = await bcrypt.compare(decoded.password, user.user_login.passwordHash);
    // if (!validPassword) {
    //   return next(
    //     res.status(401).json({
    //       errorCode: errorCodes.INVALID_TOKEN,
    //       message: errorMessages.INVALID_TOKEN,
    //     })
    //   );
    // }
    next();
  } catch (error) {
    console.log(error,"323");
    if (error.name === "TokenExpiredError") {
      return next(
        res.status(401).json({
          errorCode: errorCodes.TOKEN_EXPIRED,
          message: errorMessages.TOKEN_EXPIRED,
        })
      );
    }
    return next(
      res.status(401).json({      
        errorCode: errorCodes.UNAUTHORISED_ACCESS,
        message: errorMessages.UNAUTHORISED_ACCESS,
      })
    );
  }
};

module.exports = {
  currentUserAdmin,
  currentUser,
};
