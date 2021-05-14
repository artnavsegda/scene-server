import mqtt from "mqtt";
import EventEmitter from "events";
import cipclient from "crestron-cip";

var client  = mqtt.connect('mqtt://127.0.0.1')

const cip = cipclient.connect({host:  "192.168.10.11",  ipid:  "\x03"},  ()  =>  {
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
  "appletv": {on: false, in: ""},
  "appletv2": {on: false, in: ""},
  "kodi": {on: false, in: ""},
  "kodi2": {on: false, in: ""},
  "yamaha": {on: false, in: "", ampinput: 1},
  "yamaha2": {on: false, in: "", ampinput: 2},
  "yamaha_big": {on: false, in: ""},
}

let rooms = {
  "cinema": { list: ["appletv", "kodi", "yamaha_big", "appletv2", "kodi2"], current: ""},
  "livingroom": { list: ["appletv", "kodi", "yamaha_big", "appletv2", "kodi2"], current: ""},
  "kitchen": { list: ["yamaha", "yamaha2", "appletv", "kodi", "appletv2", "kodi2"], current: "", ampcode: 1},
  "bathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 2},
  "bedroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 3},
  "bedroombathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 4},
  "highfloorbathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 5},
}

//turn down every unused source in particular room
myEmitter.on('turn', function(power, location, source) {
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
    case "livingroom":
      if (source == "appletv" || source == "kodi")
      {
        if (prevSource == "appletv" || prevSource == "kodi")
        {
          timeout += 5;
        }
        else
        {
          timeout += 60;
        }
      }
      else
      {
        if (prevSource == "appletv" || prevSource == "kodi")
        {
          // in case of switching from source that doesnot use screen projector, we need deliberatly shut off projector, take lift up and roll up lift, if it currently used
          timeout += 60;
        }
        else
        {
          timeout += 5;
        }
      }
    break;
    case "kitchen":
    case "bathroom":
    case "bedroom":
    case "bedroombathroom":
    case "highfloorbathroom":
      cip.aset(sources[source].ampinput, rooms[location].ampcode); // that should work, i guess but do not forget jount index, th this case is 0 but for other controld has to be different
    default:
      timeout += 5;
  }

  return timeout;
}

function powerOff(location,source)
{
  let timeout = 5;

  switch (location)
  {
    case "livingroom":
      if (source == "appletv" || source == "kodi")
      {
        timeout += 60;
      }
      else
      {
        timeout += 5;
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

  myEmitter.emit('turn', parameters.power, parameters.location, parameters.source);

  if (parameters.power == "on")
  {
    if (sources[parameters.source].on == false)
    {
      // calculate timeouts & execute actions
      timeout = powerOn(parameters.location, parameters.source, rooms[parameters.location].current);

      sources[parameters.source] = {on: true, in: parameters.location};
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

    sources[parameters.source] = {on: false, in: ""};
    rooms[parameters.location].current = "";
    client.publish('/media/' + parameters.location + '/'+ parameters.source +'/on', "0", {retain: true});
  }

  console.log("timeout:" + timeout)

  return {result, timeout, details}
}