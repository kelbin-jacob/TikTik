const { DataTypes } = require('sequelize');
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require('uuid');
const userDetails = require('../Models/userDetails.model')
const refferalIncomeHistory=require('../Models/refferalIncomeHistory.model')

const refferal = sequelize.define('refferal', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(), // Generate a UUID when a super admin is added
        primaryKey: true,
    },

    refferalType: {
        field: "refferal_type",
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
      

    },
    refferalCode: {
        field: "refferal_code",  //enum created in utils
        type: DataTypes.STRING,
        allowNull: false,
    
    },
    refferedUserId: {
        field: "reffered_userid",  
        type: DataTypes.STRING,
        allowNull: false,
    
    },
    isActive: {
        field: "is_active",
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    refferalDate: {
        field: "refferal_date",
        type: DataTypes.DATEONLY,
        allowNull: false,
    },

}, {
    tableName: 'refferal'
}

)
refferal.hasMany(userDetails)
userDetails.belongsTo(refferal)
refferal.hasMany(refferalIncomeHistory)
refferalIncomeHistory.belongsTo(refferal)

module.exports = refferal;