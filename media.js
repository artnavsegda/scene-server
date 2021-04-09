import mqtt from "mqtt";
import EventEmitter from "events";

var client  = mqtt.connect('mqtt://127.0.0.1')

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
  ["appletv", {on: false}],
  ["kodi", {on: false}],
])

//turn down every unused source
myEmitter.on('turn', function(power, location, source) {
  if (power == "on")
  {
    sources.forEach((value, key) => {
      if (key != source)
      {
        sources.set(key, {on: false})
        client.publish('/media/livingroom/'+ key +'/on', "0", {retain: true})
      }
    })
  }
});

export function turn(parameters)
{
  let timeout = 0;

  console.log(parameters.power);
  console.log(parameters.location);
  console.log(parameters.source);

  myEmitter.emit('turn', parameters.power, parameters.location, parameters.source);

  if (parameters.power == "on")
  {
    console.log("AAAA:" + sources.get(parameters.source).on)
    if (sources.get(parameters.source).on == false)
    {
      console.log("BBBB!");
      sources.set(parameters.source, {on: true})
      client.publish('/media/livingroom/'+ parameters.source +'/on', "1", {retain: true})
      timeout = 10;
    }
  } else if (parameters.power == "off")
  {
    sources.set(parameters.source, {on: false})
    client.publish('/media/livingroom/'+ parameters.source +'/on', "0", {retain: true})
    timeout = 15;
  }

  console.log("timeout:" + timeout)

  return {result: "ok", timeout}
}