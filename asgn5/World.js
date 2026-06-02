import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const canvas = document.querySelector("#three-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 2, 0.1, 300);
camera.position.set(18, 11, -20);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.2, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 8;
controls.maxDistance = 55;

const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

const animatedObjects = [];
const buoys = [];
const scanRings = [];
let drone = null;
let launchActive = false;
let launchStart = 0;
let padPointLight;
let spotLight;

function configureTexture(texture, repeatX = 1, repeatY = 1) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

const textures = {
  concrete: configureTexture(textureLoader.load("./assets/textures/concrete.svg"), 5, 5),
  crate: configureTexture(textureLoader.load("./assets/textures/crate.svg"), 1, 1),
  water: configureTexture(textureLoader.load("./assets/textures/water.svg"), 7, 7),
  tower: configureTexture(textureLoader.load("./assets/textures/tower.svg"), 1, 4),
  runway: configureTexture(textureLoader.load("./assets/textures/runway.svg"), 1, 5)
};

scene.background = cubeTextureLoader.load([
  "./assets/skybox/px.svg",
  "./assets/skybox/nx.svg",
  "./assets/skybox/py.svg",
  "./assets/skybox/ny.svg",
  "./assets/skybox/pz.svg",
  "./assets/skybox/nz.svg"
]);

const materials = {
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
  glass: new THREE.MeshPhysicalMaterial({ color: 0x8ed7ff, transmission: 0.25, opacity: 0.62, transparent: true, roughness: 0.08, metalness: 0.05 })
};

function addMesh(mesh, castShadow = true, receiveShadow = true) {
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  scene.add(mesh);
  return mesh;
}

function createBox(name, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.name = name;
  mesh.position.copy(position);
  return addMesh(mesh);
}

function createCylinder(name, radiusTop, radiusBottom, height, position, material, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.name = name;
  mesh.position.copy(position);
  return addMesh(mesh);
}

function createSphere(name, radius, position, material, width = 32, height = 16) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), material);
  mesh.name = name;
  mesh.position.copy(position);
  return addMesh(mesh);
}

function setupLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.22);
  scene.add(ambient);

  const hemisphere = new THREE.HemisphereLight(0xb9d9ff, 0x334533, 1.35);
  scene.add(hemisphere);

  const directional = new THREE.DirectionalLight(0xfff0d8, 2.2);
  directional.position.set(-12, 18, 9);
  directional.castShadow = true;
  directional.shadow.mapSize.set(2048, 2048);
  directional.shadow.camera.left = -28;
  directional.shadow.camera.right = 28;
  directional.shadow.camera.top = 28;
  directional.shadow.camera.bottom = -28;
  scene.add(directional);

  padPointLight = new THREE.PointLight(0x5ee0ff, 2.3, 28, 1.8);
  padPointLight.position.set(0, 4.8, 0);
  padPointLight.castShadow = true;
  scene.add(padPointLight);

  spotLight = new THREE.SpotLight(0xffdf9b, 4.6, 36, Math.PI / 6, 0.45, 1.2);
  spotLight.position.set(-7, 8, 8);
  spotLight.target.position.set(0, 1, 0);
  spotLight.castShadow = true;
  scene.add(spotLight);
  scene.add(spotLight.target);
}

function buildHarbor() {
  const water = createBox("textured water base", new THREE.Vector3(52, 0.12, 52), new THREE.Vector3(0, -0.08, 0), materials.water);
  water.receiveShadow = true;

  createBox("textured concrete pier", new THREE.Vector3(25, 0.45, 16), new THREE.Vector3(0, 0.2, 0), materials.concrete);
  createBox("textured runway stripe", new THREE.Vector3(4.4, 0.08, 15.4), new THREE.Vector3(0, 0.48, 0), materials.runway);
  createBox("control shed", new THREE.Vector3(4.6, 2.2, 3.4), new THREE.Vector3(-9.2, 1.55, -4.9), materials.darkSteel);
  createBox("glass observation room", new THREE.Vector3(3.3, 1.35, 2.6), new THREE.Vector3(-9.2, 3.35, -4.9), materials.glass);

  const pad = createCylinder("round launch pad", 5.2, 5.2, 0.38, new THREE.Vector3(0, 0.72, 0), materials.concrete, 64);
  pad.rotation.y = Math.PI / 8;

  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.75, 0.08, 12, 96), materials.ring);
  ring1.name = "animated scanning ring inner";
  ring1.position.set(0, 0.98, 0);
  ring1.rotation.x = Math.PI / 2;
  addMesh(ring1);
  scanRings.push(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.65, 0.08, 12, 96), materials.ring);
  ring2.name = "animated scanning ring outer";
  ring2.position.set(0, 1.02, 0);
  ring2.rotation.x = Math.PI / 2;
  addMesh(ring2);
  scanRings.push(ring2);

  const towerPositions = [
    [-6.2, 2.3, -6.2],
    [6.2, 2.3, -6.2],
    [-6.2, 2.3, 6.2],
    [6.2, 2.3, 6.2]
  ];

  towerPositions.forEach((position, index) => {
    createCylinder(`textured support tower ${index + 1}`, 0.34, 0.46, 4.6, new THREE.Vector3(...position), materials.tower, 18);
    const cap = createSphere(`beacon sphere ${index + 1}`, 0.5, new THREE.Vector3(position[0], 4.8, position[2]), materials.beacon);
    animatedObjects.push({ mesh: cap, speed: 1.5 + index * 0.25, offset: index });
  });

  const cratePositions = [
    [-10.0, 0.95, 3.8], [-8.7, 0.95, 3.8], [-7.4, 0.95, 3.8],
    [-10.0, 1.95, 3.8], [-8.7, 1.95, 3.8],
    [8.2, 0.95, 4.6], [9.5, 0.95, 4.6], [10.8, 0.95, 4.6],
    [8.8, 1.95, 4.6], [10.1, 1.95, 4.6],
    [9.6, 0.95, -5.9], [10.9, 0.95, -5.9]
  ];

  cratePositions.forEach((position, index) => {
    const crate = createBox(`textured cargo crate ${index + 1}`, new THREE.Vector3(1.1, 1.1, 1.1), new THREE.Vector3(...position), materials.crate);
    crate.rotation.y = (index % 3) * 0.12;
  });

  for (let i = 0; i < 10; i += 1) {
    const z = -7 + i * 1.55;
    createCylinder(`pier rail post ${i + 1}A`, 0.12, 0.12, 1.0, new THREE.Vector3(-12.4, 1.0, z), materials.steel, 12);
    createCylinder(`pier rail post ${i + 1}B`, 0.12, 0.12, 1.0, new THREE.Vector3(12.4, 1.0, z), materials.steel, 12);
  }

  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    const x = Math.cos(angle) * 15.5;
    const z = Math.sin(angle) * 15.5;
    const buoy = createSphere(`animated harbor buoy ${i + 1}`, 0.55, new THREE.Vector3(x, 0.55, z), i % 2 === 0 ? materials.buoyRed : materials.buoyWhite);
    buoys.push({ mesh: buoy, baseY: buoy.position.y, phase: i * 0.8 });
  }

  const antenna = createCylinder("control tower antenna mast", 0.07, 0.1, 2.2, new THREE.Vector3(-9.2, 5.2, -4.9), materials.steel, 10);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 24), materials.beacon);
  cone.name = "control tower cone beacon";
  cone.position.set(-9.2, 6.75, -4.9);
  addMesh(cone);
  animatedObjects.push({ mesh: antenna, speed: 0.6, offset: 2.1 });
}

function loadDroneModel() {
  const mtlLoader = new MTLLoader(loadingManager);
  mtlLoader.setPath("./assets/models/");
  mtlLoader.load("harbor-drone.mtl", (loadedMaterials) => loadedMaterials.preload());

  const objLoader = new OBJLoader(loadingManager);
  objLoader.setPath("./assets/models/");
  objLoader.load("harbor-drone.obj", (object) => {
    drone = object;
    drone.name = "textured loaded OBJ harbor drone";
    drone.position.set(0, 4.0, 0);
    drone.scale.set(1.7, 1.7, 1.7);
    drone.rotation.y = Math.PI / 4;
    drone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.name.includes("Window")) {
          child.material = materials.glass;
        } else if (child.name.includes("Rotor")) {
          child.material = materials.darkSteel;
        } else {
          child.material = new THREE.MeshStandardMaterial({ map: textures.crate, roughness: 0.48, metalness: 0.25 });
        }
      }
    });
    scene.add(drone);
  });
}

function animate(timeSeconds) {
  const elapsed = timeSeconds;

  animatedObjects.forEach((item) => {
    item.mesh.rotation.y += 0.018 * item.speed;
    if (item.mesh.material.emissiveIntensity !== undefined) {
      item.mesh.material.emissiveIntensity = 0.55 + Math.sin(elapsed * item.speed + item.offset) * 0.25;
    }
  });

  buoys.forEach((item) => {
    item.mesh.position.y = item.baseY + Math.sin(elapsed * 1.2 + item.phase) * 0.18;
    item.mesh.rotation.z = Math.sin(elapsed + item.phase) * 0.12;
  });

  scanRings.forEach((ring, index) => {
    ring.rotation.z += 0.01 + index * 0.006;
    const pulse = 1 + Math.sin(elapsed * 2.2 + index * Math.PI) * 0.035;
    ring.scale.set(pulse, pulse, pulse);
  });

  padPointLight.intensity = launchActive ? 4.2 + Math.sin(elapsed * 7) * 0.5 : 2.3 + Math.sin(elapsed * 2) * 0.25;

  if (drone) {
    drone.rotation.y += launchActive ? 0.028 : 0.006;

    const rotors = [];
    drone.traverse((child) => {
      if (child.name.includes("Rotor")) {
        rotors.push(child);
      }
    });
    rotors.forEach((rotor) => {
      rotor.rotation.y += launchActive ? 0.5 : 0.08;
    });

    if (launchActive) {
      const t = Math.min((elapsed - launchStart) / 5.5, 1);
      drone.position.y = 4.0 + easeOutCubic(t) * 8.5;
      drone.position.x = Math.sin(t * Math.PI) * 1.2;
      spotLight.target.position.copy(drone.position);
      if (t >= 1) {
        launchActive = false;
      }
    }
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function resizeRendererToDisplaySize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needsResize = canvas.width !== width || canvas.height !== height;
  if (needsResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function render(time) {
  const timeSeconds = time * 0.001;
  resizeRendererToDisplaySize();
  animate(timeSeconds);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function bindButtons() {
  document.querySelector("#launchButton").addEventListener("click", () => {
    launchActive = true;
    launchStart = performance.now() * 0.001;
    if (drone) {
      drone.position.set(0, 4.0, 0);
    }
  });

  document.querySelector("#resetButton").addEventListener("click", () => {
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

setupLights();
buildHarbor();
loadDroneModel();
bindButtons();
requestAnimationFrame(render);
