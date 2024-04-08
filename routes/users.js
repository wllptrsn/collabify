const express = require("express");
const User = require("../models/user");
const Project = require("../models/project");
const connectionRequest = require("../models/connectionRequest");
const passport = require("passport");
const cors = require("./cors");
const app = require("../app");

imagePath = app.imagePath;

const router = express.Router();

//START
router.get("/", cors.corsWithOptions, function (req, res, next) {
  User.find().then((users) => {
    res.statusCode = 200;
    res.render("users/index", {
      imagePath: imagePath,
      user: req.user,
      userList: users,
    });
  });
});

router.post("/signup", cors.corsWithOptions, (req, res) => {
  User.register(
    new User({
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
    }),
    req.body.password,
    (err, user) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.json({ err: err });
      } else {
        user.save((err) => {
          if (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.json({ err: err });
            return;
          }
          passport.authenticate("local")(req, res, () => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({ success: true, status: "Registration Successful!" });
          });
        });
      }
    }
  );
});
router.get("/login", cors.corsWithOptions, (req, res, next) => {
  res.statusCode = 200;
  res.render("users/login");
});
router.post(
  "/login",
  cors.corsWithOptions,
  passport.authenticate("local"),
  (req, res) => {
    const token = authenticate.getToken({ _id: req.user._id });
    res.statusCode = 200;
    //res.setHeader("Content-Type", "application/json");
    res.json({
      success: true,
      token: token,
      status: "You are successfully logged in!",
    });
    res.render("index");
  }
);

router.get("/logout", cors.corsWithOptions, (req, res, next) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie("session-id");
    res.redirect("/");
  } else {
    const err = new Error("You are not logged in!");
    err.status = 401;
    return next(err);
  }
});
// END
router
  .route("/:userId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    User.findById(req.params.userId).then((userInList) => {
      res.statusCode = 200;
      res.render("users/profile", {
        imagePath: imagePath,
        user: req.user,
        userInList: userInList,
      });
    });
  });

router
  .route("/connect/:userId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    User.findById(req.params.userId).then((userInList) => {
      res.statusCode = 200;
      res.render("users/connect", {
        imagePath: imagePath,
        user: req.user,
        userInList: userInList,
      });
    });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    connectionRequest
      .findOne({
        sender: req.user._id,
        receiver: req.params.userId,
      })
      .then((sent) => {
        connectionRequest
          .findOne({
            receiver: req.user._id,
            sender: req.params.userId,
          })
          .then((inbox) => {
            if (sent) {
              res.redirect("/users");
            } else if (inbox) {
              res.redirect("/requests");
            } else {
              User.findOne({
                _id: req.user._id,
                "connections._id": req.params.userId,
              }).then((connec) => {
                if (connec) {
                  res.redirect("/users/" + req.params.userId);
                } else {
                  req.body.sender = req.user._id;
                  req.body.receiver = req.params.userId;
                  connectionRequest
                    .create(req.body)
                    .then((request) => {
                      res.redirect("/users");
                    })
                    .catch((err) => {
                      console.log("Error: ", err);
                      res.statusCode = 404;
                      next(err);
                    });
                }
              });
            }
          });
      });
  });

module.exports = router;
