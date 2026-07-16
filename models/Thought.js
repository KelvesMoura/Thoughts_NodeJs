const { DataTypes } = require("sequelize");

const db = require("../database/conn");

const User = require("../models/User");

const Thought = db.define("Thought", {
  title: {
    type: DataTypes.STRING,
    require: true,
    allowNull: false,
  },
});

Thought.belongsTo(User);
User.hasMany(Thought);

module.exports = Thought;
