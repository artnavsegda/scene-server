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