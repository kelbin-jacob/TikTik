const { DataTypes } = require("sequelize");
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require("uuid");


const userDetails = sequelize.define(
  "user_details",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(), // Generate a UUID when a super admin is added
      primaryKey: true,
    },
    firstName: {
      field: "first_name",
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      field: "last_name",
      type: DataTypes.STRING,
      allowNull: true,
    },
    profilePhoto: {
        field: "profile_photo",
        type: DataTypes.STRING,
        allowNull: true,
      },
    gender: {
        field: "gender",
        type: DataTypes.STRING,
        allowNull: true,
      },
      age: {
        field: "age",
        type: DataTypes.INTEGER,
        allowNull: true,
      },

    email: {
      field: "email",
      type: DataTypes.STRING,
      allowNull: true,
      unique: {
        args: true,
        msg: "email Already Registered.",
      },
    },
  
    userName: {
      field: "user_name",
      type: DataTypes.STRING,
      allowNull: true,
      unique: {
        args: true,
        msg: "username Already Registered.",
      },
    },

    refferalCode: {
      field: "refferal_code",
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalAmount: {
      field: "total_amount",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    kycVerified: {
      field: "kyc_verified",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    bankAccountNumber: {
      field: "bank_account_number",
      type: DataTypes.STRING,
      allowNull: true,
    },
    pancardNumber: {
      field: "pancard_number",
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankIfscCode: {
      field: "bank_ifsc_code",
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankAccountVerified: {
      field: "bank_verified",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    role: {
        field: "role",
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },

    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "user_details",
  }
);

module.exports = userDetails;
