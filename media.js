import mqtt from "mqtt";
import EventEmitter from "events";
import cipclient from "crestron-cip";

var client  = mqtt.connect('mqtt://127.0.0.1')

const  cip  = cipclient.connect({host:  "192.168.10.11",  ipid:  "\x03"},  ()  =>  {
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
  "kodi": {on: false, in: ""},
  "yamaha": {on: false, in: ""},
  "yamaha2": {on: false, in: ""},
  "yamaha_big": {on: false, in: ""},
}

let rooms = {
  "livingroom": { list: ["appletv", "kodi", "yamaha_big"], current: ""},
  "kitchen": { list: ["yamaha", "yamaha2"], current: ""},
  "bathroom": { list: ["yamaha", "yamaha2"], current: ""},
  "bedroom": { list: ["yamaha", "yamaha2"], current: ""},
  "bedroombathroom": { list: ["yamaha", "yamaha2"], current: ""},
  "highfloorbathroom": { list: ["yamaha", "yamaha2"], current: ""},
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

function powerOn(location,source)
{
  let timeout = 15;
  if (location == "livingroom" && (source == "appletv" || source == "kodi"))
  {
    timeout += 60;
  }

  // in case of switching from source that doesnot use screen projector, we need deliberatly shut off projector, take lift up and roll up lift, if it currently used


  return timeout;
}

function powerOff(location,source)
{
  let timeout = 10;
  if (location == "livingroom" && (source == "appletv" || source == "kodi"))
  {
    timeout += 60;
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
      timeout = powerOn(parameters.location, parameters.source);

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