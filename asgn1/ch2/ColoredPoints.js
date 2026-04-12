// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "void main() {\n" +
  "  gl_Position = a_Position;\n" +
  "  gl_PointSize = 10.0;\n" +
  "}\n";

// Fragment shader program
var FSHADER_SOURCE =
  "precision mediump float;\n" +
  "uniform vec4 u_FragColor;\n" + // uniform変数
  "void main() {\n" +
  "  gl_FragColor = u_FragColor;\n" +
  "}\n";

// Global variables
var gl;
var a_Position;
var u_FragColor;
var shapesList = []; // Single list containing all shapes to be drawn
var currentShapeType = "point"; // Track what type of shape to draw
var currentSegments = 10; // Number of segments for circles
var currentSize = 0.1; // Size of shapes to be drawn
var currentEraserSize = 0.1; // Size of the eraser

function drawUTArt() {
  shapesList = [];

  function addTri(x, y, size, r, g, b) {
    shapesList.push(new Triangle(x, y, size, r, g, b, 1.0));
  }

  // =========================
  // T (ANCHOR SHAFT + TOP BAR) — BLUE
  // =========================

  // Top horizontal bar of T (clearly visible)
  addTri(-0.3, 0.6, 0.18, 0.2, 0.4, 1.0);
  addTri(0.0, 0.6, 0.18, 0.2, 0.4, 1.0);
  addTri(0.3, 0.6, 0.18, 0.2, 0.4, 1.0);

  // Vertical shaft of T (long, centered)
  addTri(0.0, 0.4, 0.16, 0.2, 0.4, 1.0);
  addTri(0.0, 0.2, 0.16, 0.2, 0.4, 1.0);
  addTri(0.0, 0.0, 0.16, 0.2, 0.4, 1.0);
  addTri(0.0, -0.2, 0.16, 0.2, 0.4, 1.0);

  // =========================
  // U (ANCHOR BASE) — ORANGE
  // =========================

  // Left side of U
  addTri(-0.5, 0.0, 0.2, 1.0, 0.7, 0.2);
  addTri(-0.45, -0.2, 0.2, 1.0, 0.7, 0.2);

  // Right side of U
  addTri(0.5, 0.0, 0.2, 1.0, 0.7, 0.2);
  addTri(0.45, -0.2, 0.2, 1.0, 0.7, 0.2);

  // Bottom arc (strong curve)
  addTri(-0.3, -0.4, 0.22, 1.0, 0.7, 0.2);
  addTri(-0.1, -0.5, 0.22, 1.0, 0.7, 0.2);
  addTri(0.1, -0.5, 0.22, 1.0, 0.7, 0.2);
  addTri(0.3, -0.4, 0.22, 1.0, 0.7, 0.2);

  renderAllShapes();
}

function main() {
  gl = setupWebGL();
  if (!gl) return;

  connectVariablesToGLSL();

  // Setup slider event listeners
  setupSliders();

  // Setup shape type buttons
  document.getElementById("pointButton").addEventListener("click", function() {
    currentShapeType = "point";
  });
  document.getElementById("triangleButton").addEventListener("click", function() {
    currentShapeType = "triangle";
  });
  document.getElementById("circleButton").addEventListener("click", function() {
    currentShapeType = "circle";
  });
  document.getElementById("eraserButton").addEventListener("click", function() {
    currentShapeType = "eraser";
  });
  document
    .getElementById("drawUTButton")
    .addEventListener("click", function () {
      drawUTArt();
    });

  // Register function (event handler) to be called on a mouse press
  var canvas = document.getElementById("webgl");
  canvas.onmousedown = click;
  canvas.onmousemove = click; // Also draw when mouse moves

  // Setup clear button
  document.getElementById("clearButton").addEventListener("click", function() {
    shapesList = [];
    renderAllShapes();
  });

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupSliders() {
  var redSlider = document.getElementById("redSlider");
  var greenSlider = document.getElementById("greenSlider");
  var blueSlider = document.getElementById("blueSlider");
  var sizeSlider = document.getElementById("sizeSlider");
  var segmentSlider = document.getElementById("segmentSlider");
  var eraserSlider = document.getElementById("eraserSlider");

  // Initialize currentSize and currentSegments from slider values
  if (sizeSlider) {
    currentSize = parseFloat(sizeSlider.value);
  }
  if (segmentSlider) {
    currentSegments = parseInt(segmentSlider.value);
  }
  if (eraserSlider) {
    currentEraserSize = parseFloat(eraserSlider.value);
  }

  if (redSlider) {
    redSlider.addEventListener("input", function () {
      document.getElementById("redValue").textContent = this.value;
    });
  }

  if (greenSlider) {
    greenSlider.addEventListener("input", function () {
      document.getElementById("greenValue").textContent = this.value;
    });
  }

  if (blueSlider) {
    blueSlider.addEventListener("input", function () {
      document.getElementById("blueValue").textContent = this.value;
    });
  }

  if (sizeSlider) {
    sizeSlider.addEventListener("input", function () {
      currentSize = parseFloat(this.value);
      document.getElementById("sizeValue").textContent = this.value;
    });
  }

  if (segmentSlider) {
    segmentSlider.addEventListener("input", function () {
      currentSegments = parseInt(this.value);
      document.getElementById("segmentValue").textContent = this.value;
    });
  }

  if (eraserSlider) {
    eraserSlider.addEventListener("input", function () {
      currentEraserSize = parseFloat(this.value);
      document.getElementById("eraserValue").textContent = this.value;
    });
  }
}

function setupWebGL() {
  // Retrieve <canvas> element
  var canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  var glContext = getWebGLContext(canvas);
  if (!glContext) {
    console.log("Failed to get the rendering context for WebGL");
    return null;
  }

  // Initialize shaders
  if (!initShaders(glContext, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return null;
  }

  return glContext;
}

function connectVariablesToGLSL() {
  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }
}

function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Render all shapes in the list
  var len = shapesList.length;
  for (var i = 0; i < len; i++) {
    shapesList[i].render();
  }
}

function click(ev) {
  // Only proceed if left mouse button is down
  if (ev.buttons !== 1) return;

  var canvas = document.getElementById("webgl");
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  // Get the RGB color from the sliders (convert percentage to 0-1 range)
  var redValue = document.getElementById("redSlider").value / 100;
  var greenValue = document.getElementById("greenSlider").value / 100;
  var blueValue = document.getElementById("blueSlider").value / 100;

  // Handle eraser mode
  if (currentShapeType === "eraser") {
    // Remove shapes within eraser radius
    for (var i = shapesList.length - 1; i >= 0; i--) {
      var shape = shapesList[i];
      var dx = shape.x - x;
      var dy = shape.y - y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < currentEraserSize) {
        shapesList.splice(i, 1);
      }
    }
  } else {
    // Create and add the appropriate shape to shapesList
    if (currentShapeType === "point") {
      var point = new Point(x, y, currentSize, redValue, greenValue, blueValue, 1.0);
      shapesList.push(point);
    } else if (currentShapeType === "triangle") {
      var triangle = new Triangle(x, y, currentSize, redValue, greenValue, blueValue, 1.0);
      shapesList.push(triangle);
    } else if (currentShapeType === "circle") {
      var circle = new Circle(x, y, currentSegments, currentSize, redValue, greenValue, blueValue, 1.0);
      shapesList.push(circle);
    }
  }

  renderAllShapes();
}
