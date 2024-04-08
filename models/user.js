const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const connectionSchema = new Schema(
  {
    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);
const userSchema = new Schema(
  {
    url: String,
    username: String,
    firstName: String,
    LastName: String,
    thumbnail: String,
    password: String,
    googleId: String,
    facebookId: String,
    linkedInId: String,
    connections: [connectionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
