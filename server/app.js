var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
const cors = require("cors");

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// logger, cookieparser, urlencoded json parser setup
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../client/build')))

app.use(cors());

// connect to the Database
const DATABASE_URL = "mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19";
const { MongoClient } = require("mongodb");
const router = require('./routes/api');

MongoClient.connect(DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, async (err, db) => {
  if (err) return console.log(err);

  app.mongodb = db;

  const covid19 = db.db("covid19");
  const covid19jhu = db.db("covid19jhu");

  console.log("Connected successfully to mongodb server");

  // app.use('/', indexRouter);
  app.use('/api', apiRouter);
  
  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });
  
  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

})


module.exports = app;
