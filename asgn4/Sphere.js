function Sphere() {
  this.type = "sphere";
  this.color = [1.0, 1.0, 1.0, 1.0];
  this.matrix = new Matrix4();
}

Sphere.prototype.render = function () {
  applyShapeState(this.matrix, this.color);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereNormalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, g_sphereVertexCount);
};
