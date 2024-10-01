import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import GUI from "lil-gui";

/*********************************************
 * Base
 */
// Debug
const gui = new GUI();
const debugObject = {};

let counter = 0;
debugObject.nextAnimation = () => {
  counter < 2 ? counter++ : (counter = 0);
};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/*********************************************
 * Models
 */
//GLTF loader
const gltfLoader = new GLTFLoader();

//**********come importare il modello
// gltfLoader.load("/models/FlightHelmet/glTF/FlightHelmet.gltf", (gltf) => {
//   //usando il for loop non riusciamo ad avere accessibilità su tutti pezzi del oggetto
//   //   for (const children of gltf.scene.children) {
//   //     scene.add(children);
//   //   }

//   //possiamo usare il while loop, ma non è sicuro, sempre dobbiamo essere attenti sul infinite loop
//   //   while (gltf.scene.children.length) {
//   //     scene.add(gltf.scene.children[0]);
//   //   }

//   //possiamo usare spread operator per creare un array spearato poi usare il loop per renderizzare
//   //   const childrens = [...gltf.scene.children];
//   //   for (const children of childrens) {
//   //     scene.add(children);
//   //   }

//   //Miglior metodo per loading è usare l'oggetto scene, perchè è un gruppo e basta aggiugere il gruppo alla scene
//   scene.add(gltf.scene);
// });

//**********importare il modello DRACO compressed file, "import DRACOLoader instance" questo file è più leggero perché viene applicato sul webassembly e usa un wroker space separato sul cpu
//** quando usare DRACO loader? qando abbaimo una geometria più grande, perché il loader stesso pesa qualcosa quando lo importiamo. inoltre abbiamo un momento di freezing per uncompressing della geometria, quindi dipende dalla situazione

const dracoLoader = new DRACOLoader(); //init draco loader

dracoLoader.setDecoderPath("/draco/"); //abbiamo bisogno del deraco folder, allora per semplificare il lavoro andiamo a copiare il folder da questo path 'node_modules/three/examples/jsm/libs/draco' e lo mettiamo nel static folder

gltfLoader.setDRACOLoader(dracoLoader); //settare al gltfLoader il dracoLoader
gltfLoader.load("/models/Duck/glTF-Draco/Duck.gltf", (gltf) => {
  // scene.add(gltf.scene);
});

//******Scaling, Animation
let mixer = null; //per scoping lo dichiaramo fuori che poi viene chiamato dentro tick function
let fox = null; //variabile che prende in se il gltf.scene, quindi abbiamo accesso all'oggetto del modello

const mixerClipAction = () => {
  if (counter !== null) {
    scene.remove(fox);
  }
  gltfLoader.load("/models/Fox/glTF/Fox.gltf", (gltf) => {
    fox = gltf.scene;
    mixer = new THREE.AnimationMixer(fox);
    const action = mixer.clipAction(gltf.animations[counter]); //cambia index per altri animazioni

    action.play();
    fox.name = "fox";
    fox.scale.set(0.025, 0.025, 0.025);
    scene.add(fox);

    // console.log(
    //   scene.children.findIndex((x) => {
    //     return x.name === "fox";
    //   })
    // );
    // console.log(scene.children.find((x) => x.name === "fox"));
  });
};

mixerClipAction();
gui.add(debugObject, "nextAnimation").onChange(mixerClipAction);
/*********************************************
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: "#444444",
    metalness: 0,
    roughness: 0.5,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/*********************************************
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/*********************************************
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/*********************************************
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(2, 2, 2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/*********************************************
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/*********************************************
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update Mixer
  if (mixer !== null) {
    mixer.update(deltaTime);
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
