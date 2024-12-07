// db.js
const { MongoClient } = require('mongodb');

const DATABASE_URL = process.env.MONGODB_URI || "mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19";
const DATABASE_NAME = process.env.DATABASE_NAME || "covid19";

class DatabaseConnection {
  static instance = null;
  static client = null;

  static async getConnection() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }

    if (!DatabaseConnection.client) {
      DatabaseConnection.client = new MongoClient(DATABASE_URL);

      await DatabaseConnection.client.connect();
      console.log('New MongoDB connection established');
    }

    DatabaseConnection.instance = DatabaseConnection.client.db(DATABASE_NAME);
    return DatabaseConnection.instance;
  }

  static async closeConnection() {
    if (DatabaseConnection.client) {
      await DatabaseConnection.client.close();
      DatabaseConnection.instance = null;
      DatabaseConnection.client = null;
      console.log('MongoDB connection closed');
    }
  }
}

module.exports = DatabaseConnection;