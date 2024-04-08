const express = require("express");
const multer = require("multer");
const authenticate = require("./../authenticate");
const User = require("../models/user");
const cors = require("./cors");

const app = require("../app");
const imagePath = app.imagePath;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname);
  },
});

const imageFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("You can upload only image files!"), false);
  }
  cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter });

const projectRouter = express.Router();
projectRouter
  .route("/")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, authenticate.verifyUser, (req, res) => {
    res.render("profiles/edit_profile", {
      imagePath: imagePath,
      user: req.user,
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /edit_profile");
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    upload.single("file"),
    (req, res, next) => {
      User.findOne({ _id: req.user._id })
        .then((user) => {
          if (user) {
            console.log(req.body);
            if (req.body.userUrl) {
              user.url = req.body.userUrl;
            }
            if (req.body.firstname) {
              user.firstName = req.body.firstname;
            }
            if (req.body.lastname) {
              user.lastName = req.body.lastname;
            }
            if (req.body.username) {
              user.username = req.body.username;
            }
            if (req.file) {
              req.body.files = {
                url: "images/" + req.file.filename,
              };
              user.thumbnail = "images/" + req.file.filename;
            }
            user
              .save()
              .then((user) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.redirect("/");
              })
              .catch((err) => next(err));
          } else {
            err = new Error(`Your account soesn't seem to exist.`);
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));
    }
  )
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("Delete operation not supported on /edit_profile");
  });

module.exports = projectRouter;
