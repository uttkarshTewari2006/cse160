var VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "uniform mat4 u_ModelMatrix;\n" +
  "uniform mat4 u_GlobalRotationMatrix;\n" +
  "uniform mat4 u_ViewProjectionMatrix;\n" +
  "void main() {\n" +
  "  gl_Position = u_ViewProjectionMatrix * u_GlobalRotationMatrix * u_ModelMatrix * a_Position;\n" +
  "}\n";

var FSHADER_SOURCE =
  "precision mediump float;\n" +
  "uniform vec4 u_FragColor;\n" +
  "void main() {\n" +
  "  gl_FragColor = u_FragColor;\n" +
  "}\n";

var gl;
var canvas;
var a_Position;
var u_ModelMatrix;
var u_GlobalRotationMatrix;
var u_ViewProjectionMatrix;
var u_FragColor;

var g_globalAngle = 0;
var g_viewProjectionMatrix = new Matrix4();
var g_frontLeftUpperLegAngle = 0;
var g_frontLeftLowerLegAngle = 0;
var g_frontLeftPawAngle = 0;
var g_headTiltAngle = 0;
var g_animationOn = false;
var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;
var g_bodyBobOffset = 0;
var g_frontRightUpperLegAngle = 0;
var g_frontRightLowerLegAngle = 0;
var g_backLeftUpperLegAngle = 0;
var g_backRightUpperLegAngle = 0;
var g_mouseRotateX = 0;
var g_mouseRotateY = 0;
var g_isDragging = false;
var g_pokeActive = false;
var g_pokeStartSeconds = 0;
var g_lastFrameSeconds = performance.now() / 1000.0;
var g_fps = 0;

var g_cubeBuffer = null;
var g_cubeVertexCount = 36;
var g_sphereBuffer = null;
var g_sphereVertexCount = 0;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  initCubeBuffer();
  initSphereBuffer();
  initViewProjectionMatrix();

  gl.clearColor(0.87, 0.92, 0.98, 1.0);
  renderScene();
  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = getWebGLContext(canvas);

  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotationMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotationMatrix");
  u_ViewProjectionMatrix = gl.getUniformLocation(gl.program, "u_ViewProjectionMatrix");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
}

function addActionsForHtmlUI() {
  bindSlider("globalAngle", "globalAngleValue", function (value) {
    g_globalAngle = value;
  });
  bindSlider("frontUpperLeg", "frontUpperLegValue", function (value) {
    g_frontLeftUpperLegAngle = value;
  });
  bindSlider("frontLowerLeg", "frontLowerLegValue", function (value) {
    g_frontLeftLowerLegAngle = value;
  });
  bindSlider("frontPaw", "frontPawValue", function (value) {
    g_frontLeftPawAngle = value;
  });
  bindSlider("headTilt", "headTiltValue", function (value) {
    g_headTiltAngle = value;
  });

  document.getElementById("animationOnButton").addEventListener("click", function () {
    g_animationOn = true;
  });

  document.getElementById("animationOffButton").addEventListener("click", function () {
    g_animationOn = false;
    g_pokeActive = false;
    syncManualPoseFromSliders();
    renderScene();
  });

  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  canvas.addEventListener("mouseup", stopDragging);
  canvas.addEventListener("mouseleave", stopDragging);
}

function bindSlider(sliderId, valueId, onChange) {
  var slider = document.getElementById(sliderId);
  var valueLabel = document.getElementById(valueId);

  onChange(Number(slider.value));
  valueLabel.textContent = slider.value;

  slider.addEventListener("input", function () {
    onChange(Number(this.value));
    valueLabel.textContent = this.value;
    renderScene();
  });
}

function initCubeBuffer() {
  var vertices = new Float32Array([
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,

    -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,

    -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,

    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,

     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,

    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5
  ]);

  g_cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function initSphereBuffer() {
  var vertices = [];
  var latBands = 10;
  var longBands = 12;
  var lat;
  var lon;
  var theta1;
  var theta2;
  var phi1;
  var phi2;
  var p1;
  var p2;
  var p3;
  var p4;

  function point(theta, phi) {
    return [
      0.5 * Math.sin(theta) * Math.cos(phi),
      0.5 * Math.cos(theta),
      0.5 * Math.sin(theta) * Math.sin(phi)
    ];
  }

  for (lat = 0; lat < latBands; lat++) {
    theta1 = (lat / latBands) * Math.PI;
    theta2 = ((lat + 1) / latBands) * Math.PI;

    for (lon = 0; lon < longBands; lon++) {
      phi1 = (lon / longBands) * Math.PI * 2;
      phi2 = ((lon + 1) / longBands) * Math.PI * 2;

      p1 = point(theta1, phi1);
      p2 = point(theta2, phi1);
      p3 = point(theta2, phi2);
      p4 = point(theta1, phi2);

      vertices.push(
        p1[0], p1[1], p1[2],
        p2[0], p2[1], p2[2],
        p3[0], p3[1], p3[2],
        p1[0], p1[1], p1[2],
        p3[0], p3[1], p3[2],
        p4[0], p4[1], p4[2]
      );
    }
  }

  g_sphereVertexCount = vertices.length / 3;
  g_sphereBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function initViewProjectionMatrix() {
  var aspect = canvas.width / canvas.height;
  g_viewProjectionMatrix.setPerspective(50, aspect, 0.1, 100);
  g_viewProjectionMatrix.translate(0, 0, -6);
}

function drawCube(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, g_cubeVertexCount);
}

function drawSphere(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, g_sphereVertexCount);
}

function renderScene() {
  var globalRotationMatrix = new Matrix4();

  globalRotationMatrix.rotate(g_mouseRotateX, 1, 0, 0);
  globalRotationMatrix.rotate(g_globalAngle + g_mouseRotateY, 0, 1, 0);

  gl.uniformMatrix4fv(u_GlobalRotationMatrix, false, globalRotationMatrix.elements);
  gl.uniformMatrix4fv(u_ViewProjectionMatrix, false, g_viewProjectionMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawGround();
  drawPanda();
}

function drawGround() {
  var groundMatrix = new Matrix4();
  groundMatrix.translate(0, -1.65, 0);
  groundMatrix.scale(4.6, 0.12, 4.6);
  drawCube(groundMatrix, [0.73, 0.86, 0.70, 1.0]);
}

function drawPanda() {
  var frontLegYOffset = -0.08;
  var pandaYOffset = 0.38 + g_bodyBobOffset;
  var bodyMatrix = new Matrix4();
  var headBaseMatrix = new Matrix4();
  var headMatrix = new Matrix4();
  var leftEarMatrix = new Matrix4();
  var rightEarMatrix = new Matrix4();
  var snoutMatrix = new Matrix4();
  var leftEyePatchMatrix = new Matrix4();
  var rightEyePatchMatrix = new Matrix4();
  var eyeStripMatrix = new Matrix4();
  var backLeftUpperLegMatrix = new Matrix4();
  var backLeftLowerLegMatrix = new Matrix4();
  var backLeftPawMatrix = new Matrix4();
  var backRightUpperLegMatrix = new Matrix4();
  var backRightLowerLegMatrix = new Matrix4();
  var backRightPawMatrix = new Matrix4();
  var frontRightUpperLegMatrix = new Matrix4();
  var frontRightLowerLegMatrix = new Matrix4();
  var frontRightPawMatrix = new Matrix4();
  var tailMatrix = new Matrix4();
  var frontLeftUpperLegMatrix = new Matrix4();
  var frontLeftLowerLegMatrix = new Matrix4();
  var frontLeftPawMatrix = new Matrix4();

  bodyMatrix.translate(0, -0.25 + pandaYOffset, 0);
  bodyMatrix.scale(1.8, 1.15, 1.1);
  drawCube(bodyMatrix, [0.96, 0.96, 0.96, 1.0]);

  headBaseMatrix.translate(1.08, 0.36 + pandaYOffset, 0);
  headBaseMatrix.rotate(g_headTiltAngle, 0, 0, 1);

  headMatrix = headBaseMatrix.clone();
  headMatrix.translate(0.28, 0, 0);
  headMatrix.scale(0.76, 0.72, 0.72);
  drawCube(headMatrix, [0.98, 0.98, 0.98, 1.0]);

  leftEarMatrix = headBaseMatrix.clone();
  leftEarMatrix.translate(0.05, 0.44, 0.27);
  leftEarMatrix.scale(0.2, 0.2, 0.2);
  drawSphere(leftEarMatrix, [0.12, 0.12, 0.12, 1.0]);

  rightEarMatrix = headBaseMatrix.clone();
  rightEarMatrix.translate(0.05, 0.44, -0.27);
  rightEarMatrix.scale(0.2, 0.2, 0.2);
  drawSphere(rightEarMatrix, [0.12, 0.12, 0.12, 1.0]);

  eyeStripMatrix = headBaseMatrix.clone();
  eyeStripMatrix.translate(0.26, 0.08, 0);
  eyeStripMatrix.scale(0.08, 0.22, 0.7);
  drawCube(eyeStripMatrix, [0.12, 0.12, 0.12, 1.0]);

  leftEyePatchMatrix = headBaseMatrix.clone();
  leftEyePatchMatrix.translate(0.38, 0.12, 0.22);
  leftEyePatchMatrix.scale(0.1, 0.18, 0.16);
  drawCube(leftEyePatchMatrix, [0.12, 0.12, 0.12, 1.0]);

  rightEyePatchMatrix = headBaseMatrix.clone();
  rightEyePatchMatrix.translate(0.38, 0.12, -0.22);
  rightEyePatchMatrix.scale(0.1, 0.18, 0.16);
  drawCube(rightEyePatchMatrix, [0.12, 0.12, 0.12, 1.0]);

  snoutMatrix = headBaseMatrix.clone();
  snoutMatrix.translate(0.62, -0.04, 0);
  snoutMatrix.scale(0.22, 0.16, 0.28);
  drawCube(snoutMatrix, [0.16, 0.16, 0.16, 1.0]);

  backLeftUpperLegMatrix.translate(-0.78, -0.84 + pandaYOffset, 0.42);
  backLeftUpperLegMatrix.rotate(g_backLeftUpperLegAngle, 0, 0, 1);
  backLeftUpperLegMatrix.translate(0, -0.27, 0);
  backLeftUpperLegMatrix.scale(0.32, 0.54, 0.32);
  drawCube(backLeftUpperLegMatrix, [0.14, 0.14, 0.14, 1.0]);

  backLeftLowerLegMatrix.translate(-0.78, -0.84 + pandaYOffset, 0.42);
  backLeftLowerLegMatrix.rotate(g_backLeftUpperLegAngle, 0, 0, 1);
  backLeftLowerLegMatrix.translate(0, -0.54, 0);
  backLeftLowerLegMatrix.scale(0.28, 0.28, 0.28);
  drawCube(backLeftLowerLegMatrix, [0.88, 0.88, 0.88, 1.0]);

  backLeftPawMatrix.translate(-0.78, -0.84 + pandaYOffset, 0.42);
  backLeftPawMatrix.rotate(g_backLeftUpperLegAngle, 0, 0, 1);
  backLeftPawMatrix.translate(0.1, -0.76, 0);
  backLeftPawMatrix.scale(0.3, 0.12, 0.34);
  drawCube(backLeftPawMatrix, [0.14, 0.14, 0.14, 1.0]);

  backRightUpperLegMatrix.translate(-0.78, -0.84 + pandaYOffset, -0.42);
  backRightUpperLegMatrix.rotate(g_backRightUpperLegAngle, 0, 0, 1);
  backRightUpperLegMatrix.translate(0, -0.27, 0);
  backRightUpperLegMatrix.scale(0.32, 0.54, 0.32);
  drawCube(backRightUpperLegMatrix, [0.14, 0.14, 0.14, 1.0]);

  backRightLowerLegMatrix.translate(-0.78, -0.84 + pandaYOffset, -0.42);
  backRightLowerLegMatrix.rotate(g_backRightUpperLegAngle, 0, 0, 1);
  backRightLowerLegMatrix.translate(0, -0.54, 0);
  backRightLowerLegMatrix.scale(0.28, 0.28, 0.28);
  drawCube(backRightLowerLegMatrix, [0.88, 0.88, 0.88, 1.0]);

  backRightPawMatrix.translate(-0.78, -0.84 + pandaYOffset, -0.42);
  backRightPawMatrix.rotate(g_backRightUpperLegAngle, 0, 0, 1);
  backRightPawMatrix.translate(0.1, -0.76, 0);
  backRightPawMatrix.scale(0.3, 0.12, 0.34);
  drawCube(backRightPawMatrix, [0.14, 0.14, 0.14, 1.0]);

  frontRightUpperLegMatrix.translate(0.76, -0.69 + pandaYOffset + frontLegYOffset, -0.36);
  frontRightUpperLegMatrix.rotate(g_frontRightUpperLegAngle, 0, 0, 1);
  frontRightUpperLegMatrix.translate(0, -0.23, 0);
  frontRightUpperLegMatrix.scale(0.3, 0.46, 0.3);
  drawCube(frontRightUpperLegMatrix, [0.14, 0.14, 0.14, 1.0]);

  frontRightLowerLegMatrix.translate(0.76, -0.69 + pandaYOffset + frontLegYOffset, -0.36);
  frontRightLowerLegMatrix.rotate(g_frontRightUpperLegAngle, 0, 0, 1);
  frontRightLowerLegMatrix.translate(0, -0.46, 0);
  frontRightLowerLegMatrix.rotate(g_frontRightLowerLegAngle, 0, 0, 1);
  frontRightLowerLegMatrix.translate(0, -0.14, 0);
  frontRightLowerLegMatrix.scale(0.26, 0.28, 0.26);
  drawCube(frontRightLowerLegMatrix, [0.88, 0.88, 0.88, 1.0]);

  frontRightPawMatrix.translate(0.76, -0.69 + pandaYOffset + frontLegYOffset, -0.36);
  frontRightPawMatrix.rotate(g_frontRightUpperLegAngle, 0, 0, 1);
  frontRightPawMatrix.translate(0, -0.46, 0);
  frontRightPawMatrix.rotate(g_frontRightLowerLegAngle, 0, 0, 1);
  frontRightPawMatrix.translate(0.1, -0.32, 0);
  frontRightPawMatrix.scale(0.28, 0.1, 0.32);
  drawCube(frontRightPawMatrix, [0.14, 0.14, 0.14, 1.0]);

  tailMatrix.translate(-1.1, -0.02 + pandaYOffset, 0);
  tailMatrix.scale(0.24, 0.24, 0.24);
  drawCube(tailMatrix, [0.14, 0.14, 0.14, 1.0]);

  frontLeftUpperLegMatrix.translate(0.76, -0.69 + pandaYOffset + frontLegYOffset, 0.42);
  frontLeftUpperLegMatrix.rotate(g_frontLeftUpperLegAngle, 0, 0, 1);
  frontLeftUpperLegMatrix.translate(0, -0.23, 0);
  frontLeftUpperLegMatrix.scale(0.3, 0.46, 0.3);
  drawCube(frontLeftUpperLegMatrix, [0.14, 0.14, 0.14, 1.0]);

  frontLeftLowerLegMatrix.translate(0.76, -0.69 + pandaYOffset + frontLegYOffset, 0.42);
  frontLeftLowerLegMatrix.rotate(g_frontLeftUpperLegAngle, 0, 0, 1);
  frontLeftLowerLegMatrix.translate(0, -0.46, 0);
  frontLeftLowerLegMatrix.rotate(g_frontLeftLowerLegAngle, 0, 0, 1);
  frontLeftLowerLegMatrix.translate(0, -0.14, 0);
  frontLeftLowerLegMatrix.scale(0.26, 0.28, 0.26);
  drawCube(frontLeftLowerLegMatrix, [0.88, 0.88, 0.88, 1.0]);

  frontLeftPawMatrix.translate(0.73, -0.5 + pandaYOffset + frontLegYOffset, 0.42);
  frontLeftPawMatrix.rotate(g_frontLeftUpperLegAngle, 0, 0, 1);
  frontLeftPawMatrix.translate(0, -0.46, 0);
  frontLeftPawMatrix.rotate(g_frontLeftLowerLegAngle, 0, 0, 1);
  frontLeftPawMatrix.translate(0, -0.36, 0);
  frontLeftPawMatrix.rotate(g_frontLeftPawAngle, 0, 0, 1);
  frontLeftPawMatrix.translate(0.09, -0.08, -0.02);
  frontLeftPawMatrix.scale(0.28, 0.1, 0.32);
  drawCube(frontLeftPawMatrix, [0.14, 0.14, 0.14, 1.0]);
}

function tick() {
  var nowSeconds = performance.now() / 1000.0;
  var deltaSeconds = nowSeconds - g_lastFrameSeconds;

  g_lastFrameSeconds = nowSeconds;
  g_seconds = nowSeconds - g_startTime;

  if (deltaSeconds > 0) {
    g_fps = g_fps === 0 ? 1 / deltaSeconds : g_fps * 0.9 + (1 / deltaSeconds) * 0.1;
  }

  if (g_animationOn || g_pokeActive) {
    updateAnimationAngles();
  }

  renderScene();
  updatePerformanceDisplay();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  var swing = Math.sin(g_seconds * 3.2);
  var counterSwing = Math.sin(g_seconds * 3.2 + Math.PI);
  var pokeElapsed;
  var pokeProgress;
  var pokeWave;

  if (g_pokeActive) {
    pokeElapsed = g_seconds - g_pokeStartSeconds;

    if (pokeElapsed >= 1.2) {
      g_pokeActive = false;
      if (!g_animationOn) {
        syncManualPoseFromSliders();
      }
      return;
    }

    pokeProgress = pokeElapsed / 1.2;
    pokeWave = Math.sin(pokeElapsed * 18);

    g_bodyBobOffset = -0.08 * Math.sin(Math.PI * pokeProgress);
    g_headTiltAngle = 20 * Math.sin(Math.PI * pokeProgress);
    g_frontLeftUpperLegAngle = 20 * pokeWave;
    g_frontLeftLowerLegAngle = -20 * Math.max(0, Math.sin(pokeElapsed * 9));
    g_frontLeftPawAngle = 18 * Math.sin(pokeElapsed * 14);
    g_frontRightUpperLegAngle = -10 * pokeWave;
    g_frontRightLowerLegAngle = -8 * Math.max(0, Math.sin(pokeElapsed * 9 + 0.6));
    g_backLeftUpperLegAngle = -8 * pokeWave;
    g_backRightUpperLegAngle = 8 * pokeWave;
    return;
  }

  g_bodyBobOffset = 0.03 * Math.sin(g_seconds * 6.4);
  g_headTiltAngle = 6 * Math.sin(g_seconds * 1.6);

  g_frontLeftUpperLegAngle = 18 * swing;
  g_frontLeftLowerLegAngle = -14 * Math.max(0, counterSwing);
  g_frontLeftPawAngle = 4 * swing;

  g_frontRightUpperLegAngle = 12 * counterSwing;
  g_frontRightLowerLegAngle = -10 * Math.max(0, swing);

  g_backLeftUpperLegAngle = 10 * counterSwing;
  g_backRightUpperLegAngle = 10 * swing;
}

function syncManualPoseFromSliders() {
  g_bodyBobOffset = 0;
  g_frontRightUpperLegAngle = 0;
  g_frontRightLowerLegAngle = 0;
  g_backLeftUpperLegAngle = 0;
  g_backRightUpperLegAngle = 0;
  g_frontLeftUpperLegAngle = Number(document.getElementById("frontUpperLeg").value);
  g_frontLeftLowerLegAngle = Number(document.getElementById("frontLowerLeg").value);
  g_frontLeftPawAngle = Number(document.getElementById("frontPaw").value);
  g_headTiltAngle = Number(document.getElementById("headTilt").value);
}

function handleCanvasMouseDown(ev) {
  if (ev.shiftKey) {
    triggerPokeAnimation();
    return;
  }

  g_isDragging = true;
  updateMouseRotationFromEvent(ev);
}

function handleCanvasMouseMove(ev) {
  if (!g_isDragging) {
    return;
  }

  updateMouseRotationFromEvent(ev);
}

function stopDragging() {
  g_isDragging = false;
}

function updateMouseRotationFromEvent(ev) {
  var rect = canvas.getBoundingClientRect();
  var normalizedX = (ev.clientX - rect.left) / canvas.width;
  var normalizedY = (ev.clientY - rect.top) / canvas.height;

  g_mouseRotateY = normalizedX * 180 - 90;
  g_mouseRotateX = 45 - normalizedY * 90;
  renderScene();
}

function triggerPokeAnimation() {
  g_pokeActive = true;
  g_pokeStartSeconds = g_seconds;
}

function updatePerformanceDisplay() {
  var fpsDisplay = document.getElementById("fpsDisplay");
  var modeDisplay = document.getElementById("modeDisplay");
  var modeText = "Manual";

  if (g_pokeActive) {
    modeText = "Poke";
  } else if (g_animationOn) {
    modeText = "Walking";
  }

  if (fpsDisplay) {
    fpsDisplay.textContent = g_fps.toFixed(1);
  }

  if (modeDisplay) {
    modeDisplay.textContent = modeText;
  }
}
