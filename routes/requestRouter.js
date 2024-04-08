const express = require("express");
const Project = require("../models/project");
const User = require("../models/user");
const Invite = require("../models/invite");
const connectionRequest = require("../models/connectionRequest");
const cors = require("./cors");
const app = require("../app");

const imagePath = app.imagePath;

const requestRouter = express.Router();

requestRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    res.statusCode = 200;
    res.redirect("/requests/connectionRequests");
  });
requestRouter
  .route("/connectionRequests")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    connectionRequest
      .find({ receiver: req.user._id })
      .populate("sender")
      .then((request) => {
        if (request) {
          res.render("requests/connections", {
            imagePath: imagePath,
            requests: request,
            user: req.user,
          });
        }
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end("POST operation not supported on /requests");
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /requests/`);
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation not supported on /requests/`);
  });
requestRouter
  .route("/connectionRequests/:userId/accept")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    connectionRequest
      .findOne({
        sender: req.params.userId,
        receiver: req.user._id,
      })
      .populate("sender")
      .then((invite) => {
        if (invite) {
          res.render("requests/connectionAccept", {
            imagePath: imagePath,
            user: req.user,
            sender: invite.sender,
          });
        } else {
          console.log(invite);
        }
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    User.findById(req.params.userId).then((sender) => {
      connectionRequest
        .findOne({ sender: sender._id, receiver: req.user._id })
        .then((request) => {
          if (request) {
            console.log("request exists");
            sender.connections.push(req.user._id);
            req.user.connections.push(sender._id);
            req.user.save();
            sender.save().then(() => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.redirect(`/requests`);
            });

            request.remove();
          } else {
            console.log("request not found");
          }
        });
    });
  });
requestRouter
  .route("/connectionRequests/:userId/decline")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    connectionRequest
      .findOne({
        sender: req.params.userId,
        receiver: req.user._id,
      })
      .populate("sender")
      .then((request) => {
        if (request) {
          res.render("requests/connectionDecline", {
            imagePath: imagePath,
            user: req.user,
            receiver: req.user._id,
            sender: request.sender,
          });
        }
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    connectionRequest
      .findOne({
        receiver: req.user._id,
        sender: req.params.userId,
      })
      .populate("project")
      .then((request) => {
        if (request) {
          request.remove();
          request.updateOne().then(() => {
            res.statusCode = 200;
            res.redirect(`/requests/connectionRequests`);
          });
        } else {
          console.log("request not found");
        }
      });
  });
requestRouter
  .route("/sent")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    connectionRequest
      .find({ sender: req.user._id })
      .populate("receiver")
      .then((request) => {
        if (request) {
          res.render("requests/connectionsPending", {
            imagePath: imagePath,
            requests: request,
            user: req.user,
          });
        }
      });
  });
requestRouter
  .route("/projectInvitations")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Invite.find({ receiver: req.user._id })
      .populate("sender")
      .populate("project")
      .then((invite) => {
        if (invite) {
          res.render("requests/projectInvitations", {
            imagePath: imagePath,
            invites: invite,
            user: req.user,
          });
        }
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end("POST operation not supported on /projects");
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /requests/${invitationId}`);
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(`DELETE operation not supported on /requests/${invitationId}`);
  });

requestRouter
  .route("/projectInvitations/:invitationId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Project.findOne({ "invites._id": req.params.invitationId })
      .then((request) => {
        if (request) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          console.log(request);
          res.json(request.invites.id(req.params.invitationId));
        } else {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          console.log(request);
          res.end("No current invitations pending");
        }
      })
      .catch((err) => {
        return next(err);
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end("POST operation not supported on /projects");
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /requests/${invitationId}`);
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    //If user is author of project
    Project.findOne({ "invites._id": req.params.invitationId })
      .then((request) => {
        if (request && request.invites.id(req.params.invitationId)) {
          request.invites.id(req.params.invitationId).remove();
          request
            .save()
            .then((request) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(route("/").get);
            })
            .catch((err) => next(err));
          ///
        } else {
          err = new Error(`Invitation not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

requestRouter
  .route("/projectInvitations/:projectId/accept")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Invite.findOne({
      project: req.params.projectId,
      receiver: req.user._id,
    })
      .populate("sender")
      .then((invite) => {
        if (invite) {
          res.render("requests/projectAccept", {
            imagePath: imagePath,
            user: req.user,
            sender: invite.sender,
          });
        } else {
          console.log("No invites available.");
        }
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    Invite.findOne({
      project: req.params.projectId,
      receiver: req.user._id,
    })
      .populate("project")
      .then((invite) => {
        if (invite) {
          invite.project.members.push(req.user._id);
          invite.remove();
          invite.updateOne();
          invite.project.save().then(() => {
            res.statusCode = 200;
            res.redirect(`/projects/${req.params.projectId}`);
          });
        } else {
          console.log("request not found");
        }
      });
  });

requestRouter
  .route("/projectInvitations/:projectId/decline")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Invite.findOne({
      project: req.params.projectId,
      receiver: req.user._id,
    })
      .populate("sender")
      .then((invite) => {
        if (invite) {
          res.render("requests/projectDecline", {
            imagePath: imagePath,
            project: invite.project,
            user: req.user,
            sender: invite.sender,
          });
        } else {
          console.log("No invite found.");
        }
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    Invite.findOne({
      project: req.params.projectId,
      receiver: req.user._id,
    })
      .populate("project")
      .then((invite) => {
        if (invite) {
          invite.remove();
          invite.updateOne().then(() => {
            res.statusCode = 200;
            res.redirect(`/requests/projectInvitations`);
          });
        } else {
          console.log("request not found");
        }
      });
  });

module.exports = requestRouter;
