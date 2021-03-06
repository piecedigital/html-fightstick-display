var gamepads = {};
var configuring = false;
var knownAxis;

var inputImages = {};

// create input images
[
  "lp",
  "mp",
  "hp",
  "lmhp",
  "lk",
  "mk",
  "hk",
  "lmhk",
  // "n",
  "u",
  "ur",
  "r",
  "dr",
  "d",
  "dl",
  "l",
  "ul"
].map((input, ind) => {
  var name;
  if(ind >= 8) name = "u";
  var img = document.createElement("img");
  var imgObj = {};
  img.className = "input-img " + input;
  img.src = "images/" + (name || input) + ".png";
  imgObj.className = "input-img " + input;
  imgObj.src = "images/" + (name || input) + ".png";
  inputImages[input] = imgObj;
  // console.log(input, name);
});


var ballTop = document.querySelector(".stick .ball");
var inputDisplay = document.querySelector(".inputs");

window.addEventListener("gamepadconnected", function(e) {
  console.log("Gamepad Connected!");
  addPad(e);
});

window.addEventListener("gamepaddisconnected", function(e) {
  console.log("Gamepad Disconnected!");
  removePad(e);
});

(function () {
  setInterval(function () {
    var pads = navigator.getGamepads();
    Object.keys(pads).map(function (num) {
      if(pads[num]) {
        var name = "i" + pads[num].index + "-" + normalizeID(pads[num].id);

        // console.log("Gamepad Found!");
        if(!gamepads[name]) addPad({
          gamepad: pads[num]
        });
      }
    });
  }, 1000/120);
  gameLoop();
})()

function addPad(e) {
  // console.log(e.gamepad);
  var name = "i" + e.gamepad.index + "-" + normalizeID(e.gamepad.id);
  // console.log(name);
  gamepads[name] = {
    name: name,
    index: e.gamepad.index,
    configuration: {},
    axes: {
      // ind: 9,
      // u: -1,
      // ur: -.71,
      // r: -.43,
      // dr: -.14,
      // d: .14,
      // dl: .43,
      // l: .71,
      // ul: 1,
      ind: 9,
      "3.29": "n",
      "-1.00": "u",
      "-0.71": "ur",
      "-0.43": "r",
      "-0.14": "dr",
      "0.14": "d",
      "0.43": "dl",
      "0.71": "l",
      "1.00": "ul",
      "-0.03": "n",
      "12.00": "u",
      "1215.00": "ur",
      "15.00": "r",
      "1315.00": "dr",
      "13.00": "d",
      "1314.00": "dl",
      "14.00": "l",
      "1214.00": "ul"
    }
  };
  // checkPad(gamepads[name]);
  var opt = document.createElement("option");
  opt.dataset.name = name;
  opt.value = name;
  opt.innerText = e.gamepad.id;
  sticks.appendChild(opt);
}

function removePad(e) {
  // console.log(e.gamepad);
  var name = "i" + e.gamepad.index + "-" + normalizeID(e.gamepad.id);
  delete gamepads[name];
  sticks.removeChild(document.querySelector("[data-name=" + name + "]"))
}

function normalizeID(id) {
  return id.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s/g, "-");
}

function startConfig(index) {
  configuring = parseInt(index) - 1;
  var elem = document.querySelector(".btn-" + index);
  elem.addClass("configuring");
}

function setConfig(name, index) {
  console.log(configuring, index);
  // console.log(humanizeButton(configuring), humanizeButton(index));
  gamepads[name].configuration[index] = parseInt(configuring);
  // gamepads[name].configuration[configuring] = parseInt(index);
  var elem = document.querySelector(".btn-" + humanizeButton(configuring));
  elem.removeClass("configuring");
  configuring = false;
}

function primaryController(gamepad) {
  var name;
  if(gamepad) name = "i" + gamepad.index + "-" + normalizeID(gamepad.id);
  // console.log(sticks.value, name, sticks.value === name);
  return sticks.value === name;
}

function getButton(padInfo, btn) {
  // console.log(gamepads[padInfo.name].configuration, btn);
  var value = gamepads[padInfo.name].configuration[btn];
  // console.log(value);
  var returnValue = typeof value === "number" ? parseInt(value) : parseInt(btn);
  // console.log(returnValue);
  return returnValue;
}

function highlightButton(usedButton, released) {
  var elem = document.querySelector(".btn-" + humanizeButton(usedButton));
  // if(!elem) return console.error("no elem");
  if(!elem) return;
  // console.log(elem, humanizeButton(usedButton));
  if(released) {
    elem.removeClass("pressed");
  } else {
    elem.addClass("pressed");
  }
}

function humanizeButton(btn) {
  return parseInt(btn) + 1;
}

function checkPad(padInfo) {
  // var gamepad = navigator.getGamepads()[gamepadIndex]
  var gamepadIndex = padInfo.index;
  var gamepadName = padInfo.name;
  // console.log(navigator.getGamepads()[gamepadIndex], gamepadName);
  padInfo.depressed = padInfo.depressed || {};
  var depressed = padInfo.depressed;
  padInfo.test = padInfo.test || [];

  var returnData = {};

  // main loop
  var gamepad = navigator.getGamepads()[gamepadIndex]
  // if(primaryController(gamepad)) console.log(gamepadName); else return;
  if(!primaryController(gamepad)) return;
  var onePress = {}, oneRelease = {};
  if(gamepad) gamepad.buttons.map(function (btn, ind) {
    // console.log(btn);
    if(btn.pressed) {
      if(!depressed[ind]) onePress[ind] = true;
      depressed[ind] = true;
    } else {
      if(depressed[ind]) oneRelease[ind] = true;
      delete depressed[ind];
    }
  });

  if(Object.keys(onePress).length > 0) returnData.onePress = onePress;
  // if(Object.keys(depressed).length > 0) returnData.depressed = depressed;
  // if(Object.keys(oneRelease).length > 0) returnData.oneRelease = oneRelease;

  buttonsPressedOnce(onePress);
  buttonsAreDepressedAndAxes(depressed, gamepad.axes);
  buttonsReleasedOnce(oneRelease);
  // end loop

  function buttonsPressedOnce(buttons) {
    breakdownButton(buttons, function (usedButton) {
      // console.log("pressed", usedButton);
      if(configuring !== false) {
        setConfig(gamepadName, Object.keys(buttons).slice(0, 1)[0]);
      } else {
        highlightButton(usedButton);
      }
    });
  }
  function buttonsAreDepressedAndAxes(buttons, axes) {
    // console.log("start");
    var padButtonsObj = {};
    breakdownButton(buttons, function (usedButton) {
      // console.log("depressed", usedButton, buttons);
      if(buttons["12"]) padButtonsObj[12] = 12;
      if(buttons["14"]) padButtonsObj[14] = 14;
      if(buttons["13"]) padButtonsObj[13] = 13;
      if(buttons["15"]) padButtonsObj[15] = 15;
    });
    padButtonsArr = Object.keys(padButtonsObj);
    // console.log(parseInt(padButtonsArr.join("")));
    if(padButtonsArr.length > 0) axisData([parseInt(padButtonsArr.join(""))]); else axisData(axes);
    // console.log("end");
  }
  function buttonsReleasedOnce(buttons) {
    breakdownButton(buttons, function (usedButton) {
      // console.log("released");
      highlightButton(usedButton, true);
    });
  }

  function breakdownButton(buttons, cb) {
    Object.keys(buttons).map(function (btn) {
      var usedButton = getButton(padInfo, btn);
      // console.log(btn, "(" + (parseInt(btn) + 1) + ")", "Config:", usedButton);
      cb(usedButton);
    });
  }

  function axisData(axes) {
    // console.log(axes);
    var axPlus = axes.reduce((m,n) => m + n);
    // console.log(axPlus);
    var value = axes.length === 4 ? axPlus.toFixed(2) : axes.pop().toFixed(2);
    var input = getStickInput(value);
    // console.log(value);
    returnData.axis = input;
    if(input && !ballTop.hasClass(input)) {
      returnData.oneAxis = input;
      // console.log(input);
      ballTop.removeClass(["n", "u", "ur", "r", "dr", "d", "dl", "l", "ul"]);
      // console.log(value, input);
      ballTop.addClass(input);
      // console.log(value, gamepads[gamepadName].axes[value]);
    }
  }

  function getStickInput(value) {
    return gamepads[gamepadName].axes[value];
  }

  return returnData;
}

HTMLElement.prototype.hasClass = function(stringOrArray) {
  if(!this) return console.error("No element found");
  if(!this.className) return false;

  var proceed = function(type) {
    var yes = false;

    switch (type) {
      case "Array": yes = stringOrArray.map(check) || yes; break;
      case "String": yes = check(stringOrArray); break;
    }
    return yes;
  }

  var check = function(text) {
    return this.className.split(" ").indexOf(text) >= 0;
  }.bind(this);

  var type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  switch (type) {
    case "String":
    case "Array":
      return proceed(type);
    break;
  }
}

HTMLElement.prototype.addClass = function(stringOrArray) {
  if(!this) return console.error("No element found");
  var proceed = function(type) {
    switch (type) {
      case "Array": stringOrArray.map(add).join(" "); break;
      case "String": add(stringOrArray); break;
    }
  }

  var add = function(text) {
    var arr = this.className ? this.className.split(" ") : [];
    if(arr.indexOf(text) !== -1) return;
    arr.push(text);
    var joined = arr.join(" ");
    this.className = joined;
  }.bind(this);

  var type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  proceed(type);
}

HTMLElement.prototype.removeClass = function(stringOrArray) {
  if(!this) return console.error("No element found");
  var proceed = function(type) {
    switch (type) {
      case "Array": stringOrArray.map(remove).join(" "); break;
      case "String": remove(stringOrArray); break;
    }
  }

  var remove = function(text) {
    var arr = this.className ? this.className.split(" ") : [];
    var place = arr.indexOf(text);
    if(place < 0) return this.className;
    arr.splice(place, 1);
    this.className = arr.join(" ");
  }.bind(this);

  var type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  proceed(type);
}

HTMLImageElement.prototype.hasClass = HTMLElement.prototype.hasClass;

HTMLImageElement.prototype.addClass = HTMLElement.prototype.addClass;

HTMLImageElement.prototype.removeClass = HTMLElement.prototype.removeClass;

function gameLoop() {
  var tick = setInterval(function () {
    Object.keys(gamepads).map(name => {
      var returned = checkPad(gamepads[name]);

      if(returned && Object.keys(returned).length > 0) {
        // console.log(returned);
        makeInputDisplayElements(gamepads[name], returned);
      }
    });
  }, 1000/120);
}

function makeInputDisplayElements(padInfo, inputs) {
  // inputDisplay.innerHTML = "";

  var parentElem = document.createElement("div");
  // setTimeout(() => {
  //   // parentElem = null;
  //   inputDisplay.removeChild(parentElem);
  // }, 500);

  if(inputs.onePress) Object.keys(inputs.onePress).map(btn => {
    // if(inputs.onePress && inputs.onePress[btn]) return;

    var configBtn = getButton(padInfo, btn);

    if(inputs.onePress[4]) {
      switch (configBtn) {
        case 0:
        case 3:
        case 5:
          return;
      }
    }
    if(inputs.onePress[6]) {
      switch (configBtn) {
        case 1:
        case 2:
        case 7:
          return;
      }
    }
    var elem = document.createElement("span");
    elem.className = "btn-input";
    elem.dataset.btn = btn;
    var img = getInputImage(configBtn);

    // console.log(img);
    elem.appendChild(img);
    parentElem.appendChild(elem);
  });
  // if(inputs.depressed) Object.keys(inputs.depressed).map(btn => {
    //   if(inputs.onePress && inputs.onePress[btn]) return;
    //
    //   var configBtn = getButton(padInfo, btn);
    //
    //   if(inputs.depressed[4]) {
    //     switch (configBtn) {
    //       case 0:
    //       case 3:
    //       case 5:
    //         return;
    //     }
    //   }
    //   if(inputs.depressed[6]) {
    //     switch (configBtn) {
    //       case 1:
    //       case 2:
    //       case 7:
    //         return;
    //     }
    //   }
    //   var elem = document.createElement("span");
    //   elem.className = "btn-input";
    //   elem.dataset.btn = btn;
    //   var img = getInputImage(configBtn);
    //
    //   // console.log(img);
    //   elem.appendChild(img);
    //   parentElem.appendChild(elem);
    // });

  if(
    inputs.oneAxis === inputs.axis ||
    inputs.onePress
  ) {
    if(inputs.axis !== "n") {
      var elem = document.createElement("span");
      elem.className = "axis-input";
      elem.dataset.axis = inputs.axis;
      var img = getInputImage(inputs.axis);

      elem.appendChild(img);
      parentElem.appendChild(elem);
    }
  }

  if(parentElem.innerHTML) inputDisplay.appendChild(parentElem);
}

function getInputImage(configBtn) {
  // console.log(configBtn);
  var img = document.createElement("img");
  var data = getData(configBtn);
  if(data) {
    img.className = data.className;
    img.src = data.src;
    return img;
  }

  function getData(configBtn) {
    if(typeof configBtn === "string") {
      // console.log("axis");
      // console.log(inputImages[configBtn]);
      return inputImages[configBtn];
    } else {
      // console.log("button");
      switch (configBtn) {
        case 0: return inputImages["lp"];
        case 3: return inputImages["mp"];
        case 5: return inputImages["hp"];
        case 4: return inputImages["lmhp"];

        case 1: return inputImages["lk"];
        case 2: return inputImages["mk"];
        case 7: return inputImages["hk"];
        case 6: return inputImages["lmhk"];
      }
    }
  }
}
