const { DataTypes } = require('sequelize');
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require('uuid');
const User = require('../Models/userLogin.model');


const like = sequelize.define('like', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(), // Generate a UUID when a super admin is added
        primaryKey: true,
    },
    fromUserId: {
        field: "from_user_id",
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User, // Assuming you have a User model
            key: 'id' // This should match the referenced column in the User model
        }
    },
    toUserId: {
        field: "to_user_id",
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User, // Assuming you have a User model
            key: 'id' // This should match the referenced column in the User model
        }
    },
    commentMessage: {
        field: "commented_message",
        type: DataTypes.STRING,
        allowNull: true,
      
    },
    commentedUserId: {
        field: "commented_user_id",
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: User, // Assuming you have a User model
            key: 'id' // This should match the referenced column in the User model
        }
    },
    likeDate: {
        field: "like_date",
        type: DataTypes.DATE,
        allowNull: false,
        // defaultValue: new Date,
    },
 
    isActive: {
        field: "is_active",
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
  

}, {
    tableName: 'like'
}

)


module.exports = like;