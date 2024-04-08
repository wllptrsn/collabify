const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const FacebookStrategy = require("passport-facebook");
const LocalStrategy = require("passport-local");
const LinkedinStrategy = require("passport-linkedin-oauth2").Strategy;
const keys = require("./config/keys");
const User = require("./models/user");
const bcrypt = require("bcrypt");

passport.serializeUser((user, done) => {
  console.log(`4-- Serialize User: ${JSON.stringify(user.username)}`);
  return done(null, user);
});
passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      //options for google strategy
      callbackURL: "https://localhost:3443/auth/google",
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret,
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ googleId: profile.id }).then((currentUser) => {
        if (currentUser) {
          done(null, currentUser);
        } else {
          new User({
            username: profile.displayName,
            googleId: profile.id,
            thumbnail: profile._json.picture,
          })
            .save()
            .then((newUser) => {
              done(null, newUser);
            });
        }
      });
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: keys.facebook.clientID,
      clientSecret: keys.facebook.clientSecret,
      callbackURL: "https://localhost:3443/auth/facebook",
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ facebookId: profile.id }).then((currentUser) => {
        if (currentUser) {
          done(null, currentUser);
        } else {
          new User({
            username: profile.displayName,
            facebookId: profile.id,
            thumbnail: profile._json.picture,
          })
            .save()
            .then((newUser) => {
              done(null, newUser);
            });
        }
      });
    }
  )
);

passport.use(
  new LinkedinStrategy(
    {
      clientID: keys.linkedin.clientID,
      clientSecret: keys.linkedin.clientSecret,
      callbackURL: "https://localhost:3443/auth/linkedin",
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ linkedinId: profile.id }).then((currentUser) => {
        if (currentUser) {
          done(null, currentUser);
        } else {
          new User({
            username: profile.displayName,
            linkedInId: profile.id,
            thumbnail: profile._json.picture,
          })
            .save()
            .then((newUser) => {
              done(null, newUser);
            });
        }
      });
    }
  )
);
passport.use(
  "local",
  new LocalStrategy(
    { passReqToCallback: true },
    (req, username, password, done) => {
      console.log(`2--local strategy verify cb: ${JSON.stringify(username)}`);
      User.findOne({ username: username }).then((currentUser) => {
        if (currentUser) {
          console.log(`User is: ${currentUser.username}`);
          bcrypt
            .compare(req.body.password, currentUser.password)
            .then((passwordsMatch) => {
              if (passwordsMatch) {
                console.log("passwords Match");
                done(null, currentUser);
              } else {
                console.log("passwords Do Not Match");
                done("Password Is Incorrect. Please try again.", null);
              }
            });
        } else {
          done("Username doesn't exist. Please try again.", null);
        }
      });
    }
  )
);

exports.verifyUser = (req, res, next) => {
  if (!req.user) {
    res.redirect("/auth/login");
  } else {
    next();
  }
};
