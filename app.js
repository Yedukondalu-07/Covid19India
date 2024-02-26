const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initilizeDBAnsServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    proces.exit(1)
  }
}

initilizeDBAnsServer()

const convertStateObIntoResObj = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistDBObjToResObj = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

// API: 1

app.get('/states/', async (req, res) => {
  const getStateQuery = `SELECT *
                      FROM state;`
  const allStates = await db.all(getStateQuery)

  res.send(allStates.map(eachState => convertStateObIntoResObj(eachState)))
})

//API: 2

app.get(`/states/:stateId/`, async (req, res) => {
  const {stateId} = req.params
  const getStateQuery = `SELECT * 
                        FROM
                          state
                        WHERE 
                          state_id = '${stateId}';`
  const state = await db.get(getStateQuery)
  res.send(convertStateObIntoResObj(state))
})

//API: 3

app.post('/districts/', async (req, res) => {
  const {districtName, stateId, cases, cured, active, deaths} = req.body
  const insertDistQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
                            VALUES 
                            ("${districtName}",
                            ${stateId}, 
                            ${cases},
                            ${cured},
                            ${active},
                            ${deaths})`;
  await db.run(insertDistQuery)
  res.send('District Successfully Added')
})

//API: 4

app.get('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const getDistQuery = `SELECT 
                          * 
                        FROM 
                          district
                        WHERE 
                          district_id = ${districtId};`
  const eachDist = await db.get(getDistQuery)
  res.send(convertDistDBObjToResObj(eachDist))
})

//API: 5

app.delete('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const deleteDistQuery = `DELETE FROM district 
                            WHERE district_id = ${districtId};`
  await db.run(deleteDistQuery)
  res.send('District Removed')
})

//API: 6

app.put('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const {districtName, stateId, cases, cured, active, deaths} = req.body
  const updateDistQuery = `UPDATE district
                          SET 
                          district_name = "${districtName}",
                          state_id = ${stateId},
                          cases = ${cases},
                          cured = ${cured},
                          active = ${active},
                          deaths = ${deaths}
                          WHERE district_id = ${districtId};`
  await db.run(updateDistQuery)
  res.send('District Details Updated')
})

//API: 7

app.get('/states/:stateId/stats/', async (req, res) => {
  const {stateId} = req.params
  const stateStatQuery = `SELECT 
                            SUM(cases),
                            SUM(cured),
                            SUM(active),
                            SUM(deaths)
                          FROM 
                            district
                          WHERE state_id = ${stateId};`
  const stat = await db.get(stateStatQuery)

  res.send({
    totalCases: stat['SUM(cases)'],
    totalCured: stat['SUM(cured)'],
    totalActive: stat['SUM(active)'],
    totalDeaths: stat['SUM(deaths)'],
  })
})

//API: 8

app.get('/districts/:districtId/details/', async (req, res) => {
  const {districtId} = req.params
  const getDistQuery = `SELECT 
                            state_id 
                        FROM 
                            district 
                        WHERE district_id = ${districtId};`
  const getDistIdQueryRes = await db.get(getDistQuery)
  const getStateNameQuery = `SELECT state_name as stateName FROM
                                  state WHERE state_id = ${getDistIdQueryRes.state_id};`
  const getStateQueryRes = await db.get(getStateNameQuery)
  res.send(getStateQueryRes)
})

module.exports = app
