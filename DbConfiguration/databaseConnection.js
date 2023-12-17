const { Sequelize} = require('sequelize');
require('dotenv').config();
const DATABASE_NAME = process.env.DATABASE_NAME
const USER_NAME = process.env.USER_NAME
const DB_PASSWORD = process.env.DB_PASSWORD
const HOST=process.env.HOST
const sequelize = new Sequelize(DATABASE_NAME, USER_NAME, DB_PASSWORD, {
  host:HOST,
  dialect: 'mysql',
  logging:false
  
});
sequelize.authenticate()
  .then(()=>{
    console.log("Database connected");
  })
  .catch(err=>{
    console.log("error",err);
  })
  const db = {}

  db.Sequelize = Sequelize
  db.sequelize = sequelize
  db.sequelize.sync({force :false})

module.exports = sequelize;
