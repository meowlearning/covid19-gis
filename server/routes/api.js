const express = require('express');
const path = require('path');
const router = express.Router();
const redis = require('redis');
const { promisify } = require("util");
const { BlobServiceClient } = require('@azure/storage-blob');
const ServerlessHttp = require('serverless-http');


// load environment variables
require('dotenv').config()

// Set up azure blobs
const CONNECT_STR = process.env.CONNECT_STR;
const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECT_STR);
const containerName = 'covid19container';
const containerClient = blobServiceClient.getContainerClient(containerName);

// Create the container if it doesn't exist
containerClient.create()
  .then(result => console.log(`Container "${containerName}" created/verified at ${result?.date || new Date()}`))
  .catch(err => console.log('Container exists or error:', err?.details || err))

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
  const covid19 = req.db;
  let country = req.query.country === undefined ? '' : req.query.country;
  let state = req.query.state === undefined ? '' : req.query.state;
  let key = `regions_${country}_${state}`;

  let pipeline = [
    {
      '$match': {
        'country': { '$nin': ["Summer Olympics 2020", "Winter Olympics 2022"] }
      }
    }, {
      '$group': {
        '_id': {
          'country': '$country'
        },
        'lat': {
          '$first': { $arrayElemAt: ["$loc.coordinates", 1] }
        },
        'lng': {
          '$first': { $arrayElemAt: ["$loc.coordinates", 0] }
        }
      }
    }, {
      '$sort': {
        '_id': 1
      }
    }
  ]

  if (country != '') {
    // if countries is defined return list of states without the country itself
    pipeline[0]['$match']['country'] = country;
    pipeline[0]['$match']['state'] = { '$nin': [""] }
    pipeline[1]['$group']['_id']['state'] = '$state'

    // if state is defined return list of counties, without country and states itself
    if (state != '') {
      pipeline[0]['$match']['state'] = state;
      pipeline[0]['$match']['county'] = { '$nin': [""] };
      pipeline[1]['$group']['_id']['county'] = '$county';
    }
  }

  const blockBlobClient = containerClient.getBlockBlobClient(key);

  // try to get data from redis first
  redis_get(key)
    .then(async (result) => {
      if (result) {
        console.log(`Caught '${key}' in Redis cache`)
        res.status(200).json(JSON.parse(result));
      } else { // key not in redis
        blockBlobClient.download()
          .then(AzureResponse => streamToString(AzureResponse.readableStreamBody))
          .then(data => {
            console.log(`Caught '${key}' in Azure blob`);
            // store in redis
            redis_client.setex(key, 28800, JSON.stringify({
              source: "Redis Cache",
              result: JSON.parse(data).result
            }));
            res.status(200).json(JSON.parse(data));
          })
          .catch(err => {
            if (err.details.errorCode === 'BlobNotFound') { // no cache found in redis nor azure blob
              covid19.collection("global_and_us").aggregate(pipeline).toArray()
                .then(result => {
                  // Store in Redis
                  redis_client.setex(key, 28800, JSON.stringify({
                    source: "Redis Cache",
                    result: result
                  }));

                  // Store in Azure blob
                  const blobData = JSON.stringify({
                    source: "Azure Blob",
                    result: result
                  });
                  blockBlobClient.upload(blobData, blobData.length);

                  // Send response
                  res.send({
                    source: "MongoDB",
                    result: result
                  });
                })
                .catch(err => console.error(err))
            } else {
              console.log(err.details.errorCode)
            }
          })
      }
    })
    .catch(err => console.error(err))
})

router.get('/gis', async (req, res, next) => {
  let key = "world_gis";
  const covid19 = req.db;

  //  get data from cache
  const blockBlobClient = containerClient.getBlockBlobClient(key);

  redis_get(key)
    .then(async (result) => {
      if (result) {
        console.log(`Caught '${key}' in Redis cache`);
        res.status(200).json(JSON.parse(result));
      } else { // no redis cache found
        blockBlobClient.download()
          .then(AzureResponse => streamToString(AzureResponse.readableStreamBody))
          .then(data => {
            console.log(`Caught '${key}' in Azure blob`);
            // store in redis
            redis_client.setex(key, 28800, JSON.stringify({
              source: "Redis Cache",
              result: JSON.parse(data).result
            }));
            res.status(200).json(JSON.parse(data));
          })
          .catch(err => {
            if (err.details.errorCode === 'BlobNotFound') { // no cache found in redis nor azure blob
              covid19.collection("metadata").findOne()
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
                        },
                        'fatality': {
                          '$cond': [
                            {
                              '$eq': [
                                '$confirmed', 0
                              ]
                            }, 0, {
                              '$multiply': [
                                {
                                  '$divide': [
                                    '$deaths', '$confirmed'
                                  ]
                                }, 100
                              ]
                            }
                          ]
                        }
                      }
                    }
                  ]

                  // aggregate and get the result
                  return covid19.collection("global_and_us").aggregate(pipeline).toArray()
                })
                .then(async (result) => {
                  // Store in Redis
                  redis_client.setex(key, 28800, JSON.stringify({
                    source: "Redis Cache",
                    result: result
                  }));

                  // Store in Azure blob
                  const blobData = JSON.stringify({
                    source: "Azure Blob",
                    result: result
                  });
                  blockBlobClient.upload(blobData, blobData.length);

                  // Send response
                  res.send({
                    source: "MongoDB",
                    result: result
                  });
                })
                .catch(err => {
                  console.error(err)
                })
            } else {
              console.error(err.details.errorCode)
            }
          })
      }
    })
    .catch(err => console.error(err))
})

router.get('/graphinfo', async (req, res, next) => {
  const covid19 = req.db;
  let country = req.query.country === undefined ? '' : req.query.country;
  let state = req.query.state === undefined ? '' : req.query.state;
  let county = req.query.county === undefined ? '' : req.query.county;
  let key = `graphinfo_${country}_${state}_${county}`;

  let match = {
    'loc': {
      '$exists': true
    }
  }

  let set = {
    '$set': {
      'population': {
        '$cond': [
          {
            '$and': [
              {
                '$anyElementTrue': [
                  {
                    '$map': {
                      'input': [
                        'US', 'Canada', 'France'
                      ],
                      'as': 'el',
                      'in': {
                        '$eq': [
                          '$$el', '$country'
                        ]
                      }
                    }
                  }
                ]
              }, '$state'
            ]
          }, 0, '$population'
        ]
      },
      'confirmed': {
        '$cond': [
          {
            '$and': [
              {
                '$anyElementTrue': [
                  {
                    '$map': {
                      'input': [
                        'France'
                      ],
                      'as': 'el',
                      'in': {
                        '$eq': [
                          '$$el', '$country'
                        ]
                      }
                    }
                  }
                ]
              }, '$state'
            ]
          }, 0, '$confirmed'
        ]
      },
      'deaths': {
        '$cond': [
          {
            '$and': [
              {
                '$anyElementTrue': [
                  {
                    '$map': {
                      'input': [
                        'France'
                      ],
                      'as': 'el',
                      'in': {
                        '$eq': [
                          '$$el', '$country'
                        ]
                      }
                    }
                  }
                ]
              }, '$state'
            ]
          }, 0, '$deaths'
        ]
      },
      'recovered': {
        '$cond': [
          {
            '$and': [
              {
                '$anyElementTrue': [
                  {
                    '$map': {
                      'input': [
                        'France', 'US', 'Canada'
                      ],
                      'as': 'el',
                      'in': {
                        '$eq': [
                          '$$el', '$country'
                        ]
                      }
                    }
                  }
                ]
              }, '$state'
            ]
          }, 0, '$recovered'
        ]
      }
    }
  }

  let _id = {
    'date': '$date'
  }

  if (country !== '') {
    match['country'] = country;
    _id['country'] = '$country';

    if (state !== '') {
      set = {
        '$match': {}
      }
      match['state'] = state;
      _id['state'] = '$state';

      if (county !== '') {
        match['county'] = county;
        _id['county'] = '$county';
      }
    }
  }

  const pipeline = [
    {
      '$match': match
    }, {
      '$sort': {
        'date': 1
      }
    }, set, {
      '$group': {
        '_id': '$loc',
        'docs': {
          '$push': {
            'date': '$date',
            'country': '$country',
            'state': '$state',
            'county': '$county',
            'confirmed': '$confirmed',
            'deaths': '$deaths',
            'recovered': '$recovered',
            'population': '$population'
          }
        }
      }
    }, {
      '$set': {
        'docs': {
          '$map': {
            'input': {
              '$range': [
                0, {
                  '$size': '$docs'
                }
              ]
            },
            'as': 'idx',
            'in': {
              '$let': {
                'vars': {
                  'yearly': {
                    '$arrayElemAt': [
                      '$docs', {
                        '$max': [
                          0, {
                            '$subtract': [
                              '$$idx', 365
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  'weekly': {
                    '$arrayElemAt': [
                      '$docs', {
                        '$max': [
                          0, {
                            '$subtract': [
                              '$$idx', 7
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  'this': {
                    '$arrayElemAt': [
                      '$docs', '$$idx'
                    ]
                  }
                },
                'in': {
                  'date': '$$this.date',
                  'country': '$$this.country',
                  'state': '$$this.state',
                  'county': '$$this.county',
                  'confirmed': '$$this.confirmed',
                  'deaths': '$$this.deaths',
                  'recovered': '$$this.recovered',
                  'weekly_confirmed': {
                    '$subtract': [
                      '$$this.confirmed', '$$weekly.confirmed'
                    ]
                  },
                  'weekly_deaths': {
                    '$subtract': [
                      '$$this.deaths', '$$weekly.deaths'
                    ]
                  },
                  'yearly_confirmed': {
                    '$subtract': [
                      '$$this.confirmed', '$$yearly.confirmed'
                    ]
                  },
                  'population': '$$this.population'
                }
              }
            }
          }
        }
      }
    }, {
      '$unwind': '$docs'
    }, {
      '$replaceRoot': {
        'newRoot': '$docs'
      }
    }, {
      '$group': {
        '_id': _id,
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
      '$set': {
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
        },
        'fatality': {
          '$cond': [
            {
              '$eq': [
                '$confirmed', 0
              ]
            }, 0, {
              '$multiply': [
                {
                  '$divide': [
                    '$deaths', '$confirmed'
                  ]
                }, 100
              ]
            }
          ]
        }
      }
    }, {
      '$sort': {
        '_id.date': 1
      }
    }
  ]

  const blockBlobClient = containerClient.getBlockBlobClient(key);

  redis_get(key)
    .then(async (result) => {
      if (result) {
        console.log(`Caught '${key}' in Redis cache`);
        res.status(200).json(JSON.parse(result));
      } else { // no redis cache found
        // try azure blob
        blockBlobClient.download()
          .then(AzureResponse => streamToString(AzureResponse.readableStreamBody))
          .then(data => {
            console.log(`Caught '${key}' in Azure blob`);
            // store in redis
            redis_client.setex(key, 28800, JSON.stringify({
              source: "Redis Cache",
              result: JSON.parse(data).result
            }));
            res.status(200).json(JSON.parse(data));
          })
          .catch(err => {
            if (err.details.errorCode === 'BlobNotFound') { // no cache found in azure blob
              covid19.collection("global_and_us").aggregate(pipeline, { allowDiskUse: true }).toArray()
                .then(async (result) => {
                  // Store in Redis
                  redis_client.setex(key, 28800, JSON.stringify({
                    source: "Redis Cache",
                    result: result
                  }));

                  // Store in Azure blob
                  const blobData = JSON.stringify({
                    source: "Azure Blob",
                    result: result
                  });
                  blockBlobClient.upload(blobData, blobData.length);

                  // Send response
                  res.send({
                    source: "MongoDB",
                    result: result
                  });
                })
                .catch(err => {
                  console.error(err)
                })
            }
          })
      }
    })
    .catch(err => console.error(err))

})

router.get('/docs', async (req, res, next) => {
  res.sendFile('public/api-docs/index.html', { root: './' })
})

function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

module.exports = router;

