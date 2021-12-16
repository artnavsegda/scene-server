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
    ["workshop", {mode: "always", enable: true, join: 514}],
]

const climateHeaters = [
    ["garage", {mode: "always", enable: true, join: 515}],
    ["boiler", {mode: "always", enable: true, join: 516}],
    ["technical_room", {mode: "always", enable: true, join: 517}],
    ["livingroom", {mode: "always", enable: true, join: 518}],
    ["kitchen", {mode: "always", enable: true, join: 520}],
    ["bedroom", {mode: "always", enable: true, join: 521}],
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

export function testclimate(req, res) {
    res.send("test climate");
    processClimate();
}

function processClimate()
{
    processFloors();
    processHeaters();
    processRooms();
}

function processRooms()
{
    const basementEnable = heatersActive.get('garage').enable
        || heatersActive.get('boiler').enable
        || heatersActive.get('technical_room').enable;
    client.publish('/climate/basement/enable', basementEnable, {retain: true});

    const stairsEnable = heatersActive.get('2ndstairs').enable
        || heatersActive.get('3rdstairs').enable;
    client.publish('/climate/stairs/enable', stairsEnable, {retain: true});

    const livingroomEnable = heatersActive.get('livingroom').enable
        || floorsActive.get('livingroom').enable;
    client.publish('/climate/livingroom/enable', livingroomEnable, {retain: true});

    const kitchenEnable = heatersActive.get('kitchen').enable
        || floorsActive.get('kitchen').enable;
    client.publish('/climate/kitchen/enable', kitchenEnable, {retain: true});

    const bedroomEnable = heatersActive.get('bedroom').enable
        || floorsActive.get('bedroom').enable;
    client.publish('/climate/bedroom/enable', bedroomEnable, {retain: true});

    const kidsroomEnable = heatersActive.get('kidsroom').enable
        || floorsActive.get('kidsroom').enable;
    client.publish('/climate/kidsroom/enable', kidsroomEnable, {retain: true});

    const cabinetEnable = heatersActive.get('cabinet').enable
        || floorsActive.get('cabinet').enable;
    client.publish('/climate/cabinet/enable', cabinetEnable, {retain: true});

    const workshopEnable = heatersActive.get('workshop').enable
        || floorsActive.get('workshop').enable;
    client.publish('/climate/workshop/enable', workshopEnable, {retain: true});
}

function processFloors()
{
    console.log('process floors');
    floorsActive.forEach((value,key) => {
        console.log('floors name ' + key);
        processFloor(value);
    })
}

function processFloor(floor)
{
    if (floor.enable == true)
    {
        if (floor.mode == 'always')
        {
            console.log('switch on');
            cip.dset(floor.join, 0);
            cip.dset(floor.join, 1);
        }
        else if (floor.mode == 'daily')
        {
            var setValue = floorsSchedule.daily[new Date().getHours()] ? 1 : 0;
            console.log('daily value is ' + setValue);
            var invSetValue = floorsSchedule.daily[new Date().getHours()] ? 0 : 1;
            cip.dset(floor.join, invSetValue);
            cip.dset(floor.join, setValue);
        }
        else if (floor.mode == 'weekly')
        {
            var dayWeekNumber = (new Date().getDay() + 6) % 7;
            var setValue = floorsSchedule.weekly[dayWeekNumber][new Date().getHours()] ? 1 : 0;
            console.log('weekly value is ' + setValue);
            var invSetValue = floorsSchedule.weekly[dayWeekNumber][new Date().getHours()] ? 0 : 1;
            cip.dset(floor.join, invSetValue);
            cip.dset(floor.join, setValue);
        }
    }
    else
    {
        //disable
        console.log('switch off');
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
            console.log('switch on');
            cip.dset(heater.join, 0);
            cip.dset(heater.join, 1);
        }
        else if (heater.mode == 'daily')
        {
            var setValue = heatersSchedule.daily[new Date().getHours()] ? 1 : 0;
            console.log('daily value is ' + setValue);
            var invSetValue = heatersSchedule.daily[new Date().getHours()] ? 0 : 1;
            cip.dset(heater.join, invSetValue);
            cip.dset(heater.join, setValue);
        }
        else if (heater.mode == 'weekly')
        {
            var dayWeekNumber = (new Date().getDay() + 6) % 7;
            var setValue = heatersSchedule.weekly[dayWeekNumber][new Date().getHours()] ? 1 : 0;
            console.log('weekly value is ' + setValue);
            var invSetValue = heatersSchedule.weekly[dayWeekNumber][new Date().getHours()] ? 0 : 1;
            cip.dset(heater.join, invSetValue);
            cip.dset(heater.join, setValue);
        }
    }
    else
    {
        //disable
        console.log('switch off');
        cip.dset(heater.join, 1);
        cip.dset(heater.join, 0);
    }
}

function processHeaters()
{
    console.log('process heaters');
    heatersActive.forEach((value,key) => {
        console.log('heater name ' + key);
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
    var floor = floorsActive.get(req.query.floor);
    console.log('switch '+req.query.floor+' Floor Climate');
    floor.enable = !floor.enable;
    floorsActive.set(req.query.floor, floor);
    client.publish('/climate/floor/' + req.query.floor +'/enable', floor.enable, {retain: true});
    processFloor(floor);
    fs.writeFile('floorsActive.json', JSON.stringify(Array.from(floorsActive.entries())),(error) => {});
    res.send("ok");
    processRooms();
}

export function turnFloorClimate(req, res) {
    var floor = floorsActive.get(req.query.floor);
    console.log('turn '+req.query.floor+' Floor Climate' + req.query.turn);
    floor.enable = (req.query.turn === 'true');
    floorsActive.set(req.query.floor, floor);
    client.publish('/climate/floor/' + req.query.floor +'/enable', floor.enable, {retain: true});
    processFloor(floor);
    fs.writeFile('floorsActive.json', JSON.stringify(Array.from(floorsActive.entries())),(error) => {});
    res.send("ok");
    processRooms();
}

export function setFloorClimateMode(req, res) {
    var floor = floorsActive.get(req.query.floor);
    floor.mode = req.query.mode;
    console.log('set '+req.query.floor+' Floor Climate mode ' + floor.mode);
    floorsActive.set(req.query.floor, floor);
    client.publish('/climate/floor/' + req.query.floor +'/mode', modes[floor.mode], {retain: true});
    processFloor(floor);
    fs.writeFile('floorsActive.json', JSON.stringify(Array.from(floorsActive.entries())),(error) => {});
    res.send("ok");
}

export function getHeaterClimate(req, res) {
    res.send(Array.from(heatersActive.entries()));
}

export function turnHeaterClimate(req, res) {
    var heater = heatersActive.get(req.query.heater);
    console.log('turn '+req.query.heater+' Heater Climate' + req.query.turn);
    heater.enable = (req.query.turn === 'true');
    heatersActive.set(req.query.heater, heater);
    client.publish('/climate/heater/' + req.query.heater +'/enable', heater.enable, {retain: true});
    processHeater(heater);
    fs.writeFile('heatersActive.json', JSON.stringify(Array.from(heatersActive.entries())),(error) => {});
    res.send("ok");
    processRooms();
}

export function switchHeaterClimate(req, res) {
    var heater = heatersActive.get(req.query.heater);
    console.log('switch '+req.query.heater+' Heater Climate');
    heater.enable = !heater.enable;
    heatersActive.set(req.query.heater, heater);
    client.publish('/climate/heater/' + req.query.heater +'/enable', heater.enable, {retain: true});
    processHeater(heater);
    fs.writeFile('heatersActive.json', JSON.stringify(Array.from(heatersActive.entries())),(error) => {});
    res.send("ok");
    processRooms();
}

export function setHeaterClimateMode(req, res) {
    var heater = heatersActive.get(req.query.heater);
    heater.mode = req.query.mode;
    console.log('set '+req.query.heater+' Heater Climate mode ' + heater.mode);
    heatersActive.set(req.query.heater, heater);
    client.publish('/climate/heater/' + req.query.heater +'/mode', modes[heater.mode], {retain: true});
    processHeater(heater);
    fs.writeFile('heatersActive.json', JSON.stringify(Array.from(heatersActive.entries())),(error) => {});
    res.send("ok");
}

export function shutdownRoom(req, res) {
    switch (req.query.room)
    {
        case 'basement':
            ['garage', 'boiler', 'technical_room'].forEach((element) => {
                var heater = heatersActive.get(element);
                heater.mode = false;
                heatersActive.set(element, heater);
                client.publish('/climate/heater/' + element +'/enable', false, {retain: true});
            })
        break
        case 'stairs':
            ['2ndstairs', '3rdstairs'].forEach((element) => {
                var heater = heatersActive.get(element);
                heater.mode = false;
                heatersActive.set(element, heater);
                client.publish('/climate/heater/' + element +'/enable', false, {retain: true});
            })
        default:
            var heater = heatersActive.get(req.query.room);
            heater.mode = false;
            heatersActive.set(req.query.room, heater);
            client.publish('/climate/heater/' + req.query.room +'/enable', false, {retain: true});

            var floor = floorsActive.get(req.query.room);
            floor.mode = false;
            floorsActive.set(req.query.room, floor);
            client.publish('/climate/floor/' + req.query.room +'/enable', false, {retain: true});
    }
}
