const { raw } = require("express");
const Thought = require("../models/Thought");

module.exports = class ThoughtController {
  static async show(req, res) {
    try {
      const userid = req.session.userid;

      const thoughts = await Thought.findAll({
        where: { UserId: userid },
        raw: true,
      });

      let emptyThoughts = false;

      if (thoughts.length === 0) emptyThoughts = true;

      res.render("thoughts/dashboard", { thoughts, emptyThoughts });
    } catch (err) {
      res.status(500).send("Erro no servidor");
    }
  }

  static createThought(req, res) {
    res.render("thoughts/create");
  }

  static async createThoughtPost(req, res) {
    try {
      const { title } = req.body;

      const userid = req.session.userid;

      await Thought.create({ title: title, UserId: userid });

      req.flash("message", "Pensamento criado com sucesso");

      req.session.save(() => {
        res.redirect("/thoughts/dashboard");
      });
    } catch (err) {
      res.status(500).send("Erro no servidor");
    }
  }

  static async deleteThought(req, res) {
    try {
      const id = req.body.id;

      const userid = req.session.userid;

      await Thought.destroy({ where: { id: id, UserId: userid } });

      req.flash("message", "Pensamento removido com sucesso");

      req.session.save(() => {
        res.redirect("/thoughts/dashboard");
      });
    } catch (err) {
      res.status(500).send("Erro no servidor");
    }
  }

  static async editThought(req, res) {
    try {
      const { id } = req.params;

      const thought = await Thought.findOne({ where: { id: id }, raw: true });

      res.render("thoughts/edit", { thought });
    } catch (err) {
      res.status(500).send("Erro no servidor");
    }
  }

  static async editThoughtPost(req, res) {
    try {
      const { id, title } = req.body;

      const thought = await Thought.update(
        { title: title },
        { where: { id: id } },
      );

      req.flash("message", "Pensamento atualizado com sucesso");

      req.session.save(() => {
        res.redirect("/thoughts/dashboard");
      });
    } catch (err) {
      res.status(500).send("Erro no servidor");
    }
  }
};
