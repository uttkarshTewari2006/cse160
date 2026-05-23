function Camera() {
  this.fov = 60;
  this.eye = new Vector3([0, 2.2, 6]);
  this.at = new Vector3([0, 1.2, 0]);
  this.up = new Vector3([0, 1, 0]);
  this.viewMatrix = new Matrix4();
  this.projectionMatrix = new Matrix4();
  this.speed = 0.3;
  this.turnAngle = 5;

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
  this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 100);
};

Camera.prototype.moveForward = function () {
  var forward = new Vector3();
  forward.set(this.at);
  forward.sub(this.eye);
  forward.normalize();
  forward.mul(this.speed);
  this.eye.add(forward);
  this.at.add(forward);
  this.updateViewMatrix();
};

Camera.prototype.moveBackwards = function () {
  var backward = new Vector3();
  backward.set(this.eye);
  backward.sub(this.at);
  backward.normalize();
  backward.mul(this.speed);
  this.eye.add(backward);
  this.at.add(backward);
  this.updateViewMatrix();
};

Camera.prototype.moveLeft = function () {
  var forward = new Vector3();
  var side;
  forward.set(this.at);
  forward.sub(this.eye);
  side = Vector3.cross(this.up, forward);
  side.normalize();
  side.mul(this.speed);
  this.eye.add(side);
  this.at.add(side);
  this.updateViewMatrix();
};

Camera.prototype.moveRight = function () {
  var forward = new Vector3();
  var side;
  forward.set(this.at);
  forward.sub(this.eye);
  side = Vector3.cross(forward, this.up);
  side.normalize();
  side.mul(this.speed);
  this.eye.add(side);
  this.at.add(side);
  this.updateViewMatrix();
};

Camera.prototype.panBy = function (angle) {
  var forward = new Vector3();
  var rotationMatrix = new Matrix4();
  var turnedForward;
  forward.set(this.at);
  forward.sub(this.eye);
  rotationMatrix.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
  turnedForward = rotationMatrix.multiplyVector3(forward);
  this.at.set(this.eye);
  this.at.add(turnedForward);
  this.updateViewMatrix();
};

Camera.prototype.panLeft = function () {
  this.panBy(this.turnAngle);
};

Camera.prototype.panRight = function () {
  this.panBy(-this.turnAngle);
};
