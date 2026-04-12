// Point class - draws a square
function Point(x, y, size, r, g, b, a) {
  this.x = x;
  this.y = y;
  this.color = [r, g, b, a];
  this.size = size;
}

Point.prototype.render = function() {
  // Draw a square centered at (x, y)
  var size = this.size;
  
  // Four vertices of the square in counter-clockwise order
  var vertices = [
    this.x - size, this.y + size, 0.0,  // top-left
    this.x - size, this.y - size, 0.0,  // bottom-left
    this.x + size, this.y + size, 0.0,  // top-right
    this.x + size, this.y - size, 0.0   // bottom-right
  ];
  
  // Create a buffer for the square vertices
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 12, 0);
  gl.enableVertexAttribArray(a_Position);

  // Set the square color
  gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

  // Draw the square as a triangle strip
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Clean up
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};
