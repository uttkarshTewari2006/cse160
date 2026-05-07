function Camera() {
  this.fov = 60;
  this.eye = new Vector3([0, 1.2, 12.5]);
  this.at = new Vector3([2, 1.2, 12.5]);
  this.up = new Vector3([0, 1, 0]);
  this.viewMatrix = new Matrix4();
  this.projectionMatrix = new Matrix4();
  this.speed = 0.25;
  this.turnAngle = 5;
  this.pitchAngle = 0;
  this.maxPitch = 80;

  this.updateViewMatrix();
  this.updateProjectionMatrix();
}

Camera.prototype.updateViewMatrix = function () {
  this.viewMatrix.setLookAt(
    this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
    this.at.elements[0], this.at.elements[1], this.at.elements[2],
    this.up.elements[0], this.up.elements[1], this.up.elements[2]
  );
};

Camera.prototype.updateProjectionMatrix = function () {
  this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
};

Camera.prototype.moveForward = function () {
  var f = new Vector3();
  f.set(this.at);
  f.sub(this.eye);
  f.normalize();
  f.mul(this.speed);
  this.eye.add(f);
  this.at.add(f);
  this.updateViewMatrix();
};

Camera.prototype.moveBackwards = function () {
  var b = new Vector3();
  b.set(this.eye);
  b.sub(this.at);
  b.normalize();
  b.mul(this.speed);
  this.eye.add(b);
  this.at.add(b);
  this.updateViewMatrix();
};

Camera.prototype.moveLeft = function () {
  var f = new Vector3();
  var s;
  f.set(this.at);
  f.sub(this.eye);
  s = Vector3.cross(this.up, f);
  s.normalize();
  s.mul(this.speed);
  this.eye.add(s);
  this.at.add(s);
  this.updateViewMatrix();
};

Camera.prototype.moveRight = function () {
  var f = new Vector3();
  var s;
  f.set(this.at);
  f.sub(this.eye);
  s = Vector3.cross(f, this.up);
  s.normalize();
  s.mul(this.speed);
  this.eye.add(s);
  this.at.add(s);
  this.updateViewMatrix();
};

Camera.prototype.moveUp = function () {
  var offset = new Vector3([0, this.speed, 0]);
  this.eye.add(offset);
  this.at.add(offset);
  this.updateViewMatrix();
};

Camera.prototype.moveDown = function () {
  var offset = new Vector3([0, -this.speed, 0]);
  this.eye.add(offset);
  this.at.add(offset);
  this.updateViewMatrix();
};

Camera.prototype.panBy = function (angle) {
  var f = new Vector3();
  var rotationMatrix = new Matrix4();
  var fPrime;
  f.set(this.at);
  f.sub(this.eye);
  rotationMatrix.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
  fPrime = rotationMatrix.multiplyVector3(f);
  this.at.set(this.eye);
  this.at.add(fPrime);
  this.updateViewMatrix();
};

Camera.prototype.panLeft = function () {
  this.panBy(this.turnAngle);
};

Camera.prototype.panRight = function () {
  this.panBy(-this.turnAngle);
};

Camera.prototype.pitchBy = function (angle) {
  var nextPitch = this.pitchAngle + angle;
  var f = new Vector3();
  var side;
  var rotationMatrix = new Matrix4();
  var fPrime;

  if (nextPitch > this.maxPitch) {
    angle = this.maxPitch - this.pitchAngle;
    nextPitch = this.maxPitch;
  } else if (nextPitch < -this.maxPitch) {
    angle = -this.maxPitch - this.pitchAngle;
    nextPitch = -this.maxPitch;
  }

  if (angle === 0) {
    return;
  }

  f.set(this.at);
  f.sub(this.eye);
  side = Vector3.cross(f, this.up);
  side.normalize();
  rotationMatrix.setRotate(angle, side.elements[0], side.elements[1], side.elements[2]);
  fPrime = rotationMatrix.multiplyVector3(f);
  this.at.set(this.eye);
  this.at.add(fPrime);
  this.pitchAngle = nextPitch;
  this.updateViewMatrix();
};
