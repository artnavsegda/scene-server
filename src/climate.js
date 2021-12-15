import fs from "fs";
import { cip } from "./index.js"
import { tryRead } from "./utils.js";
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

const climateFloors = [
	["hallway", {mode: "always", enable: true, join: 501}],
    ["hall", {mode: "always", enable: true, join: 502}],
    ["livingroom", {mode: "always", enable: true, join: 503}],
    ["kitchen", {mode: "always", enable: true, join: 504}],
    ["bathroom", {mode: "always", enable: true, join: 505}],
    ["bedroom", {mode: "always", enable: true, join: 506}],
    ["kidsroom", {mode: "always", enable: true, join: 507}],
    ["2ndbathroom", {mode: "always", enable: true, join: 508}],
    ["2ndstairs", {mode: "always", enable: true, join: 510}],
    ["cabinet", {mode: "always", enable: true, join: 511}],
    ["3rdstairs", {mode: "always", enable: true, join: 512}],
    ["3rdbathroom", {mode: "always", enable: true, join: 513}],
    ["Workshop", {mode: "always", enable: true, join: 514}],
]

const climateHeaters = [
    ["garage", {mode: "always", enable: true, join: 515}],
    ["boiler", {mode: "always", enable: true, join: 516}],
    ["technical_room", {mode: "always", enable: true, join: 517}],
    ["livingroom", {mode: "always", enable: true, join: 518}],
    ["kitchen", {mode: "always", enable: true, join: 520}],
    ["nedroom", {mode: "always", enable: true, join: 521}],
    ["kidsroom", {mode: "always", enable: true, join: 522}],
    ["2ndstairs", {mode: "always", enable: true, join: 523}],
    ["cabinet", {mode: "always", enable: true, join: 524}],
    ["3rdstairs", {mode: "always", enable: true, join: 525}],
    ["workshop", {mode: "always", enable: true, join: 526}],
]

let floorsSchedule = tryRead('floors.json', climateTemplate);
let heatersSchedule = tryRead('heaters.json', climateTemplate);

let floorsActive = new Map(tryRead('floorsActive.json', climateFloors))
let heatersActive = new Map(tryRead('heatersActive.json', climateHeaters))

export function getFloors(req, res) {
    res.send(floorsSchedule);
}

export function setFloors(req, res) {
    console.log("data:" + JSON.stringify(req.body))
    floorsSchedule = req.body;
    fs.writeFile('floors.json', JSON.stringify(floorsSchedule),(error) => {});
    res.json(req.body);
}

export function getHeaters(req, res) {
    res.send(heatersSchedule);
}

export function setHeaters(req, res) {
    console.log("data:" + JSON.stringify(req.body))
    heatersSchedule = req.body;
    fs.writeFile('heaters.json', JSON.stringify(heatersSchedule),(error) => {});
    res.json(req.body);
}

export function setActiveFloors(req, res) {
    console.log("data:" + JSON.stringify(req.body))
    floorsActive = req.body;
    fs.writeFile('floorsActive.json', JSON.stringify(floorsActive),(error) => {});
    res.json(req.body);
}

export function setActiveHeaters(req, res) {
    console.log("data:" + JSON.stringify(req.body))
    heatersActive = req.body;
    fs.writeFile('heatersActive.json', JSON.stringify(heatersActive),(error) => {});
    res.json(req.body);
}

/* function processDaily(elementList, schedule)
{
    var setValue = schedule[new Date().getHours()] ? 1 : 0;

    elementList.forEach(element => {
        cip.dset(elementList[element], setValue);
    });
}

function processWeekly(elementList,schedule)
{
    var dayWeekNumber = (new Date().getDay() + 6) % 7;
    processDaily(elementList, schedule[dayWeekNumber]);
} */

export function testclimate(req, res) {
    res.send("test climate");
    processClimate();
    processHeaters();
}

/* function processDaily(elementList, schedule)
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
} */

function processClimate()
{
/*     console.log("floors weekly");
    processWeekly(floorsActive.weekly,floorsSchedule.weekly);
    console.log("floors daily");
    processDaily(floorsActive.daily,floorsSchedule.daily)
    console.log("heaters weekly");
    processWeekly(heatersActive.weekly,heatersSchedule.weekly);
    console.log("heaters daily");
    processDaily(heatersActive.daily,heatersSchedule.daily); */
    processFloors();
}

function processFloors()
{
    floorsActive.forEach((value,key) => {
        processFloor(value);
    })
}

function processFloor(floor)
{
    if (floor.enable == true)
    {
        if (floor.mode == 'always')
        {
            cip.dset(floor.join, 0);
            cip.dset(floor.join, 1);
        }
        else if (value.mode == 'daily')
        {
            var setValue = floorsSchedule.daily[new Date().getHours()] ? 1 : 0;
            var invSetValue = floorsSchedule.daily[new Date().getHours()] ? 0 : 1;
            cip.dset(floor.join, invSetValue);
            cip.dset(floor.join, setValue);
        }
        else if (floor.mode == 'weekly')
        {
            var dayWeekNumber = (new Date().getDay() + 6) % 7;
            var setValue = floorsSchedule.weekly[dayWeekNumber][new Date().getHours()] ? 1 : 0;
            var invSetValue = floorsSchedule.weekly[dayWeekNumber][new Date().getHours()] ? 0 : 1;
            cip.dset(floor.join, invSetValue);
            cip.dset(floor.join, setValue);
        }
    }
    else
    {
        //disable
        cip.dset(floor.join, 1);
        cip.dset(floor.join, 0);
    }
}

function processHeater(heater)
{
    if (heater.enable == true)
    {
        if (heater.mode == 'always')
        {
            //enable
            cip.dset(heater.join, 0);
            cip.dset(heater.join, 1);
        }
        else if (heater.mode == 'daily')
        {
            var setValue = heatersSchedule.daily[new Date().getHours()] ? 1 : 0;
            var invSetValue = heatersSchedule.daily[new Date().getHours()] ? 0 : 1;
            cip.dset(heater.join, invSetValue);
            cip.dset(heater.join, setValue);
        }
        else if (value.mode == 'weekly')
        {
            var dayWeekNumber = (new Date().getDay() + 6) % 7;
            var setValue = heatersSchedule.weekly[dayWeekNumber][new Date().getHours()] ? 1 : 0;
            var invSetValue = heatersSchedule.weekly[dayWeekNumber][new Date().getHours()] ? 0 : 1;
            cip.dset(heater.join, invSetValue);
            cip.dset(heater.join, setValue);
        }
    }
    else
    {
        //disable
        cip.dset(heater.join, 1);
        cip.dset(heater.join, 0);
    }
}

function processHeaters()
{
    heatersActive.forEach((value,key) => {
        processHeater(value)
    })
}

const climateTimer = setInterval((w) => {
    processClimate();
},100000)

const modes = {
    'always': 0,
    'daily': 1,
    'weekly': 2
}

export function getFloorClimate(req, res) {
    res.send(Array.from(floorsActive.entries()));
}

export function switchFloorClimate(req, res) {
    console.log('floor name ' + req.query.floor)
    var floor = floorsActive.get(req.query.floor);
    console.log('floor ' + floor);
    floor.enable = !floor.enable;
    floorsActive.set(req.query.floor, floor);
    client.publish('/climate/floor/' + req.query.floor +'/enable', floor.enable, {retain: true});
    processFloor(floor);
    fs.writeFile('floorsActive.json', JSON.stringify(Array.from(floorsActive.entries())),(error) => {});
    res.send("ok");
}

export function setFloorClimateMode(req, res) {
    var floor = floorsActive.get(req.query.floor);
    floor.mode = req.query.mode;
    floorsActive.set(req.query.floor, floor);
    client.publish('/climate/floor/' + req.query.floor +'/mode', modes[floor.mode], {retain: true});
    processFloor(floor);
    fs.writeFile('floorsActive.json', JSON.stringify(Array.from(floorsActive.entries())),(error) => {});
    res.send("ok");
}

export function getHeaterClimate(req, res) {
    res.send(Array.from(heatersActive.entries()));
}

export function switchHeaterClimate(req, res) {
    var heater = heatersActive.get(req.query.heater);
    heater.enable = !heater.enable;
    heatersActive.set(req.query.heater, heater);
    client.publish('/climate/heater/' + req.query.heater +'/enable', heater.enable, {retain: true});
    processHeater(heater);
    fs.writeFile('heatersActive.json', JSON.stringify(Array.from(heatersActive.entries())),(error) => {});
    res.send("ok");
}

export function setHeaterClimateMode(req, res) {
    var heater = heatersActive.get(req.query.heater);
    heater.mode = req.query.mode;
    heatersActive.set(req.query.heater, heater);
    client.publish('/climate/heater/' + req.query.heater +'/mode', modes[heater.mode], {retain: true});
    processHeater(heater);
    fs.writeFile('heatersActive.json', JSON.stringify(Array.from(heatersActive.entries())),(error) => {});
    res.send("ok");
}
