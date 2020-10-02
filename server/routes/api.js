const { json } = require('body-parser');
const { query } = require('express');
const express = require('express');
const router = express.Router();
const axios = require("axios").default;
const redis = require('redis');


// connect to the Database
const DATABASE_URL = "mongodb+srv://readonly:readonly@covid-19.hip2i.mongodb.net/covid19";
const { MongoClient } = require("mongodb");
const e = require('express');
const mongodb_client = new MongoClient(DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//  create redis client and connect to redis server
const redis_url = process.env.REDIS_URL || "redis://127.0.0.1";
const redis_client = redis.createClient(redis_url);


router.get('/data', async function (req, res, next) {

  const key = "world-data";


  //get data from the cache
  redis_client.get(key, async (err, result) => {
    if (err) {
      res.status(500).send(err);
    }

    //check data from the cache
    if (result) {
      console.log(`${key} serve from Redis`);
      res.status(200).json(JSON.parse(result));
    } else {

      // get data from the database and store it in the cache
      mongodb_client.connect(async (err) => {
        if (err) res.status(500).send(err);

        const covid19Database = mongodb_client.db("covid19");
        var globalAndUS = covid19Database.collection("global_and_us");
        var metadata = covid19Database.collection("metadata");

        // get all the latest data
        metadata
          .find()
          .toArray((err, docs) => {
            if (err) {
              res.status(500).send(err);
            }
            const lastDate = docs[0].last_date;
            globalAndUS
              .find({ date: { $eq: lastDate } })
              .toArray((err, docs) => {
                if (err) {
                  res.status(500).send(err);
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

                //  store the result from mongodb to cache
                redis_client.setex(key, 28800, JSON.stringify({ "data": resJSON }));

                // send to the client
                res.send({ "data": resJSON })
              });
          });
      });

    }
  })

});

router.get('/gis', async (req, res, next) => {
  let key = "world_gis";

  let pipeline = [
    {
      '$group': {
        '_id': {
          'country': '$country',
          'state': '$state',
          'county': '$county',
          'coords': '$loc.coordinates'
        },
        'data': {
          '$push': {
            'confirmed': '$confirmed',
            'deaths': '$deaths',
            'recovered': {
              '$ifNull': [
                '$recovered', 0
              ]
            },
            'population': '$population'
          }
        }
      }
    }, {
      '$project': {
        'data': {
          '$map': {
            'input': {
              '$range': [
                0, {
                  '$size': '$data'
                }
              ]
            },
            'as': 'this',
            'in': {
              '$mergeObjects': [
                {
                  'confirmed': {
                    '$arrayElemAt': [
                      '$data.confirmed', '$$this'
                    ]
                  },
                  'deaths': {
                    '$arrayElemAt': [
                      '$data.deaths', '$$this'
                    ]
                  },
                  'recovered': {
                    '$arrayElemAt': [
                      '$data.recovered', '$$this'
                    ]
                  },
                  'active': {
                    '$subtract': [
                      {
                        '$subtract': [
                          {
                            '$arrayElemAt': [
                              '$data.confirmed', '$$this'
                            ]
                          }, {
                            '$arrayElemAt': [
                              '$data.deaths', '$$this'
                            ]
                          }
                        ]
                      }, {
                        '$arrayElemAt': [
                          '$data.recovered', '$$this'
                        ]
                      }
                    ]
                  },
                  'incidence': {
                    '$divide': [
                      {
                        '$multiply': [
                          {
                            '$subtract': [
                              {
                                '$arrayElemAt': [
                                  '$data.confirmed', '$$this'
                                ]
                              }, {
                                '$arrayElemAt': [
                                  '$data.confirmed', {
                                    '$max': [
                                      0, {
                                        '$subtract': [
                                          '$$this', 365
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }, 100000
                        ]
                      }, {
                        '$arrayElemAt': [
                          '$data.population', '$$this'
                        ]
                      }
                    ]
                  }
                }, null
              ]
            }
          }
        }
      }
    }, {
      '$project': {
        'confirmed': {
          '$arrayElemAt': [
            '$data.confirmed', -1
          ]
        },
        'deaths': {
          '$arrayElemAt': [
            '$data.deaths', -1
          ]
        },
        'recovered': {
          '$arrayElemAt': [
            '$data.recovered', -1
          ]
        },
        'active': {
          '$arrayElemAt': [
            '$data.active', -1
          ]
        },
        'incidence': {
          '$arrayElemAt': [
            '$data.incidence', -1
          ]
        }
      }
    }
  ]

  //  get the data from cache
  redis_client.get(key, async (err, result) => {
    if (err) res.status(500).send(err);

    // check the data present in cache
    if (result) {
      res.status(200).json(JSON.parse(result));
    } else {
      //  get data from mongodb and store in cache
      mongodb_client.connect(async (err) => {
        if (err) return res.status(500).send(err);

        // send results
        mongodb_client.db("covid19").collection("global_and_us").aggregate(pipeline, { allowDiskUse: true }).toArray(async (err, result) => {
          if (err) return res.status(500).send(err);

          //  store the result from mongodb to cache
          redis_client.setex(key, 28800, JSON.stringify({ source: "Redis Cache", result: result }));

          // send the result back to client
          res.send({ source: "Mongodb", result: result });
        })
      })
    }
  })

})

router.get('/marker', async (req, res, next) => {
  let country = req.query.country;
  let key = `marker_${country}`;
  let pipeline = [
    {
      '$match': {
        'Country_Region': country,
        'Province_State': ''
      }
    }, {
      '$project': {
        'coords': {
          'lat': '$Lat',
          'lng': '$Long_'
        }
      }
    }
  ]

  // get data from the cache
  redis_client.get(key, async (err, result) => {
    if (err) res.status(500).send(err);

    // check if data present in cache
    else if (result) {
      res.status(200).json(JSON.parse(result));
    } else {
      // get data from mongodb and store in cache
      mongodb_client.connect(async (err) => {
        if (err) return res.status(500).send(err);

        // get result from mongodb
        mongodb_client.db("covid19jhu").collection("UID_ISO_FIPS_LookUp_Table").aggregate(pipeline).toArray(async (err, result) => {
          if (err) return res.status(500).send(err);

          // store result in redis cache
          redis_client.setex(key, 28800, JSON.stringify({ source: 'Redis cache', ...result[0] }));
          
          // send the result back to client
          res.send({ source: 'Mongodb', ...result[0] });
        })
      })
    }
  })
})


router.post('/graph', async (req, res, next) => {
  let selected_countries = req.body.countries;
  let selected_case = req.body.case;
  let key = `${selected_countries.sort().join("_")}_${selected_case}`;

  const pipeline = [
    {
      '$sort': {
        'date': 1
      }
    }, {
      '$addFields': {
        'countries': selected_countries,
        'case': `$${selected_case}`
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
            'case': '$case',
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
                0, {
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
                  'case_weekly': {
                    '$subtract': [
                      {
                        '$arrayElemAt': [
                          '$data.case', '$$this'
                        ]
                      }, {
                        '$arrayElemAt': [
                          '$data.case', {
                            '$max': [
                              0, {
                                '$subtract': [
                                  '$$this', 7
                                ]
                              }
                            ]
                          }
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
    }
  ]

  // get the data from the cache
  redis_client.get(key, async (err, result) => {
    if (err) res.status(500).send(err);

    // check data present in cache
    if (result) {
      res.status(200).json(JSON.parse(result));
    } else {
      // get data from database and store in cache
      mongodb_client.connect(async (err) => {
        if (err) {
          return res.status(500).send(err);
        }

        // send results
        mongodb_client.db("covid19").collection("countries_summary").aggregate(pipeline).toArray(async (err, result) => {
          if (err) {
            return res.status(500).send(err);
          }

          //  store the result from mongodb to cache
          redis_client.setex(key, 28800, JSON.stringify({ source: 'Redis cache', result: result }))

          // send the result back to the client
          res.send({ source: 'Mongodb', result: result });
        })
      })

    }
  });


});

module.exports = router;
