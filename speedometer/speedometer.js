/*jslint plusplus: true, sloppy: true, indent: 4 */
(function () {
    "use strict";
    // this function is strict...
}());

// Stores the data of the created speedometers. Hashed on canvasId (The id of the canvas in HTML)
var speedometerData = {};

// These defines the canvas size we think we're painting to (The actual canvas size is adjusted with scale())
var speedDefWidth = 440;
var speedDefHeight = 220;

// Converts degrees to radians
function degToRad(angle) {
  return ((angle * Math.PI) / 180);
}

// Converts radians to degrees
function radToDeg(angle) {
  return ((angle * 180) / Math.PI);
}

// Draws a line
function drawLine(options, line) {
  // Draw a line using the line object passed in
  options.ctx.beginPath();

  // Set attributes of open
  options.ctx.globalAlpha = line.alpha;
  options.ctx.lineWidth = line.lineWidth;
  options.ctx.fillStyle = line.fillStyle;
  options.ctx.strokeStyle = line.fillStyle;
  options.ctx.moveTo(line.from.X,
    line.from.Y);

  // Plot the line
  options.ctx.lineTo(
    line.to.X,
    line.to.Y
  );

  options.ctx.stroke();
}

// Create the line parameters
function createLine(fromX, fromY, toX, toY, fillStyle, lineWidth, alpha) {
  // Create a line object using Javascript object notation
  return {
    from: {
      X: fromX,
      Y: fromY
    },
    to: {
      X: toX,
      Y: toY
    },
    fillStyle: fillStyle,
    lineWidth: lineWidth,
    alpha: alpha
  };
}

function drawMetallicArc(options) {
  applyDefaultContextSettings(options);

  options.ctx.beginPath();
  
  /* Draw the metallic border of the speedometer. */
  var grd = options.ctx.createRadialGradient(0, 0, options.metallicArcRadius + 0.5 * options.metallicArcWidth,
      0, 0, options.metallicArcRadius - 0.5 * options.metallicArcWidth);
  grd.addColorStop(0, "rgb(127,127,127)");
  grd.addColorStop(0.5, "rgb(225,225,225)");
  grd.addColorStop(1, "rgb(127,127,127)");

  options.ctx.strokeStyle = grd;
  options.ctx.lineWidth = options.metallicArcWidth;

  options.ctx.arc(0, 0, options.metallicArcRadius, 0, Math.PI, true);

  // Stroke the last object
  options.ctx.stroke();
}

function drawBackground(options) {
  /* Draw the black background of the dial */
  options.ctx.beginPath();
  
  applyDefaultContextSettings(options);

  options.ctx.fillStyle = "black";
  options.ctx.arc(0, 0, options.backStop, 0, Math.PI, true);

  options.ctx.fill();
}

function applyDefaultContextSettings(options) {
  /* Helper function to revert to gauges
   * default settings
   */

  options.ctx.lineWidth = options.defaultLineWidth;
  options.ctx.globalAlpha = 1.0;
  options.ctx.strokeStyle = "rgb(255, 255, 255)";
  options.ctx.fillStyle = "rgb(255,255,255)";
}

function drawTicks(options) {
  // Draws the ticks alternating large then small

  var iTick = 0,
      largeTick = true,
      degStep = (160 / (2 * options.numLargeTicks)),
      tickRadius,
      lineWidth,
      iTickRad,
      cosTickRad,
      sinTickRad,
      innerRadius,
      outerRadius,
      innerX,
      innerY,
      outerX,
      outerY;
  
  applyDefaultContextSettings(options);
  
  for (iTick = 10; iTick <= 170; iTick += degStep, largeTick = !largeTick) {
    iTickRad = degToRad(iTick);
    
    cosTickRad = Math.cos(iTickRad);
    sinTickRad = Math.sin(iTickRad);
    
    if (largeTick)
    {
      lineWidth = options.largeTickLineWidth;
      tickLength = options.largeTickLength;
    }
    else
    {
      lineWidth = options.smallTickLineWidth;
      tickLength = options.smallTickLength;
    }
    
    innerRadius = options.colorArcRadius + options.colorArcWidth * 0.5 - tickLength;
    outerRadius = options.colorArcRadius + options.colorArcWidth * 0.5 + tickLength;
    
    innerX = -innerRadius * cosTickRad;
    innerY = -innerRadius * sinTickRad;
    
    outerX = -outerRadius * cosTickRad;
    outerY = -outerRadius * sinTickRad;
    
    // Create a line expressed in JSON
    line = createLine(innerX, innerY, outerX, outerY, "rgb(127,127,127)", lineWidth, 0.6);

    // Draw the line
    drawLine(options, line);

  }
}

function drawTextMarkers(options) {
  /* Draws the speed number above the large ticks */
  var innerTickX = 0,
      innerTickY = 0,
        iTick = 0,
        iTickToPrint = options.startSpeed;

  applyDefaultContextSettings(options);

  // Font styling
  options.ctx.font = options.fontPx + "px " + options.font;
  options.ctx.textBaseline = 'top';

  options.ctx.beginPath();

  var yOffset = 5;
  var xOffset = 0;
  
  var arcOffset = options.radius + options.textArcOffset;
  
  // Tick every 20 (small ticks)
  for (iTick = 10; iTick <= 170; iTick += 160/options.numLargeTicks, iTickToPrint += options.speedLargeTickDelta) {

    var iTickRad = degToRad(iTick);
    innerTickX = -arcOffset * Math.cos(iTickRad);
    innerTickY = -arcOffset * Math.sin(iTickRad);
    xOffset = options.ctx.measureText(iTickToPrint).width * 0.5;
    
    options.ctx.fillText(iTickToPrint, innerTickX - xOffset, innerTickY - yOffset);
  }

    options.ctx.stroke();
}

function drawSpeedometerPart(options, alphaValue, strokeStyle, startPos, stopPos) {
  /* Draw part of the arc that represents
  * the colour speedometer arc
  */

  options.ctx.beginPath();

  options.ctx.globalAlpha = alphaValue;
  options.ctx.lineWidth = options.colorArcWidth;
  options.ctx.strokeStyle = strokeStyle;

  options.ctx.arc(0, 0, options.colorArcRadius, Math.PI + degToRad(startPos), Math.PI + degToRad(stopPos), false);

  options.ctx.stroke();
}

function drawSpeedometerColourArc(options) {
/* Draw the color arc for each color arc segment specified in the options */
  var arcDataLength = options.colorArcArray.length;
  for (var arcIndex = 0; arcIndex < arcDataLength; arcIndex++)
  {
    var arcData = options.colorArcArray[arcIndex];
    drawSpeedometerPart(options, arcData.alpha, arcData.color, convertSpeedToAngle(arcData.startSpeed, options),
        convertSpeedToAngle(arcData.stopSpeed, options));
  }
}

function drawNeedleDial(options) {
  /* Draws the metallic dial that covers the base of the
  * needle.
  */
  applyDefaultContextSettings(options);

  options.ctx.save();
  
  options.ctx.beginPath();
  
  options.ctx.rect(-speedDefWidth * 0.5, -speedDefHeight, speedDefWidth, speedDefHeight);
  options.ctx.clip();

  options.ctx.beginPath();
  var grd = options.ctx.createRadialGradient(0, 0, options.needleDialStop,
      0, 0, options.needleDialStop * 0.8);
  grd.addColorStop(0, "rgb(200,200,200)");
  grd.addColorStop(1, "rgb(127,127,127)");

  options.ctx.fillStyle = grd;
  options.ctx.arc(0, 0, options.needleDialStop, 0, Math.PI, true);

  options.ctx.fill();
  
  options.ctx.restore();
}

function convertSpeedToAngle(speed, options) {
  // Helper function to convert a speed to the needle angle 
  var speedRange = options.numLargeTicks * options.speedLargeTickDelta;
  
  // Normalize the speed to a percentage of the maximum range.
  var normalizedSpeed = (speed - options.startSpeed) / speedRange;
  var iSpeedAsAngle = 10 + normalizedSpeed * 160;

  // Return the angle in degrees clamping needle to 5 & 175 min & max
  return Math.max(Math.min(iSpeedAsAngle, 175), 5);
}

function drawNeedle(options) {
  /* Draw the needle in a nice read colour at the
  * angle that represents the options.speed value.
  */
 var iSpeedAsAngle = convertSpeedToAngle(options.speed, options),
      iSpeedAsAngleRad = degToRad(iSpeedAsAngle),
        innerTickX = options.radius - (Math.cos(iSpeedAsAngleRad) * 20),
        innerTickY = options.radius - (Math.sin(iSpeedAsAngleRad) * 20),
        fromX = -options.radius + innerTickX,
        fromY = -options.radius + innerTickY,
        endNeedleX = options.radius - (Math.cos(iSpeedAsAngleRad) * options.radius),
        endNeedleY = options.radius - (Math.sin(iSpeedAsAngleRad) * options.radius),
        toX = -options.radius + endNeedleX,
        toY = -options.radius + endNeedleY;

  var deltaX = (options.needleWidth * 0.5) * Math.sin(iSpeedAsAngleRad);
  var deltaY = (options.needleWidth * 0.5) * Math.cos(iSpeedAsAngleRad);
  
  options.ctx.globalAlpha = 0.6;
  options.ctx.lineWidth = options.needleLineWidth;
  options.ctx.fillStyle = "red";
  options.ctx.strokeStyle = "white";

  // Draw a line using the line object passed in
  options.ctx.beginPath();

  // Set attributes of open
  options.ctx.moveTo(fromX - deltaX, fromY + deltaY);
  options.ctx.lineTo(toX - deltaX * 0.5, toY + deltaY * 0.5);
  options.ctx.lineTo(toX + deltaX * 0.5, toY - deltaY * 0.5);
  options.ctx.lineTo(fromX + deltaX, fromY - deltaY);
  options.ctx.closePath();
  options.ctx.stroke();
  options.ctx.fill();

  // Two circle to draw the dial at the base (give its a nice effect?)
//  drawNeedleDial(options, 0.6, "rgb(127, 127, 127)", "rgb(255,255,255)");
  drawNeedleDial(options);
}

function buildOptionsAsJSON(canvas, scaleFactor, xOffset, yOffset, additionalOptions) {
  /* Setting for the speedometer. Pass these parameters with your new values in additionalOptions */ 

  // Create a speedometer object using Javascript object notation
  var options = {
    ctx: canvas.getContext('2d'),
    speed: 0.0,
    startSpeed: 0,                              // The starting speed on the speedometer
    numLargeTicks: 8,                           // The number of large ticks on speedometer
    speedLargeTickDelta: 10,                    // The Numerical increase for each large tick
    radius: 140,                                // Radius of the gauge
    metallicArcRadius: 190,                     // Radius of middle of metallic arc
    metallicArcWidth: 20,                       // Width of the metallic arc
    scaleFactor: scaleFactor,                   // How much we're scaling from the nominal 440x220 default
    xOffset: xOffset,                           // Calculated xOffset if we're centering in canvas
    yOffset: yOffset,                           // Calculated yOffset if we're centering in canvas
    backStart: 170,                             // Radius start of the background arc
    backStop: 180,                              // Radius end of the background arc
    defaultLineWidth: 2,                        // Default linewidth
    smallTickLineWidth: 3,                      // Line width of the small ticks
    smallTickLength: 5,                         // Length of the small ticks
    largeTickLineWidth: 3,                      // Line width of the large ticks
    largeTickLength: 10,                        // Length of the large ticks
    font: "italic sans-serif",                  // Name of font to use
    fontPx: 10,                                 // Font height in pixels
    colorArcOffset: 10,                         // Offset of the color arc
    colorArcWidth: 5,                           // Width of the color arc
    textArcOffset: 10,                          // Offset from the tick radius to start drawing text
    needleDialWidth: 3,                         // Width of the needle dial
    needleDialStart: 0,                         // Start radius of the needle dial
    needleDialStop: 30,                         // Stop radius of the needle dial
    needleWidth: 3,                             // Width of the needle
    needleLineWidth: 1,                         // Width of the white part of needle
    
    // Color arc array. This is a list of the arc segments. You specify the color, alpha, and the start/stop
    // speeds for the specified color arc. 
    colorArcArray: [ { alpha: 1.0, color: "rgb(82, 240, 55)", startSpeed: -100, stopSpeed: 45},
                     { alpha: 1.0, color: "rgb(198, 111, 0)", startSpeed: 45, stopSpeed: 65},
                     { alpha: 1.0, color: "rgb(255, 0, 0)", startSpeed: 65, stopSpeed: 100}]
  };
  
  // Overwrite any options supplied by the user
  for (var property in additionalOptions) {
    if (additionalOptions.hasOwnProperty(property)) {
        options[property] = additionalOptions[property];
    }
  }
  
  // Calculated from the other options
  options.colorArcRadius = options.radius - (options.colorArcOffset + 0.5 * options.colorArcWidth);

  return options;
}

/* Clears the canvas and sets the transform matrices up to scale the
 * speedometer. The center of the canvas is mapped to the center of
 * the circle the speedometer is based on (middle bottom)
 */
function clearCanvas(canvas, options) {
  options.ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Setting width of canvas clears it. Due to the alpha usages clearRect() doesn't
  // appear to work correctly.
  options.ctx.clearRect(0, 0, canvas.width, canvas.height);

  options.ctx.scale(options.scaleFactor, options.scaleFactor);
  options.ctx.translate(options.xOffset / options.scaleFactor + speedDefWidth * 0.5,
      options.yOffset / options.scaleFactor + speedDefHeight);
  
  applyDefaultContextSettings(options);
}

/*
 * Create the speedometer object. if center is true then the speedometer will be
 * centered within its canvas specified by canvasId. If you wish to overwrite any
 * of the options you can simply supply a hash containing options you wish to change.
 * (e.g. createSpeedometer('myCanvas', true, { numLargeTicks: 10 }); will create
 * a speedometer going from 0-100 with 10 ticks.)
 */
function createSpeedometer(canvasId, options, center)
{
  if(typeof(options)==='undefined') options = {};
  if(typeof(center)==='undefined') center = true;
  
  var canvas = document.getElementById(canvasId);
 
  if (canvas == null)
  {
    alert("Could not find canvas on page.");
    return;
  }
  
  // Make sure the canvas is supported by browser
  if (!canvas.getContext)
  {
    alert("Canvas not supported by your browser!");
    return;
  }

  speedometerData[canvasId] = { timer: null, decrementing: false };
  var speedParams = speedometerData[canvasId];
    
  speedParams['canvas'] = canvas;
  
  var finalRatio = canvas.width / canvas.height;
  var defaultRatio = speedDefWidth / speedDefHeight;
  
  var xOffset = 0.0;
  var yOffset = 0.0;
  var scaleFactor = 1.0;
  
  if (finalRatio > defaultRatio)
  {
    scaleFactor = canvas.height / speedDefHeight;
    xOffset = center ? (canvas.width - (speedDefWidth * scaleFactor)) * 0.5 : 0;
  }
  else
  {
    scaleFactor = canvas.width / speedDefWidth;
    yOffset = center ? (canvas.height - (speedDefHeight * scaleFactor)) * 0.5 : 0;
  }

  speedParams['options'] = buildOptionsAsJSON(canvas, scaleFactor, xOffset, yOffset, options);
} 

/*
 * This is the main draw routine. Passing the target speed & canvasId will draw
 * speedometer to the canvas. If doAnimation is set to true then the needle will
 * animate until it reaches the target speed. (Default is false, so it just sets
 * the speed to the targetSpeed immediately)
 * If you do not call createSpeedometer() first then a default configuration of the
 * speedometer will be created for you. If you want to modify any options then you
 * must call createSpeedometer() before attempting to call drawSpeedometer.
 */
function drawSpeedometer(targetSpeed, canvasId, doAnimation) {
  if(typeof(doAnimation)==='undefined') doAnimation = false;

  // Find the canvas options from the speedometer data otherwise create a new one with defaults
  if (!(canvasId in speedometerData))
  {
    createSpeedometer(canvasId);
  }
  speedParams = speedometerData[canvasId];
  canvas = speedParams.canvas;
  options = speedParams.options;

  // If we're not animating then set the currentSpeed to target speed right now!
  if (!doAnimation)
  {
    options.speed = targetSpeed;
  }

  options.ctx.save();
  
  // Clear canvas
  clearCanvas(canvas, options);

  // Draw the background
  drawBackground(options);

  // Draw the metallic styled edge
  drawMetallicArc(options);

  // Draw tick marks
  drawTicks(options);

  // Draw speeometer colour arc
  drawSpeedometerColourArc(options);

  // Draw labels on markers
  drawTextMarkers(options);

  // Draw the needle and base
  drawNeedle(options);
  
  options.ctx.restore();
    
  var currentSpeed = options.speed;
  
  if(Math.abs(targetSpeed - currentSpeed) < 1) {
    clearTimeout(speedParams.timer);
    return;
  } else if(targetSpeed < currentSpeed) {
    speedParams['decrementing'] = true;
  } else if(targetSpeed > currentSpeed) {
    speedParams['decrementing'] = false;
  }
  
  if(speedParams['decrementing']) {
    if(currentSpeed - 10 < targetSpeed)
      options.speed = currentSpeed - 1;
    else
      options.speed = currentSpeed - 5;
  } else {
  
    if(currentSpeed + 10 > targetSpeed)
      options.speed = currentSpeed + 1;
    else
      options.speed = currentSpeed + 5;
  }
  
  // Set timeout to redraw the speedometer with next value
  speedParams.timer = setTimeout(function() { drawSpeedometer(targetSpeed, canvasId, true); });
}
