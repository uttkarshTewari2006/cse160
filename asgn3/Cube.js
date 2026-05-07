function Cube() {
  this.type = "cube";
  this.color = [1.0, 1.0, 1.0, 1.0];
  this.textureWeight = 0.0;
  this.textureIndex = 0;
  this.matrix = new Matrix4();
}

Cube.prototype.render = function () {
  gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
  gl.uniform1f(u_texColorWeight, this.textureWeight);
  gl.uniform1i(u_TextureIndex, this.textureIndex);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, g_cubeVertexCount);
};
