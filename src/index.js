import fs from "fs";
import express from "express";
import cipclient from "crestron-cip";
import { digitalMap, feedbackDigitalMap } from "./joinMap.js";
import { turn, query, multiroom } from "./media.js";
import { 
  getFloorClimate, 
  switchFloorClimate, 
  setFloorClimateMode, 
  getHeaterClimate, 
  switchHeaterClimate, 
  setHeaterClimateMode,
  getFloors,
  setFloors,
  getHeaters,
  setHeaters,
  getActiveFloors,
  setActiveFloors,
  getActiveHeaters,
  setActiveHeaters,
  testclimate,
} from "./climate.js";

const cip  = cipclient.connect({host:  "192.168.10.10",  ipid:  "\x03"},  ()  =>  {
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

app.get('/media', (req, res) => {
  res.send(turn(req.query));
})

app.get('/query', (req, res) => {
  res.send(query(req.query));
})

app.get('/multiroom', (req, res) => {
  res.send(multiroom(req.query));
})

app.get('/getFloorClimate', getFloorClimate);
app.get('/switchFloorClimate', switchFloorClimate);
app.get('/setFloorClimateMode', setFloorClimateMode);
app.get('/getHeaterClimate', getHeaterClimate);
app.get('/switchHeaterClimate', switchHeaterClimate);
app.get('/setHeaterClimateMode', setHeaterClimateMode);
app.get('/getHeaters', getHeaters);
app.post('/setHeaters', setHeaters);
app.get('/getFloors', getFloors);
app.post('/setFloors', setFloors);
app.get('/getActiveFloors', getActiveFloors);
app.post('/setActiveFloors', setActiveFloors);
app.get('/getActiveHeaters', getActiveHeaters);
app.post('/setActiveHeaters', setActiveHeaters);
app.get('/testclimate', testclimate);

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

export {tryRead, cip};
