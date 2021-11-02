import fs from "fs";
import express from "express";
import cipclient from "crestron-cip";
import { digitalMap, feedbackDigitalMap } from "./joinMap.js";
import { turn, query, multiroom } from "./media.js";

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

let floorsActive = tryRead('floorsActive.json', activeTemplate);
let heatersActive = tryRead('heatersActive.json', activeTemplate);

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

app.get('/media', (req, res) => {
    res.send(turn(req.query));
})

app.get('/query', (req, res) => {
    res.send(query(req.query));
})

app.get('/multiroom', (req, res) => {
    res.send(multiroom(req.query));
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
