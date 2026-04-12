// Circle class
function Circle(x, y, segments, size, r, g, b, a) {
  this.x = x;
  this.y = y;
  this.segments = segments;
  this.radius = size;
  this.color = [r, g, b, a];
}

Circle.prototype.render = function() {
  var vertices = [];
  
  // Center point
  vertices.push(this.x, this.y, 0.0);
  
  // Generate vertices around the circle
  var angleStep = (Math.PI * 2) / this.segments;
  for (var i = 0; i <= this.segments; i++) {
    var angle = i * angleStep;
    var vx = this.x + this.radius * Math.cos(angle);
    var vy = this.y + this.radius * Math.sin(angle);
    vertices.push(vx, vy, 0.0);
  }
  
  // Create a buffer for the circle vertices
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 12, 0);
  gl.enableVertexAttribArray(a_Position);

  // Set the circle color
  gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

  // Draw the circle as a triangle fan
  gl.drawArrays(gl.TRIANGLE_FAN, 0, this.segments + 2);

  // Clean up
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};
