import mqtt from "mqtt";
import EventEmitter from "events";
import cipclient from "crestron-cip";
import fetch from "node-fetch";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var client  = mqtt.connect('mqtt://127.0.0.1');

export {client};

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
  "smarttv": {},
  "multiroom": {on: false, in: ""}
}

let rooms = {
  "cinema": { list: ["appletv", "kodi", "appletv2", "kodi2"], current: "", matrixjoin: 21},
  "livingroom": { list: ["appletv", "kodi", "yamaha_big", "appletv2", "kodi2", "smarttv"], current: "", ampcode: 7, ampon: 17, ampoff: 27, matrixjoin: 21, tvjoin: { on: 100, off: 101, hdmi1: 103, tv: 109 }},
  "kitchen": { list: ["yamaha", "yamaha2", "appletv", "kodi", "appletv2", "kodi2", "smarttv"], current: "", ampcode: 1, ampon: 11, ampoff: 21, matrixjoin: 22, tvjoin: { on: 200, off: 201, hdmi1: 203, tv: 209, smarthub: 221 }, ampinput: 11, matrixaudio: 31, tvinput: 3},
  "bathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 2, ampon: 12, ampoff: 22},
  "bedroom": { list: ["yamaha", "yamaha2", "appletv", "kodi", "appletv2", "kodi2", "smarttv"], current: "", ampcode: 3, ampon: 13, ampoff: 23, matrixjoin: 24, tvjoin: { on: 300, off: 301, hdmi1: 303, tv: 309, smarthub: 221 }, ampinput: 12, matrixaudio: 32, tvinput: 4},
  "kidsroom": { list: [], current: "", matrixjoin: 25},
  "bedroombathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 4, ampon: 14, ampoff: 24},
  "highfloorbathroom": { list: ["yamaha", "yamaha2"], current: "", ampcode: 5, ampon: 15, ampoff: 25},
  "cabinet": { list: [], current: "", matrixjoin: 26},
  "workshop": { list: [], current: "", matrixjoin: 27}
}

function stopSource(source)
{

}

//turn down every unused source in particular room
myEmitter.on('turn', function(power, location, source, prevSource) {
  if (power == "on")
  {
    const index = activeMultirooms.indexOf(location);
    if (index > -1) {
      console.log("removing room from multiroom set")
      console.log("previous state: " + JSON.stringify(activeMultirooms));
      activeMultirooms.splice(index, 1);
      console.log("after state: " + JSON.stringify(activeMultirooms));
    }

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
  if (power == "off")
  {
    stopSource(source);
  }
});

function setGlobalPower(power, source) {
  if (power == "on")
  {
    client.publish('/media/on', "1", {retain: true})
  }
  if (power == "off")
  {
    let power = false;
    if (source)
    {
      for (var element in
        [
          "appletv",
          "appletv2",
          "kodi",
          "kodi2",
          "yamaha",
          "yamaha2",
          "yamaha_big",
          "multiroom"
        ])
      {
        if (source != element)
        {
          if (source != "smarttv" && sources[source].on == true)
          {
            power = true;
            console.log("global power flag not set due " + source);
          }
        }
      }
    }
    if (power == false)
    {
      console.log("global power flag set to off");
      client.publish('/media/on', "0", {retain: true})
    }
  }
}

function powerOn(location, source, prevSource)
{
  let timeout = 10;

  // power tv/procjector
  switch (location)
  {
    case "cinema":
      if (prevSource == "")
      {
          timeout += 100;
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
          delay(5000)
          .then(() => {
                  cip.pulse(rooms[location].tvjoin.hdmi1);
          });
          break;
	case "smarttv":
          cip.pulse(rooms[location].tvjoin.on);
          delay(5000)
          .then(() => {
                cip.pulse(rooms[location].tvjoin.tv);
          });
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
    timeout += 1000;
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
      if (source == "smarttv")
      {
	fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=on")
	.then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setInput?input=audio1"))
      }
      else
      {
	fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=on")
	.then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setInput?input=av2"))
	.then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut1?enable=false"))
	.then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/system/setHdmiOut2?enable=true"))
      }
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
        case "smarttv":
          cip.aset(rooms[location].ampcode, rooms[location].tvinput);
          break;
      }
    break;
    default:
      timeout += 5;
  }

  if (sources[source].matrixcode)
  {
    //switch matrix video
    switch (location)
    {
      case "cinema":
      case "bedroom":
      case "livingroom":
      case "kitchen":
        console.log("Matrix video CIP analog " + rooms[location].matrixjoin + " = " + sources[source].matrixcode);
        cip.aset(rooms[location].matrixjoin, sources[source].matrixcode);
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
  }

  if (location == "cinema")
  {
    rooms["livingroom"].current = "";
    rooms["livingroom"].list.forEach((key) => {
        client.publish('/media/livingroom/'+ key +'/on', "0", {retain: true})
        client.publish('/media/livingroom',  "void", {retain: true});
    });
  }

  if (location == "livingroom")
  {
    rooms["cinema"].current = "";
    rooms["cinema"].list.forEach((key) => {
      client.publish('/media/cinema/'+ key +'/on', "0", {retain: true})
      client.publish('/media/cinema',  "void", {retain: true});
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
      timeout += 100;
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
	      case "smarttv":
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

  if (parameters.power == "off" && parameters.source == undefined && parameters.location == undefined)
  {
    client.publish('/media/on', "0", {retain: true});

    [
      "livingroom", 
      "cinema",
      "kitchen",
      "bathroom",
      "bedroom",
      "bedroombathroom",
      "highfloorbathroom",
    ]
    .forEach((element) => {
      if (rooms[element].current != "")
      {
        client.publish('/media/' + element,  "void", {retain: true});
        var tempname = rooms[element].current;
        if (tempname == "appletv2")
          tempname = "appletv";
        if (tempname == "kodi2")
          tempname = "kodi";
        if (tempname == "yamaha2")
          tempname = "yamaha";
        client.publish('/media/' + element + '/'+ tempname +'/on', "0", {retain: true});
        powerOff(element, rooms[element].current);
        rooms[element].current = "";
      }
    })
  }
  else if (parameters.power == "off" && parameters.source == undefined)
  {
    var tempname = rooms[parameters.location].current;
    if (tempname == "appletv2")
      tempname = "appletv";
    if (tempname == "kodi2")
      tempname = "kodi";
    if (tempname == "yamaha2")
      tempname = "yamaha";

    myEmitter.emit('turn', parameters.power, parameters.location, rooms[parameters.location].current, rooms[parameters.location].current);
    setGlobalPower(parameters.power, parameters.source);
    timeout = powerOff(parameters.location, rooms[parameters.location].current);
    client.publish('/media/' + parameters.location + '/'+ tempname +'/on', "0", {retain: true});
    client.publish('/media/' + parameters.location,  "void", {retain: true});

    if (rooms[parameters.location].current != "smarttv" && rooms[parameters.location].current != "multiroom" && rooms[parameters.location].current != "")
    {
      sources[rooms[parameters.location].current].on = false;
      sources[rooms[parameters.location].current].in = "";
    }

    rooms[parameters.location].current = "";
  }
  else if (parameters.source == "smarttv")
  {
    myEmitter.emit('turn', parameters.power, parameters.location, parameters.source, rooms[parameters.location].current);
    setGlobalPower(parameters.power, parameters.source);

    if (parameters.power == "on" && rooms[parameters.location].current != parameters.source)
    {
      timeout = powerOn(parameters.location, parameters.source, rooms[parameters.location].current);
      rooms[parameters.location].current = parameters.source;
      client.publish('/media/' + parameters.location + '/' + parameters.source +'/on', "1", {retain: true});
      client.publish('/media/' + parameters.location,  parameters.source, {retain: true});
    }
    else if (parameters.power == "off")
    {
      timeout = powerOff(parameters.location, parameters.source);
      rooms[parameters.location].current = "";
      client.publish('/media/' + parameters.location + '/'+ parameters.source +'/on', "0", {retain: true});
      client.publish('/media/' + parameters.location,  "void", {retain: true});
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
      if ((multiroomStatus == true) && ((selectedMultiroomDriver == "yamaha1" && parameters.source == "yamaha") 
        || (selectedMultiroomDriver == "yamaha2" && parameters.source == "yamaha2")))
        {
        result = "busy";
        details = {
          prompt: "Устройство занято мультирумом"
        }
      }
      else
      {
        console.log("Sources status:" + JSON.stringify(sources));
        if (sources[parameters.source].on == false || 
          (parameters.location == "cinema" && sources[parameters.source].in == "livingroom") || 
          (parameters.location == "livingroom" && sources[parameters.source].in == "cinema"))
        {
          myEmitter.emit('turn', parameters.power, parameters.location, parameters.source, rooms[parameters.location].current);
          setGlobalPower(parameters.power, parameters.source);

          console.log("Performing ON actions");
          // calculate timeouts & execute actions
          timeout = powerOn(parameters.location, parameters.source, rooms[parameters.location].current);

          sources[parameters.source].on = true
          sources[parameters.source].in = parameters.location;
          rooms[parameters.location].current = parameters.source;
          client.publish('/media/' + parameters.location + '/' + tempname + '/on', "1", {retain: true});
          client.publish('/media/' + parameters.location,  tempname, {retain: true});
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
      client.publish('/media/' + parameters.location,  "void", {retain: true});
      setGlobalPower(parameters.power, parameters.source);
    }
  }

  console.log("timeout:" + timeout)

  return {result, timeout, details}
}

let activeMultirooms = []
var multiroomStatus = false;

const MRControllers = {
  "yamaha1": {
    address: "http://192.168.10.34",
    ampinput: 1
  },
  "yamaha2": {
    address: "http://192.168.10.35",
    ampinput: 2
  }
}

let selectedMultiroomDriver = "";

export function multiroom(parameters)
{
  switch (parameters.op)
  {
    case "status":
      var readyList = [];

      if (sources["yamaha"].on == false)
        readyList.push("yamaha1");

      if (sources["yamaha2"].on == false)
        readyList.push("yamaha2");

      return {
        on: multiroomStatus,
        ready: readyList,
        driver: selectedMultiroomDriver,
        enlisted: activeMultirooms
      }
    break;
    case "enlist":
      console.log("enlisting " + parameters.arg);
      let moreRooms = parameters.arg.split(" ");

      moreRooms.forEach((element) => {
        client.publish('/media/' + element,  "multiroom", {retain: true});
        rooms[element].list.forEach((key) => {
          client.publish('/media/' + element + '/'+ key +'/on', "0", {retain: true})
        });

        cip.pulse(rooms[element].ampon);
        cip.aset(rooms[element].ampcode, MRControllers[selectedMultiroomDriver].ampinput);

        rooms[element].current = "multiroom";

        switch(element)
        {
          case 'kitchen':
          case 'livingroom':
          case 'bedroom':
            cip.pulse(rooms[element].tvjoin.off);
        }
        
        if (element == 'livingroom')
        {
          fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=on")
          .then(() => fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setInput?input=av4"))
        }

      })
      
      activeMultirooms = activeMultirooms.concat(moreRooms);

      return {
        status: "ok",
        timeout: 15
      }
    break;
    case "exclude":
      console.log("excluding " + parameters.arg);
      client.publish('/media/' + parameters.arg, "void", {retain: true});
      rooms[parameters.arg].current = "";

      cip.pulse(rooms[parameters.arg].ampoff);

      if (parameters.arg == 'livingroom')
        {
          fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=standby");
        }

      const index = activeMultirooms.indexOf(parameters.arg);
      if (index > -1) {
        activeMultirooms.splice(index, 1);
      }

      return {
        status: "ok",
        timeout: 15
      }
    break;
    case "start":
      console.log("start " + parameters.arg);
      client.publish('/media/multiroom/on', "1", {retain: true})
      setGlobalPower("on", "multiroom");

      fetch(MRControllers[parameters.arg].address + "/YamahaExtendedControl/v1/main/setPower?power=on")
        .then(res => res.json())
        .then(json => console.log(json));

      activeMultirooms = [];
      sources["multiroom"].on = true;
      multiroomStatus = true;
      selectedMultiroomDriver = parameters.arg;

      return {
        status: "ok",
        timeout: 15
      }
    break;
    case "stop":
      console.log("stop " + parameters.arg);
      client.publish('/media/multiroom/on', "0", {retain: true})

      fetch(MRControllers[parameters.arg].address + "/YamahaExtendedControl/v1/main/setPower?power=standby")
        .then(res => res.json())
        .then(json => console.log(json));

      activeMultirooms.forEach((element) => {
        client.publish('/media/' + element, "void", {retain: true});
        rooms[element].current = "";
        cip.pulse(rooms[element].ampoff);

        if (element == 'livingroom')
        {
          fetch("http://192.168.10.33/YamahaExtendedControl/v1/main/setPower?power=standby");
        }
      })

      activeMultirooms = [];
      sources["multiroom"].on = false;
      multiroomStatus = false;
      selectedMultiroomDriver = "";

      setGlobalPower("off", "multiroom");

      return {
        status: "ok",
        timeout: 15
      }
    break;
  }

  return {
    status: "unknown op"
  }
}