import * as THREE from 'three';
import simpleVert from './shaders/simple.vert';
import pixelBlur from './shaders/pixelBlur.frag';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { Tween, Easing, Sequence } from '@tweenjs/tween.js';

let gui: GUI,
  animationTime,
  clock,
  scene1,
  scene2,
  camera,
  canvas,
  renderer,
  composer,
  effect,
  colorPass,
  rt;

const param = {
  interpolationCount: 6.0,
  stretchStrength: 0.0,
  transitionStrength: 0.0,
  transitionDirection: 0.0,
  loopTransition: false,
};

function init() {
  canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({
    canvas,
    precision: 'highp',
  });
  //renderer.setSize(800, 600);
  document.body.appendChild(renderer.domElement);
  scene1 = new THREE.Scene();
  scene1.background = new THREE.Color(0x424242);
  scene2 = new THREE.Scene();
  scene2.background = new THREE.Color(0x424242);
  clock = new THREE.Clock();
  clock.start();

  rt = new THREE.WebGLRenderTarget(canvas.clientWidth, canvas.clientHeight, {
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
}

function update() {
  requestAnimationFrame(update);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    composer.setSize(canvas.width, canvas.height);
  }

  let time = performance.now() * 0.001;
  time = Math.sin(time);

  transitionAnimation(clock.getDelta() * 1.5);
  renderer.setRenderTarget(rt);
  renderer.render(scene1, camera);
  renderer.setRenderTarget(null);

  composer.render(clock.getDelta());
}

function addEffect() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene2, camera));

  effect = {
    uniforms: {
      tDiffuse: { value: null },
      rt0: { value: rt },
      time: { value: 1.0 },
      stretchNoiseMultiplier: { value: new THREE.Vector2(1, 1) },
      stretchStrength: { value: 0.0 },
      transitionStrength: { value: 0.0 },
      transitionDirection: { value: 0.0 },
      interpolationCount: { value: 5.0 },
      uClearColor: { value: new THREE.Vector3(0, 0, 0) },
    },
    vertexShader: simpleVert,
    fragmentShader: pixelBlur,
  };

  colorPass = new ShaderPass(effect);
  colorPass.renderToScreen = true;
  composer.addPass(colorPass);
}

function addGUI() {
  gui = new GUI();
  gui.width = 300;

  gui.add(param, 'stretchStrength', 0.0, 1.0).onChange((value) => {
    colorPass.uniforms.stretchStrength.value = value;
  });

  gui.add(param, 'transitionStrength', 0.0, 1.0).onChange((value) => {
    colorPass.uniforms.transitionStrength.value = value;
  });

  gui.add(param, 'interpolationCount', 1.5, 10.0).onChange((value) => {
    colorPass.uniforms.interpolationCount.value = value;
  });

  gui.add(param, 'transitionDirection', 0.0, 1.0).onChange((value) => {
    colorPass.uniforms.transitionDirection.value = value;
  });

  gui.add(param, 'loopTransition').onChange(() => {
    //param.transitionAmount = 0;
    animationTime = 0;
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

  colorPass.uniforms.transitionStrength.value = easeInOutQuart(b);
  colorPass.uniforms.stretchStrength.value = easeInOutQuart(b * 2.0);
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
  camera.position.set(0, 0, 7);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
}

async function addPlane() {
  const loader = new THREE.TextureLoader();
  const texture1 = await Promise.resolve(loader.loadAsync('./resources/test1.jpg'));
  const texture2 = await Promise.resolve(loader.loadAsync('./resources/test2.jpg'));

  const mat1 = new THREE.MeshBasicMaterial({
    map: texture1,
  });

  const mat2 = new THREE.MeshBasicMaterial({
    map: texture2,
  });

  const geometry = new THREE.PlaneGeometry(5, 5, 10, 10);

  const plane1 = new THREE.Mesh(geometry, mat1);
  plane1.name = 'plane';
  plane1.position.z = 0;
  scene1.add(plane1);

  const plane2 = new THREE.Mesh(geometry, mat2);
  plane2.name = 'plane';
  plane2.position.z = 0;
  scene2.add(plane2);
}

(async function () {
  init();
  addCamera();
  await addPlane();
  addEffect();
  addGUI();
  update();
})();
