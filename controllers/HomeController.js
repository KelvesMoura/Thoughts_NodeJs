const Thought = require("../models/Thought");
const User = require("../models/User");

const { Op } = require("sequelize");

module.exports = class HomeController {
  static async show(req, res) {
    try {
      let search = "";

      if (req.query.search) {
        search = req.query.search;
      }

      let order = "DESC";

      req.query.order === "old" ? (order = "ASC") : (order = "DESC");

      const thoughtsInstance = await Thought.findAll({
        include: User,
        where: {
          title: { [Op.like]: `%${search}%` },
        },
        order: [["createdAt", order]],
      });

      const thoughts = thoughtsInstance.map((el) => el.get({ plain: true }));

      let qtdSearch = thoughts.length;

      let emptyThoughts = false;

      if (thoughts.length == 0) emptyThoughts = true;

      res.render("home", { thoughts, emptyThoughts, search, qtdSearch });
    } catch (err) {
      res.status(500).send("Erro no servidor");
    }
  }
};
