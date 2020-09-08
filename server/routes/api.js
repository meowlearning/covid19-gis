var express = require('express');
var router = express.Router();
const axios = require("axios").default;


// connect to the Database
const DATABASE_URL = "mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19";
const { MongoClient } = require("mongodb");
const client = new MongoClient(DATABASE_URL, { 
  useNewUrlParser: true,
  useUnifiedTopology: true 
});

/* GET COVID data for Australia regions. */
router.get('/data', async function(req, res, next) {
  // get the data from the Database
  client.connect((err) => {
    const covid19Database = client.db("covid19");
    var globalAndUS = covid19Database.collection("global_and_us");
    var metadata = covid19Database.collection("metadata");

    // get all the latest data
    metadata
    .find()
    .toArray((err, docs) => {
      if (err) {
        console.error(err);
      }
      const lastDate = docs[0].last_date;
      globalAndUS
        .find({ date: { $eq: lastDate } })
        .toArray((err, docs) => {
          if (err) {
            console.error(err);
          }
          // construct the response JSON file to be sent to the client
          let resJSON = [];
          docs.map((obj) => {
            resJSON.push({
              // Construct the Object
              data:{
                  state: (obj.state !== undefined) ? obj.state : null,
                  county: (obj.county !== undefined) ? obj.county : null,
                  iso_code: obj.country_iso3,
                  location: (obj.loc !== undefined ) ? obj.loc : null,
                  case: {
                    confirmed: (obj.confirmed !== undefined) ? obj.confirmed : null,
                    death: (obj.deaths !== undefined)? obj.deaths : null,
                    recovered: (obj.recovered !== undefined) ? obj.recovered : null
                  }
              }
            });
          })

          res.send({"data" : resJSON})
        });
    });
  })
});

module.exports = router;
