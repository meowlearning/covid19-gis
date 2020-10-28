const app = require('../app')
const supertest = require('supertest')
const request = supertest(app)

beforeAll(done => {
    app.on('ready', done)
});

describe('GET /api/regions', () => {
    it('country not empty', async done => {
        const res = await request.get('/api/regions')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('result')
        expect(res.body.result.length).toBeGreaterThan(0)
        done();
    })

    it('country property not empty', async done => {
        const res = await request.get('/api/regions')
        expect(res.status).toBe(200)
        expect(res.body.result[0]).toHaveProperty('_id')
        expect(res.body.result[0]['_id']).toHaveProperty('country')
        expect(res.body.result[0]).toHaveProperty('lat')
        expect(res.body.result[0]).toHaveProperty('lng')
        done()
    })
})

describe('GET /api/regions?country=US', () => {
    it('state not empty', async done => {
        const res = await request.get('/api/regions?country=US')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('result')
        expect(res.body.result.length).toBeGreaterThan(0)
        done();
    })

    it('correct state property', async done => {
        const res = await request.get('/api/regions?country=US')
        expect(res.status).toBe(200)
        expect(res.body.result[0]).toHaveProperty('_id')
        expect(res.body.result[0]['_id']).toHaveProperty('country')
        expect(res.body.result[0]['_id']['country']).toBe('US')
        expect(res.body.result[0]['_id']).toHaveProperty('state')
        expect(res.body.result[0]).toHaveProperty('lat')
        expect(res.body.result[0]).toHaveProperty('lng')
        done()
    })
})

describe('GET /api/regions?country=US&state=New York', () => {
    it('county not empty', async done => {
        const res = await request.get('/api/regions?country=US&state=New York')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('result')
        expect(res.body.result.length).toBeGreaterThan(0)
        done();
    })

    it('correct county property', async done => {
        const res = await request.get('/api/regions?country=US&state=New York')
        expect(res.status).toBe(200)
        expect(res.body.result[0]).toHaveProperty('_id')
        expect(res.body.result[0]['_id']).toHaveProperty('country')
        expect(res.body.result[0]['_id']['country']).toBe('US')
        expect(res.body.result[0]['_id']).toHaveProperty('state')
        expect(res.body.result[0]['_id']['state']).toBe('New York')
        expect(res.body.result[0]['_id']).toHaveProperty('county')
        expect(res.body.result[0]).toHaveProperty('lat')
        expect(res.body.result[0]).toHaveProperty('lng')
        done()
    })
})

describe('GET /api/gis', () => {
    it('gis data not empty', async done => {
        const res = await request.get('/api/gis')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('result')
        expect(res.body.result.length).toBeGreaterThan(0)
        done()
    })

    it('gis data property not empty', async done => {
        const res = await request.get('/api/gis')
        expect(res.status).toBe(200)
        expect(res.body.result[0]).toHaveProperty('_id')
        expect(res.body.result[0]).toHaveProperty('country')
        expect(res.body.result[0]).toHaveProperty('population')
        expect(res.body.result[0]).toHaveProperty('date')
        expect(res.body.result[0]).toHaveProperty('confirmed')
        expect(res.body.result[0]).toHaveProperty('deaths')
        expect(res.body.result[0]).toHaveProperty('recovered')
        expect(res.body.result[0]).toHaveProperty('incidence')
        expect(res.body.result[0]).toHaveProperty('fatality')
        expect(res.body.result[0]).toHaveProperty('coords')
        done()
    })
})

describe('GET /api/graphino', () => {
    it('Global data not empty', async done => {
        const res = await request.get('/api/graphinfo')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('result')
        expect(res.body.result.length).toBeGreaterThan(0)
        done()
    })

    it('Global property not empty', async done => {
        const res = await request.get('/api/graphinfo')
        expect(res.status).toBe(200)
        expect(res.body.result[0]).toHaveProperty('_id')
        expect(res.body.result[0]['_id']).toHaveProperty('date')
        expect(res.body.result[0]).toHaveProperty('confirmed')
        expect(res.body.result[0]).toHaveProperty('deaths')
        expect(res.body.result[0]).toHaveProperty('recovered')
        expect(res.body.result[0]).toHaveProperty('weekly_confirmed')
        expect(res.body.result[0]).toHaveProperty('weekly_deaths')
        expect(res.body.result[0]).toHaveProperty('population')
        expect(res.body.result[0]).toHaveProperty('active')
        expect(res.body.result[0]).toHaveProperty('incidence')
        expect(res.body.result[0]).toHaveProperty('fatality')
        done()
    })
})

describe('GET /api/graphinfo?country=US', () => {
    it('Country data not empty', async done => {
        const res = await request.get('/api/graphinfo?country=US')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('result')
        expect(res.body.result.length).toBeGreaterThan(0)
        done()
    })

    it('Correct country property', async done => {
        const res = await request.get('/api/graphinfo?country=US')
        expect(res.status).toBe(200)
        expect(res.body.result[0]).toHaveProperty('_id')
        expect(res.body.result[0]['_id']).toHaveProperty('date')
        expect(res.body.result[0]['_id']).toHaveProperty('country')
        expect(res.body.result[0]['_id']['country']).toBe('US')
        expect(res.body.result[0]).toHaveProperty('confirmed')
        expect(res.body.result[0]).toHaveProperty('deaths')
        expect(res.body.result[0]).toHaveProperty('recovered')
        expect(res.body.result[0]).toHaveProperty('weekly_confirmed')
        expect(res.body.result[0]).toHaveProperty('weekly_deaths')
        expect(res.body.result[0]).toHaveProperty('population')
        expect(res.body.result[0]).toHaveProperty('active')
        expect(res.body.result[0]).toHaveProperty('incidence')
        expect(res.body.result[0]).toHaveProperty('fatality')
        done()
    })
})

describe('GET /api/graphinfo?country=US&state=New York', () => {
    it('state data not empty', async done => {
        const res = await request.get('/api/graphinfo?country=US&state=New York')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('result')
        expect(res.body.result.length).toBeGreaterThan(0)
        done()
    })

    it('Correct state property', async done => {
        const res = await request.get('/api/graphinfo?country=US&state=New York')
        expect(res.status).toBe(200)
        expect(res.body.result[0]).toHaveProperty('_id')
        expect(res.body.result[0]['_id']).toHaveProperty('date')
        expect(res.body.result[0]['_id']).toHaveProperty('country')
        expect(res.body.result[0]['_id']['country']).toBe('US')
        expect(res.body.result[0]['_id']).toHaveProperty('state')
        expect(res.body.result[0]['_id']['state']).toBe('New York')
        expect(res.body.result[0]).toHaveProperty('confirmed')
        expect(res.body.result[0]).toHaveProperty('deaths')
        expect(res.body.result[0]).toHaveProperty('recovered')
        expect(res.body.result[0]).toHaveProperty('weekly_confirmed')
        expect(res.body.result[0]).toHaveProperty('weekly_deaths')
        expect(res.body.result[0]).toHaveProperty('population')
        expect(res.body.result[0]).toHaveProperty('active')
        expect(res.body.result[0]).toHaveProperty('incidence')
        expect(res.body.result[0]).toHaveProperty('fatality')
        done()
    })
})

describe('GET /api/graphinfo?country=US&state=New York&county=Albany', () => {
    it('county data not empty', async done => {
        const res = await request.get('/api/graphinfo?country=US&state=New York&county=Albany')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('result')
        expect(res.body.result.length).toBeGreaterThan(0)
        done()
    })

    it('Correct county property', async done => {
        const res = await request.get('/api/graphinfo?country=US&state=New York&county=Albany')
        expect(res.status).toBe(200)
        expect(res.body.result[0]).toHaveProperty('_id')
        expect(res.body.result[0]['_id']).toHaveProperty('date')
        expect(res.body.result[0]['_id']).toHaveProperty('country')
        expect(res.body.result[0]['_id']['country']).toBe('US')
        expect(res.body.result[0]['_id']).toHaveProperty('state')
        expect(res.body.result[0]['_id']['state']).toBe('New York')
        expect(res.body.result[0]['_id']).toHaveProperty('county')
        expect(res.body.result[0]['_id']['county']).toBe('Albany')
        expect(res.body.result[0]).toHaveProperty('confirmed')
        expect(res.body.result[0]).toHaveProperty('deaths')
        expect(res.body.result[0]).toHaveProperty('recovered')
        expect(res.body.result[0]).toHaveProperty('weekly_confirmed')
        expect(res.body.result[0]).toHaveProperty('weekly_deaths')
        expect(res.body.result[0]).toHaveProperty('population')
        expect(res.body.result[0]).toHaveProperty('active')
        expect(res.body.result[0]).toHaveProperty('incidence')
        expect(res.body.result[0]).toHaveProperty('fatality')
        done()
    })
})
