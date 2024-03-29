const version = "1.0.0"



class Note {
  constructor(note, nextNote) {
    this.raw = note;
    this.padding = (nextNote ? nextNote._time : note._time + 1) - note._time;
  }
}



const EventTemplate = {
  ringRotation(time) {
    return {
      _time: time,
      _type: 8,
      _value: 0
    }
  },
  ringZoom(time) {
    return {
      _time: time,
      _type: 9,
      _value: 0
    }
  }
};



function init() {
  const statusText = document.getElementById("status-text");
  const fileInput = document.getElementById("beatmap-input");
  if (fileInput.files.length < 1) {
    return statusText.innerText = "You must first select a beatmap!";
  }

  const fileReader = new FileReader();
  fileReader.onload = (event) => {
    statusText.innerText = "Parsing beatmap...";
    try {
      calculate(event.target.result);
    } catch (e) {
      statusText.innerText += "\n\n----- AN ERROR OCCURED -----\n\n" + e.message;
    }
  };
  fileReader.readAsText(fileInput.files[0]);
}



function calculate(_input) {
  let statusText = document.getElementById("status-text");
  if (!statusText) statusText = { innerText: "" };
  let beatmap = {
    _version: "",
    _notes: [],
    _events: []
  };

  // ready the beatmap file
  try {
    beatmap = JSON.parse(_input);
  } catch (e) {
    throw new Error("Failed to parse beatmap!");
  }
  if (!beatmap.hasOwnProperty("_version")) throw new Error("Invalid beatmap version! V3 mapping is not supported yet!");
  if (!beatmap.hasOwnProperty("_notes")) throw new Error("Not a valid beatmap!");

  let lastPadding = 0;
  let lastTime;
  let leftLaserNext = true;
  statusText.innerText += "\nAdding note-based lighting effects...";
  const paceChanges = [""];
  beatmap._events = [];
  for (let i = 0; i < beatmap._notes.length; i++) {
    // make sure that the next note isnt on the same beat
    let nextNote = null;
    let n = i;
    let addedRingRotation = false;
    let doubleLasers = false;
    while (nextNote == null) {
      n++;
      const nextUp = beatmap._notes[n];
      if (!nextUp) {
        nextNote = {
          _time: beatmap._notes[n - 1]._time * 2
        };
        break;
      }
      if (nextUp._time == beatmap._notes[i]._time) {
        if (!addedRingRotation) {
          beatmap._events.push(EventTemplate.ringRotation(beatmap._notes[i]._time))
          addedRingRotation = true;
        }
        doubleLasers = true;
        continue;
      }
      nextNote = nextUp;
    }

    // stop stacked events
    if (lastTime == beatmap._notes[i]._time) continue;

    // get variables needed to keep track of event statistics
    const note = new Note(beatmap._notes[i], nextNote);

    let lightValue;
    let lightType;
    let pacePrefix = null;

    // check what effects to use based on the current pace of the notes
    if (note.raw._cutDirection == 8 || note.raw._type == 3) {
      // add back light effects if block is cut in any direction or is a bomb
      beatmap._events.push({
        _time: note.raw._time,
        _type: 0,
        _value: note.padding < 1 ? 6 : 2
      });
      beatmap._events.push({
        _time: note.raw._time,
        _type: 4,
        _value: 0
      });
      // make this be the only event in the event that this is a bomb
      if (note.raw._type == 3) continue;
    } else if (note.padding >= 2) {
      // check if pace changed
      if (lastPadding < 2 || i < 1) {
        beatmap._events.push(EventTemplate.ringZoom(note.raw._time))
        pacePrefix = "0";
      }
      // add fading center blue light
      lightType = 4;
      lightValue = 3;
    } else if (note.padding >= 1) {
      // check if pace changed
      if (lastPadding < 1 || lastPadding >= 2 || i < 1) {
        beatmap._events.push(EventTemplate.ringZoom(note.raw._time))
        pacePrefix = "a";
      }
      // add flashing center blue light
      lightType = 4;
      lightValue = 2;
    } else {
      // check if pace changed
      if (lastPadding >= 1 || i < 1) {
        beatmap._events.push(EventTemplate.ringZoom(note.raw._time))
        pacePrefix = "b";
      }
      // add flashing center red light
      lightType = 4;
      lightValue = 6;
    }

    // add needed changes for pacing differences
    if (pacePrefix != null) {
      paceChanges.push(pacePrefix + note.raw._time);
    }

    // send the center light event to the json
    if (note.raw._cutDirection != 8) {
      beatmap._events.push({
        _time: note.raw._time,
        _type: lightType,
        _value: lightValue
      });
      beatmap._events.push({
        _time: note.raw._time,
        _type: 0,
        _value: 0
      });
    }

    // setup laser effects
    let laserColor;
    let laserSide;
    if (note.padding < 1) {
      laserColor = 7;
    } else {
      laserColor = 3;
    }

    if (doubleLasers && note.padding >= 2) {
      // when double blocks, use double lasers
      beatmap._events.push({
        _time: note.raw._time,
        _type: 3,
        _value: laserColor
      });
      beatmap._events.push({
        _time: note.raw._time,
        _type: 2,
        _value: laserColor
      });
      beatmap._events.push({
        _time: note.raw._time,
        _type: 12,
        _value: calculateLaserSpeed(note.padding)
      });
      beatmap._events.push({
        _time: note.raw._time,
        _type: 13,
        _value: calculateLaserSpeed(note.padding)
      });
    } else if (leftLaserNext) {
      // when switching to the left laser, turn off the right laser
      leftLaserNext = false;
      laserSide = 2;
      beatmap._events.push({
        _time: note.raw._time,
        _type: 3,
        _value: 0
      });
    } else {
      // when switching to the right laser, turn off the left laser
      leftLaserNext = true;
      laserSide = 3;
      beatmap._events.push({
        _time: note.raw._time,
        _type: 2,
        _value: 0
      });
    }

    // add laser effect if not a double block note
    if (!doubleLasers || note.padding < 2) {
      beatmap._events.push({
        _time: note.raw._time,
        _type: laserSide == 2 ? 12 : 13,
        _value: calculateLaserSpeed(note.padding)
      });
      beatmap._events.push({
        _time: note.raw._time,
        _type: laserSide,
        _value: laserColor
      });
    }

    // set data remenants
    lastPadding = note.padding;
    lastTime = note.raw._time;
  }

  // add ring lights for decently-paced sections
  statusText.innerText += "\nAdding pace-based lighting effects...";
  for (let i = 0; i < paceChanges.length; i++) {
    let ringValue = 0;

    // check what color light to use, if any at all
    switch (paceChanges[i].charAt(0)) {
      case "a":
        ringValue = 3;
        break;
      case "b":
        ringValue = 7;
        break;
    }

    // if theres no color light to use, skip to the next iteration
    if (ringValue == 0 || paceChanges.length == i + 1) continue;

    // find what timestamps to use and enable the light in advance if the pace is too quick
    let currentTimestamp = Math.ceil(parseFloat(paceChanges[i].substring(1)));
    let nextTimestamp = Math.ceil(parseFloat(paceChanges[i + 1].substring(1)));
    if (currentTimestamp != parseFloat(paceChanges[i].substring(1))) {
      beatmap._events.push({
        _time: parseFloat(paceChanges[i].substring(1)),
        _type: 1,
        _value: ringValue
      });
    }

    // start looping through what beats we can use for ring light effects
    while (currentTimestamp < nextTimestamp) {
      beatmap._events.push({
        _time: currentTimestamp,
        _type: 1,
        _value: ringValue
      });
      currentTimestamp++;
    }
  }

  // set beatmap to text
  statusText.innerText += "\nFinalizing file...";
  const finalBeatmap = encodeURIComponent(JSON.stringify(beatmap));
  let semiFinalLightshow = beatmap;
  semiFinalLightshow._notes = [];
  semiFinalLightshow._obstacles = [];
  let finalLightshow = encodeURIComponent(JSON.stringify(semiFinalLightshow));

  // tell the user we've done it once again
  statusText.innerText += "\nFinished!\n\n";
  statusText.innerHTML += `<a class="download" href="data:text/plain;charset=utf-8,${finalBeatmap}" download="ExpertPlusStandard.dat"><button>Download Beatmap</button></a>\n\n`;
  statusText.innerHTML += `<a class="download" href="data:text/plain;charset=utf-8,${finalLightshow}" download="LightshowStandard.dat"><button>Download Lightshow</button></a>`;

  return [JSON.stringify(beatmap), JSON.stringify(semiFinalLightshow)];
}



function textCalculate() {
  if (!location.search) return;
  const params = new URLSearchParams(location.search);
  let data = params.get("data");
  if (!data) return;
  data = data.toString();
  document.body.innerHTML = "";
  document.head.innerHTML = "<title>LiteMapper</title><meta charset=\"UTF-8\">"

  try {
    const result = calculate(data);
    let output = result[0]
    if (params.get("lightshow")) {
      if (params.get("lightshow").toString() == "true") output = result[1];
    }
    document.body.innerText += output;
    console.log(output);
  } catch (e) {
    console.error(e);
    document.body.innerHTML = `{"error":"500 Internal Server Error","errorMessage":"${e.message}"}`;
    return;
  }
}



function calculateLaserSpeed(padding) {
  return Math.ceil((Math.ceil((2 / padding) + 1) ** 2) / 4)
}



document.addEventListener('DOMContentLoaded', () => {
  textCalculate();
  const versionText = document.getElementById("version-text");
  versionText.innerText = versionText.innerText.replace("{ver}", version);
});