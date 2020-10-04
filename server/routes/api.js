const express = require('express');
const router = express.Router();
const redis = require('redis');
const { promisify } = require("util");


//  create redis client and connect to redis server
const redis_url = process.env.REDIS_URL || "redis://127.0.0.1";
const redis_client = redis.createClient(redis_url);
const redis_get = promisify(redis_client.get).bind(redis_client);

/**
 * Get list of requested regions. If country is undefined,
 * return list of countries with their locations. 
 * If country is defined and state is undefined,
 * return list of states of requested countries.
 * if state is defined, return list of requested counties of
 * requested country and state
 */
router.get('/regions', async (req, res, next) => {
  const covid19jhu = req.app.mongodb.db("covid19jhu");
  let country = req.query.country;
  let state = req.query.state;
  let key = `regions_${country}_${state}`;

  let pipeline = [
    {
      '$match': {}
    }, {
      '$group': {
        '_id': {
          'country': '$Country_Region'
        },
        'lat': {
          '$first': '$Lat'
        },
        'lng': {
          '$first': '$Long_'
        }
      }
    }, {
      '$match': {}
    }, {
      '$sort': {
        '_id': 1
      }
    }
  ]

  if (country != undefined) {
    // if countries is defined return list of states without the country itself
    pipeline[0]['$match']['Country_Region'] = country;
    pipeline[1]['$group']['_id']['state'] = '$Province_State';
    pipeline[2]['$match']['_id.state'] = {};
    pipeline[2]['$match']['_id.state']['$nin'] = [""];

    // if state is defined return list of counties, without country and states itself
    if (state != undefined) {
      pipeline[0]['$match']['Province_State'] = state;
      pipeline[1]['$group']['_id']['county'] = '$Admin2';
      pipeline[2]['$match']['_id.county'] = {};
      pipeline[2]['$match']['_id.county']['$nin'] = [""];
    }
  }

  // try to get data from redis
  redis_get(key)
    .then(async (result) => {
      if (result) {
        res.status(200).json(JSON.parse(result));
        throw `Caught '${key}' in cache`;
      } else {
        // return data from mongodb
        return covid19jhu.collection("UID_ISO_FIPS_LookUp_Table").aggregate(pipeline).toArray()
      }
    })
    .then(async (result) => {
      // store the result from mongodb to redis
      redis_client.setex(key, 28800, JSON.stringify({ source: "Redis Cache", result: result }))

      // send the result back to client
      return res.send({ source: "Mongodb", result: result });
    })
    .catch(err => console.log(err))
})

router.get('/gis', async (req, res, next) => {
  let key = "world_gis";
  const covid19 = req.app.mongodb.db("covid19");

  //  get data from cache
  redis_get(key)
    .then(async (result) => {
      if (result) {
        res.status(200).json(JSON.parse(result));
        throw `Caught '${key}' in cache`;
      } else {
        // get the data from mongodb, starting with last date
        return covid19.collection("metadata").findOne()
      }
    })
    .then(async ({ last_date }) => {
      //  build pipeline and aggregate
      let pipeline = [
        {
          '$match': {
            'loc': {
              '$exists': true
            },
            'date': last_date
          }
        }, {
          '$lookup': {
            'from': 'global_and_us',
            'let': {
              'cur_country': '$country',
              'cur_state': '$state',
              'cur_county': '$county',
              'cur_date': {
                '$subtract': [
                  '$date', 86400 * 1000 * 365
                ]
              }
            },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$and': [
                      {
                        '$eq': [
                          '$country', '$$cur_country'
                        ]
                      }, {
                        '$eq': [
                          '$state', '$$cur_state'
                        ]
                      }, {
                        '$eq': [
                          '$county', '$$cur_county'
                        ]
                      }, {
                        '$eq': [
                          '$date', '$$cur_date'
                        ]
                      }
                    ]
                  }
                }
              }
            ],
            'as': 'result'
          }
        }, {
          '$project': {
            'country': 1,
            'state': 1,
            'county': 1,
            'coords': '$loc.coordinates',
            'confirmed': 1,
            'recovered': {
              '$ifNull': [
                '$recovered', 0
              ]
            },
            'deaths': 1,
            'yearly_confirmed': {
              '$subtract': [
                '$confirmed', {
                  '$ifNull': [
                    {
                      '$arrayElemAt': [
                        '$result.confirmed', 0
                      ]
                    }, 0
                  ]
                }
              ]
            },
            'date': 1,
            'population': 1
          }
        }, {
          '$addFields': {
            'active': {
              '$subtract': [
                {
                  '$subtract': [
                    '$confirmed', '$deaths'
                  ]
                }, '$recovered'
              ]
            },
            'incidence': {
              '$divide': [
                {
                  '$multiply': [
                    '$yearly_confirmed', 100000
                  ]
                }, '$population'
              ]
            }
          }
        }
      ]

      // aggregate and get the result
      return covid19.collection("global_and_us").aggregate(pipeline).toArray()
    })
    .then(async (result) => {
      // store the result from mongodb to redis
      redis_client.setex(key, 28800, JSON.stringify({ source: "Redis Cache", result: result }));

      // send the result back to client
      return res.send({ source: "Mongodb", result: result });
    })
    .catch(err => console.log(err))
})

router.post('/graph', async (req, res, next) => {
  let selected_countries = req.body.countries;
  let selected_case = req.body.case;
  let key = `graph_${selected_countries.sort().join("_")}_${selected_case}`;
  const covid19 = req.app.mongodb.db("covid19");

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

  // get data from the cache
  redis_get(key)
    .then(async (result) => {
      if (result) {
        res.status(200).json(JSON.parse(result));
        throw `Caught '${key}' in cache`;
      } else {
        // get data from database and store in cache
        return covid19.collection("countries_summary").aggregate(pipeline).toArray()
      }
    })
    .then(async (result) => {
      // store the result from mongodb to cache
      redis_client.setex(key, 28800, JSON.stringify({ source: 'Redis Cache', result: result }));

      // send the result back to client
      return res.send({ source: 'Mongodb', result: result })
    })
    .catch(err => console.log(err))
});

router.get('/graphinfo', async (req, res, next) => {
  const covid19 = req.app.mongodb.db("covid19");
  let country = req.query.country;
  let state = req.query.state;
  let county = req.query.county;
  let key = `graphinfo_${country}_${state}_${county}`;

  const pipeline = [
    {
      '$match': {
        'country': country
      }
    }, {
      '$lookup': {
        'from': 'global_and_us',
        'let': {
          'cur_country': '$country',
          'cur_state': '$state',
          'cur_county': '$county',
          'weekly_date': {
            '$subtract': [
              '$date', 604800000
            ]
          },
          'yearly_date': {
            '$subtract': [
              '$date', 31536000000
            ]
          }
        },
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$and': [
                  {
                    '$eq': [
                      '$country', '$$cur_country'
                    ]
                  }, {
                    '$eq': [
                      '$state', '$$cur_state'
                    ]
                  }, {
                    '$eq': [
                      '$county', '$$cur_county'
                    ]
                  }, {
                    '$or': [
                      {
                        '$eq': [
                          '$date', '$$weekly_date'
                        ]
                      }, {
                        '$eq': [
                          '$date', '$$yearly_date'
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        ],
        'as': 'result'
      }
    }, {
      '$project': {
        'country': 1,
        'state': 1,
        'county': 1,
        'coords': '$loc.coordinates',
        'confirmed': 1,
        'recovered': {
          '$ifNull': [
            '$recovered', 0
          ]
        },
        'deaths': 1,
        'weekly_confirmed': {
          '$subtract': [
            '$confirmed', {
              '$ifNull': [
                {
                  '$arrayElemAt': [
                    '$result.confirmed', 0
                  ]
                }, 0
              ]
            }
          ]
        },
        'weekly_deaths': {
          '$subtract': [
            '$deaths', {
              '$ifNull': [
                {
                  '$arrayElemAt': [
                    '$result.deaths', 0
                  ]
                }, 0
              ]
            }
          ]
        },
        'yearly_confirmed': {
          '$subtract': [
            '$confirmed', {
              '$ifNull': [
                {
                  '$arrayElemAt': [
                    '$result.confirmed', 1
                  ]
                }, 0
              ]
            }
          ]
        },
        'date': 1,
        'population': 1
      }
    }, {
      '$group': {
        '_id': {
          'country': '$country',
          'date': '$date'
        },
        'confirmed': {
          '$sum': '$confirmed'
        },
        'deaths': {
          '$sum': '$deaths'
        },
        'recovered': {
          '$sum': '$recovered'
        },
        'weekly_confirmed': {
          '$sum': '$weekly_confirmed'
        },
        'weekly_deaths': {
          '$sum': '$weekly_deaths'
        },
        'yearly_confirmed': {
          '$sum': '$yearly_confirmed'
        },
        'population': {
          '$sum': '$population'
        }
      }
    }, {
      '$addFields': {
        'active': {
          '$subtract': [
            {
              '$subtract': [
                '$confirmed', '$deaths'
              ]
            }, '$recovered'
          ]
        },
        'incidence': {
          '$divide': [
            {
              '$multiply': [
                '$yearly_confirmed', 100000
              ]
            }, '$population'
          ]
        }
      }
    }, {
      '$sort': {
        '_id.date': 1
      }
    }
  ]

  if (county == undefined) {
    if (state != undefined) {
      pipeline[0]['$match']['state'] = state;
    }
  } else {
    pipeline[0]['$match']['state'] = state;
    pipeline[0]['$match']['county'] = county;
  }

  redis_get(key)
    .then(async (result) => {
      if (result) {
        res.status(200).json(JSON.parse(result));
        throw `Caught '${key}' in cache`;
      } else {
        // get data from database and store in cache
        return covid19.collection("global_and_us").aggregate(pipeline).toArray()
      }
    })
    .then(async (result) => {
      // store the result from mongodb to cache
      redis_client.setex(key, 28800, JSON.stringify({ source: "Redis Cache", result: result }));

      // send the retult back to client
      return res.send({ source: "Mongodb", result: result });
    })
    .catch(err => console.log(err))
})

router.get('/globalinfo', async (req, res, next) => {
  const covid19 = req.app.mongodb.db("covid19");
  let key = 'globalinfo';

  redis_get(key)
    .then(async (result) => {
      // check if data present in cache
      if (result) {
        res.send(JSON.parse(result));
        throw `Caught '${key}' in cache`;
      } else {
        // get the last date in mongodb data
        return covid19.collection("metadata").findOne()
      }
    })
    .then(async ({ last_date }) => {
      let pipeline = [
        {
          '$match': {
            'date': last_date
          }
        }, {
          '$group': {
            '_id': '$date',
            'population': {
              '$sum': '$population'
            },
            'confirmed': {
              '$sum': '$confirmed'
            },
            'deaths': {
              '$sum': '$deaths'
            },
            'recovered': {
              '$sum': '$recovered'
            }
          }
        }, {
          '$lookup': {
            'from': 'global_and_us',
            'let': {
              'yearly_date': {
                '$subtract': [
                  '$_id', 86400 * 1000 * 365
                ]
              }
            },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$and': [
                      {
                        '$eq': [
                          '$date', '$$yearly_date'
                        ]
                      }
                    ]
                  }
                }
              }, {
                '$group': {
                  '_id': '$date',
                  'confirmed': {
                    '$sum': '$confirmed'
                  },
                  'deaths': {
                    '$sum': '$deaths'
                  },
                  'recovered': {
                    '$sum': '$recovered'
                  }
                }
              }
            ],
            'as': 'result'
          }
        }, {
          '$project': {
            'population': '$population',
            'confirmed': '$confirmed',
            'deaths': '$deaths',
            'recovered': '$recovered',
            'active': {
              '$subtract': [
                {
                  '$subtract': [
                    '$confirmed', '$deaths'
                  ]
                }, '$recovered'
              ]
            },
            'incidence': {
              '$divide': [
                {
                  '$multiply': [
                    {
                      '$subtract': [
                        '$confirmed', {
                          '$ifNull': [
                            {
                              '$arrayElemAt': [
                                '$result.confirmed', 0
                              ]
                            }, 0
                          ]
                        }
                      ]
                    }, 100000
                  ]
                }, '$population'
              ]
            }
          }
        }
      ];

      // aggregate and get the result
      return covid19.collection("global_and_us").aggregate(pipeline).toArray()
    })
    .then(async (result) => {
      // store data to redis
      redis_client.setex(key, 28800, JSON.stringify({ source: "Redis Cache", ...result[0] }));

      // send back to client
      return res.send({ source: "Mongodb", ...result[0] });
    })
    .catch(err => console.log(err))
})

module.exports = router;

