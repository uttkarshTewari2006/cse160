// Triangle class
function Triangle(x, y, size, r, g, b, a) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.color = [r, g, b, a];
}

Triangle.prototype.render = function() {
  // Draw a simple equilateral triangle
  var size = this.size;
  
  // Three vertices of the triangle in counter-clockwise order
  var vertices = [
    this.x,                              this.y + size,           0.0,  // top
    this.x - size * Math.cos(Math.PI/6), this.y - size * Math.sin(Math.PI/6), 0.0,  // bottom left
    this.x + size * Math.cos(Math.PI/6), this.y - size * Math.sin(Math.PI/6), 0.0   // bottom right
  ];
  
  // Create a buffer for the triangle vertices
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 12, 0);
  gl.enableVertexAttribArray(a_Position);

  // Set the triangle color
  gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

  // Draw the triangle
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Clean up
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};
