const express = require("express");
const Project = require("../models/project");
const authenticate = require("../authenticate");

const projectRouter = express.Router();

projectRouter
  .route("/")
  .get((req, res, next) => {
    Project.find()
      .populate("posts.author")
      .then((projects) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(projects);
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    req.body.admin = req.user._id;
    Project.create(req.body)
      .then((project) => {
        console.log("Project Created ", project);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(project);
      })
      .catch((err) => next(err));
  })
  .put(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /projects");
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("DELETE operation not supported on /projects");
  });
projectRouter
  .route("/:projectId")
  .get((req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("comments.author")
      .then((project) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(project);
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Project.findById(req.params.projectId)
      .then((project) => {
        req.body.author = req.user._id;
        project.posts.push(req.body);
        project
          .save()
          .then((project) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(project);
          })
          .catch((err) => next(err));
      })
      .catch((err) => next(err));
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    //If user is author of project
    Project.findById(req.params.projectId)
      .then((project) => {
        if (project) {
          if (project.admin.equals(req.user._id)) {
            if (req.body.name) {
              project.name = req.body.name;
            }
            if (req.body.description) {
              project.description = req.body.description;
            }
            if (req.body.type) {
              project.type = req.body.type;
            }
            if (req.body.public) {
              project.public = req.body.public;
            }
            project
              .save()
              .then((project) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(project);
                console.log(project.description);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(
              "You must be the project admin in order to make this change.."
            );
            err.status = 403;
            return next(err);
          }
        } else {
          err = new Error(`Campsite: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    Project.findById(req.params.projectId)
      .then((project) => {
        if (project) {
          if (project.admin.equals(req.user._id)) {
            project
              .remove()
              .then((campsite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json("You have deleted this awful project!");
              })
              .catch((err) => next(err));
          } else {
            err = new Error(
              "You must be the project admin in order to delete this project.."
            );
            err.status = 403;
            return next(err);
          }
        } else {
          err = new Error(`Project: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });
projectRouter
  .route("/:projectId/posts")
  .get((req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("comments.author")
      .then((project) => {
        if (project) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(project.posts);
        } else {
          err = new Error(`Project ${req.params.projectId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `POST operation not supported on /projects/${req.params.projectId}/posts`
    );
  })
  .put(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /projects/${req.params.projectId}/posts`
    );
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `DELETE operation not supported on /projects/${req.params.projectId}/posts`
    );
  });

projectRouter
  .route("/:projectId/posts/:postId")
  .get((req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("comments.author")
      .then((project) => {
        if (project && project.posts.id(req.params.postId)) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(project.posts.id(req.params.postId));
        } else if (!project) {
          err = new Error(`Project: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Post: ${req.params.postId} not found.`);
          err.status = 404;
          return next(err);
        }
      });
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Project.findById(req.params.projectId).then((project) => {
      if (project && project.posts.id(req.params.postId)) {
        req.body.author = req.user._id;
        project.posts.id(req.params.postId).comments.push(req.body);
        project.save().then((post) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(post);
        });
      } else if (!project) {
        err = new Error(`Project: ${req.params.projectId} not found.`);
        err.status = 404;
        return next(err);
      } else {
        err = new Error(`Post: ${req.params.postId} not found.`);
        err.status = 404;
        return next(err);
      }
    });
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    //If user is author of project
    Project.findById(req.params.projectId)
      .then((project) => {
        if (project && project.posts.id(req.params.postId)) {
          if (
            project.posts.id(req.params.postId).author._id.equals(req.user._id)
          ) {
            if (req.body.files) {
              project.posts.id(req.params.postId).files = req.body.files;
            }
            if (req.body.text) {
              project.posts.id(req.params.postId).text = req.body.text;
            }
            project
              .save()
              .then((project) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(project.posts.id(req.params.postId));
              })
              .catch((err) => next(err));
          } else {
            err = new Error(
              "You must be the author of this post in order to make this change.."
            );
            err.status = 403;
            return next(err);
          }
        } else if (!project) {
          err = new Error(`Project: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Post: ${req.params.postId} not found.`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    //If user is author of project
    Project.findById(req.params.projectId)
      .then((project) => {
        if (project && project.posts.id(req.params.postId)) {
          if (
            project.posts.id(req.params.postId).author._id.equals(req.user._id)
          ) {
            project.posts.id(req.params.postId).remove();
            project
              .save()
              .then((project) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(project);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(
              "You must be the author of this post in order to delete.."
            );
            err.status = 403;
            return next(err);
          }
        } else if (!project) {
          err = new Error(`Project: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Post: ${req.params.postId} not found.`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

projectRouter
  .route("/:projectId/posts/:postId/comments")
  .get((req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("comments.author")
      .then((project) => {
        if (project && project.posts.id(req.params.postId).comments) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(project.posts.id(req.params.postId).comments);
        } else if (!project) {
          err = new Error(`Project: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment: ${req.params.postId}/comments not found.`);
          err.status = 404;
          return next(err);
        }
      });
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Project.findById(req.params.projectId).then((project) => {
      if (project && project.posts.id(req.params.postId)) {
        req.body.author = req.user._id;
        project.posts.id(req.params.postId).comments.push(req.body);
        project.save().then((project) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(project.posts.id(req.params.postId).comments);
        });
      } else if (!project) {
        err = new Error(`Project: ${req.params.projectId} not found.`);
        err.status = 404;
        return next(err);
      } else {
        err = new Error(`Post: ${req.params.postId} not found.`);
        err.status = 404;
        return next(err);
      }
    });
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `Put operation not supported on /projects/${req.params.projectId}/posts/${req.params.postId}/comments`
    );
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `Delete operation not supported on /projects/${req.params.projectId}/posts/${req.params.postId}/comments`
    );
  });

projectRouter
  .route("/:projectId/posts/:postId/comments/:commentId")

  .get((req, res, next) => {
    Project.findById(req.params.projectId).then((project) => {
      if (
        project &&
        project.posts.id(req.params.postId).comments.id(req.params.commentId)
      ) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(
          project.posts.id(req.params.postId).comments.id(req.params.commentId)
        );
      } else if (!project) {
        err = new Error(`Project: ${req.params.projectId} not found.`);
        err.status = 404;
        return next(err);
      } else {
        err = new Error(`Post: ${req.params.postId}/comments not found.`);
        err.status = 404;
        return next(err);
      }
    });
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `Post operation not supported on /projects/${req.params.projectId}/posts/${req.params.postId}/comments/${req.params.commentId}`
    );
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    //If user is author of project
    Project.findById(req.params.projectId)
      .then((project) => {
        if (
          project &&
          project.posts.id(req.params.postId).comments.id(req.params.commentId)
        ) {
          if (
            project.posts
              .id(req.params.postId)
              .comments.id(req.params.commentId)
              .author._id.equals(req.user._id)
          ) {
            if (req.body.text) {
              project.posts
                .id(req.params.postId)
                .comments.id(req.params.commentId).text = req.body.text;
            }
            project
              .save()
              .then((project) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(project.posts.id(req.params.postId).comments);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(
              "You must be the author of this comment in order to make this change.."
            );
            err.status = 403;
            return next(err);
          }
        } else if (!project) {
          err = new Error(`Project: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment: ${req.params.commentId} not found.`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    //If user is author of project
    Project.findById(req.params.projectId)
      .then((project) => {
        if (
          project &&
          project.posts.id(req.params.postId).comments.id(req.params.commentId)
        ) {
          if (
            project.posts
              .id(req.params.postId)
              .comments.id(req.params.commentId)
              .author._id.equals(req.user._id)
          ) {
            project.posts
              .id(req.params.postId)
              .comments.id(req.params.commentId)
              .remove();
            project
              .save()
              .then((project) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(project.posts.id(req.params.postId).comments);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(
              "You must be the author of this comment in order to delete.."
            );
            err.status = 403;
            return next(err);
          }
        } else if (!project) {
          err = new Error(`Project: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment: ${req.params.commentId} not found.`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

module.exports = projectRouter;
