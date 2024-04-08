const express = require("express");
const User = require("../models/user");
const cors = require("./cors");

const connectionRouter = express.Router();

connectionRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    User.findById(req.user._id)
      .populate("connections._id")
      .then((user) => {
        res.statusCode = 200;
        res.render("connections", { user: user });
      });
  });

module.exports = connectionRouter;
