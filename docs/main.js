import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import simpleVert from './shaders/simple.vert';
import pixelBlur from './shaders/pixelBlur.frag';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let gui,
  clock,
  scene1,
  scene2,
  camera,
  canvas,
  renderer,
  composer,
  effect,
  colorPass,
  textures = [],
  transitionTexture,
  transitionMat,
  currentMat,
  transitionTexIndex = 1,
  canTransition = true,
  gltfLoader;

const param = {
  interpolationCount: 4.2,
  stretchStrength: 1.0,
  transitionStrength: 0.0,
  transitionDirection: 0.0,
  loopTransition: false,
  lineAmount: -1.0,
  lineNoiseSeed: 1.0,
  onClick: function () {
    transition();
  },
  transitionLineAmount: -0.35,
  lineIncreaseTime: 1000,
  lineDecreaseTime: 500,
  transitionTime: 1400,
  startTransitionDelayTime: 500,
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
  scene1.background = new THREE.Color(0x000000);
  scene2 = new THREE.Scene();
  scene2.background = new THREE.Color(0x000000);
  clock = new THREE.Clock();
  clock.start();

  transitionTexture = new THREE.WebGLRenderTarget(canvas.clientWidth, canvas.clientHeight, {
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });

  document.addEventListener('keypress', onKeyPress, false);

  gltfLoader = new GLTFLoader();
}

function update() {
  requestAnimationFrame(update);
  TWEEN.update();

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    composer.setSize(canvas.width, canvas.height);
  }

  let time = performance.now() * 0.001;
  time = Math.sin(time);

  colorPass.uniforms.time.value = clock.getElapsedTime();
  renderer.setRenderTarget(transitionTexture);
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
      transitionTexture: { value: transitionTexture },
      time: { value: 1.0 },
      stretchNoiseMultiplier: { value: new THREE.Vector2(1, 1) },
      stretchStrength: { value: 1.0 },
      transitionStrength: { value: 0.0 },
      transitionDirection: { value: 0.0 },
      interpolationCount: { value: 4.2 },
      uClearColor: { value: new THREE.Vector3(1, 1, 1) },
      lineAmount: { value: -1.0 },
      lineNoiseSeed: { value: 1.0 },
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
  gui.width = 600;

  const params = gui.addFolder('effect parameter');

  params.add(param, 'stretchStrength', 0.0, 1.0).onChange((value) => {
    colorPass.uniforms.stretchStrength.value = value;
  });

  params.add(param, 'transitionStrength', 0.0, 1.0).onChange((value) => {
    colorPass.uniforms.transitionStrength.value = value;
  });

  params.add(param, 'interpolationCount', 1.5, 10.0).onChange((value) => {
    colorPass.uniforms.interpolationCount.value = value;
  });

  params.add(param, 'transitionDirection', 0.0, 1.0).onChange((value) => {
    colorPass.uniforms.transitionDirection.value = value;
  });

  params.add(param, 'lineAmount', -1.0, 1.0).onChange((value) => {
    colorPass.uniforms.lineAmount.value = value;
  });

  params.add(param, 'lineNoiseSeed', -10.0, 10.0).onChange((value) => {
    colorPass.uniforms.lineNoiseSeed.value = value;
  });

  const folder = gui.addFolder('transition parameter');
  folder.add(param, 'transitionLineAmount', -1.0, 1.0).onChange((value) => {
    param.transitionLineAmount = value;
  });
  folder.add(param, 'lineIncreaseTime', 500, 1500).onChange((value) => {
    param.LineIncreaseTime = value;
  });
  folder.add(param, 'lineDecreaseTime', 100, 1000).onChange((value) => {
    param.LineDecreaseTime = value;
  });
  folder.add(param, 'transitionTime', 500, 2000).onChange((value) => {
    param.transitionTime = value;
  });
  folder.add(param, 'startTransitionDelayTime', 100, 1000).onChange((value) => {
    param.startTransitionDelayTime = value;
  });

  gui.add(param, 'onClick').name('click this or press [t] key to start transition');
}

function transition() {
  if (!canTransition) return;

  canTransition = false;
  colorPass.uniforms.lineNoiseSeed.value = Math.random() * 10;

  const p = {
    transitionStrength: 0.0,
    lineAmount: -1.0,
  };
  const lineTween = new TWEEN.Tween(p)
    .to({ lineAmount: param.transitionLineAmount }, param.lineIncreaseTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      colorPass.uniforms.lineAmount.value = p.lineAmount;
    })
    .onComplete(() => {
      const finishTween = new TWEEN.Tween(p)
        .to({ lineAmount: -1.0 }, param.LineDecreaseTime)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          colorPass.uniforms.lineAmount.value = p.lineAmount;
        })
        .start();
      canTransition = true;
    })
    .start();
}

function onKeyPress(event) {
  var keyCode = event.which;
  if (keyCode == 116) {
    transition();
  }
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
  textures.push(await Promise.resolve(loader.loadAsync('./resources/test1.jpg')));
  textures.push(await Promise.resolve(loader.loadAsync('./resources/test2.jpg')));
  textures.push(await Promise.resolve(loader.loadAsync('./resources/test3.jpeg')));

  transitionMat = new THREE.MeshBasicMaterial({
    map: textures[1],
  });

  currentMat = new THREE.MeshBasicMaterial({
    map: textures[0],
  });

  const geometry = new THREE.PlaneGeometry(0, 0, 10, 10);

  const plane1 = new THREE.Mesh(geometry, transitionMat);
  plane1.name = 'plane';
  plane1.position.z = 0;
  scene1.add(plane1);

  const plane2 = new THREE.Mesh(geometry, currentMat);
  plane2.name = 'plane';
  plane2.position.z = 0;
  scene2.add(plane2);
}

function addModel() {
  gltfLoader.load('./resources/models/210507__t5.glb', function (gltf) {
    var model = gltf.scene;
    model.scale.set(0.015, 0.015, 0.015);
    model.position.set(0, -2, 0);
    scene2.add(model);
  });
}

(async function () {
  init();
  addCamera();
  // await addPlane();
  addModel();
  addEffect();
  addGUI();
  update();
})();
