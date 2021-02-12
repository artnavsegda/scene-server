const fs = require('fs');
const express = require('express');

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
    res.send(meetingScenarios);
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
