const fs = require('fs');
const express = require('express');
const cipclient = require('crestron-cip');

let digitalMap = new Map([
	["[Light][Garage]Ceiling[L0-1][On]", 1],
	["[Light][Corridor]Ceiling[L0-2][On]", 2],
	["[Light][Boiler]Ceiling[L0-3][On]", 3],
	["[Light][Technical_room]Ceiling[L0-4][On]", 4],
	["[Light][Stairs]Bra[Ll1][On]", 5],
	["[Light][Stairs]Bra[Ll2][On]", 6],
	["[Light][Hallway]Ceiling[L1-1][On]", 7],
	["[Light][Hall]Ceiling[L2-1][On]", 8],
	["[Light][Hall]Bra[L2-1/1][On]", 9],
	["[Light][Hall]LED[L2-2][On]", 10],
	["[Light][Hall]Ceiling[L2-3][On]", 11],
	["[Light][Hall]LED[L2-4/1][On]", 12],
	["[Light][Hall]LED[L2-4/2][On]", 13],
	["[Light][Hall]Lamp[L2-5][On]", 14],
	["[Light][Hall]LED[L2-6][On]", 15],
	["[Light][Living_room]Luster[L3-1][On]", 16],
	["[Light][Living_room]LED[L3-2][On]", 17],
	["[Light][Living_room]LED[L3-3][On]", 18],
	["[Light][Living_room]LED[L3-4][On]", 19],
	["[Light][Kitchen]Luster[L4-1][On]", 20],
	["[Light][Kitchen]Built-in[L4-2][On]", 21],
	["[Light][Kitchen]LED[L4-2/1][On]", 22],
	["[Light][Kitchen]Built-in[L4-3][On]", 23],
	["[Light][Bathroom]Bra[L5-1][On]", 24],
	["[Light][Bathroom]Luster[L5-2][On]", 25],
	["[Light][Bedroom]Luster[L6-1][On]", 26],
	["[Light][Bedroom]LED[L6-3][On]", 27],
	["[Light][Bedroom]Bra[L6-5][On]", 28],
	["[Light][Bedroom]LED[L6-6][On]", 29],
	["[Light][Bedroom]Bra[L6-7][On]", 30],
	["[Light][Bedroom]Bra[L6-8][On]", 31],
	["[Light][Bedroom]Outlet[L6-9][On]", 32],
	["[Light][Bedroom]Outlet[L6-10][On]", 33],
	["[Light][Kids_room]Ceiling[L7-1][On]", 34],
	["[Light][Kids_room]Ceiling[L7-2][On]", 35],
	["[Light][Kids_room]Bra[L7-3][On]", 36],
	["[Light][Kids_room]Bra[L7-4][On]", 37],
	["[Light][Kids_room]Ceiling[L7-5][On]", 38],
	["[Light][Kids_room]Ceiling[L7-6][On]", 39],
	["[Light][Kids_room]Bra[L7-7][On]", 40],
	["[Light][Kids_room]Bra[L7-8][On]", 41],
	["[Light][Bedroom_bathroom]Ceiling[L8-1][On]", 42],
	["[Light][Bedroom_bathroom]Mirror[L8-2][On]", 43],
	["[Light][Kids_room_bathroom]Ceiling[L9-1][On]", 44],
	["[Light][Kids_room_bathroom]Mirror[L9-2][On]", 45],
	["[Light][Hall]Bra[L10-1][On]", 46],
	["[Light][Hall]Ceiling[L10-2][On]", 47],
	["[Light][Cabinet]Ceiling[L11-1][On]", 48],
	["[Light][Cabinet]Ceiling[L11-2][On]", 49],
	["[Light][Cabinet]Bra[L11-3][On]", 50],
	["[Light][Cabinet]LED[L11-4][On]", 51],
	["[Light][Cabinet]Luster[Ll3][On]", 52],
	["[Light][Hall]Bra[L12-1][On]", 53],
	["[Light][Bathroom]Lamp[L13-1][On]", 54],
	["[Light][Bathroom]Bra_mirror[L13-2][On]", 55],
	["[Light][Bathroom][L13-3][On]", 56],
	["[Light][Bathroom]LED[L13-4][On]", 57],
	["[Light][1st_level]Lamp[L14-1][On]", 58],
	["[Light][1st_level]Lamp[L14-2][On]", 59],
	["[Light][1st_level]Bra[L14-3][On]", 60],
	["[Light][1st_level]Bra[L14-4][On]", 61],
	["[Light][Balcony]Lamp[L15-1][On]", 62],
	["[Light][Garage]Ceiling[L0-1][Off]", 101],
	["[Light][Corridor]Ceiling[L0-2][Off]", 102],
	["[Light][Boiler]Ceiling[L0-3][Off]", 103],
	["[Light][Technical_room]Ceiling[L0-4][Off]", 104],
	["[Light][Stairs]Bra[Ll1][Off]", 105],
	["[Light][Stairs]Bra[Ll2][Off]", 106],
	["[Light][Hallway]Ceiling[L1-1][Off]", 107],
	["[Light][Hall]Ceiling[L2-1][Off]", 108],
	["[Light][Hall]Bra[L2-1/1][Off]", 109],
	["[Light][Hall]LED[L2-2][Off]", 110],
	["[Light][Hall]Ceiling[L2-3][Off]", 111],
	["[Light][Hall]LED[L2-4/1][Off]", 112],
	["[Light][Hall]LED[L2-4/2][Off]", 113],
	["[Light][Hall]Lamp[L2-5][Off]", 114],
	["[Light][Hall]LED[L2-6][Off]", 115],
	["[Light][Living_room]Luster[L3-1][Off]", 116],
	["[Light][Living_room]LED[L3-2][Off]", 117],
	["[Light][Living_room]LED[L3-3][Off]", 118],
	["[Light][Living_room]LED[L3-4][Off]", 119],
	["[Light][Kitchen]Luster[L4-1][Off]", 120],
	["[Light][Kitchen]Built-in[L4-2][Off]", 121],
	["[Light][Kitchen]LED[L4-2/1][Off]", 122],
	["[Light][Kitchen]Built-in[L4-3][Off]", 123],
	["[Light][Bathroom]Bra[L5-1][Off]", 124],
	["[Light][Bathroom]Luster[L5-2][Off]", 125],
	["[Light][Bedroom]Luster[L6-1][Off]", 126],
	["[Light][Bedroom]LED[L6-3][Off]", 127],
	["[Light][Bedroom]Bra[L6-5][Off]", 128],
	["[Light][Bedroom]LED[L6-6][Off]", 129],
	["[Light][Bedroom]Bra[L6-7][Off]", 130],
	["[Light][Bedroom]Bra[L6-8][Off]", 131],
	["[Light][Bedroom]Outlet[L6-9][Off]", 132],
	["[Light][Bedroom]Outlet[L6-10][Off]", 133],
	["[Light][Kids_room]Ceiling[L7-1][Off]", 134],
	["[Light][Kids_room]Ceiling[L7-2][Off]", 135],
	["[Light][Kids_room]Bra[L7-3][Off]", 136],
	["[Light][Kids_room]Bra[L7-4][Off]", 137],
	["[Light][Kids_room]Ceiling[L7-5][Off]", 138],
	["[Light][Kids_room]Ceiling[L7-6][Off]", 139],
	["[Light][Kids_room]Bra[L7-7][Off]", 140],
	["[Light][Kids_room]Bra[L7-8][Off]", 141],
	["[Light][Bedroom_bathroom]Ceiling[L8-1][Off]", 142],
	["[Light][Bedroom_bathroom]Mirror[L8-2][Off]", 143],
	["[Light][Kids_room_bathroom]Ceiling[L9-1][Off]", 144],
	["[Light][Kids_room_bathroom]Mirror[L9-2][Off]", 145],
	["[Light][Hall]Bra[L10-1][Off]", 146],
	["[Light][Hall]Ceiling[L10-2][Off]", 147],
	["[Light][Cabinet]Ceiling[L11-1][Off]", 148],
	["[Light][Cabinet]Ceiling[L11-2][Off]", 149],
	["[Light][Cabinet]Bra[L11-3][Off]", 150],
	["[Light][Cabinet]LED[L11-4][Off]", 151],
	["[Light][Cabinet]Luster[Ll3][Off]", 152],
	["[Light][Hall]Bra[L12-1][Off]", 153],
	["[Light][Bathroom]Lamp[L13-1][Off]", 154],
	["[Light][Bathroom]Bra_mirror[L13-2][Off]", 155],
	["[Light][Bathroom][L13-3][Off]", 156],
	["[Light][Bathroom]LED[L13-4][Off]", 157],
	["[Light][1st_level]Lamp[L14-1][Off]", 158],
	["[Light][1st_level]Lamp[L14-2][Off]", 159],
	["[Light][1st_level]Bra[L14-3][Off]", 160],
	["[Light][1st_level]Bra[L14-4][Off]", 161],
	["[Light][Balcony]Lamp[L15-1][Off]", 162]
])

let feedbackDigitalMap = new Map([
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

const  cip  = cipclient.connect({host:  "192.168.10.10",  ipid:  "\x03"},  ()  =>  {
  console.log('CIP connected')
})

const tryRead = (filename, template) => {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch(err) {
    console.log("no file " + filename);
    return template;
  }
}

let floorsSchedule = tryRead('floors.json', climateTemplate);
let heatersSchedule = tryRead('heaters.json', climateTemplate);

let Scenarios = tryRead('scenes.json', []);

function activateScene(scene)
{
    scene.forEach(function(elementToActivate)
    {
        switch (elementToActivate.type)
        {
            case "rgblights"://color           
                if (elementToActivate.hue)
                    if (elementToActivate.set_Hue)
                        IR.GetDevice("Crestron").Set(elementToActivate.set_Hue, elementToActivate.hue);
            case "dimmerlights"://dimmer 
            case "rgblights":
                if (elementToActivate.brightness)
                    if (elementToActivate.set_Brightness)
                        IR.GetDevice("Crestron").Set(elementToActivate.set_Brightness, elementToActivate.brightness);
            case "lights"://switch
            case "dimmerlights":
            case "rgblights":
                if (elementToActivate.value == 1)
                    if (elementToActivate.set_On)
                        Pulse(elementToActivate.set_On);
                if (elementToActivate.value == 0)
                    if (elementToActivate.set_Off)
                        Pulse(elementToActivate.set_Off);
        }
    });
}

cip.subscribe((data)  =>  {
	//console.log("type:"  +  data.type  +  " join:"  +  data.join  +  " value:"  +  data.value)
	switch(data.type)
	{
	  case "digital":
		//console.log("digital decode: " + feedbackDigitalMap.get(data.join))
		if (data.join == 228)
		{
			activateScene(Scenarios)
		}
	}
  })

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
    
app.get('/getFloors', (req, res) => {
    res.send(floorSchedule);
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

app.post('/setActive', (req,res) => {
	res.json(req.body);
})

app.post('/getActive', (req,res) => {
	res.json(req.body);
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
