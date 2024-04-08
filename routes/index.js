var express = require("express");
const bcrypt = require("bcrypt");
var router = express.Router();
const User = require("../models/user");
const passport = require("passport");

//auth login
router.get("/login", (req, res) => {
  if (!req.user) {
    res.render("login", { user: req.user });
  } else {
    res.redirect("/dashboard");
  }
});

//auth login
router.post("/login", (req, res, next) => {
  console.log(`1-- Login Header: ${JSON.stringify(req.body)}`);
  passport.authenticate("local", (err, user) => {
    console.log(
      `3-- Passport Authenticate Callback: ${JSON.stringify(user.username)}`
    );
    if (err) {
      console.log("Error!");
    }
    if (!user) {
      console.log("No user available");
    } else {
      req.logIn(user, (err) => {
        res.redirect("/dashboard");
      });
    }
  })(req, res, next);
});

//auth login
router.get("/signup", (req, res) => {
  res.render("signup", { user: req.user });
});

router.post("/signup", (req, res) => {
  User.findOne({ username: req.body.username })
    .then((username) => {
      if (!username) {
        const hashedPassword = bcrypt
          .hash(req.body.password, 10)
          .then((hash) => {
            User.create({
              username: req.body.username,
              password: hash,
            });
          });
      }
    })
    .catch((err) => next(err));
});

//auth logout
router.get("/logout", (req, res) => {
  //handle with passport
  req.logout();
  res.redirect("/");
});

//callback route for google to redirect
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

//callback route for google to redirect
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["profile"] }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

//callback route for google to redirect
router.get(
  "/auth/linkedin/",
  passport.authenticate("linkedin", { scope: ["profile"] }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

router.get("/", (req, res) => {
  if (req.user) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
