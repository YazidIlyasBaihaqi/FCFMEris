const mongoose = require("mongoose");
require("dotenv").config();

module.exports = {
  innit: () => {
    mongoose.connect(
      `mongodb+srv://Client:${process.env.PASS}@cluster0.4a90r.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
    );
    mongoose.Promise = global.Promise;

    mongoose.connection.on("connected", () => {
      console.log("The bot has connected to the database");
    });

    mongoose.connection.on("disconnected", () => {
      console.log("The bot has disconnected to the database");
    });

    mongoose.connection.on("err", () => {
      console.log(
        "There was an error with the connection to the database: " + err
      );
    });
  },
};
