const express = require("express");

const Notification = require("../models/notification");
const authenticate = require("./../authenticate");
const cors = require("./cors");
const app = require("../app");

const imagePath = app.imagePath;

const notificationRouter = express.Router();

notificationRouter
  .route("/")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, (req, res, next) => {
    Notification.find({ receiver: req.user })
      .populate("project")
      .populate("sender")
      .then((notifications) => {
        res.render("notifications", {
          imagePath: imagePath,
          user: req.user,
          notifications: notifications,
        });
      });
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Notification.find({ receiver: req.user }).then((notifications) => {
      notifications.forEach((notification) => {
        notification.remove();
        notification.updateOne();
      });
      res.redirect("/notifications");
    });
  });

module.exports = notificationRouter;
