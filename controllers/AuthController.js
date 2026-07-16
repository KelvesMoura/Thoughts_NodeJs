const { raw } = require("express");
const User = require("../models/User");

const bcrypt = require("bcryptjs");

module.exports = class AuthController {
  static login(req, res) {
    res.render("auth/login");
  }

  static register(req, res) {
    res.render("auth/register");
  }

  static async registerPost(req, res) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        req.flash("message", "As senhas não conferem, tente novamente");
        res.render("auth/register");
        return;
      }

      const checkUser = await User.findOne({
        where: { email: email },
        raw: true,
      });

      if (checkUser) {
        req.flash("message", "E-mail já esta cadastrado");
        res.render("auth/register");
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const user = {
        name: name,
        email: email,
        password: hash,
      };

      const createUser = await User.create(user);

      req.session.userid = createUser.id;

      req.flash("message", "Cadastro realizado com sucesso!");

      req.session.save(() => {
        res.redirect("/");
      });
    } catch (err) {
      res.status(500).send("Erro no servidor");
    }
  }

  static logout(req, res) {
    const { userid } = req.session;

    if (userid) {
      req.session.destroy(() => {
        res.redirect("/login");
      });
    }
  }

  static async loginPost(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email: email }, raw: true });

      if (!user) {
        req.flash("message", "Usuário não está cadastrado");
        res.render("auth/login");
        return;
      }

      const checkPassword = await bcrypt.compare(password, user.password);

      if (!checkPassword) {
        req.flash("message", "Senha incorreta!");
        res.render("auth/login");
        return;
      }

      req.session.userid = user.id;

      req.flash("message", "Usuário logado com sucesso!");

      req.session.save((err) => {
        if (err) {
          console.log("Erro ao salvar sessão:", err);
          return res.status(500).send("Erro no servidor");
        }
        res.redirect("/");
      });
    } catch (err) {
      res.status(500).send("Erro no servidor");
    }
  }
};
