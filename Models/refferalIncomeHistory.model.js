const { DataTypes } = require('sequelize');
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require('uuid');


const refferalIncomeHistory = sequelize.define('refferal_income_history', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(), // Generate a UUID when a super admin is added
        primaryKey: true,
    },

    income:{
        field: "income",  
        type: DataTypes.STRING,
        allowNull: false,
    
    },
    userType: {
        field: "user-type",
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
    },
    isActive: {
        field: "is_active",
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
 
}, {
    tableName: 'refferal_income_history'
}

)

module.exports = refferalIncomeHistory;