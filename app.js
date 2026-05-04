require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const { campgroundSchemas, reviewSchema } = require("./schemas");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const catchAsync = require("./utils/catchAsync");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

// const dbURL = process.env.DB_URL;

mongoose
  .connect("mongodb://localhost:27017/nomadcamp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("MongoDBコネクションOK！！");
  })
  .catch((err) => {
    console.log("MongoDBコネクションエラー！！！");
    console.log(err);
  });

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionConfig = {
  secret: process.env.SECRET || "mysecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

app.use((req, res, next) => {
  console.log(req.session);
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

// app.all("*", (req, res, next) => {
//   next(new ExpressError("ページが見つかりませんでした", 404));
// });

app.use((err, req, res, next) => {
  console.log("ERROR:", err);
  const { statusCode = 500 } = err;
  if (!err.message) {
    err.message = "問題が起きました";
  }
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("ポート3000でリクエスト待受中...");
});
