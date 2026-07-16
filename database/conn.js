const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_USER_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  },
);

// try {
//   sequelize.authenticate();
//   console.log("Connection has been established successfully");
// } catch (err) {
//   console.log("Unable to connect to the database", err);
// }

module.exports = sequelize;
