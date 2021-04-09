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

//shut down every unused source
myEmitter.on('turn', function(power, location, source) {
  if (power == "on")
  {
    ['kodi', 'appletv'].forEach((element) => {
      if (element != source)
      {
        client.publish('/media/livingroom/'+ element +'/on', "0", {retain: true})
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
    client.publish('/media/livingroom/'+ parameters.source +'/on', "1", {retain: true})
    timeout = 10;
  } else if (parameters.power == "off")
  {
    client.publish('/media/livingroom/'+ parameters.source +'/on', "0", {retain: true})
    timeout = 15;
  }

  return {result: "ok", timeout}
}