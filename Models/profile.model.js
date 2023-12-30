const { DataTypes } = require("sequelize");
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require("uuid");
const postLikeModel=require('../Models/postLike.model')

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
    message: {
      field: "message",
      type: DataTypes.STRING,
      allowNull: true,
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
profile.hasMany(postLikeModel)
postLikeModel.belongsTo(profile)


module.exports = profile;