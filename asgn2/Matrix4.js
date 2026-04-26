function Matrix4(source) {
  if (source && source.elements) {
    this.elements = new Float32Array(source.elements);
  } else {
    this.elements = new Float32Array(16);
    this.setIdentity();
  }
}

Matrix4.prototype.setIdentity = function () {
  var e = this.elements;
  e[0] = 1; e[4] = 0; e[8] = 0; e[12] = 0;
  e[1] = 0; e[5] = 1; e[9] = 0; e[13] = 0;
  e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
  e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
  return this;
};

Matrix4.prototype.set = function (source) {
  this.elements.set(source.elements);
  return this;
};

Matrix4.prototype.clone = function () {
  return new Matrix4(this);
};

Matrix4.prototype.multiply = function (other) {
  var a = this.elements;
  var b = other.elements;
  var result = new Float32Array(16);
  var row;
  var col;
  var i;

  for (col = 0; col < 4; col++) {
    for (row = 0; row < 4; row++) {
      i = row + col * 4;
      result[i] =
        a[row] * b[col * 4] +
        a[row + 4] * b[col * 4 + 1] +
        a[row + 8] * b[col * 4 + 2] +
        a[row + 12] * b[col * 4 + 3];
    }
  }

  this.elements = result;
  return this;
};

Matrix4.prototype.translate = function (x, y, z) {
  var t = new Matrix4();
  t.elements[12] = x;
  t.elements[13] = y;
  t.elements[14] = z;
  return this.multiply(t);
};

Matrix4.prototype.scale = function (x, y, z) {
  var s = new Matrix4();
  s.elements[0] = x;
  s.elements[5] = y;
  s.elements[10] = z;
  return this.multiply(s);
};

Matrix4.prototype.rotate = function (angle, x, y, z) {
  var length = Math.sqrt(x * x + y * y + z * z);
  var r = new Matrix4();
  var e = r.elements;
  var s;
  var c;
  var t;

  if (!length) {
    return this;
  }

  x /= length;
  y /= length;
  z /= length;

  s = Math.sin((Math.PI * angle) / 180);
  c = Math.cos((Math.PI * angle) / 180);
  t = 1 - c;

  e[0] = x * x * t + c;
  e[1] = y * x * t + z * s;
  e[2] = z * x * t - y * s;
  e[3] = 0;

  e[4] = x * y * t - z * s;
  e[5] = y * y * t + c;
  e[6] = z * y * t + x * s;
  e[7] = 0;

  e[8] = x * z * t + y * s;
  e[9] = y * z * t - x * s;
  e[10] = z * z * t + c;
  e[11] = 0;

  e[12] = 0;
  e[13] = 0;
  e[14] = 0;
  e[15] = 1;

  return this.multiply(r);
};

Matrix4.prototype.setPerspective = function (fovy, aspect, near, far) {
  var e = this.elements;
  var f = 1 / Math.tan((Math.PI * fovy) / 360);
  var nf = 1 / (near - far);

  e[0] = f / aspect;
  e[1] = 0;
  e[2] = 0;
  e[3] = 0;

  e[4] = 0;
  e[5] = f;
  e[6] = 0;
  e[7] = 0;

  e[8] = 0;
  e[9] = 0;
  e[10] = (far + near) * nf;
  e[11] = -1;

  e[12] = 0;
  e[13] = 0;
  e[14] = (2 * far * near) * nf;
  e[15] = 0;

  return this;
};
