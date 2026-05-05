const express = require("express");
const router = express.Router();
const passport = require("passport");
const users = require("../controllers/users");

router.route("/register").get(users.renderRegister).post(users.register);

router.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "おかえりなさい！！");
    res.redirect("/campgrounds");
  }
);



router.get("/logout", users.logout);

module.exports = router;
