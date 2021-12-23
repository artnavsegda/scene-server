import fs from "fs";
import express from "express";
import cipclient from "crestron-cip";
import { tryRead } from "./utils.js";
import { analogMap, digitalMap, feedbackDigitalMap } from "./joinMap.js";
import { turn, query, multiroom } from "./media.js";
import * as climate from "./climate.js";

const cip  = cipclient.connect({host:  "192.168.10.10",  ipid:  "\x03"},  ()  =>  {
  console.log('CIP connected')
})

let Scenarios = tryRead('scenes.json', []);

function activateScene(scene)
{
  console.log("Start scene " + scene.name)
  scene.payload.forEach(function(elementToActivate)
  {
      switch (elementToActivate.type)
      {
          case "dimmerlights"://dimmer 
              if (elementToActivate.brightness)
                  if (elementToActivate.set_Brightness)
                  {
                    cip.aset(analogMap.get(elementToActivate.set_Brightness), elementToActivate.brightness)
                  }
          case "lights"://switch
          case "dimmerlights":
              if (elementToActivate.value == 1)
                  if (elementToActivate.set_On)
                  {
                    cip.pulse(digitalMap.get(elementToActivate.set_On))
                  }
              if (elementToActivate.value == 0)
                  if (elementToActivate.set_Off)
                  {
                    cip.pulse(digitalMap.get(elementToActivate.set_Off))
                  }
      }
  });
}

cip.subscribe((data)  =>  {
	//console.log("type:"  +  data.type  +  " join:"  +  data.join  +  " value:"  +  data.value)
	switch(data.type)
	{
	  case "digital":
		//console.log("digital decode: " + feedbackDigitalMap.get(data.join))
    Scenarios.forEach(element => {
      if (element.join == data.join)
      {
        activateScene(element);
      }
    })
	}
  })

const app = express();

const port = 3000;

app.use(express.json());

app.get('/actScene', (req, res) => {
  Scenarios.forEach(element => {
    if (element.join == Number(req.query.join))
    {
      activateScene(element);
    }
  })
  res.send("OK");
})

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

app.get('/getFloorClimate', climate.getFloorClimate);
app.get('/switchFloorClimate', climate.switchFloorClimate);
app.get('/turnFloorClimate', climate.turnFloorClimate);
app.get('/setFloorClimateMode', climate.setFloorClimateMode);
app.get('/getHeaterClimate', climate.getHeaterClimate);
app.get('/switchHeaterClimate', climate.switchHeaterClimate);
app.get('/turnHeaterClimate', climate.turnHeaterClimate);
app.get('/setHeaterClimateMode', climate.setHeaterClimateMode);
app.get('/getHeaters', climate.getHeaters);
app.post('/setHeaters', climate.setHeaters);
app.get('/getFloors', climate.getFloors);
app.post('/setFloors', climate.setFloors);
//app.post('/setActiveFloors', climate.setActiveFloors);
//app.post('/setActiveHeaters', climate.setActiveHeaters);
app.get('/testclimate', climate.testclimate);
app.get('/shutdownRoom', climate.shutdownRoom);

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

export {cip};
