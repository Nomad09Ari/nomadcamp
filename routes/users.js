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

// router
//   .route("/login")
//   .get(users.renderLogin)
//   .post(
//     passport.authenticate("local", {
//       failureFlash: true,
//       failureRedirect: "/login",
//     }),
//     users.login
//   );

router.get("/logout", users.logout);

module.exports = router;
