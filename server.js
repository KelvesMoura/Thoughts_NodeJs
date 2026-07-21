const express = require("express");
const exphbs = require("express-handlebars");
const session = require("express-session");
const flash = require("express-flash");
const path = require("path");
require("dotenv").config();
const conn = require("./src/database/conn");
const { RedisStore } = require("connect-redis");
const redisClient = require("./src/database/redis");

const app = express();
const port = process.env.DB_PORT_HOST || 3000;
const viewPath = path.join(__dirname, "src", "views");
const viewPartial = path.join(__dirname, "src", "views", "partials");

const hbs = exphbs.create({
  partialsDir: viewPartial,
  defaultLayout: "main",
});

app.set("views", viewPath);
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set("trust proxy", 1);

//models
const Thoughts = require("./src/models/Thought");
const User = require("./src/models/User");

//routers
const homeRoutes = require("./src/routes/homeRoutes");
const authRoutes = require("./src/routes/authRoutes");
const thoughtRoutes = require("./src/routes/thoughtRoutes");

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
      secure: true, //Alterar para false em dev, true para produção.
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
