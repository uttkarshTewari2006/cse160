function Model() {
  this.color = [1.0, 1.0, 1.0, 1.0];
  this.matrix = new Matrix4();
  this.vertexBuffer = null;
  this.normalBuffer = null;
  this.vertexCount = 0;
  this.isReady = false;
}

Model.prototype.loadFromOBJ = function (source, onComplete) {
  var request = new XMLHttpRequest();
  var self = this;

  request.onreadystatechange = function () {
    if (request.readyState !== 4) {
      return;
    }

    if (request.status === 200 || request.status === 0) {
      self.parseOBJ(request.responseText);
      if (onComplete) {
        onComplete(true);
      }
    } else if (onComplete) {
      onComplete(false);
    }
  };

  request.open("GET", source, true);
  request.send();
};

Model.prototype.parseOBJ = function (text) {
  var positions = [];
  var normals = [];
  var finalVertices = [];
  var finalNormals = [];
  var lines = text.split(/\r?\n/);
  var i;

  function parseIndex(token, listLength) {
    var index = Number(token);
    if (index > 0) {
      return index - 1;
    }
    return listLength + index;
  }

  function pushVertex(vertexRef) {
    var parts = vertexRef.split("/");
    var positionIndex = parseIndex(parts[0], positions.length);
    var normalIndex = parts.length > 2 && parts[2] ? parseIndex(parts[2], normals.length) : -1;
    var position = positions[positionIndex];
    var normal = normalIndex >= 0 ? normals[normalIndex] : [0, 1, 0];

    finalVertices.push(position[0], position[1], position[2]);
    finalNormals.push(normal[0], normal[1], normal[2]);
  }

  for (i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    var parts;

    if (!line || line.charAt(0) === "#") {
      continue;
    }

    parts = line.split(/\s+/);

    if (parts[0] === "v") {
      positions.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    } else if (parts[0] === "vn") {
      normals.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    } else if (parts[0] === "f") {
      var face = parts.slice(1);
      var j;

      for (j = 1; j < face.length - 1; j++) {
        pushVertex(face[0]);
        pushVertex(face[j]);
        pushVertex(face[j + 1]);
      }
    }
  }

  this.vertexCount = finalVertices.length / 3;
  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finalVertices), gl.STATIC_DRAW);

  this.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finalNormals), gl.STATIC_DRAW);

  this.isReady = true;
};

Model.prototype.render = function () {
  if (!this.isReady) {
    return;
  }

  applyShapeState(this.matrix, this.color);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
};
