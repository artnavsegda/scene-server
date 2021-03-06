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
  "livingroom": { list: ["appletv", "kodi", "yamaha_big", "appletv2", "kodi2", "smarttv"], current: "", matrixjoin: 21, tvjoin: { on: 100, off: 101, hdmi1: 103 }},
  "kitchen": { list: ["yamaha", "yamaha2", "appletv", "kodi", "appletv2", "kodi2", "smarttv"], current: "", ampcode: 1, ampon: 11, ampoff: 21, matrixjoin: 22, tvjoin: { on: 200, off: 201, hdmi1: 203 }, ampinput: 11, matrixaudio: 31},
  "bathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 2, ampon: 12, ampoff: 22},
  "bedroom": { list: ["yamaha", "yamaha2", "appletv", "kodi", "appletv2", "kodi2", "smarttv"], current: "", ampcode: 3, ampon: 13, ampoff: 23, matrixjoin: 24, tvjoin: { on: 300, off: 301, hdmi1: 303 }, ampinput: 12, matrixaudio: 32},
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
        //if (key != "smarttv")
	      //sources[key].on = false;
        client.publish('/media/' + location + '/'+ key +'/on', "0", {retain: true})
      }
    })
    if (prevSource != "smarttv" && prevSource != "" && prevSource != source)
      sources[prevSource].on = false;
  }
});

function powerOn(location, source, prevSource)
{
  let timeout = 10;

  // power tv/procjector
  switch (location)
  {
    case "cinema":
      if (prevSource == "")
      {
          timeout += 60;
          cip.pulse(3);
          cip.pulse(rooms["livingroom"].tvjoin.off);
      }
      else
      {
          timeout += 5;
      }
    break;
    case "livingroom":
    case "kitchen":
    case "bedroom":
      switch (source) {
        case "appletv":
        case "appletv2":
        case "kodi":
        case "kodi2":
          cip.pulse(rooms[location].tvjoin.on);
          cip.pulse(rooms[location].tvjoin.hdmi1);
          break;
        case "yamaha":
        case "yamaha2":
        case "yamaha_big":
          cip.pulse(rooms[location].tvjoin.off);
          break;
      }
    break;
  }

  if (location == "livingroom" && rooms["cinema"].current != "")
  {
    timeout += 60;
    cip.pulse(4);
  }

  //power sound
  switch (location)
  {
    case "cinema":
      fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=on")
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setInput?input=av2"))
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut1?enable=true"))
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut2?enable=false"))
    break;
    case "livingroom":
      fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=on")
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setInput?input=av2"))
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut1?enable=false"))
      .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut2?enable=true"))
    break;
    case "kitchen":
    case "bathroom":
    case "bedroom":
    case "bedroombathroom":
    case "highfloorbathroom":
      cip.pulse(rooms[location].ampon);
      switch (source) {
        case "yamaha":
        case "yamaha2":
          cip.aset(rooms[location].ampcode, sources[source].ampinput);
          break;
        case "appletv":
        case "kodi":
        case "appletv2":
        case "kodi2":
          cip.aset(rooms[location].ampcode, rooms[location].ampinput);
          break;
      }
    break;
    default:
      timeout += 5;
  }

  //switch matrix video
  switch (location)
  {
    case "cinema":
    case "bedroom":
    case "livingroom":
    case "kitchen":
      if (sources[source].matrixcode)
      {
        console.log("Matrix video CIP analog " + rooms[location].matrixjoin + " = " + sources[source].matrixcode);
        cip.aset(rooms[location].matrixjoin, sources[source].matrixcode);
      }
    break;
  }

  //switch matrix audio
  switch (location)
  {
    case "kitchen":
    case "bedroom":
      console.log("Matrix audio CIP analog " + rooms[location].matrixaudio + " = " + sources[source].matrixcode);
      cip.aset(rooms[location].matrixaudio, sources[source].matrixcode);
      break;
  }

  if (location == "cinema")
  {
    rooms["livingroom"].current = "";
    rooms["livingroom"].list.forEach((key) => {
        client.publish('/media/livingroom/'+ key +'/on', "0", {retain: true})
    });
  }

  if (location == "livingroom")
  {
    rooms["cinema"].current = "";
    rooms["cinema"].list.forEach((key) => {
      client.publish('/media/cinema/'+ key +'/on', "0", {retain: true})
    });
  }

  return timeout;
}

function powerOff(location,source)
{
  let timeout = 5;

  //shutdown audio
  switch (location)
  {
    case "cinema":
    case "livingroom":
      fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=standby")
        .then(res => res.json())
        .then(json => console.log(json));
    break;
    case "kitchen":
    case "bathroom":
    case "bedroom":
    case "bedroombathroom":
    case "highfloorbathroom":
      cip.pulse(rooms[location].ampoff);
    break;
    default:
      timeout += 5;
  }

  //shutdown video
  switch (location)
  {
    case "cinema":
      timeout += 60;
      cip.pulse(4);
    break;
    case "livingroom":
    case "kitchen":
    case "bedroom":
      switch (source) {
        case "appletv":
        case "appletv2":
        case "kodi":
        case "kodi2":
          cip.pulse(rooms[location].tvjoin.off);
          break;
      }
    break;
  }

  return timeout;
}

export function query(parameters)
{
  return {
    current: rooms[parameters.location].current
  }
}

export function turn(parameters)
{
  let timeout = 0;
  let result = "ok";
  let details = {prompt: ""};

  console.log(parameters.power);
  console.log(parameters.location);
  console.log(parameters.source);

  if (parameters.source == "smarttv")
  {
    myEmitter.emit('turn', parameters.power, parameters.location, parameters.source, rooms[parameters.location].current);

    if (parameters.power == "on")
    {
      timeout = powerOn(parameters.location, parameters.source, rooms[parameters.location].current);
      client.publish('/media/' + parameters.location + '/' + parameters.source +'/on', "1", {retain: true});
    }
    else if (parameters.power == "off")
    {
      timeout = powerOff(parameters.location, parameters.source);
      client.publish('/media/' + parameters.location + '/'+ parameters.source +'/on', "0", {retain: true});
    }
  }
  else
  {
    var tempname = parameters.source;
    if (tempname == "appletv2")
      tempname = "appletv";
    if (tempname == "kodi2")
      tempname = "kodi";
    if (tempname == "yamaha2")
      tempname = "yamaha";

    if (parameters.power == "on")
    {
      console.log("Sources status:" + JSON.stringify(sources));
      if (sources[parameters.source].on == false || 
        (parameters.location == "cinema" && sources[parameters.source].in == "livingroom") || 
        (parameters.location == "livingroom" && sources[parameters.source].in == "cinema"))
      {
        myEmitter.emit('turn', parameters.power, parameters.location, parameters.source, rooms[parameters.location].current);

        console.log("Performing ON actions");
        // calculate timeouts & execute actions
        timeout = powerOn(parameters.location, parameters.source, rooms[parameters.location].current);

        sources[parameters.source].on = true
        sources[parameters.source].in = parameters.location;
        rooms[parameters.location].current = parameters.source;
        client.publish('/media/' + parameters.location + '/' + tempname + '/on', "1", {retain: true});
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
      myEmitter.emit('turn', parameters.power, parameters.location, parameters.source, rooms[parameters.location].current);

      // calculate timeouts & execute actions
      timeout = powerOff(parameters.location, parameters.source);

      sources[parameters.source].on = false;
      sources[parameters.source].in = "";
      rooms[parameters.location].current = "";
      client.publish('/media/' + parameters.location + '/'+ tempname +'/on', "0", {retain: true});
    }
  }

  console.log("timeout:" + timeout)

  return {result, timeout, details}
}
