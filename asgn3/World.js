var VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "attribute vec2 a_UV;\n" +
  "uniform mat4 u_ModelMatrix;\n" +
  "uniform mat4 u_ViewMatrix;\n" +
  "uniform mat4 u_ProjectionMatrix;\n" +
  "varying vec2 v_UV;\n" +
  "void main() {\n" +
  "  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n" +
  "  v_UV = a_UV;\n" +
  "}\n";

var FSHADER_SOURCE =
  "precision mediump float;\n" +
  "uniform vec4 u_FragColor;\n" +
  "uniform float u_texColorWeight;\n" +
  "uniform sampler2D u_Sampler0;\n" +
  "uniform sampler2D u_Sampler1;\n" +
  "uniform sampler2D u_Sampler2;\n" +
  "uniform sampler2D u_Sampler3;\n" +
  "uniform int u_TextureIndex;\n" +
  "varying vec2 v_UV;\n" +
  "void main() {\n" +
  "  vec4 texColor = texture2D(u_Sampler0, v_UV);\n" +
  "  if (u_TextureIndex == 1) {\n" +
  "    texColor = texture2D(u_Sampler1, v_UV);\n" +
  "  } else if (u_TextureIndex == 2) {\n" +
  "    texColor = texture2D(u_Sampler2, v_UV);\n" +
  "  } else if (u_TextureIndex == 3) {\n" +
  "    texColor = texture2D(u_Sampler3, v_UV);\n" +
  "  }\n" +
  "  gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);\n" +
  "}\n";

var gl;
var canvas;
var a_Position;
var a_UV;
var u_ModelMatrix;
var u_ViewMatrix;
var u_ProjectionMatrix;
var u_FragColor;
var u_texColorWeight;
var u_Sampler0;
var u_Sampler1;
var u_Sampler2;
var u_Sampler3;
var u_TextureIndex;

var g_cubeBuffer = null;
var g_cubeVertexCount = 36;
var g_worldObjects = [];
var g_wallBuffers = [null, null, null, null];
var g_wallVertexCounts = [0, 0, 0, 0];
var g_terrainBuffer = null;
var g_terrainVertexCount = 0;
var g_textureReady = false;
var g_textureLoadCount = 0;
var g_requiredTextureCount = 4;
var g_camera;
var g_worldSize = 32;
var g_worldOffset = g_worldSize / 2 - 0.5;
var g_isDragging = false;
var g_lastMouseX = 0;
var g_lastMouseY = 0;
var g_inputDebug;
var g_goalStatus;
var g_identityMatrix = new Matrix4();
var g_storyComplete = false;
var g_goalPosition = { x: 10.5, y: 1.2, z: -10.5 };
var g_worldMap = [
  "44444444444444444444444444444444",
  "40000000000000000000000000000004",
  "40222000111000330000002220000004",
  "40002000101000300000002020000004",
  "40002000101000300000002020000004",
  "40002222101000302222002020000004",
  "40000000101000002000002020000004",
  "40111100101111002033332020000004",
  "40000100100001002030002020000004",
  "40000100122221002030002022222004",
  "40000100000000002030000000002004",
  "40333111111110002030111111102004",
  "40003000000110000030000000102004",
  "40003022220112222030222220102004",
  "40003020000110002030000020102004",
  "40003020333110002033333020102004",
  "40003020000000000000003020102004",
  "40003022222222222222003020102004",
  "40000000000000000002003020102004",
  "40222222111111111002003020102004",
  "40000002100000001002000020102004",
  "40111102103333301002222220102004",
  "40000102103000301000000000102004",
  "40000102103000301111111110102004",
  "40000102103000300000000000102004",
  "40000102103333333333333330102004",
  "40000102000000000000000000102004",
  "40222102222222222222222222102004",
  "40000000000000000000000000000004",
  "40003333333332222222333333330004",
  "40000000000000000000000000000004",
  "44444444444444444444444444444444"
].map(function (row) {
  return row.split("").map(function (value) {
    return Number(value);
  });
});

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initCubeBuffer();
  g_camera = new Camera();
  g_inputDebug = document.getElementById("inputDebug");
  g_goalStatus = document.getElementById("goalStatus");

  window.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("keydown", handleKeyDown, true);
  canvas.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("pointerdown", focusCanvasForControls, true);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", handleMouseUp);

  bindControlButtons();
  canvas.focus();
  buildWorld();

  gl.clearColor(0.80, 0.90, 1.00, 1.0);
  initTextures();
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = getWebGLContext(canvas);

  if (!gl) {
    setStatus("Failed to get the rendering context for WebGL.");
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    setStatus("Failed to initialize shaders.");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_texColorWeight = gl.getUniformLocation(gl.program, "u_texColorWeight");
  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");
  u_Sampler3 = gl.getUniformLocation(gl.program, "u_Sampler3");
  u_TextureIndex = gl.getUniformLocation(gl.program, "u_TextureIndex");
}

function initCubeBuffer() {
  var vertices = new Float32Array([
    -0.5, -0.5,  0.5,  0.0, 0.0,   0.5, -0.5,  0.5,  1.0, 0.0,   0.5,  0.5,  0.5,  1.0, 1.0,
    -0.5, -0.5,  0.5,  0.0, 0.0,   0.5,  0.5,  0.5,  1.0, 1.0,  -0.5,  0.5,  0.5,  0.0, 1.0,

    -0.5, -0.5, -0.5,  1.0, 0.0,  -0.5,  0.5, -0.5,  1.0, 1.0,   0.5,  0.5, -0.5,  0.0, 1.0,
    -0.5, -0.5, -0.5,  1.0, 0.0,   0.5,  0.5, -0.5,  0.0, 1.0,   0.5, -0.5, -0.5,  0.0, 0.0,

    -0.5,  0.5, -0.5,  0.0, 0.0,  -0.5,  0.5,  0.5,  0.0, 1.0,   0.5,  0.5,  0.5,  1.0, 1.0,
    -0.5,  0.5, -0.5,  0.0, 0.0,   0.5,  0.5,  0.5,  1.0, 1.0,   0.5,  0.5, -0.5,  1.0, 0.0,

    -0.5, -0.5, -0.5,  0.0, 1.0,   0.5, -0.5, -0.5,  1.0, 1.0,   0.5, -0.5,  0.5,  1.0, 0.0,
    -0.5, -0.5, -0.5,  0.0, 1.0,   0.5, -0.5,  0.5,  1.0, 0.0,  -0.5, -0.5,  0.5,  0.0, 0.0,

     0.5, -0.5, -0.5,  0.0, 0.0,   0.5,  0.5, -0.5,  1.0, 0.0,   0.5,  0.5,  0.5,  1.0, 1.0,
     0.5, -0.5, -0.5,  0.0, 0.0,   0.5,  0.5,  0.5,  1.0, 1.0,   0.5, -0.5,  0.5,  0.0, 1.0,

    -0.5, -0.5, -0.5,  1.0, 0.0,  -0.5, -0.5,  0.5,  0.0, 0.0,  -0.5,  0.5,  0.5,  0.0, 1.0,
    -0.5, -0.5, -0.5,  1.0, 0.0,  -0.5,  0.5,  0.5,  0.0, 1.0,  -0.5,  0.5, -0.5,  1.0, 1.0
  ]);

  g_cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function initTextures() {
  loadTextureSource("./textures/brick.svg", 0, u_Sampler0);
  loadTextureSource("./textures/grass.svg", 1, u_Sampler1);
  loadTextureSource("./textures/stone.svg", 2, u_Sampler2);
  loadTextureSource("./textures/gold.svg", 3, u_Sampler3);
}

function loadTextureSource(source, unit, samplerUniform) {
  var image = new Image();

  image.onload = function () {
    loadTexture(image, unit, samplerUniform);
    g_textureLoadCount += 1;
    setStatus("Loaded texture " + g_textureLoadCount + " / " + g_requiredTextureCount + ".");

    if (g_textureLoadCount === g_requiredTextureCount) {
      g_textureReady = true;
      setStatus("Textures loaded. Find the lost sheep, explore the terrain, and use C / X to edit blocks.");
      renderScene();
    }
  };

  image.onerror = function () {
    setStatus("A texture failed to load. Make sure you opened the page through a local server.");
  };

  image.src = source;
}

function loadTexture(image, unit, samplerUniform) {
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.uniform1i(samplerUniform, unit);
}

function buildWorld() {
  g_worldObjects = [];
  g_storyComplete = false;
  addSky();
  addPanda();
  addTerrainDecor();
  buildTerrainMesh();
  buildWallMesh();
  setStatus("World created. Find the lost sheep. Use C and X to add or remove blocks.");
}

function addSky() {
  var sky = new Cube();
  sky.color = [0.53, 0.78, 0.97, 1.0];
  sky.textureWeight = 0.0;
  sky.textureIndex = 1;
  sky.matrix.translate(0, 0, 0);
  sky.matrix.scale(90, 90, 90);
  g_worldObjects.push(sky);
}

function addPanda() {
  addColoredCube(10.5, 0.95, -10.2, 0.9, 0.7, 0.7, [0.96, 0.96, 0.96, 1.0]);
  addColoredCube(11.15, 1.15, -10.2, 0.45, 0.45, 0.45, [0.98, 0.98, 0.98, 1.0]);
  addColoredCube(11.32, 1.4, -10.36, 0.12, 0.12, 0.12, [0.12, 0.12, 0.12, 1.0]);
  addColoredCube(11.32, 1.4, -10.04, 0.12, 0.12, 0.12, [0.12, 0.12, 0.12, 1.0]);
  addColoredCube(11.35, 1.15, -10.08, 0.08, 0.12, 0.10, [0.12, 0.12, 0.12, 1.0]);
  addColoredCube(10.15, 0.45, -9.95, 0.14, 0.35, 0.14, [0.12, 0.12, 0.12, 1.0]);
  addColoredCube(10.15, 0.45, -10.45, 0.14, 0.35, 0.14, [0.12, 0.12, 0.12, 1.0]);
  addColoredCube(10.78, 0.45, -9.95, 0.14, 0.35, 0.14, [0.12, 0.12, 0.12, 1.0]);
  addColoredCube(10.78, 0.45, -10.45, 0.14, 0.35, 0.14, [0.12, 0.12, 0.12, 1.0]);
}

function addTerrainDecor() {
  addTexturedCube(-8, 0.2, 7, 1.2, 0.8, 1.2, [0.75, 0.77, 0.81, 1.0], 1.0, 2);
  addTexturedCube(-7.2, 0.35, 6.2, 0.6, 1.1, 0.6, [0.68, 0.72, 0.76, 1.0], 1.0, 2);
}

function addTexturedCube(x, y, z, sx, sy, sz, color, textureWeight, textureIndex) {
  var cube = new Cube();
  cube.color = color;
  cube.textureWeight = textureWeight;
  cube.textureIndex = textureIndex;
  cube.matrix.translate(x, y, z);
  cube.matrix.scale(sx, sy, sz);
  g_worldObjects.push(cube);
}

function addColoredCube(x, y, z, sx, sy, sz, color) {
  addTexturedCube(x, y, z, sx, sy, sz, color, 0.0, 0);
}

function buildWallMesh() {
  var verticesByTexture = [[], [], [], []];
  var row;
  var col;
  var level;
  var height;
  var worldX;
  var worldZ;
  var textureIndex;

  for (row = 0; row < g_worldMap.length; row++) {
    for (col = 0; col < g_worldMap[row].length; col++) {
      height = g_worldMap[row][col];

      for (level = 0; level < height; level++) {
        worldX = col - g_worldOffset;
        worldZ = row - g_worldOffset;
        textureIndex = chooseWallTexture(row, col, height, level);
        appendCubeVertices(verticesByTexture[textureIndex], worldX, level, worldZ, 1, 1, 1);
      }
    }
  }

  g_wallBuffers = [null, null, null, null];
  g_wallVertexCounts = [0, 0, 0, 0];
  createBufferForTexture(verticesByTexture[0], 0);
  createBufferForTexture(verticesByTexture[2], 2);
}

function createBufferForTexture(vertices, textureIndex) {
  if (!vertices.length) {
    return;
  }

  g_wallVertexCounts[textureIndex] = vertices.length / 5;
  g_wallBuffers[textureIndex] = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_wallBuffers[textureIndex]);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function buildTerrainMesh() {
  var vertices = [];
  var row;
  var col;
  var heightLevel;
  var heightScale;
  var centerY;
  var worldX;
  var worldZ;

  for (row = 0; row < g_worldSize; row++) {
    for (col = 0; col < g_worldSize; col++) {
      heightLevel = getTerrainHeight(row, col);
      heightScale = 0.3 + heightLevel * 0.12;
      centerY = -0.8 + heightScale * 0.5;
      worldX = col - g_worldOffset;
      worldZ = row - g_worldOffset;
      appendCubeVertices(vertices, worldX, centerY, worldZ, 1, heightScale, 1);
    }
  }

  g_terrainVertexCount = vertices.length / 5;
  g_terrainBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_terrainBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function renderScene() {
  var i;

  if (!g_textureReady) {
    return;
  }

  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (i = 0; i < g_worldObjects.length; i++) {
    g_worldObjects[i].render();
  }

  drawStaticMesh(g_terrainBuffer, g_terrainVertexCount, [0.46, 0.66, 0.36, 1.0], 1.0, 1);
  drawStaticMesh(g_wallBuffers[0], g_wallVertexCounts[0], [0.58, 0.44, 0.30, 1.0], 1.0, 0);
  drawStaticMesh(g_wallBuffers[2], g_wallVertexCounts[2], [0.66, 0.68, 0.72, 1.0], 1.0, 2);
}

function drawStaticMesh(buffer, vertexCount, color, textureWeight, textureIndex) {
  if (!buffer || vertexCount === 0) {
    return;
  }

  gl.uniformMatrix4fv(u_ModelMatrix, false, g_identityMatrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.uniform1f(u_texColorWeight, textureWeight);
  gl.uniform1i(u_TextureIndex, textureIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
  gl.enableVertexAttribArray(a_UV);
  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}

function handleKeyDown(ev) {
  var handled;

  if (!g_camera) {
    return;
  }

  handled = handleControlInput(ev.key, ev.code);
  if (!handled) {
    return;
  }

  if (ev.preventDefault) {
    ev.preventDefault();
  }
  if (ev.stopPropagation) {
    ev.stopPropagation();
  }
}

function handleMouseDown(ev) {
  canvas.focus();
  g_isDragging = true;
  g_lastMouseX = ev.clientX;
  g_lastMouseY = ev.clientY;
}

function handleMouseMove(ev) {
  var deltaX;
  var deltaY;
  var angleStep;
  var pitchStep;

  if (!g_isDragging || !g_camera) {
    return;
  }

  deltaX = ev.clientX - g_lastMouseX;
  deltaY = ev.clientY - g_lastMouseY;
  g_lastMouseX = ev.clientX;
  g_lastMouseY = ev.clientY;

  if (deltaX === 0 && deltaY === 0) {
    return;
  }

  angleStep = deltaX * 0.35;
  pitchStep = deltaY * 0.2;
  g_camera.panBy(-angleStep);
  g_camera.pitchBy(-pitchStep);
  checkStoryProgress();
  renderScene();
}

function handleMouseUp() {
  g_isDragging = false;
}

function focusCanvasForControls() {
  canvas.focus();
}

function bindControlButtons() {
  document.getElementById("forwardButton").addEventListener("click", function () {
    handleControlInput("w", "KeyW");
  });
  document.getElementById("leftButton").addEventListener("click", function () {
    handleControlInput("a", "KeyA");
  });
  document.getElementById("backButton").addEventListener("click", function () {
    handleControlInput("s", "KeyS");
  });
  document.getElementById("rightButton").addEventListener("click", function () {
    handleControlInput("d", "KeyD");
  });
  document.getElementById("turnLeftButton").addEventListener("click", function () {
    handleControlInput("q", "KeyQ");
  });
  document.getElementById("turnRightButton").addEventListener("click", function () {
    handleControlInput("e", "KeyE");
  });
  document.getElementById("upButton").addEventListener("click", function () {
    handleControlInput("r", "KeyR");
  });
  document.getElementById("downButton").addEventListener("click", function () {
    handleControlInput("f", "KeyF");
  });
  document.getElementById("lookUpButton").addEventListener("click", function () {
    handleControlInput("lookUp", "LookUp");
  });
  document.getElementById("lookDownButton").addEventListener("click", function () {
    handleControlInput("lookDown", "LookDown");
  });
  document.getElementById("addBlockButton").addEventListener("click", function () {
    handleControlInput("c", "KeyC");
  });
  document.getElementById("removeBlockButton").addEventListener("click", function () {
    handleControlInput("x", "KeyX");
  });
}

function handleControlInput(key, code) {
  var normalizedKey = key ? key.toLowerCase() : "";
  var label = code || normalizedKey;

  switch (code || normalizedKey) {
    case "KeyW":
    case "w":
      g_camera.moveForward();
      break;
    case "KeyA":
    case "a":
      g_camera.moveLeft();
      break;
    case "KeyS":
    case "s":
      g_camera.moveBackwards();
      break;
    case "KeyD":
    case "d":
      g_camera.moveRight();
      break;
    case "KeyQ":
    case "q":
      g_camera.panLeft();
      break;
    case "KeyE":
    case "e":
      g_camera.panRight();
      break;
    case "KeyR":
    case "r":
      g_camera.moveUp();
      break;
    case "KeyF":
    case "f":
      g_camera.moveDown();
      break;
    case "ArrowUp":
    case "LookUp":
      g_camera.pitchBy(5);
      break;
    case "ArrowDown":
    case "LookDown":
      g_camera.pitchBy(-5);
      break;
    case "KeyC":
    case "c":
      editBlockInFront(1);
      break;
    case "KeyX":
    case "x":
      editBlockInFront(-1);
      break;
    default:
      updateInputDebug("Ignored key: " + (code || key || "unknown"));
      return false;
  }

  updateInputDebug("Handled input: " + label);
  checkStoryProgress();
  renderScene();
  return true;
}

function editBlockInFront(delta) {
  var forward = new Vector3();
  var targetX;
  var targetZ;
  var row;
  var col;
  var nextHeight;

  forward.set(g_camera.at);
  forward.sub(g_camera.eye);
  forward.elements[1] = 0;
  forward.normalize();

  targetX = g_camera.eye.elements[0] + forward.elements[0] * 1.5;
  targetZ = g_camera.eye.elements[2] + forward.elements[2] * 1.5;
  col = Math.round(targetX + g_worldOffset);
  row = Math.round(targetZ + g_worldOffset);

  if (row < 0 || row >= g_worldSize || col < 0 || col >= g_worldSize) {
    setStatus("That block is outside the world bounds.");
    return;
  }

  nextHeight = g_worldMap[row][col] + delta;
  if (nextHeight < 0 || nextHeight > 4) {
    setStatus("Block height stays within 0 to 4.");
    return;
  }

  g_worldMap[row][col] = nextHeight;
  buildWallMesh();
  setStatus("Edited block at row " + row + ", col " + col + ". New height: " + nextHeight + ".");
}

function chooseWallTexture(row, col, height, level) {
  if (height >= 4 || (row + col + level) % 9 === 0) {
    return 2;
  }

  return 0;
}

function getTerrainHeight(row, col) {
  var centeredRow = row - g_worldSize / 2;
  var centeredCol = col - g_worldSize / 2;
  var radial = Math.sqrt(centeredRow * centeredRow + centeredCol * centeredCol);
  var wave = Math.sin(row * 0.38) + Math.cos(col * 0.33);
  var level = Math.round(Math.max(0, 1.8 - radial / 10 + wave * 0.6));

  if (row >= 11 && row <= 18 && col >= 12 && col <= 20) {
    level = 0;
  }

  if (row >= 20 && row <= 27 && col >= 22 && col <= 29) {
    level = Math.max(level, 1);
  }

  if (level > 3) {
    return 3;
  }

  return level;
}

function checkStoryProgress() {
  var dx = g_camera.eye.elements[0] - g_goalPosition.x;
  var dy = g_camera.eye.elements[1] - g_goalPosition.y;
  var dz = g_camera.eye.elements[2] - g_goalPosition.z;
  var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (!g_storyComplete && distance < 2.2) {
    g_storyComplete = true;
    setStatus("You found the lost sheep. Assignment world objective complete.");
    updateGoalStatus("found sheep");
  }
}

function appendCubeVertices(vertices, centerX, centerY, centerZ, scaleX, scaleY, scaleZ) {
  appendFace(vertices,
    centerX, centerY, centerZ, scaleX, scaleY, scaleZ,
    [-0.5, -0.5,  0.5, 0.0, 0.0], [ 0.5, -0.5,  0.5, 1.0, 0.0], [ 0.5,  0.5,  0.5, 1.0, 1.0],
    [-0.5, -0.5,  0.5, 0.0, 0.0], [ 0.5,  0.5,  0.5, 1.0, 1.0], [-0.5,  0.5,  0.5, 0.0, 1.0]
  );
  appendFace(vertices,
    centerX, centerY, centerZ, scaleX, scaleY, scaleZ,
    [-0.5, -0.5, -0.5, 1.0, 0.0], [-0.5,  0.5, -0.5, 1.0, 1.0], [ 0.5,  0.5, -0.5, 0.0, 1.0],
    [-0.5, -0.5, -0.5, 1.0, 0.0], [ 0.5,  0.5, -0.5, 0.0, 1.0], [ 0.5, -0.5, -0.5, 0.0, 0.0]
  );
  appendFace(vertices,
    centerX, centerY, centerZ, scaleX, scaleY, scaleZ,
    [-0.5,  0.5, -0.5, 0.0, 0.0], [-0.5,  0.5,  0.5, 0.0, 1.0], [ 0.5,  0.5,  0.5, 1.0, 1.0],
    [-0.5,  0.5, -0.5, 0.0, 0.0], [ 0.5,  0.5,  0.5, 1.0, 1.0], [ 0.5,  0.5, -0.5, 1.0, 0.0]
  );
  appendFace(vertices,
    centerX, centerY, centerZ, scaleX, scaleY, scaleZ,
    [-0.5, -0.5, -0.5, 0.0, 1.0], [ 0.5, -0.5, -0.5, 1.0, 1.0], [ 0.5, -0.5,  0.5, 1.0, 0.0],
    [-0.5, -0.5, -0.5, 0.0, 1.0], [ 0.5, -0.5,  0.5, 1.0, 0.0], [-0.5, -0.5,  0.5, 0.0, 0.0]
  );
  appendFace(vertices,
    centerX, centerY, centerZ, scaleX, scaleY, scaleZ,
    [ 0.5, -0.5, -0.5, 0.0, 0.0], [ 0.5,  0.5, -0.5, 1.0, 0.0], [ 0.5,  0.5,  0.5, 1.0, 1.0],
    [ 0.5, -0.5, -0.5, 0.0, 0.0], [ 0.5,  0.5,  0.5, 1.0, 1.0], [ 0.5, -0.5,  0.5, 0.0, 1.0]
  );
  appendFace(vertices,
    centerX, centerY, centerZ, scaleX, scaleY, scaleZ,
    [-0.5, -0.5, -0.5, 1.0, 0.0], [-0.5, -0.5,  0.5, 0.0, 0.0], [-0.5,  0.5,  0.5, 0.0, 1.0],
    [-0.5, -0.5, -0.5, 1.0, 0.0], [-0.5,  0.5,  0.5, 0.0, 1.0], [-0.5,  0.5, -0.5, 1.0, 1.0]
  );
}

function appendFace(vertices, centerX, centerY, centerZ, scaleX, scaleY, scaleZ, v1, v2, v3, v4, v5, v6) {
  pushVertex(vertices, centerX, centerY, centerZ, scaleX, scaleY, scaleZ, v1);
  pushVertex(vertices, centerX, centerY, centerZ, scaleX, scaleY, scaleZ, v2);
  pushVertex(vertices, centerX, centerY, centerZ, scaleX, scaleY, scaleZ, v3);
  pushVertex(vertices, centerX, centerY, centerZ, scaleX, scaleY, scaleZ, v4);
  pushVertex(vertices, centerX, centerY, centerZ, scaleX, scaleY, scaleZ, v5);
  pushVertex(vertices, centerX, centerY, centerZ, scaleX, scaleY, scaleZ, v6);
}

function pushVertex(vertices, centerX, centerY, centerZ, scaleX, scaleY, scaleZ, vertex) {
  vertices.push(
    centerX + vertex[0] * scaleX,
    centerY + vertex[1] * scaleY,
    centerZ + vertex[2] * scaleZ,
    vertex[3],
    vertex[4]
  );
}

function updateInputDebug(message) {
  if (g_inputDebug) {
    g_inputDebug.textContent = message;
  }
}

function updateGoalStatus(message) {
  if (g_goalStatus) {
    g_goalStatus.textContent = message;
  }
}

function setStatus(message) {
  var status = document.getElementById("status");
  if (status) {
    status.textContent = message;
  }
}
