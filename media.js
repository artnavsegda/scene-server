var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://127.0.0.1')

client.on('connect', function () {
    client.subscribe('presence', function (err) {
      if (!err) {
        //client.publish('presence', 'Hello mqtt')
      }
    })
  })
   
client.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString())
    //client.end()
})

exports.turn = function(parameters)
{
  console.log(parameters.power);
  console.log(parameters.location);
  console.log(parameters.source);
  return {result: "ok"}
}