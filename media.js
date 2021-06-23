import mqtt from "mqtt";
import EventEmitter from "events";
import cipclient from "crestron-cip";
import fetch from "node-fetch";

var client  = mqtt.connect('mqtt://127.0.0.1')

const cip = cipclient.connect({host:  "192.168.10.11",  ipid:  "\x05"},  ()  =>  { // 192.168.10.11
  console.log('CIP connected')
})

const myEmitter = new EventEmitter();

client.on('connect', function () {
    client.subscribe('presence', function (err) {
      if (!err) {
        client.publish('presence', 'Hello mqtt')
      }
    })
  })
   
client.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString())
    //client.end()
})

let sources = {
  "appletv": {on: false, in: "", matrixcode: 6},
  "appletv2": {on: false, in: "", matrixcode: 7},
  "kodi": {on: false, in: "", matrixcode: 4},
  "kodi2": {on: false, in: "", matrixcode: 5},
  "yamaha": {on: false, in: "", ampinput: 1},
  "yamaha2": {on: false, in: "", ampinput: 2},
  "yamaha_big": {on: false, in: ""},
  "sat1": {on: false, in: "", matrixcode: 1},
  "sat2": {on: false, in: "", matrixcode: 2},
  "sat3": {on: false, in: "", matrixcode: 3},
}

let rooms = {
  "cinema": { list: ["appletv", "kodi", "appletv2", "kodi2"], current: "", matrixjoin: 21},
  "livingroom": { list: ["appletv", "kodi", "yamaha_big", "appletv2", "kodi2"], current: "", matrixjoin: 21},
  "kitchen": { list: ["yamaha", "yamaha2", "appletv", "kodi", "appletv2", "kodi2"], current: "", ampcode: 1, ampon: 11, ampoff: 21, matrixjoin: 22},
  "bathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 2, ampon: 12, ampoff: 22},
  "bedroom": { list: ["yamaha", "yamaha2", "appletv", "kodi", "appletv2", "kodi2"], current: "", ampcode: 3, ampon: 13, ampoff: 23, matrixjoin: 24, tvjoin: { on: 300, off: 301, hdmi1: 303 }},
  "kidsroom": { list: [], current: "", matrixjoin: 25},
  "bedroombathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 4, ampon: 14, ampoff: 24},
  "highfloorbathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 5, ampon: 15, ampoff: 25},
  "cabinet": { list: [], current: "", matrixjoin: 26},
  "workshop": { list: [], current: "", matrixjoin: 27}
}

//turn down every unused source in particular room
myEmitter.on('turn', function(power, location, source, prevSource) {
  if (power == "on")
  {
    rooms[location].list.forEach((key) => {
      if (key != source)
      {
        sources[key].on = false;
        client.publish('/media/' + location + '/'+ key +'/on', "0", {retain: true})
      }
    })
  }
});

function powerOn(location, source, prevSource)
{
  let timeout = 10;

  switch (location)
  {
    case "cinema":
      if (prevSource == "")
      {
          timeout += 60;
          cip.pulse(3);
      }
      else
      {
          timeout += 5;
      }
      fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=on")
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setInput?input=av1"))
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut1?enable=true"))
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut2?enable=false"))
    break;
    case "livingroom":
      timeout += 5;
      fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=on")
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setInput?input=av1"))
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut1?enable=true"))
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut2?enable=false"))
    break;
    case "kitchen":
    case "bathroom":
    case "bedroom":
    case "bedroombathroom":
    case "highfloorbathroom":
      console.log("Media CIP pulse " + rooms[location].ampon);
      cip.pulse(rooms[location].ampon);
      console.log("CIP analog " + rooms[location].ampcode + " = " + sources[source].ampinput);
      cip.aset(rooms[location].ampcode, sources[source].ampinput);
      switch (source) {
        case "appletv":
        case "kodi":
          cip.pulse(rooms[location].tvjoin.on);
          cip.pulse(rooms[location].tvjoin.hdmi1);
          break;
      }
    break;
    default:
      timeout += 5;
  }

  switch (location)
  {
    case "cinema":
    case "bedroom":
    case "livingroom":
    case "kitchen":
      console.log("CIP analog " + rooms[location].matrixjoin + " = " + sources[source].matrixcode);
      cip.aset(rooms[location].matrixjoin, sources[source].matrixcode);
    break;
  }

  return timeout;
}

function powerOff(location,source)
{
  let timeout = 5;

  switch (location)
  {
    case "cinema":
      timeout += 60;
      cip.pulse(4);
      fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=standby")
        .then(res => res.json())
        .then(json => console.log(json));
    break;
    case "livingroom":
      timeout += 5;
    break;
    case "kitchen":
    case "bathroom":
    case "bedroom":
    case "bedroombathroom":
    case "highfloorbathroom":
      cip.pulse(rooms[location].ampoff);
      switch (source) {
        case "appletv":
        case "kodi":
          cip.pulse(rooms[location].tvjoin.off);
          break;
      }
    break;
    default:
      timeout += 5;
  }

  return timeout;
}

export function turn(parameters)
{
  let timeout = 0;
  let result = "ok";
  let details = {prompt: ""};

  console.log(parameters.power);
  console.log(parameters.location);
  console.log(parameters.source);

  myEmitter.emit('turn', parameters.power, parameters.location, parameters.source, rooms[parameters.location].current);

  if (parameters.power == "on")
  {
    if (sources[parameters.source].on == false)
    {
      // calculate timeouts & execute actions
      timeout = powerOn(parameters.location, parameters.source, rooms[parameters.location].current);

      sources[parameters.source].on = true
      sources[parameters.source].location = parameters.location;
      rooms[parameters.location].current = parameters.source;
      client.publish('/media/' + parameters.location + '/' + parameters.source +'/on', "1", {retain: true});
    }
    else if (sources[parameters.source].in != parameters.location)
    {
      result = "busy";
      details = {
        in: sources[parameters.source].in,
        prompt: "Устройство занято в команте " + sources[parameters.source].in
      }
    }
  }
  else if (parameters.power == "off")
  {
    // calculate timeouts & execute actions
    timeout = powerOff(parameters.location, parameters.source);

    sources[parameters.source].on = false;
    sources[parameters.source].in = "";
    rooms[parameters.location].current = "";
    client.publish('/media/' + parameters.location + '/'+ parameters.source +'/on', "0", {retain: true});
  }

  console.log("timeout:" + timeout)

  return {result, timeout, details}
}
