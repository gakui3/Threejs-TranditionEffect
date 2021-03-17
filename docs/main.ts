import * as THREE from 'three';
import simpleVert from './shaders/simple.vert';
import glitchTransitionFrag1 from './shaders/glitchTransition2.frag';
import glitchTransitionFrag2 from './shaders/glitchTransition3.frag';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { Material, ShaderMaterial } from 'three';

let gui: GUI,
  mat1: ShaderMaterial,
  mat2: ShaderMaterial,
  animationTime,
  clock,
  plane,
  effect1,
  effect2,
  scene,
  texture1,
  texture2,
  camera,
  canvas,
  renderer,
  geometry;

const param = {
  jitterAmount: 100.0,
  chromaticaberrationAmount: 1.0,

  transitionAmount: 0,
  loopTransition: false,
  effect: 'effect1',

  speed: 10.0,
  blockSize: 30.0,
  maxOffsetX: 10.0,
  maxOffsetY: 10.0,
};

function init() {
  canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({ canvas });
  //renderer.setSize(800, 600);
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x424242);

  clock = new THREE.Clock();
  clock.start();
}

function update() {
  requestAnimationFrame(update);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  let time = performance.now() * 0.001;
  time = Math.sin(time);
  mat1.uniforms.time.value = time;
  mat2.uniforms.time.value = time;

  transitionAnimation(clock.getDelta() * 3);
  renderer.render(scene, camera);
}

function addGUI() {
  gui = new GUI();
  effect1 = gui.addFolder('Effect1');
  effect2 = gui.addFolder('Effect2');
  gui.width = 300;
  effect1.add(param, 'jitterAmount', 0, 200).onChange((value) => {
    mat1.uniforms.jitterAmount.value = value;
  });
  effect1.add(param, 'chromaticaberrationAmount', 0.01, 2.0).onChange((value) => {
    mat1.uniforms.chromaticaberrationAmount.value = value;
  });
  gui.add(param, 'transitionAmount', 0.0, 1.0).onChange((value) => {
    let t = easeInOutQuart(value);
    mat1.uniforms.transitionAmount.value = t;
    mat2.uniforms.transitionAmount.value = t;
  });

  effect2.add(param, 'speed', 1, 100).onChange((value) => {
    mat2.uniforms.speed.value = value;
  });
  effect2.add(param, 'blockSize', 1, 50).onChange((value) => {
    mat2.uniforms.blockSize.value = value;
  });
  effect2.add(param, 'maxOffsetX', 1, 100).onChange((value) => {
    mat2.uniforms.maxOffsetX.value = value;
  });
  effect2.add(param, 'maxOffsetY', 1, 100).onChange((value) => {
    mat2.uniforms.maxOffsetY.value = value;
  });

  gui.add(param, 'loopTransition').onChange(() => {
    param.transitionAmount = 0;
    animationTime = 0;
  });
  gui.add(param, 'effect', ['effect1', 'effect2']).onChange((value) => {
    if (value === 'effect1') {
      plane.material = mat1;
    }
    if (value === 'effect2') {
      plane.material = mat2;
    }
  });
}

function easeInOutQuart(x: number): number {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

function transitionAnimation(t) {
  if (!param.loopTransition) return;

  animationTime += t;
  let a = Math.sin(animationTime);
  let b = (a + 1.0) * 0.5;

  let c = (Math.sin(animationTime * 2.0) + 1) * 0.5;
  let d = param.jitterAmount - c * param.jitterAmount;
  let e = param.speed - c * param.speed;

  mat1.uniforms.transitionAmount.value = easeInOutQuart(b);
  mat1.uniforms.jitterAmount.value = d;

  mat2.uniforms.transitionAmount.value = easeInOutQuart(b);
  mat2.uniforms.speed.value = e;
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function addCamera() {
  camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
  camera.position.set(0, 0, 0);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
}

async function addPlane() {
  const loader = new THREE.TextureLoader();
  texture1 = await Promise.resolve(loader.loadAsync('./resources/test2.jpg'));
  texture2 = await Promise.resolve(loader.loadAsync('./resources/test1.jpg'));

  mat1 = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(1, 1, 0) },
      tex1: { value: texture1 },
      tex2: { value: texture2 },
      time: { value: 1.0 },
      jitterAmount: { value: 100.0 },
      chromaticaberrationAmount: { value: 0.5 },
      transitionAmount: { value: 0 },
    },
    vertexShader: simpleVert,
    fragmentShader: glitchTransitionFrag1,
  });

  mat2 = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(1, 1, 0) },
      tex1: { value: texture1 },
      tex2: { value: texture2 },
      time: { value: 1.0 },
      speed: { value: 10.0 },
      blockSize: { value: 30.0 },
      maxOffsetX: { value: 10.0 },
      maxOffsetY: { value: 10.0 },
      transitionAmount: { value: 0 },
    },
    vertexShader: simpleVert,
    fragmentShader: glitchTransitionFrag2,
  });

  geometry = new THREE.PlaneGeometry(8, 8);
  plane = new THREE.Mesh(geometry, mat1);
  plane.name = 'plane';
  plane.position.z = -10;
  scene.add(plane);
}

(async function () {
  init();
  addCamera();
  await addPlane();
  addGUI();
  update();
})();
