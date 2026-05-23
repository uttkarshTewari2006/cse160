var VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "attribute vec3 a_Normal;\n" +
  "uniform mat4 u_ModelMatrix;\n" +
  "uniform mat4 u_NormalMatrix;\n" +
  "uniform mat4 u_ViewMatrix;\n" +
  "uniform mat4 u_ProjectionMatrix;\n" +
  "varying vec3 v_Normal;\n" +
  "varying vec3 v_WorldPos;\n" +
  "void main() {\n" +
  "  vec4 worldPos = u_ModelMatrix * a_Position;\n" +
  "  gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos;\n" +
  "  v_WorldPos = worldPos.xyz;\n" +
  "  v_Normal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);\n" +
  "}\n";

var FSHADER_SOURCE =
  "precision mediump float;\n" +
  "uniform vec4 u_FragColor;\n" +
  "uniform bool u_ShowNormals;\n" +
  "uniform bool u_LightingOn;\n" +
  "uniform bool u_PointLightOn;\n" +
  "uniform bool u_SpotLightOn;\n" +
  "uniform vec3 u_CameraPos;\n" +
  "uniform vec3 u_PointLightPos;\n" +
  "uniform vec3 u_PointLightColor;\n" +
  "uniform vec3 u_SpotLightPos;\n" +
  "uniform vec3 u_SpotLightDir;\n" +
  "uniform vec3 u_SpotLightColor;\n" +
  "uniform float u_SpotCutoffCos;\n" +
  "varying vec3 v_Normal;\n" +
  "varying vec3 v_WorldPos;\n" +
  "void main() {\n" +
  "  vec3 normalDir = normalize(v_Normal);\n" +
  "  vec3 baseColor = u_FragColor.rgb;\n" +
  "  vec3 viewDir = normalize(u_CameraPos - v_WorldPos);\n" +
  "  vec3 finalColor;\n" +
  "  if (u_ShowNormals) {\n" +
  "    gl_FragColor = vec4(normalDir * 0.5 + 0.5, 1.0);\n" +
  "    return;\n" +
  "  }\n" +
  "  if (!u_LightingOn) {\n" +
  "    gl_FragColor = vec4(baseColor, u_FragColor.a);\n" +
  "    return;\n" +
  "  }\n" +
  "  finalColor = baseColor * 0.18;\n" +
  "  if (u_PointLightOn) {\n" +
  "    vec3 pointVector = u_PointLightPos - v_WorldPos;\n" +
  "    vec3 pointDir = normalize(pointVector);\n" +
  "    float pointDistance = length(pointVector);\n" +
  "    float pointDiffuse = max(dot(normalDir, pointDir), 0.0);\n" +
  "    float pointSpecular = 0.0;\n" +
  "    float pointAttenuation = 1.0 / (1.0 + 0.14 * pointDistance + 0.05 * pointDistance * pointDistance);\n" +
  "    if (pointDiffuse > 0.0) {\n" +
  "      vec3 pointReflectDir = reflect(-pointDir, normalDir);\n" +
  "      pointSpecular = pow(max(dot(viewDir, pointReflectDir), 0.0), 24.0);\n" +
  "    }\n" +
  "    finalColor += baseColor * u_PointLightColor * (0.75 * pointDiffuse * pointAttenuation);\n" +
  "    finalColor += u_PointLightColor * (0.42 * pointSpecular * pointAttenuation);\n" +
  "  }\n" +
  "  if (u_SpotLightOn) {\n" +
  "    vec3 spotVector = u_SpotLightPos - v_WorldPos;\n" +
  "    vec3 spotDir = normalize(spotVector);\n" +
  "    float spotDistance = length(spotVector);\n" +
  "    float spotTheta = dot(normalize(-u_SpotLightDir), spotDir);\n" +
  "    if (spotTheta > u_SpotCutoffCos) {\n" +
  "      float spotFalloff = smoothstep(u_SpotCutoffCos, 1.0, spotTheta);\n" +
  "      float spotDiffuse = max(dot(normalDir, spotDir), 0.0);\n" +
  "      float spotSpecular = 0.0;\n" +
  "      float spotAttenuation = spotFalloff / (1.0 + 0.10 * spotDistance + 0.03 * spotDistance * spotDistance);\n" +
  "      if (spotDiffuse > 0.0) {\n" +
  "        vec3 spotReflectDir = reflect(-spotDir, normalDir);\n" +
  "        spotSpecular = pow(max(dot(viewDir, spotReflectDir), 0.0), 18.0);\n" +
  "      }\n" +
  "      finalColor += baseColor * u_SpotLightColor * (0.70 * spotDiffuse * spotAttenuation);\n" +
  "      finalColor += u_SpotLightColor * (0.35 * spotSpecular * spotAttenuation);\n" +
  "    }\n" +
  "  }\n" +
  "  gl_FragColor = vec4(finalColor, u_FragColor.a);\n" +
  "}\n";

var gl;
var canvas;
var a_Position;
var a_Normal;
var u_ModelMatrix;
var u_NormalMatrix;
var u_ViewMatrix;
var u_ProjectionMatrix;
var u_FragColor;
var u_ShowNormals;
var u_LightingOn;
var u_PointLightOn;
var u_SpotLightOn;
var u_CameraPos;
var u_PointLightPos;
var u_PointLightColor;
var u_SpotLightPos;
var u_SpotLightDir;
var u_SpotLightColor;
var u_SpotCutoffCos;

var g_cubeBuffer = null;
var g_cubeNormalBuffer = null;
var g_cubeVertexCount = 36;
var g_sphereBuffer = null;
var g_sphereNormalBuffer = null;
var g_sphereVertexCount = 0;
var g_objModel = null;
var g_camera;

var g_showNormals = false;
var g_lightingOn = true;
var g_pointLightOn = true;
var g_spotLightOn = true;
var g_animatePointLight = true;

var g_lightSliderPos = [2.8, 2.4, 0.0];
var g_pointLightPos = [2.8, 2.4, 0.0];
var g_pointLightColor = [1.0, 0.95, 0.82];
var g_spotLightColor = [0.65, 0.82, 1.0];
var g_spotCutoffDegrees = 20;
var g_startTimeSeconds = performance.now() / 1000.0;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initCubeBuffer();
  initSphereBuffer();
  initOBJModel();
  g_camera = new Camera();
  bindControls();

  gl.clearColor(0.84, 0.92, 1.0, 1.0);
  syncAllLabels();
  canvas.focus();
  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = getWebGLContext(canvas);

  if (!gl) {
    console.log("Failed to get the rendering context for WebGL.");
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
  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ShowNormals = gl.getUniformLocation(gl.program, "u_ShowNormals");
  u_LightingOn = gl.getUniformLocation(gl.program, "u_LightingOn");
  u_PointLightOn = gl.getUniformLocation(gl.program, "u_PointLightOn");
  u_SpotLightOn = gl.getUniformLocation(gl.program, "u_SpotLightOn");
  u_CameraPos = gl.getUniformLocation(gl.program, "u_CameraPos");
  u_PointLightPos = gl.getUniformLocation(gl.program, "u_PointLightPos");
  u_PointLightColor = gl.getUniformLocation(gl.program, "u_PointLightColor");
  u_SpotLightPos = gl.getUniformLocation(gl.program, "u_SpotLightPos");
  u_SpotLightDir = gl.getUniformLocation(gl.program, "u_SpotLightDir");
  u_SpotLightColor = gl.getUniformLocation(gl.program, "u_SpotLightColor");
  u_SpotCutoffCos = gl.getUniformLocation(gl.program, "u_SpotCutoffCos");
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
  var normals = new Float32Array([
     0.0,  0.0,  1.0,   0.0,  0.0,  1.0,   0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,   0.0,  0.0,  1.0,   0.0,  0.0,  1.0,

     0.0,  0.0, -1.0,   0.0,  0.0, -1.0,   0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,   0.0,  0.0, -1.0,   0.0,  0.0, -1.0,

     0.0,  1.0,  0.0,   0.0,  1.0,  0.0,   0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,   0.0,  1.0,  0.0,   0.0,  1.0,  0.0,

     0.0, -1.0,  0.0,   0.0, -1.0,  0.0,   0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,   0.0, -1.0,  0.0,   0.0, -1.0,  0.0,

     1.0,  0.0,  0.0,   1.0,  0.0,  0.0,   1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,   1.0,  0.0,  0.0,   1.0,  0.0,  0.0,

    -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0
  ]);

  g_cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  g_cubeNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}

function initSphereBuffer() {
  var vertices = [];
  var normals = [];
  var latBands = 20;
  var longBands = 24;
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

  function pushTriangle(a, b, c) {
    vertices.push(
      a[0], a[1], a[2],
      b[0], b[1], b[2],
      c[0], c[1], c[2]
    );

    normals.push(
      a[0] * 2.0, a[1] * 2.0, a[2] * 2.0,
      b[0] * 2.0, b[1] * 2.0, b[2] * 2.0,
      c[0] * 2.0, c[1] * 2.0, c[2] * 2.0
    );
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

      pushTriangle(p1, p2, p3);
      pushTriangle(p1, p3, p4);
    }
  }

  g_sphereVertexCount = vertices.length / 3;

  g_sphereBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  g_sphereNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
}

function initOBJModel() {
  g_objModel = new Model();
  g_objModel.color = [0.80, 0.36, 0.72, 1.0];
  g_objModel.loadFromOBJ("./models/torus.obj", function (loaded) {
    if (loaded) {
      console.log("OBJ model loaded successfully.");
    } else {
      console.log("OBJ model did not load. If needed, run this through a local server.");
    }
  });
}

function bindControls() {
  var sliderConfigs = [
    ["lightX", "lightXValue", function (value) { g_lightSliderPos[0] = value; }],
    ["lightY", "lightYValue", function (value) { g_lightSliderPos[1] = value; }],
    ["lightZ", "lightZValue", function (value) { g_lightSliderPos[2] = value; }],
    ["lightR", "lightRValue", function (value) { g_pointLightColor[0] = value; }],
    ["lightG", "lightGValue", function (value) { g_pointLightColor[1] = value; }],
    ["lightB", "lightBValue", function (value) { g_pointLightColor[2] = value; }]
  ];
  var i;

  window.addEventListener("keydown", handleKeyDown, true);
  canvas.addEventListener("click", function () {
    canvas.focus();
  });

  document.getElementById("forwardButton").addEventListener("click", function () {
    applyCameraAction("forward");
  });
  document.getElementById("leftButton").addEventListener("click", function () {
    applyCameraAction("left");
  });
  document.getElementById("backButton").addEventListener("click", function () {
    applyCameraAction("back");
  });
  document.getElementById("rightButton").addEventListener("click", function () {
    applyCameraAction("right");
  });
  document.getElementById("turnLeftButton").addEventListener("click", function () {
    applyCameraAction("turnLeft");
  });
  document.getElementById("turnRightButton").addEventListener("click", function () {
    applyCameraAction("turnRight");
  });

  document.getElementById("toggleLightingButton").addEventListener("click", function () {
    g_lightingOn = !g_lightingOn;
    updateLightingButton();
    renderScene();
  });
  document.getElementById("toggleNormalsButton").addEventListener("click", function () {
    g_showNormals = !g_showNormals;
    updateNormalButton();
    renderScene();
  });
  document.getElementById("togglePointLightButton").addEventListener("click", function () {
    g_pointLightOn = !g_pointLightOn;
    updatePointLightButton();
    renderScene();
  });
  document.getElementById("toggleSpotLightButton").addEventListener("click", function () {
    g_spotLightOn = !g_spotLightOn;
    updateSpotLightButton();
    renderScene();
  });
  document.getElementById("toggleLightMotionButton").addEventListener("click", function () {
    g_animatePointLight = !g_animatePointLight;
    updateLightMotionButton();
    renderScene();
  });

  for (i = 0; i < sliderConfigs.length; i++) {
    bindSlider(sliderConfigs[i][0], sliderConfigs[i][1], sliderConfigs[i][2]);
  }
}

function bindSlider(sliderId, valueId, onChange) {
  var slider = document.getElementById(sliderId);
  var valueLabel = document.getElementById(valueId);

  function applyValue() {
    var value = Number(slider.value);
    onChange(value);
    if (valueLabel) {
      valueLabel.textContent = value.toFixed(2);
    }
  }

  applyValue();
  slider.addEventListener("input", function () {
    applyValue();
    renderScene();
  });
}

function handleKeyDown(ev) {
  switch (ev.key.toLowerCase()) {
    case "w":
      applyCameraAction("forward");
      break;
    case "a":
      applyCameraAction("left");
      break;
    case "s":
      applyCameraAction("back");
      break;
    case "d":
      applyCameraAction("right");
      break;
    case "q":
      applyCameraAction("turnLeft");
      break;
    case "e":
      applyCameraAction("turnRight");
      break;
    default:
      return;
  }

  if (ev.preventDefault) {
    ev.preventDefault();
  }
}

function applyCameraAction(action) {
  switch (action) {
    case "forward":
      g_camera.moveForward();
      break;
    case "left":
      g_camera.moveLeft();
      break;
    case "back":
      g_camera.moveBackwards();
      break;
    case "right":
      g_camera.moveRight();
      break;
    case "turnLeft":
      g_camera.panLeft();
      break;
    case "turnRight":
      g_camera.panRight();
      break;
  }

  renderScene();
}

function tick() {
  var elapsedSeconds = performance.now() / 1000.0 - g_startTimeSeconds;

  updatePointLightAnimation(elapsedSeconds);
  renderScene();
  requestAnimationFrame(tick);
}

function updatePointLightAnimation(elapsedSeconds) {
  if (g_animatePointLight) {
    g_pointLightPos[0] = Math.cos(elapsedSeconds * 0.85) * 3.0;
    g_pointLightPos[1] = g_lightSliderPos[1];
    g_pointLightPos[2] = Math.sin(elapsedSeconds * 0.85) * 3.0;
  } else {
    g_pointLightPos[0] = g_lightSliderPos[0];
    g_pointLightPos[1] = g_lightSliderPos[1];
    g_pointLightPos[2] = g_lightSliderPos[2];
  }
}

function renderScene() {
  if (!gl || !g_camera) {
    return;
  }

  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);
  gl.uniform3f(
    u_CameraPos,
    g_camera.eye.elements[0],
    g_camera.eye.elements[1],
    g_camera.eye.elements[2]
  );

  applyLightingUniforms();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawEnvironment();
  drawDecorObjects();
  drawOBJModel();
  drawScratchStructures();
  drawPointLightMarker();
}

function applyLightingUniforms() {
  var spotlightDirection = getCameraForwardDirection();

  gl.uniform1i(u_ShowNormals, g_showNormals ? 1 : 0);
  gl.uniform1i(u_LightingOn, g_lightingOn ? 1 : 0);
  gl.uniform1i(u_PointLightOn, g_pointLightOn ? 1 : 0);
  gl.uniform1i(u_SpotLightOn, g_spotLightOn ? 1 : 0);
  gl.uniform3f(u_PointLightPos, g_pointLightPos[0], g_pointLightPos[1], g_pointLightPos[2]);
  gl.uniform3f(u_PointLightColor, g_pointLightColor[0], g_pointLightColor[1], g_pointLightColor[2]);
  gl.uniform3f(
    u_SpotLightPos,
    g_camera.eye.elements[0],
    g_camera.eye.elements[1],
    g_camera.eye.elements[2]
  );
  gl.uniform3f(u_SpotLightDir, spotlightDirection[0], spotlightDirection[1], spotlightDirection[2]);
  gl.uniform3f(u_SpotLightColor, g_spotLightColor[0], g_spotLightColor[1], g_spotLightColor[2]);
  gl.uniform1f(u_SpotCutoffCos, Math.cos(g_spotCutoffDegrees * Math.PI / 180));
}

function getCameraForwardDirection() {
  var dx = g_camera.at.elements[0] - g_camera.eye.elements[0];
  var dy = g_camera.at.elements[1] - g_camera.eye.elements[1];
  var dz = g_camera.at.elements[2] - g_camera.eye.elements[2];
  var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return [dx / length, dy / length, dz / length];
}

function applyShapeState(matrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, computeNormalMatrix(matrix));
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
}

function computeNormalMatrix(matrix) {
  var e = matrix.elements;
  var a00 = e[0];
  var a01 = e[4];
  var a02 = e[8];
  var a10 = e[1];
  var a11 = e[5];
  var a12 = e[9];
  var a20 = e[2];
  var a21 = e[6];
  var a22 = e[10];
  var det = a00 * (a11 * a22 - a12 * a21)
    - a01 * (a10 * a22 - a12 * a20)
    + a02 * (a10 * a21 - a11 * a20);
  var invDet;
  var inv00;
  var inv01;
  var inv02;
  var inv10;
  var inv11;
  var inv12;
  var inv20;
  var inv21;
  var inv22;
  var normalMatrix;

  if (Math.abs(det) < 0.00001) {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  invDet = 1.0 / det;

  inv00 = (a11 * a22 - a12 * a21) * invDet;
  inv01 = (a02 * a21 - a01 * a22) * invDet;
  inv02 = (a01 * a12 - a02 * a11) * invDet;
  inv10 = (a12 * a20 - a10 * a22) * invDet;
  inv11 = (a00 * a22 - a02 * a20) * invDet;
  inv12 = (a02 * a10 - a00 * a12) * invDet;
  inv20 = (a10 * a21 - a11 * a20) * invDet;
  inv21 = (a01 * a20 - a00 * a21) * invDet;
  inv22 = (a00 * a11 - a01 * a10) * invDet;

  normalMatrix = new Float32Array(16);
  normalMatrix[0] = inv00;
  normalMatrix[1] = inv01;
  normalMatrix[2] = inv02;
  normalMatrix[3] = 0;
  normalMatrix[4] = inv10;
  normalMatrix[5] = inv11;
  normalMatrix[6] = inv12;
  normalMatrix[7] = 0;
  normalMatrix[8] = inv20;
  normalMatrix[9] = inv21;
  normalMatrix[10] = inv22;
  normalMatrix[11] = 0;
  normalMatrix[12] = 0;
  normalMatrix[13] = 0;
  normalMatrix[14] = 0;
  normalMatrix[15] = 1;

  return normalMatrix;
}

function drawEnvironment() {
  renderCubePrimitive(0, -1.15, 0, 8.0, 0.25, 8.0, [0.67, 0.80, 0.68, 1.0]);
  renderCubePrimitive(0, 0.05, -4.0, 8.0, 2.5, 0.3, [0.70, 0.74, 0.80, 1.0]);
  renderCubePrimitive(-4.0, 0.05, 0, 0.3, 2.5, 8.0, [0.75, 0.77, 0.82, 1.0]);
  renderCubePrimitive(2.6, -0.55, 1.4, 1.2, 1.2, 1.2, [0.63, 0.45, 0.31, 1.0]);
}

function drawDecorObjects() {
  renderCubePrimitive(0, -0.2, 0, 1.0, 1.0, 1.0, [0.82, 0.45, 0.29, 1.0]);
  renderSpherePrimitive(1.85, 0.1, -0.8, 0.95, 0.95, 0.95, [0.34, 0.56, 0.88, 1.0]);
  renderSpherePrimitive(2.7, 0.15, 1.2, 1.05, 1.05, 1.05, [0.93, 0.78, 0.32, 1.0]);
}

function drawOBJModel() {
  if (!g_objModel || !g_objModel.isReady) {
    return;
  }

  g_objModel.matrix = new Matrix4();
  g_objModel.matrix.translate(2.6, 0.48, 1.4);
  g_objModel.matrix.rotate(65, 1, 0, 0);
  g_objModel.matrix.rotate(-18, 0, 1, 0);
  g_objModel.matrix.scale(0.85, 0.85, 0.85);
  g_objModel.render();
}

function drawScratchStructures() {
  renderCubePrimitive(-2.2, -0.45, 1.0, 1.2, 0.55, 1.2, [0.86, 0.52, 0.30, 1.0]);
  renderCubePrimitive(-2.2, 0.25, 1.0, 0.45, 0.85, 0.45, [0.74, 0.47, 0.27, 1.0]);
  renderSpherePrimitive(-2.2, 1.0, 1.0, 0.6, 0.6, 0.6, [0.40, 0.78, 0.46, 1.0]);

  renderCubePrimitive(-1.0, -0.65, -0.2, 0.35, 1.65, 0.35, [0.64, 0.67, 0.74, 1.0]);
  renderCubePrimitive(-1.0, 0.4, -0.2, 1.2, 0.18, 1.2, [0.79, 0.82, 0.89, 1.0]);
  renderSpherePrimitive(-1.0, 0.72, -0.2, 0.35, 0.35, 0.35, [0.95, 0.42, 0.36, 1.0]);

  renderCubePrimitive(-2.9, -0.8, -1.3, 0.55, 0.35, 0.55, [0.55, 0.34, 0.78, 1.0]);
  renderCubePrimitive(-2.25, -0.35, -1.3, 0.55, 1.25, 0.55, [0.32, 0.62, 0.84, 1.0]);
  renderCubePrimitive(-1.6, 0.15, -1.3, 0.55, 2.25, 0.55, [0.94, 0.72, 0.26, 1.0]);
}

function drawPointLightMarker() {
  var marker = new Cube();
  var previousLightingState = g_lightingOn;

  marker.color = [g_pointLightColor[0], g_pointLightColor[1], g_pointLightColor[2], 1.0];
  marker.matrix.translate(g_pointLightPos[0], g_pointLightPos[1], g_pointLightPos[2]);
  marker.matrix.scale(0.22, 0.22, 0.22);

  if (!g_showNormals) {
    gl.uniform1i(u_LightingOn, 0);
  }
  marker.render();
  gl.uniform1i(u_LightingOn, previousLightingState ? 1 : 0);
}

function renderCubePrimitive(x, y, z, sx, sy, sz, color) {
  var cube = new Cube();
  cube.color = color;
  cube.matrix.translate(x, y, z);
  cube.matrix.scale(sx, sy, sz);
  cube.render();
}

function renderSpherePrimitive(x, y, z, sx, sy, sz, color) {
  var sphere = new Sphere();
  sphere.color = color;
  sphere.matrix.translate(x, y, z);
  sphere.matrix.scale(sx, sy, sz);
  sphere.render();
}

function syncAllLabels() {
  updateLightingButton();
  updateNormalButton();
  updatePointLightButton();
  updateSpotLightButton();
  updateLightMotionButton();
}

function updateLightingButton() {
  var button = document.getElementById("toggleLightingButton");
  if (button) {
    button.textContent = g_lightingOn ? "Lighting: On" : "Lighting: Off";
  }
}

function updateNormalButton() {
  var button = document.getElementById("toggleNormalsButton");
  if (button) {
    button.textContent = g_showNormals ? "Show Normals: On" : "Show Normals: Off";
  }
}

function updatePointLightButton() {
  var button = document.getElementById("togglePointLightButton");
  if (button) {
    button.textContent = g_pointLightOn ? "Point Light: On" : "Point Light: Off";
  }
}

function updateSpotLightButton() {
  var button = document.getElementById("toggleSpotLightButton");
  if (button) {
    button.textContent = g_spotLightOn ? "Spot Light: On" : "Spot Light: Off";
  }
}

function updateLightMotionButton() {
  var button = document.getElementById("toggleLightMotionButton");
  if (button) {
    button.textContent = g_animatePointLight ? "Point Orbit: On" : "Point Orbit: Off";
  }
}
