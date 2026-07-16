const User = require("../models/User");

module.exports.checkAuth = async (req, res, next) => {
  try {
    const userid = req.session.userid;

    if (!userid) return res.redirect("/login");

    const checkUser = await User.findByPk(userid);

    if (!checkUser) {
      req.session.destroy(() => {
        res.redirect("/login");
      });
      return;
    }

    next();
  } catch (err) {
    res.status(500).send("Erro no servidor");
  }
};
