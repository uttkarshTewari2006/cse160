// HelloPoint1.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  "void main() {\n" +
  "  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);\n" + // Set the vertex coordinates of the point
  "  gl_PointSize = 10.0;\n" + // Set the point size
  "}\n";

// Fragment shader program
var FSHADER_SOURCE =
  "void main() {\n" +
  "  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n" + // Set the point color
  "}\n";

// Global variables
var gl;

function main() {
  gl = setupWebGL();
  if (!gl) return;

  connectVariablesToGLSL();
  renderAllShapes();
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

  // Specify the color for clearing <canvas>
  glContext.clearColor(0.0, 0.0, 0.0, 1.0);

  return glContext;
}

function connectVariablesToGLSL() {
  // All variables are built into the shaders, no attributes or uniforms to connect
}

function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw a point
  gl.drawArrays(gl.POINTS, 0, 1);
}
