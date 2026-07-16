const express = require("express");
const exphbs = require("express-handlebars");
const session = require("express-session");
const flash = require("express-flash");
const { RedisStore } = require("connect-redis");
require("dotenv").config();
const conn = require("./database/conn");
const redisClient = require("./database/redis");

const app = express();
const port = process.env.DB_PORT_HOST;

const hbs = exphbs.create({
  partialsDir: "views/partials",
  defaultLayout: "main",
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

//models
const Thoughts = require("./models/Thought");
const User = require("./models/User");

//routers
const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const thoughtRoutes = require("./routes/thoughtRoutes");

const redisStore = new RedisStore({
  client: redisClient,
  prefix: "session:",
});

// middleware session
app.use(
  session({
    name: "session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: false, //Garante que o cookie não irá renovar durante o uso
    store: redisStore,
    cookie: {
      secure: false, //Alterar para false em dev, true para produção.
      maxAge: 3600000,
      sameSite: "lax",
      httpOnly: true,
    },
  }),
);

//flash messages
app.use(flash());

//set session
app.use((req, res, next) => {
  if (req.session.userid) {
    res.locals.session = req.session;
  }
  next();
});

// use routes
app.use("/", homeRoutes);
app.use("/", authRoutes);
app.use("/thoughts", thoughtRoutes);

conn
  .sync()
  // .sync({ force: true })
  .then(() => {
    app.listen(port, () => "Database connected");
  })
  .catch((err) => console.log(err));
