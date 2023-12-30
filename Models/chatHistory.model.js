const { DataTypes } = require("sequelize");
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require("uuid");
// const userDetails = require('../Models/userDetails.model')
// const refferalIncomeHistory=require('../Models/refferalIncomeHistory.model')

const chatHistory = sequelize.define(
  "chat_history",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(), // Generate a UUID when a super admin is added
      primaryKey: true,
    },

    toUserId: {
      field: "to_user_id",
      type: DataTypes.STRING,
      allowNull: false,
    },
    fromUserId: {
      field: "from_user_id",
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      field: "message",
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
    tableName: "chat_history",
  }
);
refferal.hasMany(userDetails)
userDetails.belongsTo(refferal)
refferal.hasMany(refferalIncomeHistory)
refferalIncomeHistory.belongsTo(refferal)

module.exports = chatHistory;
