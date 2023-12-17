const { DataTypes } = require('sequelize');
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require('uuid');
const userDetails = require('../Models/userDetails.model')
const profile = require('../Models/profile.model')
const refferalIncomeHistory=require('../Models/refferalIncomeHistory.model')




const userLogin = sequelize.define('user_login', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(), // Generate a UUID when a super admin is added
        primaryKey: true,
    },
    phoneNumber: {
        field: "phone_number",
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            args: true,
            msg: "Phone number Already Registered."
        },

    },
    
    otp: {
        field: "otp",
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:0

    },


    passwordHash: {
        field: "password_hash",
        type: DataTypes.STRING,
        allowNull: true,

    },
    onlineStatus: {
        field: "online_status",
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    role: {
        field: "role",
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1
    },
    isActive: {
        field: "is_active",
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

}, {
    tableName: 'user_login'
}

)
userLogin.hasMany(userDetails)
userDetails.belongsTo(userLogin)
userLogin.hasMany(refferalIncomeHistory);
refferalIncomeHistory.belongsTo(userLogin)
userLogin.hasMany(profile)
profile.belongsTo(userLogin)


module.exports = userLogin;