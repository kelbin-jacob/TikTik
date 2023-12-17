const { DataTypes } = require('sequelize');
const sequelize = require('../DbConfiguration/databaseConnection');
const { v4: uuidv4 } = require('uuid');



const superAdmin = sequelize.define('super_admin', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(), // Generate a UUID when a super admin is added
        primaryKey: true,
      },

    userName: {
        field: "user_name",
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            args: true,
            msg: "username Already Registered."
        },
    },
    passwordHash: {
        field: "password_hash",
        type: DataTypes.STRING,
        allowNull: false,
     
    },
    email: {
        field: "email",
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            args: true,
            msg: "email Already Registered."
        },
    },
    refferalCode: {
        field: "refferal_code",
        type: DataTypes.STRING,
        allowNull: false,
    
    },
    totalAmount: {
        field: "total_amount",
        type: DataTypes.INTEGER,
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
    tableName: 'super_admin'
}

)



module.exports = superAdmin;