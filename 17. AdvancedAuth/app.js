// Libraries
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require('csurf');
const flash = require('connect-flash');

// Global Variables
const MONGODB_URI =
  "mongodb+srv://mash:openmongodb@shop.z8tkg.mongodb.net/shop?retryWrites=true&w=majority&appName=Shop";

// Initialization of the APP
const app = express();
const store = new MongoDBStore({ uri: MONGODB_URI, collection: "sessions" });
const csrfProtection = csrf();

// Routes
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

// Controllers
const errorController = require("./controllers/error");

// Models
const User = require("./models/user");

// View Engines
app.set("view engine", "ejs");
app.set("views", "views");

// Core Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Routes Middlewares
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// Middleware to handle unknown Urls
app.use(errorController.get404);

// Coonecting Database and Server Starting with a default user.
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
