var simpleLevelPlan = [
  "                      ",
  "                      ",
  "  x              = x  ",
  "  x         o o    x  ",
  "  x @      xxxxx   x  ",
  "  xxxxx            x  ",
  "      x!!!!!!!!!!!!x  ",
  "      xxxxxxxxxxxxxx  ",
  "                      "
];

// Uses an array consisting of strings with the same number of characters
// ** does not check for incorrect characters **
function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  this.grid = [];
  this.actors = [];
  
  // Analyzes the level plan
  // adds grid elements to gridLine array then add to grid array 
  // actors to actor array with no overlap 
  for (var y=0; y < this.height; y++) {
    var line = plan[y], gridLine = [];
    for (var x=0; x < this.width; x++) {
      var ch = line[x], fieldType = null;
      var Actor = actorChars[ch];
      if (Actor)
        this.actors.push(new Actor(new Vector(x, y), ch));
      else if (ch == "x")
        fieldType = "wall";
      else if (ch == "!")
        fieldType = "lava";
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }
  
  // finds and sets player element
  this.player = this.actors.filter(function(actor) {
    return actor.type == "player";
  })[0];
  
  // status is used to check if player has won/lost
  // finish delay used to delay level restart
  this.status = this.finishDelay = null;
}
Level.prototype.isFinished = function() {
  return this.status != null && this.finishDelay < 0;
};

// Vector object with corresponding plus and times methods
function Vector(x, y) {
  this.x = x; this.y = y;
}
Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y); 
};
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

// Selection of chars for actors
var actorChars = {
  "@": Player,
  "o": Coin,
  "=": Lava, "|": Lava, "v": Lava
};

// Player object is 1.5 squares high so pos is set up 0.5 to counteract
function Player(pos) {
  this.pos = pos.plus(new Vector(0, -0.5));
  this.size = new Vector(0.8, 1.5);
  this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

// Lava object has three different types depending on it's character
// default behaviour is to reverse direction after collision
// = will move right along x axis with a speed of 2
// | will move downwards along y axis with a speed of 2
// v will move downwards along y axis with a speed of 3
// and will also repeat position after collision
function Lava(pos, ch) {
  this.pos = pos;
  this.size = new Vector(1, 1);
  if (ch == "=") {
    this.speed = new Vector(2, 0);
  } else if (ch == "|") {
    this.speed = new Vector(0, 2);
  } else if (ch == "v") {
    this.speed = new Vector(0, 3);
    this.repeatPos = pos;
  }
}
Lava.prototype.type = "lava";

// Coins will have a slight vertical wobble
function Coin(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(0.6, 0.6);
  this.wobble = Math.random() * Math.PI * 2;
}
Coin.prototype.type = "coin";

// Simple test to check proper code
// var simpleLevel = new Level(simpleLevelPlan);
// console.log(simpleLevel.width, "by", simpleLevel.height);

// shortcut to create DOM element with class
function elt(name, className) {
  var elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

// Used to display level using DOM elements
function DOMDisplay(parent, level) {
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;

  this.wrap.appendChild(this.drawBackground());
  this.actorLayer = null;
  this.drawFrame();
}

var scale = 20;

// Uses a table to draw the grid of the background
DOMDisplay.prototype.drawBackground = function() {
  var table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";
  this.level.grid.forEach(function(row) {
    var rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(function(type) {
      rowElt.appendChild(elt("td", type));
    });
  });
  return table;
};

// Creates a new child for each actor with proper size and position
DOMDisplay.prototype.drawActors = function() {
  var wrap = elt("div");
  this.level.actors.forEach(function(actor) {
    var rect = wrap.appendChild(elt("div", "actor " + actor.type));
    rect.style.width = actor.size.x * scale + "px";
    rect.style.height = actor.size.y * scale + "px";
    rect.style.left = actor.pos.x * scale + "px";
    rect.style.top = actor.pos.y * scale + "px";
  });
  return wrap;
};

// Uses actorLayer to redraw actors every frame
DOMDisplay.prototype.drawFrame = function() {
  if (this.actorLayer)
    this.wrap.removeChild(this.actorLayer);
  this.actorLayer = this.wrap.appendChild(this.drawActors());
  this.wrap.className = "game " + (this.level.status || "");
  this.scrollPlayerIntoView();
};


// Used to scroll view to keep player in center
DOMDisplay.prototype.scrollPlayerIntoView = function() {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;
  var margin = width / 3;
  
  // The viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;
  
  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5)).times(scale);
  
  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};

// Clear screen
DOMDisplay.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
};

/* Test to make sure level displays correctly 
document.addEventListener('DOMContentLoaded', function () {
  var simpleLevel = new Level(simpleLevelPlan);
  var display = new DOMDisplay(document.body, simpleLevel);
});
*/

// Finds if obstacle is met using pos and size dimentions
Level.prototype.obstacleAt = function(pos, size) {
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  if (xStart < 0 || xEnd > this.width || yStart < 0)
    return "wall";
  if (yEnd > this.height)
    return "lava";
  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      var fieldType = this.grid[y][x];
      if (fieldType) return fieldType;
    }
  }
};

// Scans the array of actors for another overlapping actor
Level.prototype.actorAt = function(actor) {
  for (var i = 0; i < this.actors.length; i++) {
    var other = this.actors[i];
    if (other != actor &&
        actor.pos.x + actor.size.x > other.pos.x &&
        actor.pos.x < other.pos.x + other.size.x &&
        actor.pos.y + actor.size.y > other.pos.y &&
        actor.pos.y < other.pos.y + other.size.y)
      return other;
  }
};

var maxStep = 0.05;

// Gives each actor a chance to act using steps no larger then 0.05
// in order to prevent collisions resulting in getting stuck
// if game has been won or lost will continue movement for finishDelay
Level.prototype.animate = function(step, keys) {
  if (this.status != null)
    this.finishDelay -= step;
    
  while (step > 0) {
    var thisStep = Math.min(step, maxStep);
    this.actors.forEach(function(actor) {
      actor.act(thisStep, this, keys);
    }, this);
    step -= thisStep;
  }
};

// Lava act function moving by speed multiplied by time giving distance
// if collision is detected the lava will respond depending on type
Lava.prototype.act = function(step, level) {
  var newPos = this.pos.plus(this.speed.times(step));
  if (!level.obstacleAt(newPos, this.size))
    this.pos = newPos;
  else if (this.repeatPos)
    this.pos = this.repeatPos;
  else
    this.speed = this.speed.times(-1);
};

var wobbleSpeed = 8, wobbleDist = 0.07;

// Coin will move up and down following a sin wave pattern using a certain 
// wobbleDist using it's random wobble value to prevent simultatious movement
Coin.prototype.act = function(step) {
  this.wobble += step * wobbleSpeed;
  var wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

// Player movements are handled seperately by axis
var playerXSpeed = 7;

// Moves player horizontally and checks for obstacles in grid
Player.prototype.moveX = function(step, level, keys) {
  this.speed.x = 0;
  if (keys.left) this.speed.x -= playerXSpeed;
  if (keys.right) this.speed.x += playerXSpeed;

  var motion = new Vector(this.speed.x * step, 0);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle)
    level.playerTouched(obstacle);
  else
    this.pos = newPos;
};

var gravity = 30;
var jumpSpeed = 17;

// Players vertical motion is determinied first by using gravity then finds out
// if player is touching obstacle in grid setting speed to zero
// only if obstacle is touched can player jump else player falls by gravity
Player.prototype.moveY = function(step, level, keys) {
  this.speed.y += step * gravity;
  var motion = new Vector(0, this.speed.y * step);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle) {
    level.playerTouched(obstacle);
    if (keys.up && this.speed.y > 0)
      this.speed.y = -jumpSpeed;
    else
      this.speed.y = 0;
  } else {
    this.pos = newPos;
  }
};

// Player act calls both moveX and moveY with it's arguments
// check collisions with actors and handles losing animation
Player.prototype.act = function(step, level, keys) {
  this.moveX(step, level, keys);
  this.moveY(step, level, keys);

  var otherActor = level.actorAt(this);
  if (otherActor)
    level.playerTouched(otherActor.type, otherActor);

  // Losing animation
  if (level.status == "lost") {
    this.pos.y += step;
    this.size.y -= step;
  }
};

// Called when either an obstacle with one argument or with an actor with two
// If player touches lava level status is set to lost
// If coin is touched it is removed from actors array and array is searched
// for another coin if false then sets level status to won
Level.prototype.playerTouched = function(type, actor) {
  if (type == "lava" && this.status == null) {
    this.status = "lost";
    this.finishDelay = 1;
  } else if (type == "coin") {
    this.actors = this.actors.filter(function(other) {
      return other != actor;
    });
    if (!this.actors.some(function(actor) {
      return actor.type == "coin";
    })) {
      this.status = "won";
      this.finishDelay = 1;
    }
  }
};

var arrowCodes = {37: "left", 38: "up", 39: "right"};

// tracks keys state returning true if the key is in keydown position and
// false in keyup position
function trackKeys(codes) {
  var pressed = Object.create(null);
  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  
  // Add function or method to pressed that can unregister handlers after level is complete
  
  pressed.unReg = function() {
    removeEventListener("keydown", handler);
    removeEventListener("keyup", handler);
  };
  return pressed;
}

// helper function limits use of requestAnimationFrame to steps of 100ms 
// calling frameFunc using the timeStep in s
function runAnimation(frameFunc) {
  var lastTime = null;
  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// displays level using Diplay argument and calls andThen function with
// level status once level is finished
function runLevel(level, Display, andThen) {
  var display = new Display(document.body, level);
  var paused = false;
  var arrows = trackKeys(arrowCodes);
  addEventListener("keydown", function(event) {
    if (event.keyCode == 27) {
      paused = !paused;
      runAnimation(animateFunction);
    }
  });
  var animateFunction = function(step) {
    if (paused) { return false; }
    level.animate(step, arrows);
    display.drawFrame(step);
    if (level.isFinished()) {
      display.clear();
      arrows.unReg();
      if (andThen)
        andThen(level.status);
      return false;
    }
  };
  runAnimation(animateFunction);
}

// goes through the level plans using the Display interface
// runs each level one at at a time until player has either won or lost
function runGame(plans, Display) {
  var lives = 3;
  function startLevel(n) {
    runLevel(new Level(plans[n]), Display, function(status) {
        if (status == "lost") {
          lives--;
          if (lives <= 0) {
            console.log("You lost!");
            lives = 3;
            startLevel(0);
          }
          else
            startLevel(n);
        }
        else if (n < plans.length - 1)
          startLevel(n + 1);
        else
          console.log("You win!");
      });
    }
    startLevel(0);
}

// Possible additions
// a visual element for lives to see how many are left
// paused screen graphic