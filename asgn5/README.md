# Assignment 5: Three.js Scene

This submission builds a Three.js harbor launch scene using a high-level 3D library instead of raw WebGL.

## Requirements covered

- 20+ primary 3D shapes: boxes, spheres, cylinders, cones, torus rings, and planes.
- Textured primary shapes: launch pad, cargo crates, water, towers, and runway.
- Animated objects: the beacon, scanning rings, floating buoys, and launch sequence.
- At least three primary shape kinds: boxes, spheres, cylinders, cones, torus rings.
- Textured loaded model: `assets/models/harbor-drone.obj` with `harbor-drone.mtl`.
- Three or more light sources: ambient, hemisphere, directional, point, and spot lights.
- Textured skybox: six SVG cubemap faces in `assets/skybox`.
- Perspective camera and mouse navigation through `OrbitControls`.

## Wow point

The wow feature is an interactive launch sequence: pressing Launch animates the textured drone upward, spins its rotors, intensifies the landing lights, and sends scanning rings through the launch pad.

## Run

Serve the folder with a local web server, then open `index.html`. ES module imports, textures, skybox faces, and OBJ loading should be run through a server instead of directly opening the file.

On Windows, double-click `run_server.bat`, then open:

`http://127.0.0.1:8000/index.html`
