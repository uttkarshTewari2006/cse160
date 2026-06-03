var canvas = document.querySelector("#three-canvas");
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = false;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(55, 2, 0.1, 300);
camera.position.set(18, 11, -20);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.2, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 8;
controls.maxDistance = 55;

var animatedObjects = [];
var buoys = [];
var scanRings = [];
var drone = null;
var droneRotors = [];
var launchActive = false;
var launchStart = 0;
var lastTimeSeconds = 0;
var padPointLight;
var spotLight;

function makeCanvasTexture(draw, repeatX, repeatY) {
  var size = 128;
  var textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  var ctx = textureCanvas.getContext("2d");
  draw(ctx, size);
  var texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX || 1, repeatY || 1);
  return texture;
}

function fill(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function stroke(ctx, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
}

var textures = {
  concrete: makeCanvasTexture(function(ctx, s) {
    fill(ctx, "#8e9694", 0, 0, s, s);
    stroke(ctx, "rgba(80,90,88,.65)", 4);
    [48, 104, 166, 220].forEach(function(y) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke(); });
    [54, 128, 204].forEach(function(x) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke(); });
    stroke(ctx, "rgba(230,235,230,.45)", 5);
    [[18,26,60,26], [96,70,138,70], [38,150,88,150], [160,210,225,210]].forEach(function(p) {
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.stroke();
    });
  }, 5, 5),
  crate: makeCanvasTexture(function(ctx, s) {
    fill(ctx, "#9a6b36", 0, 0, s, s);
    stroke(ctx, "#5b391b", 18);
    ctx.strokeRect(14, 14, s - 28, s - 28);
    stroke(ctx, "#6f451f", 16);
    ctx.beginPath(); ctx.moveTo(24, 24); ctx.lineTo(232, 232); ctx.moveTo(232, 24); ctx.lineTo(24, 232); ctx.stroke();
    stroke(ctx, "rgba(224,182,106,.7)", 8);
    ctx.beginPath(); ctx.moveTo(82, 0); ctx.lineTo(82, s); ctx.moveTo(174, 0); ctx.lineTo(174, s); ctx.stroke();
  }, 1, 1),
  water: makeCanvasTexture(function(ctx, s) {
    fill(ctx, "#2f7f99", 0, 0, s, s);
    stroke(ctx, "rgba(142,216,230,.48)", 8);
    for (var y = 35; y < s; y += 52) {
      ctx.beginPath();
      for (var x = -20; x <= s + 20; x += 20) {
        var wave = y + Math.sin((x + y) * 0.05) * 13;
        if (x === -20) ctx.moveTo(x, wave); else ctx.lineTo(x, wave);
      }
      ctx.stroke();
    }
  }, 7, 7),
  tower: makeCanvasTexture(function(ctx, s) {
    fill(ctx, "#4d5b61", 0, 0, s, s);
    stroke(ctx, "#263238", 14);
    ctx.beginPath(); ctx.moveTo(35, 0); ctx.lineTo(35, s); ctx.moveTo(220, 0); ctx.lineTo(220, s); ctx.stroke();
    stroke(ctx, "rgba(180,190,190,.7)", 10);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s, 64); ctx.lineTo(0, 128); ctx.lineTo(s, 192); ctx.lineTo(0, s); ctx.stroke();
  }, 1, 4),
  runway: makeCanvasTexture(function(ctx, s) {
    fill(ctx, "#2f373c", 0, 0, s, s);
    stroke(ctx, "#f1eebf", 14);
    ctx.setLineDash([42, 36]);
    ctx.beginPath(); ctx.moveTo(s / 2, 8); ctx.lineTo(s / 2, s); ctx.stroke();
    ctx.setLineDash([]);
    stroke(ctx, "#d6dce0", 8);
    ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(26, s); ctx.moveTo(s - 26, 0); ctx.lineTo(s - 26, s); ctx.stroke();
  }, 1, 5),
  hull: makeCanvasTexture(function(ctx, s) {
    fill(ctx, "#d9e1e6", 0, 0, s, s);
    stroke(ctx, "rgba(119,136,145,.5)", 6);
    [56, 128, 200].forEach(function(v) {
      ctx.beginPath(); ctx.moveTo(0, v); ctx.lineTo(s, v); ctx.moveTo(v, 0); ctx.lineTo(v, s); ctx.stroke();
    });
    fill(ctx, "#2487a5", 28, 28, 70, 34);
    fill(ctx, "#ef7d3c", 0, 224, s, 14);
  }, 1, 1)
};

function makeSkybox() {
  var faces = [];
  for (var i = 0; i < 6; i += 1) {
    faces.push(makeCanvasTexture(function(ctx, s) {
      var gradient = ctx.createLinearGradient(0, 0, 0, s);
      gradient.addColorStop(0, "#73b5e5");
      gradient.addColorStop(0.62, "#cfe5ef");
      gradient.addColorStop(1, "#3d7484");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, s, s);
      stroke(ctx, "rgba(255,255,255,.45)", 28);
      ctx.beginPath();
      ctx.moveTo(30, 160);
      ctx.bezierCurveTo(90, 120, 130, 200, 190, 160);
      ctx.bezierCurveTo(250, 120, 290, 200, 350, 160);
      ctx.bezierCurveTo(410, 120, 450, 200, 510, 160);
      ctx.stroke();
    }, 1, 1).image);
  }
  scene.background = new THREE.CubeTexture(faces);
  scene.background.needsUpdate = true;
}

var materials = {
  concrete: new THREE.MeshStandardMaterial({ map: textures.concrete, roughness: 0.82, metalness: 0.08 }),
  runway: new THREE.MeshStandardMaterial({ map: textures.runway, roughness: 0.76, metalness: 0.1 }),
  water: new THREE.MeshStandardMaterial({ map: textures.water, color: 0x4b90a9, roughness: 0.38, metalness: 0.02 }),
  crate: new THREE.MeshStandardMaterial({ map: textures.crate, roughness: 0.7 }),
  tower: new THREE.MeshStandardMaterial({ map: textures.tower, roughness: 0.45, metalness: 0.25 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x78838a, roughness: 0.42, metalness: 0.55 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: 0x263137, roughness: 0.5, metalness: 0.65 }),
  buoyRed: new THREE.MeshStandardMaterial({ color: 0xe64a3b, roughness: 0.5 }),
  buoyWhite: new THREE.MeshStandardMaterial({ color: 0xf1efe6, roughness: 0.42 }),
  beacon: new THREE.MeshStandardMaterial({ color: 0xffd37a, emissive: 0xff8c2b, emissiveIntensity: 0.75 }),
  ring: new THREE.MeshStandardMaterial({ color: 0x50c8d8, emissive: 0x1c98c1, emissiveIntensity: 0.45 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x8ed7ff, opacity: 0.62, transparent: true, roughness: 0.08, metalness: 0.05 }),
  droneHull: new THREE.MeshStandardMaterial({ map: textures.hull, roughness: 0.48, metalness: 0.25 })
};

function addMesh(mesh, castShadow, receiveShadow) {
  mesh.castShadow = false;
  mesh.receiveShadow = receiveShadow !== false;
  scene.add(mesh);
  return mesh;
}

function createBox(name, size, position, material) {
  var mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.name = name;
  mesh.position.copy(position);
  return addMesh(mesh);
}

function createCylinder(name, radiusTop, radiusBottom, height, position, material, segments) {
  var mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments || 16), material);
  mesh.name = name;
  mesh.position.copy(position);
  return addMesh(mesh);
}

function createSphere(name, radius, position, material, width, height) {
  var mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, width || 20, height || 10), material);
  mesh.name = name;
  mesh.position.copy(position);
  return addMesh(mesh);
}

function setupLights() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));
  scene.add(new THREE.HemisphereLight(0xb9d9ff, 0x334533, 1.35));

  var directional = new THREE.DirectionalLight(0xfff0d8, 2.2);
  directional.position.set(-12, 18, 9);
  scene.add(directional);

  padPointLight = new THREE.PointLight(0x5ee0ff, 2.3, 28, 1.8);
  padPointLight.position.set(0, 4.8, 0);
  scene.add(padPointLight);

  spotLight = new THREE.SpotLight(0xffdf9b, 4.6, 36, Math.PI / 6, 0.45, 1.2);
  spotLight.position.set(-7, 8, 8);
  spotLight.target.position.set(0, 1, 0);
  scene.add(spotLight);
  scene.add(spotLight.target);
}

function buildHarbor() {
  createBox("textured water base", new THREE.Vector3(52, 0.12, 52), new THREE.Vector3(0, -0.08, 0), materials.water);
  createBox("textured concrete pier", new THREE.Vector3(25, 0.45, 16), new THREE.Vector3(0, 0.2, 0), materials.concrete);
  createBox("textured runway stripe", new THREE.Vector3(4.4, 0.08, 15.4), new THREE.Vector3(0, 0.48, 0), materials.runway);
  createBox("control shed", new THREE.Vector3(4.6, 2.2, 3.4), new THREE.Vector3(-9.2, 1.55, -4.9), materials.darkSteel);
  createBox("glass observation room", new THREE.Vector3(3.3, 1.35, 2.6), new THREE.Vector3(-9.2, 3.35, -4.9), materials.glass);

  var pad = createCylinder("round launch pad", 5.2, 5.2, 0.38, new THREE.Vector3(0, 0.72, 0), materials.concrete, 40);
  pad.rotation.y = Math.PI / 8;

  var ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.75, 0.08, 8, 48), materials.ring);
  ring1.name = "animated scanning ring inner";
  ring1.position.set(0, 0.98, 0);
  ring1.rotation.x = Math.PI / 2;
  addMesh(ring1);
  scanRings.push(ring1);

  var ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.65, 0.08, 8, 48), materials.ring);
  ring2.name = "animated scanning ring outer";
  ring2.position.set(0, 1.02, 0);
  ring2.rotation.x = Math.PI / 2;
  addMesh(ring2);
  scanRings.push(ring2);

  [[-6.2, 2.3, -6.2], [6.2, 2.3, -6.2], [-6.2, 2.3, 6.2], [6.2, 2.3, 6.2]].forEach(function(position, index) {
    createCylinder("textured support tower " + (index + 1), 0.34, 0.46, 4.6, new THREE.Vector3(position[0], position[1], position[2]), materials.tower, 18);
    var cap = createSphere("beacon sphere " + (index + 1), 0.5, new THREE.Vector3(position[0], 4.8, position[2]), materials.beacon);
    animatedObjects.push({ mesh: cap, speed: 1.5 + index * 0.25, offset: index });
  });

  [
    [-10, .95, 3.8], [-8.7, .95, 3.8], [-7.4, .95, 3.8], [-10, 1.95, 3.8],
    [-8.7, 1.95, 3.8], [8.2, .95, 4.6], [9.5, .95, 4.6], [10.8, .95, 4.6],
    [8.8, 1.95, 4.6], [10.1, 1.95, 4.6], [9.6, .95, -5.9], [10.9, .95, -5.9]
  ].forEach(function(position, index) {
    var crate = createBox("textured cargo crate " + (index + 1), new THREE.Vector3(1.1, 1.1, 1.1), new THREE.Vector3(position[0], position[1], position[2]), materials.crate);
    crate.rotation.y = (index % 3) * 0.12;
  });

  for (var i = 0; i < 10; i += 1) {
    var z = -7 + i * 1.55;
    createCylinder("pier rail post " + (i + 1) + "A", 0.12, 0.12, 1.0, new THREE.Vector3(-12.4, 1.0, z), materials.steel, 12);
    createCylinder("pier rail post " + (i + 1) + "B", 0.12, 0.12, 1.0, new THREE.Vector3(12.4, 1.0, z), materials.steel, 12);
  }

  for (var b = 0; b < 6; b += 1) {
    var angle = (Math.PI * 2 * b) / 6;
    var buoy = createSphere("animated harbor buoy " + (b + 1), 0.55, new THREE.Vector3(Math.cos(angle) * 15.5, 0.55, Math.sin(angle) * 15.5), b % 2 === 0 ? materials.buoyRed : materials.buoyWhite);
    buoys.push({ mesh: buoy, baseY: buoy.position.y, phase: b * 0.8 });
  }

  var antenna = createCylinder("control tower antenna mast", 0.07, 0.1, 2.2, new THREE.Vector3(-9.2, 5.2, -4.9), materials.steel, 10);
  var cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 24), materials.beacon);
  cone.name = "control tower cone beacon";
  cone.position.set(-9.2, 6.75, -4.9);
  addMesh(cone);
  animatedObjects.push({ mesh: antenna, speed: 0.6, offset: 2.1 });
}

function loadDroneModel() {
  // The assignment model is also saved in assets/models. It is embedded here so
  // Chrome can run the project directly from file:// without CORS failures.
  var mtlSource = "newmtl Hull\nKd 0.86 0.89 0.91\nnewmtl Window\nKd 0.42 0.78 0.95\nnewmtl Rotor\nKd 0.08 0.1 0.11\n";
  var objSource = [
    "mtllib harbor-drone.mtl",
    "o TexturedHarborDrone",
    "g HullBody",
    "usemtl Hull",
    "v -1.4 0.0 -0.7", "v 1.4 0.0 -0.7", "v 1.4 0.0 0.7", "v -1.4 0.0 0.7",
    "v -1.0 0.7 -0.48", "v 1.0 0.7 -0.48", "v 1.0 0.7 0.48", "v -1.0 0.7 0.48",
    "vt 0 0", "vt 1 0", "vt 1 1", "vt 0 1",
    "f 1/1 2/2 3/3", "f 1/1 3/3 4/4", "f 5/1 8/4 7/3", "f 5/1 7/3 6/2",
    "f 1/1 5/4 6/3", "f 1/1 6/3 2/2", "f 2/1 6/4 7/3", "f 2/1 7/3 3/2",
    "f 3/1 7/4 8/3", "f 3/1 8/3 4/2", "f 4/1 8/4 5/3", "f 4/1 5/3 1/2",
    "g CockpitWindow", "usemtl Window",
    "v -0.52 0.72 -0.5", "v 0.52 0.72 -0.5", "v 0.34 1.02 -0.2", "v -0.34 1.02 -0.2",
    "f 9/1 10/2 11/3", "f 9/1 11/3 12/4",
    "g Wings", "usemtl Hull",
    "v -1.1 0.26 -0.56", "v -3.1 0.2 -1.0", "v -2.82 0.2 -0.36", "v -1.1 0.26 -0.15",
    "v -1.1 0.26 0.15", "v -2.82 0.2 0.36", "v -3.1 0.2 1.0", "v -1.1 0.26 0.56",
    "v 1.1 0.26 -0.56", "v 3.1 0.2 -1.0", "v 2.82 0.2 -0.36", "v 1.1 0.26 -0.15",
    "v 1.1 0.26 0.15", "v 2.82 0.2 0.36", "v 3.1 0.2 1.0", "v 1.1 0.26 0.56",
    "f 13/1 14/2 15/3", "f 13/1 15/3 16/4", "f 17/1 18/2 19/3", "f 17/1 19/3 20/4",
    "f 21/1 24/4 23/3", "f 21/1 23/3 22/2", "f 25/1 28/4 27/3", "f 25/1 27/3 26/2",
    "g RotorFrontLeft", "usemtl Rotor",
    "v -2.85 0.34 -0.85", "v -2.0 0.34 -0.85", "v -2.0 0.34 -0.73", "v -2.85 0.34 -0.73",
    "v -2.48 0.34 -1.18", "v -2.36 0.34 -1.18", "v -2.36 0.34 -0.4", "v -2.48 0.34 -0.4",
    "f 29/1 30/2 31/3", "f 29/1 31/3 32/4", "f 33/1 34/2 35/3", "f 33/1 35/3 36/4",
    "g RotorFrontRight", "usemtl Rotor",
    "v 2.0 0.34 -0.85", "v 2.85 0.34 -0.85", "v 2.85 0.34 -0.73", "v 2.0 0.34 -0.73",
    "v 2.36 0.34 -1.18", "v 2.48 0.34 -1.18", "v 2.48 0.34 -0.4", "v 2.36 0.34 -0.4",
    "f 37/1 38/2 39/3", "f 37/1 39/3 40/4", "f 41/1 42/2 43/3", "f 41/1 43/3 44/4",
    "g RotorBackLeft", "usemtl Rotor",
    "v -2.85 0.34 0.73", "v -2.0 0.34 0.73", "v -2.0 0.34 0.85", "v -2.85 0.34 0.85",
    "v -2.48 0.34 0.4", "v -2.36 0.34 0.4", "v -2.36 0.34 1.18", "v -2.48 0.34 1.18",
    "f 45/1 48/4 47/3", "f 45/1 47/3 46/2", "f 49/1 52/4 51/3", "f 49/1 51/3 50/2",
    "g RotorBackRight", "usemtl Rotor",
    "v 2.0 0.34 0.73", "v 2.85 0.34 0.73", "v 2.85 0.34 0.85", "v 2.0 0.34 0.85",
    "v 2.36 0.34 0.4", "v 2.48 0.34 0.4", "v 2.48 0.34 1.18", "v 2.36 0.34 1.18",
    "f 53/1 56/4 55/3", "f 53/1 55/3 54/2", "f 57/1 60/4 59/3", "f 57/1 59/3 58/2"
  ].join("\n");

  var parsedMaterials = new THREE.MTLLoader().parse(mtlSource, "");
  parsedMaterials.preload();

  drone = new THREE.OBJLoader().parse(objSource);
  droneRotors = [];
  drone.name = "textured loaded OBJ harbor drone";
  drone.position.set(0, 4.0, 0);
  drone.scale.set(1.7, 1.7, 1.7);
  drone.rotation.y = Math.PI / 4;
  drone.traverse(function(child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.name.indexOf("Window") !== -1) {
        child.material = materials.glass;
      } else if (child.name.indexOf("Rotor") !== -1) {
        child.material = materials.darkSteel;
        droneRotors.push(child);
      } else {
        child.material = materials.droneHull;
      }
    }
  });
  scene.add(drone);
}

function animate(timeSeconds) {
  var deltaSeconds = Math.min(timeSeconds - lastTimeSeconds, 0.05);
  lastTimeSeconds = timeSeconds;

  animatedObjects.forEach(function(item) {
    item.mesh.rotation.y += deltaSeconds * item.speed * 0.9;
    if (item.mesh.material.emissiveIntensity !== undefined) {
      item.mesh.material.emissiveIntensity = 0.55 + Math.sin(timeSeconds * item.speed + item.offset) * 0.25;
    }
  });

  buoys.forEach(function(item) {
    item.mesh.position.y = item.baseY + Math.sin(timeSeconds * 1.2 + item.phase) * 0.18;
    item.mesh.rotation.z = Math.sin(timeSeconds + item.phase) * 0.12;
  });

  scanRings.forEach(function(ring, index) {
    ring.rotation.z += deltaSeconds * (0.65 + index * 0.35);
    var pulse = 1 + Math.sin(timeSeconds * 2.2 + index * Math.PI) * 0.035;
    ring.scale.set(pulse, pulse, pulse);
  });

  padPointLight.intensity = launchActive ? 4.2 + Math.sin(timeSeconds * 7) * 0.5 : 2.3 + Math.sin(timeSeconds * 2) * 0.25;

  if (drone) {
    drone.rotation.y += deltaSeconds * (launchActive ? 1.6 : 0.35);
    droneRotors.forEach(function(rotor) {
      rotor.rotation.y += deltaSeconds * (launchActive ? 28 : 4);
    });

    if (launchActive) {
      var t = Math.min((timeSeconds - launchStart) / 5.5, 1);
      drone.position.y = 4.0 + easeOutCubic(t) * 8.5;
      drone.position.x = Math.sin(t * Math.PI) * 1.2;
      spotLight.target.position.copy(drone.position);
      if (t >= 1) launchActive = false;
    }
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function resizeRendererToDisplaySize() {
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;
  var needsResize = canvas.width !== width || canvas.height !== height;
  if (needsResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function render(time) {
  resizeRendererToDisplaySize();
  animate(time * 0.001);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function bindButtons() {
  document.querySelector("#launchButton").addEventListener("click", function() {
    if (launchActive) return;
    launchActive = true;
    launchStart = performance.now() * 0.001;
    if (drone) {
      drone.position.set(0, 4.0, 0);
      drone.rotation.set(0, Math.PI / 4, 0);
    }
  });

  document.querySelector("#resetButton").addEventListener("click", function() {
    launchActive = false;
    if (drone) {
      drone.position.set(0, 4.0, 0);
      drone.rotation.set(0, Math.PI / 4, 0);
    }
    spotLight.target.position.set(0, 1, 0);
    controls.target.set(0, 2.2, 0);
    camera.position.set(18, 11, -20);
    controls.update();
  });
}

function maybeAutoLaunchForTest() {
  if (window.location.search.indexOf("launch=1") !== -1) {
    setTimeout(function() {
      document.querySelector("#launchButton").click();
    }, 300);
  }
}

makeSkybox();
setupLights();
buildHarbor();
loadDroneModel();
bindButtons();
maybeAutoLaunchForTest();
requestAnimationFrame(render);
