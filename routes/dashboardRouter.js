const express = require("express");
var Dashboardrouter = express.Router();
const authenticate = require("../authenticate");
const cors = require("./cors");
const Project = require("../models/project");
const app = require("../app");

const imagePath = app.imagePath;

Dashboardrouter.route("/")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, (req, res, next) => {
    Project.find({ members: [req.user._id] })
      .populate("admin")
      .then((projects) => {
        let adminFilter = [];
        projects.forEach((project) => {
          if (!project.admin.equals(req.user._id)) {
            adminFilter.push(project);
          }
        });
        res.statusCode = 200;
        res.render("dashboard", {
          imagePath: imagePath,
          projects: adminFilter,
          user: req.user,
        });
      })
      .catch((err) => next(err));
  });

Dashboardrouter.route("/explore")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, (req, res, next) => {
    Project.find()
      .populate("admin")
      .then((projects) => {
        let adminFilter = [];
        projects.forEach((project) => {
          if (!project.admin.equals(req.user._id)) {
            adminFilter.push(project);
          }
        });
        res.statusCode = 200;
        res.render("dashboard", {
          imagePath: imagePath,
          projects: adminFilter,
          user: req.user,
        });
      })
      .catch((err) => next(err));
  });

Dashboardrouter.route("/yourProjects")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, (req, res, next) => {
    Project.find()
      .populate("admin")
      .then((projects) => {
        let adminFilter = [];
        projects.forEach((project) => {
          if (project.admin.equals(req.user._id)) {
            adminFilter.push(project);
          }
        });
        res.statusCode = 200;
        res.render("dashboard", {
          imagePath: imagePath,
          projects: adminFilter,
          user: req.user,
        });
      })
      .catch((err) => next(err));
  });
module.exports = Dashboardrouter;
