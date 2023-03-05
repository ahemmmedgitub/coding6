const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbfile = path.join(__dirname, "covid19India.db");
let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbfile,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is Running At http://localhost3001.");
    });
  } catch (e) {
    console.log(`DB error ${e.messge}`);
    process.exit(1);
  }
};

intializeDbAndServer();

let camToSnakeCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

let districtCamToSnakeCase = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// GET Method
app.get("/states/", async (request, response) => {
  const queryDetails = `
        SELECT 
            * 
        FROM 
            state 
        ORDER BY 
            state_id
    `;
  const queryResult = await db.all(queryDetails);
  response.send(
    queryResult.map((eachState) => {
      return camToSnakeCase(eachState);
    })
  );
});

// GET Method
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const queryDetails = `
        SELECT 
            * 
        FROM 
            state 
        WHERE 
            state_id = ${stateId}
    `;
  const queryResult = await db.get(queryDetails);
  response.send(camToSnakeCase(queryResult));
});

// POST Method

app.post("/districts/", async (request, response) => {
  const requestedItem = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = requestedItem;
  const queryDetailsPost = `
        INSERT INTO 
            district(district_name, state_id, cases, cured, active, deaths)
        VALUES(
            '${districtName}',
            '${stateId}',
            '${cases}',
            '${cured}',
            '${active}',
            '${deaths}'
        );
            
    `;
  const dbResponse = await db.run(queryDetailsPost);
  const districtId = response.district_id;
  response.send("District Successfully Added");
});

// GET Method

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getRequest = `
        SELECT 
            * 
        FROM 
            district
        WHERE 
            district_id = ${districtId};
    `;
  const dbResponse = await db.get(getRequest);
  response.send(districtCamToSnakeCase(dbResponse));
});

// DELETE Method

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
        DELETE FROM 
            district 
        WHERE 
            district_id = ${districtId};
    `;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

// PUT Method

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = updateDetails;

  const districtDetails = `
        UPDATE 
            district
        SET
            district_name ='${districtName}',
            state_id = '${stateId}',
            cases = '${cases}',
            cured = '${cured}',
            active = '${active}',
            deaths = '${deaths}'
        WHERE
            district_id = ${districtId};
    `;
  await db.run(districtDetails);
  response.send("District Details Updated");
});

// METHOD Get

app.get("/states/:stateId/stats/", async (request, response) => {
  const stateId = request.params;
  const queryDetails = `
        SELECT 
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM 
            district 
        WHERE 
            state_id = ${stateId};
    `;
  const dbResponse = await db.get(queryDetails);
  console.log(dbResponse);
});

// GET Method
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
        SELECT
             state_id 
        FROM 
            district
        WHERE
            district_id = ${districtId};
        `;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  console.log(getDistrictIdQueryResponse);

  const getStateNameQuery = `
        SELECT 
            state_name as stateName 
        FROM 
            state
        WHERE 
            state_id = ${getDistrictIdQueryResponse.state_id};
    `;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
