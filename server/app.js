const express = require('express');
const DatabaseConnection = require('./db');
const apiRouter = require('./routes/api'); // Your API routes
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Lazily initialize the app
const app = express();

// Handle other routes (e.g., static files or frontend)
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(express.static(path.join(__dirname, '/public')));

// Middleware setup
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    req.db = await DatabaseConnection.getConnection();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});



// Use the API routes
// API routes
app.use('/api', async (req, res, next) => {
  res.on('finish', function () {
    // Close database connection on finish
    DatabaseConnection.closeConnection();
  });
  next();
}, apiRouter);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// Export the serverless function
module.exports = app;