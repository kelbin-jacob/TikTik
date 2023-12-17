const { DataTypes } = require("sequelize");
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require("uuid");
// const userDetails = require('../Models/userDetails.model')
// const refferalIncomeHistory=require('../Models/refferalIncomeHistory.model')

const profile = sequelize.define(
  "profile",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(), // Generate a UUID when a super admin is added
      primaryKey: true,
    },
    postImage: {
      field: "post_image",
      type: DataTypes.STRING,
      allowNull: false,
    },

    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "profile",
  }
);


module.exports = profile;