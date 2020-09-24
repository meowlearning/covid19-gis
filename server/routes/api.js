const { query } = require('express');
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


router.get('/data', async function (req, res, next) {
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
                data: {
                  state: (obj.state !== undefined) ? obj.state : null,
                  county: (obj.county !== undefined) ? obj.county : null,
                  iso_code: obj.country_iso3,
                  location: (obj.loc !== undefined) ? obj.loc : null,
                  case: {
                    confirmed: (obj.confirmed !== undefined) ? obj.confirmed : null,
                    death: (obj.deaths !== undefined) ? obj.deaths : null,
                    recovered: (obj.recovered !== undefined) ? obj.recovered : null
                  }
                }
              });
            })

            res.send({ "data": resJSON })
          });
      });
  });
});

router.get('/graph', async (req, res, next) => {
  let countries = ["Australia", "Russia"];
  const pipeline = [
    {
      '$sort': {
        'country': 1,
        'date': 1
      }
    }, {
      '$addFields': {
        'countries': countries
      }
    }, {
      '$addFields': {
        'is_country': {
          '$in': [
            '$country', '$countries'
          ]
        }
      }
    }, {
      '$match': {
        'is_country': true
      }
    }, {
      '$group': {
        '_id': '$country',
        'data': {
          '$push': {
            'confirmed': '$confirmed',
            'deaths': '$deaths',
            'recovered': '$recovered',
            'date': '$date'
          }
        }
      }
    }, {
      '$project': {
        'data': {
          '$map': {
            'input': {
              '$range': [
                7, {
                  '$size': '$data'
                }
              ]
            },
            'as': 'this',
            'in': {
              '$mergeObjects': [
                {
                  '$arrayElemAt': [
                    '$data', '$$this'
                  ]
                }, {
                  'weekly': {
                    '$arrayElemAt': [
                      '$data', {
                        '$subtract': [
                          '$$this', 7
                        ]
                      }
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    }, {
      '$project': {
        'data': {
          '$map': {
            'input': '$data',
            'as': 'this',
            'in': {
              '$mergeObjects': [
                {
                  'confirmed': '$$this.confirmed',
                  'deaths': '$$this.deaths',
                  'recovered': '$$this.recovered',
                  'date': '$$this.date',
                  'confirmed_weekly': {
                    '$subtract': [
                      '$$this.confirmed', '$$this.weekly.confirmed'
                    ]
                  },
                  'deaths_weekly': {
                    '$subtract': [
                      '$$this.deaths', '$$this.weekly.deaths'
                    ]
                  },
                  'recovered_weekly': {
                    '$subtract': [
                      '$$this.recovered', '$$this.weekly.recovered'
                    ]
                  }
                }, null
              ]
            }
          }
        }
      }
    }
  ]
  client.connect((err) => {
    if (err) {
      return res.status(500).send(err);
    }
    
    // send results
    client.db("covid19").collection("countries_summary").aggregate(pipeline).toArray((err, result) => {
      if (err) {
        return res.status(500).send(err);
      }
      res.send(result);
    })
  })
});

module.exports = router;
