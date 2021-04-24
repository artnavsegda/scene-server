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

let sources = new Map([
  ["appletv", {on: false, in: ""}],
  ["kodi", {on: false, in: ""}],
  ["yamaha", {on: false, in: ""}],
  ["yamaha2", {on: false, in: ""}],
  ["yamaha_big", {on: false, in: ""}],
])

let rooms = new Map([
  ["livingroom", ["appletv", "kodi", "yamaha_big"]],
  ["kitchen", ["yamaha", "yamaha2"]],
  ["bathroom", ["yamaha", "yamaha2"]],
  ["bedroom", ["yamaha", "yamaha2"]],
  ["bedroombathroom", ["yamaha", "yamaha2"]],
  ["highfloorbathroom", ["yamaha", "yamaha2"]],
])

//turn down every unused source in particular room
myEmitter.on('turn', function(power, location, source) {
  if (power == "on")
  {
    sourcesList = rooms.get(location)

    sourcesList.forEach((key) => {
      if (key != source)
      {
        sources.set(key, {on: false})
        client.publish('/media/' + location + '/'+ key +'/on', "0", {retain: true})
      }
    })
  }
});

export function turn(parameters)
{
  let timeout = 0;
  let result = "ok";
  let details = {};

  console.log(parameters.power);
  console.log(parameters.location);
  console.log(parameters.source);

  myEmitter.emit('turn', parameters.power, parameters.location, parameters.source);

  if (parameters.power == "on")
  {
    if (sources.get(parameters.source).on == false)
    {
      sources.set(parameters.source, {on: true, in: parameters.location})
      client.publish('/media/' + parameters.location + '/' + parameters.source +'/on', "1", {retain: true})
      timeout = 10;
    }
    else if (sources.get(parameters.source).in != parameters.location)
    {
      result = "busy";
      detais = {
        in: sources.get(parameters.source).in,
        prompt: "Устройство занято в команте " + sources.get(parameters.source).in
      }
    }
  }
  else if (parameters.power == "off")
  {
    sources.set(parameters.source, {on: false, in: ""})
    client.publish('/media/' + parameters.location + '/'+ parameters.source +'/on', "0", {retain: true})
    timeout = 15;
  }

  console.log("timeout:" + timeout)

  return {result, timeout, details}
}