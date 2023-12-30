const { DataTypes } = require('sequelize');
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require('uuid');
const User = require('../Models/userLogin.model');


const follow = sequelize.define('follow', {
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
    followDate: {
        field: "follow_date",
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
    tableName: 'follow'
}

)


module.exports = follow;