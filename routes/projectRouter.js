const express = require("express");
const multer = require("multer");
const Project = require("../models/project");
const User = require("../models/user");
const Invite = require("../models/invite");
const Notification = require("../models/notification");
const authenticate = require("./../authenticate");
const cors = require("./cors");
const moment = require("moment");
const app = require("../app");

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

const imagePath = app.imagePath;

projectRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    res.redirect("/dashboard/explore");
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("POST operation not supported on /projects");
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /projects");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("DELETE operation not supported on /projects");
  });

projectRouter
  .route("/newProject")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, (req, res, next) => {
    res.render("projects/create", {
      imagePath: imagePath,
      user: req.user,
    });
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Project.findOne({ name: req.body.name })
      .then((projectName) => {
        if (!projectName) {
          req.body.admin = req.user._id;
          req.body.creator = req.user.username;
          Project.create(req.body)
            .then((project) => {
              res.redirect(`${project._id}`);
            })
            .catch((err) => {
              console.log("Error: ", err);
              res.statusCode = 404;
              next(err);
            });
        } else {
          err = new Error(
            `Project name, ${projectName.name} is already taken.`
          );
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /projects");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("DELETE operation not supported on /projects");
  });

projectRouter
  .route("/:projectId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("comments.author")
      .populate("posts.author")
      .populate("post.files")
      .populate("admin")
      .then((project) => {
        res.statusCode = 200;
        res.render("projects/projectId", {
          imagePath: imagePath,
          user: req.user,
          project: project,
          moment: moment,
        });
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    upload.single("file"),
    (req, res, next) => {
      Project.findById(req.params.projectId)
        .then((project) => {
          req.body.author = req.user._id;
          let imageName;
          if (req.file) {
            req.body.files = {
              url: "images/" + req.file.filename,
            };
            imageName = "images/" + req.file.filename;
          }
          project.members.forEach((member) => {
            Notification.create({
              type: "post",
              content: req.body.text,
              file: imageName,
              sender: req.user,
              receiver: member,
              project: project,
            }).then((notification) => {
              notification.save();
            });
          });
          project.posts.push(req.body);
          project
            .save()
            .then((project) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.redirect(`/projects/${req.params.projectId}`);
            })
            .catch((err) => next(err));
        })
        .catch((err) => next(err));
    }
  )
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /projects");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("Delete operation not supported on /projects");
  });
projectRouter
  .route("/:projectId/delete")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Project.findById(req.params.projectId)
      .then((project) => {
        if (project.admin._id.equals(req.user._id)) {
          res.statusCode = 200;
          res.render("projects/delete", {
            imagePath: imagePath,
            project: project,
            user: req.user,
          });
        } else {
          res.statusCode = 200;
          res.redirect("/:projectId");
        }
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Project.findById(req.params.projectId)
      .then((project) => {
        if (project) {
          if (project.admin.equals(req.user._id)) {
            project
              .remove()
              .then((campsite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.redirect("/");
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
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /projects");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("Delete operation not supported on /projects");
  });
projectRouter
  .route("/:projectId/edit")
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Project.findById(req.params.projectId)
      .then((project) => {
        if (project.admin._id.equals(req.user._id)) {
          res.statusCode = 200;
          res.render("projects/edit", {
            imagePath: imagePath,
            project: project,
            user: req.user,
          });
        } else {
          res.statusCode = 200;
          res.redirect("/:projectId");
        }
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
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
                res.redirect(`/projects/${req.params.projectId}`);
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
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /projects");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("Delete operation not supported on /projects");
  });
projectRouter
  .route("/:projectId/posts")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("comments.author")
      .populate("posts.author")
      .then((project) => {
        if (project) {
          res.statusCode = 200;
          res.render("projects/posts/index", {
            imagePath: imagePath,
            project: project,
            user: req.user,
          });
        } else {
          err = new Error(`Project ${req.params.projectId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `POST operation not supported on /projects/${req.params.projectId}/posts`
    );
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /projects/${req.params.projectId}/posts`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `DELETE operation not supported on /projects/${req.params.projectId}/posts`
    );
  });

projectRouter
  .route("/:projectId/posts/:postId")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("posts.comments.author")
      .populate("posts.author")
      .then((project) => {
        if (project && project.posts.id(req.params.postId)) {
          res.statusCode = 200;
          res.render("projects/posts/postId", {
            imagePath: imagePath,
            post: project.posts.id(req.params.postId),
            project: project,
            user: req.user,
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
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Project.findById(req.params.projectId).then((project) => {
      if (project && project.posts.id(req.params.postId)) {
        project.members.forEach((member) => {
          Notification.create({
            type: "comment",
            content: req.body.text,
            sender: req.user,
            receiver: member,
            project: project,
          });
        });
        req.body.author = req.user._id;
        project.posts.id(req.params.postId).comments.push(req.body);
        project.save().then((post) => {
          res.statusCode = 200;
          res.redirect(`/projects/${req.params.projectId}`);
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
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /projects/${req.params.projectId}/posts`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`Delete operation not supported`);
  });
projectRouter
  .route("/:projectId/posts/:postId/edit")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("comments.author")
      .populate("posts.author")
      .then((project) => {
        if (project && project.posts.id(req.params.postId)) {
          res.statusCode = 200;
          res.render("projects/posts/edit", {
            imagePath: imagePath,
            post: project.posts.id(req.params.postId),
            user: req.user,
            project: project,
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
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    upload.single("file"),
    (req, res, next) => {
      Project.findById(req.params.projectId)
        .then((project) => {
          if (project && project.posts.id(req.params.postId)) {
            if (
              project.posts
                .id(req.params.postId)
                .author._id.equals(req.user._id)
            ) {
              // if (req.file) {
              //   req.body.files = {
              //     url: "images/" + req.file.filename,
              //   };
              if (req.file) {
                project.posts.id(req.params.postId).files = {
                  url: "images/" + req.file.filename,
                };
              }
              if (req.body.text) {
                project.posts.id(req.params.postId).text = req.body.text;
              }
              project
                .save()
                .then((project) => {
                  res.statusCode = 200;
                  res.redirect(`/projects/${req.params.projectId}`);
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
    }
  )
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /projects/${req.params.projectId}/posts`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`Delete operation not supported`);
  });
projectRouter
  .route("/:projectId/posts/:postId/delete")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("comments.author")
      .populate("posts.author")
      .then((project) => {
        if (project && project.posts.id(req.params.postId)) {
          res.statusCode = 200;
          res.render("projects/posts/delete", {
            imagePath: imagePath,
            post: project.posts.id(req.params.postId),
            user: req.user,
            project: project,
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
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
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
                res.redirect(`/projects/${project._id}`);
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
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /projects/${req.params.projectId}/posts`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`Delete operation not supported`);
  });

projectRouter
  .route("/:projectId/posts/:postId/comments")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("posts.comments.author")
      .then((project) => {
        if (project && project.posts.id(req.params.postId).comments) {
          res.statusCode = 200;
          res.render("projects/comments/index", {
            imagePath: imagePath,
            post: project.posts.id(req.params.postId),
            project: project,
            user: req.user,
          });
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
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
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
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `Put operation not supported on /projects/${req.params.projectId}/posts/${req.params.postId}/comments`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `Delete operation not supported on /projects/${req.params.projectId}/posts/${req.params.postId}/comments`
    );
  });

projectRouter
  .route("/:projectId/posts/:postId/comments/:commentId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("posts.comments.author")
      .populate("posts.author")
      .then((project) => {
        if (
          project &&
          project.posts.id(req.params.postId).comments.id(req.params.commentId)
        ) {
          res.statusCode = 200;
          res.render("projects/comments/commentId", {
            imagePath: imagePath,
            post: project.posts.id(req.params.postId),
            comment: project.posts
              .id(req.params.postId)
              .comments.id(req.params.commentId),
            project: project,
            user: req.user,
          });
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
  .post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `Post operation not supported on /projects/${req.params.projectId}/posts/${req.params.postId}/comments/${req.params.commentId}`
    );
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end("Put operation not supported");
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end("DELETE operation not supported");
  });

projectRouter
  .route("/:projectId/posts/:postId/comments/:commentId/edit")
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("posts.comments.author")
      .populate("posts.author")
      .then((project) => {
        if (
          project &&
          project.posts.id(req.params.postId).comments.id(req.params.commentId)
        ) {
          res.statusCode = 200;
          res.render("projects/comments/edit", {
            imagePath: imagePath,
            post: project.posts.id(req.params.postId),
            comment: project.posts
              .id(req.params.postId)
              .comments.id(req.params.commentId),
            project: project,
            user: req.user,
          });
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
  .post(cors.corsWithOptions, (req, res, next) => {
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
                res.redirect(
                  `/projects/${req.params.projectId}/posts/${req.params.postId}`
                );
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
  .put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end("Put operation not supported");
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end("DELETE operation not supported");
  });
projectRouter
  .route("/:projectId/posts/:postId/comments/:commentId/delete")
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("posts.comments.author")
      .populate("posts.author")
      .then((project) => {
        if (
          project &&
          project.posts.id(req.params.postId).comments.id(req.params.commentId)
        ) {
          res.statusCode = 200;
          res.render("projects/comments/delete", {
            imagePath: imagePath,
            post: project.posts.id(req.params.postId),
            comment: project.posts
              .id(req.params.postId)
              .comments.id(req.params.commentId),
            project: project,
            user: req.user,
          });
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
  .post(cors.corsWithOptions, (req, res, next) => {
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
                res.redirect(
                  `/projects/${req.params.projectId}/posts/${req.params.postId}`
                );
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
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end("Put operation not supported");
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end("DELETE operation not supported");
  });
projectRouter
  .route("/:projectId/invites")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .then((project) => {
        if (project && project.admin.equals(req.user._id)) {
          User.find().then((userList) => {
            res.statusCode = 200;
            res.render("projects/invites/index", {
              imagePath: imagePath,
              user: req.user,
              usersList: userList,
              project: project,
            });
          });
        } else if (!project) {
          err = new Error(`Project ${req.params.projectId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(
            `You must be the admin of this project in order to invite users.`
          );
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `POST operation not supported on /projects/${req.params.projectId}/invites`
    );
  })
  .put(cors.corsWithOptions, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /projects/${req.params.projectId}/invites`
    );
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `DELETE operation not supported on /projects/${req.params.projectId}/invites`
    );
  });

projectRouter
  .route("/:projectId/invites/:userId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .then((project) => {
        if (project) {
          if (project.admin.equals(req.user._id)) {
            res.statusCode = 200;
            res.render("projects/invites/userId", {
              imagePath: imagePath,
              user: req.user,
              project: req.params.projectId,
              inviteReceiver: req.params.userId,
            });
          } else {
            err = new Error(
              "You must be the admin of this project in order to view invitations.."
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
      .catch((err) => {
        return next(err);
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    Project.findById(req.params.projectId).then((project) => {
      if (project) {
        Invite.findOne({
          sender: req.user._id,
          receiver: req.params.userId,
          project: project._id,
        }).then((invite) => {
          if (!invite) {
            req.body.sender = req.user._id;
            req.body.receiver = req.params.userId;
            req.body.project = req.params.projectId;
            Invite.create(req.body).then((invite) => {
              res.redirect(`/projects/${project._id}/invites`);
            });
          }
        });
      }
    });
  })
  .put(cors.corsWithOptions, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /projects/${req.params.projectId}/invites/${req.params.inviteId}`
    );
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `Delete operation not supported on /projects/${req.params.projectId}/invites/${req.params.userId}`
    );
  });

projectRouter
  .route("/:projectId/invites/users/:invitationId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("invites.receiver")
      .then((project) => {
        if (project && project.invites.id(req.params.invitationId)) {
          if (project.admin.equals(req.user._id)) {
            res.statusCode = 200;
            res.render("projects/invites/inviteId", {
              imagePath: imagePath,
              user: req.user,
              project: project,
              invite: project.invites.id(req.params.invitationId),
            });
          } else {
            err = new Error(
              "You must be the admin of this project in order to view invitations.."
            );
            err.status = 403;
            return next(err);
          }
        } else if (!project) {
          err = new Error(`Project: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(
            `An invitation for User: ${req.params.invitationId} not found.`
          );
          err.status = 404;
          return next(err);
        }
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `Post operation not supported on /projects/${req.params.projectId}/invites/users/${req.params.invitationId}`
    );
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /projects/${req.params.projectId}/invites/users/${req.params.invitationId}`
    );
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `DELETE operation not supported on /projects/${req.params.projectId}/invites/users/${req.params.invitationId}`
    );
  });
projectRouter
  .route("/:projectId/invites/users/:invitationId/delete")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Project.findById(req.params.projectId)
      .populate("invites.receiver")
      .then((project) => {
        if (project && project.invites.id(req.params.invitationId)) {
          if (project.admin.equals(req.user._id)) {
            res.statusCode = 200;
            res.render("projects/invites/inviteDelete", {
              imagePath: imagePath,
              user: req.user,
              project: project,
              invite: project.invites.id(req.params.invitationId),
            });
          } else {
            err = new Error(
              "You must be the admin of this project in order to view invitations.."
            );
            err.status = 403;
            return next(err);
          }
        } else if (!project) {
          err = new Error(`Project: ${req.params.projectId} not found.`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(
            `An invitation for User: ${req.params.invitationId} not found.`
          );
          err.status = 404;
          return next(err);
        }
      });
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    Project.findById(req.params.projectId).then((project) => {
      if (project && project.invites.id(req.params.invitationId)) {
        if (project.admin.equals(req.user._id)) {
          project.invites.id(req.params.invitationId).remove();
          project
            .save()
            .then((project) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.redirect(`/projects/${req.params.projectId}/invites`);
            })
            .catch((err) => next(err));
        } else {
          err = new Error(
            "You must be the admin of this project in order to delete invitations.."
          );
          err.status = 403;
          return next(err);
        }
      } else if (!project) {
        err = new Error(`Project: ${req.params.projectId} not found.`);
        err.status = 404;
        return next(err);
      } else {
        err = new Error(`Invitation: ${req.params.projectId} not found.`);
        err.status = 404;
        return next(err);
      }
    });
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /projects/${req.params.projectId}/invites/users/${req.params.invitationId}`
    );
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `DELETE operation not supported on /projects/${req.params.projectId}/invites/users/${req.params.invitationId}`
    );
  });
module.exports = projectRouter;
