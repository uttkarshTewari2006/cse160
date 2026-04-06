// DrawTriangle.js (c) 2012 matsuda

function areaTriangle(v1, v2) {
  // Calculate cross product
  var cross = Vector3.cross(v1, v2);
  
  // Calculate magnitude of cross product (area of parallelogram)
  var parallelogramArea = cross.magnitude();
  
  // Area of triangle is half the area of the parallelogram
  var triangleArea = parallelogramArea / 2;
  
  return triangleArea;
}

function handleDrawEvent() {
  // Get input values for v1
  var xValue = parseFloat(document.getElementById('xInput').value);
  var yValue = parseFloat(document.getElementById('yInput').value);

  // Get input values for v2
  var x2Value = parseFloat(document.getElementById('x2Input').value);
  var y2Value = parseFloat(document.getElementById('y2Input').value);

  // Create v1 and v2 from input values
  var v1 = new Vector3([xValue, yValue, 0]);
  var v2 = new Vector3([x2Value, y2Value, 0]);

  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Clear the canvas by filling it with black
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, 400, 400);

  // Draw the vector v1 in red
  drawVector(v1, "red");

  // Draw the vector v2 in blue
  drawVector(v2, "blue");
}

function angleBetween(v1, v2) {
  // Calculate dot product
  var dot = Vector3.dot(v1, v2);
  
  // Calculate magnitudes
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  
  // Avoid division by zero
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }
  
  // Calculate cosine of angle
  var cosAngle = dot / (mag1 * mag2);
  
  // Clamp to [-1, 1] to avoid numerical errors with acos
  cosAngle = Math.max(-1, Math.min(1, cosAngle));
  
  // Calculate angle in radians
  var angleRad = Math.acos(cosAngle);
  
  // Convert to degrees
  var angleDeg = (angleRad * 180) / Math.PI;
  
  return angleDeg;
}

function handleDrawOperationEvent() {
  // Get input values for v1
  var xValue = parseFloat(document.getElementById('xInput').value);
  var yValue = parseFloat(document.getElementById('yInput').value);

  // Get input values for v2
  var x2Value = parseFloat(document.getElementById('x2Input').value);
  var y2Value = parseFloat(document.getElementById('y2Input').value);

  // Get scalar value
  var scalarValue = parseFloat(document.getElementById('scalarInput').value);

  // Get operation
  var operation = document.getElementById('operationSelect').value;

  // Create v1 and v2
  var v1 = new Vector3([xValue, yValue, 0]);
  var v2 = new Vector3([x2Value, y2Value, 0]);

  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Clear the canvas by filling it with black
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, 400, 400);

  // Draw v1 in red
  drawVector(v1, "red");

  // Draw v2 in blue
  drawVector(v2, "blue");

  // Perform operation and draw result in green
  if (operation === "add") {
    var v3 = new Vector3([xValue, yValue, 0]);
    v3.add(v2);
    drawVector(v3, "green");
  } else if (operation === "sub") {
    var v3 = new Vector3([xValue, yValue, 0]);
    v3.sub(v2);
    drawVector(v3, "green");
  } else if (operation === "mul") {
    var v3 = new Vector3([xValue, yValue, 0]);
    v3.mul(scalarValue);
    var v4 = new Vector3([x2Value, y2Value, 0]);
    v4.mul(scalarValue);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (operation === "div") {
    var v3 = new Vector3([xValue, yValue, 0]);
    v3.div(scalarValue);
    var v4 = new Vector3([x2Value, y2Value, 0]);
    v4.div(scalarValue);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (operation === "magnitude") {
    var mag1 = v1.magnitude();
    var mag2 = v2.magnitude();
    console.log("Magnitude of v1: " + mag1);
    console.log("Magnitude of v2: " + mag2);
  } else if (operation === "normalize") {
    var v1Norm = new Vector3([xValue, yValue, 0]);
    var v2Norm = new Vector3([x2Value, y2Value, 0]);
    v1Norm.normalize();
    v2Norm.normalize();
    drawVector(v1Norm, "green");
    drawVector(v2Norm, "green");
  } else if (operation === "angle") {
    var angle = angleBetween(v1, v2);
    console.log("Angle between v1 and v2: " + angle.toFixed(2) + " degrees");
  } else if (operation === "area") {
    var area = areaTriangle(v1, v2);
    console.log("Area of triangle formed by v1 and v2: " + area.toFixed(2));
  }
}

function drawVector(v, color) {
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Set the color for drawing
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Draw the vector using lineTo, scaled by 20 for visualization
  ctx.beginPath();
  ctx.moveTo(200, 200);  // Start from center of 400x400 canvas
  ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20);
  ctx.stroke();
}

function main() { 
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Fill canvas with black
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, 400, 400);
}
