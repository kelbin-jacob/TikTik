const { DataTypes } = require("sequelize");
const sequelize = require("../DbConfiguration/databaseConnection");
const { v4: uuidv4 } = require("uuid");

const incomeHistory = sequelize.define(
  "income_history",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(), // Generate a UUID when a super admin is added
      primaryKey: true,
    },
    price: {
      field: "price",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    requestedDate: {
      field: "requested_date",
      type: DataTypes.DATE,
      allowNull: false,
    },
    creditedDate: {
      field: "credited_date",
      type: DataTypes.DATE,
      allowNull: true,
    },

    status: {
      field: "status",
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      field: "is_active",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "income_history",
  }
);
module.exports = incomeHistory;
