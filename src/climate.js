import { app, tryRead, cip } from "./index.js"
import { climateDigitalMap } from "./climateJoinMap.js";
import { client } from "./media.js";

const climateTemplate = {
	mode: "weekly",
	weekly: [
		[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
		[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
		[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
		[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
		[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
		[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
		[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
	],
	daily: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
}

const activeTemplate = {
	weekly: [],
	daily: []
}

let floorsSchedule = tryRead('floors.json', climateTemplate);
let heatersSchedule = tryRead('heaters.json', climateTemplate);

let floorsActive = tryRead('floorsActive.json', activeTemplate);
let heatersActive = tryRead('heatersActive.json', activeTemplate);

app.get('/getFloors', (req, res) => {
    res.send(floorsSchedule);
})

app.post('/setFloors', (req, res) => {
    console.log("data:" + JSON.stringify(req.body))
    floorsSchedule = req.body;
    fs.writeFile('floors.json', JSON.stringify(floorsSchedule),(error) => {});
    res.json(req.body);
})

app.get('/getHeaters', (req, res) => {
    res.send(heatersSchedule);
})

app.post('/setHeaters', (req, res) => {
    console.log("data:" + JSON.stringify(req.body))
    heatersSchedule = req.body;
    fs.writeFile('heaters.json', JSON.stringify(heatersSchedule),(error) => {});
    res.json(req.body);
})

app.get('/getActiveFloors', (req, res) => {
    res.send(floorsActive);
})

app.post('/setActiveFloors', (req, res) => {
    console.log("data:" + JSON.stringify(req.body))
    floorsActive = req.body;
    fs.writeFile('floorsActive.json', JSON.stringify(floorsActive),(error) => {});
    res.json(req.body);
})

app.get('/getActiveHeaters', (req, res) => {
    res.send(heatersActive);
})

app.post('/setActiveHeaters', (req, res) => {
    console.log("data:" + JSON.stringify(req.body))
    heatersActive = req.body;
    fs.writeFile('heatersActive.json', JSON.stringify(heatersActive),(error) => {});
    res.json(req.body);
})

export function processDaily(elementList, schedule)
{
    var setValue = schedule[new Date().getHours()] ? 1 : 0;

    elementList.forEach(element => {
        cip.dset(elementList[element], setValue);
    });
}

export function processWeekly(elementList,schedule)
{
    var dayWeekNumber = (new Date().getDay() + 6) % 7;
    processDaily(elementList, schedule[dayWeekNumber]);
}

app.get('/testclimate', (req, res) => {
    res.send("test climate");
    processClimate();
})

function processDaily(elementList, schedule)
{
    var setValue = schedule[new Date().getHours()] ? 1 : 0;
    var invSetValue = schedule[new Date().getHours()] ? 0 : 1;

    elementList.forEach(element => {
        const cipnumber = new Map(climateDigitalMap).get(element + "[Enable]");
        cip.dset(cipnumber, invSetValue);
        cip.dset(cipnumber, setValue);
        console.log("join " + element + " number " + cipnumber + " value " + setValue);
    });
}

function processWeekly(elementList,schedule)
{
    var dayWeekNumber = (new Date().getDay() + 6) % 7;
    processDaily(elementList, schedule[dayWeekNumber]);
}

function processClimate()
{
        console.log("floors weekly");
        processWeekly(floorsActive.weekly,floorsSchedule.weekly);
        console.log("floors daily");
        processDaily(floorsActive.daily,floorsSchedule.daily)
        console.log("heaters weekly");
        processWeekly(heatersActive.weekly,heatersSchedule.weekly);
        console.log("heaters daily");
        processDaily(heatersActive.daily,heatersSchedule.daily);
}

const climateTimer = setInterval((w) => {
    processClimate();
},100000)

/* export const climateFloors = new Map([
	["[Climate][Hallway]Floor", {mode: "always", state: "on"}],
    ["[Climate][Hall]Floor", {mode: "always", state: "on"}],
    ["[Climate][Livingroom]Floor", {mode: "always", state: "on"}],
    ["[Climate][Kitchen]Floor", {mode: "always", state: "on"}],
    ["[Climate][Bathroom]Floor", {mode: "always", state: "on"}],
    ["[Climate][Bedroom]Floor", {mode: "always", state: "on"}],
    ["[Climate][Kids_room]Floor", {mode: "always", state: "on"}],
    ["[Climate][2nd_floor_Bathrooms]Floor", {mode: "always", state: "on"}],
    ["[Climate][2nd_floor_stairs]Floor", {mode: "always", state: "on"}],
    ["[Climate][Cabinet]Floor", {mode: "always", state: "on"}],
    ["[Climate][3rd_floor_stairs]Floor", {mode: "always", state: "on"}],
    ["[Climate][3rd_floor_Bathroom]Floor", {mode: "always", state: "on"}],
    ["[Climate][Workshop]Floor", {mode: "always", state: "on"}],
])

export const climateHeaters = new Map([
    ["[Climate][Garage]Heater", {mode: "always", state: "on"}],
    ["[Climate][Boiler]Heater", {mode: "always", state: "on"}],
    ["[Climate][Technical_room]Heater", {mode: "always", state: "on"}],
    ["[Climate][Livingroom]Heater", {mode: "always", state: "on"}],
    ["[Climate][Kitchen]Heater", {mode: "always", state: "on"}],
    ["[Climate][Bedroom]Heater", {mode: "always", state: "on"}],
    ["[Climate][Kids_room]Heater", {mode: "always", state: "on"}],
    ["[Climate][2nd_floor_stairs]Heater", {mode: "always", state: "on"}],
    ["[Climate][Cabinet]Heater", {mode: "always", state: "on"}],
    ["[Climate][3rd_floor_stairs]Heater", {mode: "always", state: "on"}],
    ["[Climate][Workshop]Heater", {mode: "always", state: "on"}],
])

app.get('/getFloorClimate', (req, res) => {
    res.send(climateFloors);
})

app.get('/switchFloorClimate', (req, res) => {
    req.query;
    res.send("ok");
})

app.get('/setFloorClimateMode', (req, res) => {
    req.query;
    res.send("ok");
})

app.get('/getHeaterClimate', (req, res) => {
    res.send(climateHeaters);
})

app.get('/switchHeaterClimate', (req, res) => {
    req.query;
    res.send("ok");
})

app.get('/setHeaterClimateMode', (req, res) => {
    req.query;
    res.send("ok");
}) */