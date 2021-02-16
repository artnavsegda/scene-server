const fs = require('fs');
const express = require('express');
const cipclient = require('crestron-cip');

let feedbackMap = new Map([
	[1, "[Light][Garage]Ceiling[L0-1][Is_On]"],
	[2, "[Light][Corridor]Ceiling[L0-2][Is_On]"],
	[3, "[Light][Boiler]Ceiling[L0-3][Is_On]"],
	[4, "[Light][Technical_room]Ceiling[L0-4][Is_On]"],
	[5, "[Light][Stairs]Bra[Ll1][Is_On]"],
	[6, "[Light][Stairs]Bra[Ll2][Is_On]"],
	[7, "[Light][Hallway]Ceiling[L1-1][Is_On]"],
	[8, "[Light][Hall]Ceiling[L2-1][Is_On]"],
	[9, "[Light][Hall]Bra[L2-1/1][Is_On]"],
	[10, "[Light][Hall]LED[L2-2][Is_On]"],
	[11, "[Light][Hall]Ceiling[L2-3][Is_On]"],
	[12, "[Light][Hall]LED[L2-4/1][Is_On]"],
	[13, "[Light][Hall]LED[L2-4/2][Is_On]"],
	[14, "[Light][Hall]Lamp[L2-5][Is_On]"],
	[15, "[Light][Hall]LED[L2-6][Is_On]"],
	[16, "[Light][Living_room]Luster[L3-1][Is_On]"],
	[17, "[Light][Living_room]LED[L3-2][Is_On]"],
	[18, "[Light][Living_room]LED[L3-3][Is_On]"],
	[19, "[Light][Living_room]LED[L3-4][Is_On]"],
	[20, "[Light][Kitchen]Luster[L4-1][Is_On]"],
	[21, "[Light][Kitchen]Built-in[L4-2][Is_On]"],
	[22, "[Light][Kitchen]LED[L4-2/1][Is_On]"],
	[23, "[Light][Kitchen]Built-in[L4-3][Is_On]"],
	[24, "[Light][Bathroom]Bra[L5-1][Is_On]"],
	[25, "[Light][Bathroom]Luster[L5-2][Is_On]"],
	[26, "[Light][Bedroom]Luster[L6-1][Is_On]"],
	[27, "[Light][Bedroom]LED[L6-3][Is_On]"],
	[28, "[Light][Bedroom]Bra[L6-5][Is_On]"],
	[29, "[Light][Bedroom]LED[L6-6][Is_On]"],
	[30, "[Light][Bedroom]Bra[L6-7][Is_On]"],
	[31, "[Light][Bedroom]Bra[L6-8][Is_On]"],
	[32, "[Light][Bedroom]Outlet[L6-9][Is_On]"],
	[33, "[Light][Bedroom]Outlet[L6-10][Is_On]"],
	[34, "[Light][Kids_room]Ceiling[L7-1][Is_On]"],
	[35, "[Light][Kids_room]Ceiling[L7-2][Is_On]"],
	[36, "[Light][Kids_room]Bra[L7-3][Is_On]"],
	[37, "[Light][Kids_room]Bra[L7-4][Is_On]"],
	[38, "[Light][Kids_room]Ceiling[L7-5][Is_On]"],
	[39, "[Light][Kids_room]Ceiling[L7-6][Is_On]"],
	[40, "[Light][Kids_room]Bra[L7-7][Is_On]"],
	[41, "[Light][Kids_room]Bra[L7-8][Is_On]"],
	[42, "[Light][Bedroom_bathroom]Ceiling[L8-1][Is_On]"],
	[43, "[Light][Bedroom_bathroom]Mirror[L8-2][Is_On]"],
	[44, "[Light][Kids_room_bathroom]Ceiling[L9-1][Is_On]"],
	[45, "[Light][Kids_room_bathroom]Mirror[L9-2][Is_On]"],
	[46, "[Light][Hall]Bra[L10-1][Is_On]"],
	[47, "[Light][Hall]Ceiling[L10-2][Is_On]"],
	[48, "[Light][Cabinet]Ceiling[L11-1][Is_On]"],
	[49, "[Light][Cabinet]Ceiling[L11-2][Is_On]"],
	[50, "[Light][Cabinet]Bra[L11-3][Is_On]"],
	[51, "[Light][Cabinet]LED[L11-4][Is_On]"],
	[52, "[Light][Cabinet]Luster[Ll3][Is_On]"],
	[53, "[Light][Hall]Bra[L12-1][Is_On]"],
	[54, "[Light][Bathroom]Lamp[L13-1][Is_On]"],
	[55, "[Light][Bathroom]Bra_mirror[L13-2][Is_On]"],
	[56, "[Light][Bathroom][L13-3][Is_On]"],
	[57, "[Light][Bathroom]LED[L13-4][Is_On]"],
	[58, "[Light][1st_level]Lamp[L14-1][Is_On]"],
	[59, "[Light][1st_level]Lamp[L14-2][Is_On]"],
	[60, "[Light][1st_level]Bra[L14-3][Is_On]"],
	[61, "[Light][1st_level]Bra[L14-4][Is_On]"],
	[62, "[Light][Balcony]Lamp[L15-1][Is_On]"]
]);

const  cip  = cipclient.connect({host:  "192.168.10.10",  ipid:  "\x03"},  ()  =>  {
  console.log('CIP connected')
})

cip.subscribe((data)  =>  {
  console.log("type:"  +  data.type  +  " join:"  +  data.join  +  " value:"  +  data.value)
})

const tryRead = (filename, template) => {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch(err) {
    console.log("no file " + filename);
    return template;
  }
}

let climateSchedule = tryRead('climate.json', {
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
  });
let Scenarios = tryRead('scenes.json', []);

const app = express();
const port = 3000;

app.use(express.json());


app.post('/setScen', (req, res) => {
    console.log("data:" + JSON.stringify(req.body))
    Scenarios = req.body;
    fs.writeFile('scenes.json', JSON.stringify(Scenarios),(error) => {});
    res.json(req.body);
})

app.get('/getScen', (req, res) => {
    res.send(Scenarios);
})
    
app.get('/getClimate', (req, res) => {
    res.send(climateSchedule);
})

app.post('/setClimate', (req, res) => {
    console.log("data:" + JSON.stringify(req.body))
    climateSchedule = req.body;
    fs.writeFile('climate.json', JSON.stringify(climateSchedule),(error) => {});
    res.json(req.body);
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
