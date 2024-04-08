var createError = require("http-errors");
var express = require("express");
var path = require("path");
var logger = require("morgan");
const bp = require("body-parser");

const methodOverride = require("method-override");
const passport = require("passport");
const keys = require("./config/keys");
const cookieSession = require("cookie-session");

var app = express();

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const profileRouter = require("./routes/profileRouter");
const dashboardRouter = require("./routes/dashboardRouter");
const projectRouter = require("./routes/projectRouter");
const requestRouter = require("./routes/requestRouter");
const notificationRouter = require("./routes/notificationRouter");
const connectionRouter = require("./routes/connectionRouter");
const mongoose = require("mongoose");

const url = keys.mongodb.dbURI;
const connect = mongoose.connect(url, {
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

connect.then((err) => console.log(err));
// view engine setup
app.set("views", path.join(__dirname, "views"));
//3-13-2024
const imagePath = path.join(__dirname, "public", "images");
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "app-auth",
    maxAge: keys.session.maxAge,
    keys: [keys.session.cookieKey],
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);
app.use("/users", usersRouter);

app.use(express.static("public"));
app.use("/editProfile", profileRouter);
app.use("/dashboard", dashboardRouter);
app.use("/projects", projectRouter);
app.use("/requests", requestRouter);
app.use("/notifications", notificationRouter);
app.use("/connections", connectionRouter);

//Secure traffic only
app.all("*", (req, res, next) => {
  if (req.secure) {
    return next();
  } else {
    console.log(
      `Redirecting to https://${req.hostname}:${app.get("secPort")}${req.url}`
    );
    res.redirect(
      301,
      `https://${req.hostname}:${app.get("secPort")}${req.url}`
    );
  }
});

app.use(methodOverride("_method"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err);
  res.render("error", { err: err.message });
});

module.exports = app;
