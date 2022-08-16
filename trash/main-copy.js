// scss読み込み
import '../stylesheets/vendors/css-reset.css';
import '../stylesheets/style.scss';

// jsライブラリー読み込み
import $ from 'jquery';
import { scrollify } from 'jquery-scrollify/jquery.scrollify';
import * as THREE from 'three';
import vertexShader from './shader/vertex.glsl';
import fragmentShader from './shader/fragment.glsl';
import { gsap } from 'gsap';
import { sample } from 'lodash';

// // スクロールアニメーション
// $(function () {
//   $.scrollify({
//     section: '.slide',
//   });
// });

// const slideSections = document.querySelectorAll('.slide');

// // 必要な数値データを設定
// let data = {
//   current: 0,
//   next: 1,
//   total: slideSections.length - 1,
//   delta: 0,
// };

// // stateを定義
// let state = {
//   animating: false,
// };

// let testUniforms = {
//   value: 0,
// };

// let oo = 0;
// console.log(oo);
// window.addEventListener('wheel', nextSlide(), { passive: true });
// function nextSlide() {
//   oo++;
//   console.log(oo);
//   console.log('nextSlide Call!');
//   console.log(data.current);

//   if (state.animating) return;
//   console.log('in');
//   nextActive();
//   console.log(state.animating);
//   state.animating = true;
//   console.log(state.animating);

//   data.current = data.current === data.total ? 0 : data.current + 1;
//   data.next = data.current === data.total ? 0 : data.current + 1;
//   console.log(state);
//   console.log(data);
// }

// function nextActive() {
//   console.log('nextActive Call!');
//   gsap.to(testUniforms, {
//     duration: 1,
//     value: 1,
//     ease: 'expo.inOut',
//     onComplete: () => {
//       testUniforms.value = 0;
//       state.animating = false;
//       console.log('comp');
//       console.log(state);
//     },
//   });
// }

// function setSlide() {
//   slideSections.forEach((slide, index) => {
//     if (index === 0) return;
//     gsap.set(slide, { autoAlpha: 0 });
//   });
// }

// THREE.js
class Slider {
  constructor() {
    //  関数のthisの束縛
    this.bindAll();

    // ******************************************************************************
    this.vert = vertexShader;
    this.frag = fragmentShader;

    // // DOMの取得
    this.el = document.querySelector('.js-slide');
    this.myCanvas = document.querySelector('#canvas');

    // 変数の初期化
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // 必要な数値データを設定
    this.data = {
      current: 0,
      next: 1,
      delta: 0,
    };

    // stateを定義
    this.state = {
      animating: false,
      text: false,
      initial: true,
    };

    // テクスチャの初期化
    this.textures = null;

    // init処理を実施
    this.init();
  }

  bindAll() {
    // 配列に指定した関数名をbindしている => this.nrextSlide.bind(this)という形
    ['render'].forEach((fn) => (this[fn] = this[fn].bind(this)));
  }

  setup() {
    // シーンの追加
    this.scene = new THREE.Scene();
    // レンダラーの追加
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.myCanvas,
      // alpha: true,
    });
    // レンダラーのサイズを調整
    // https://ics.media/tutorial-three/renderer_resize/
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // innerに子要素の末尾にrenndererを追加する
    // this.inner.appendChild(this.renderer.domElement);

    this.renderer.setClearColor(0x000000);
  }

  cameraSetup() {
    // OrthographicCamera：遠近感のないカメラを追加
    // new THREE.OrthographicCamera(left, right, top, bottom, near, far)
    // this.camera = new THREE.OrthographicCamera(
    //   this.el.offsetWidth / -2,
    //   this.el.offsetWidth / 2,
    //   this.el.offsetHeight / 2,
    //   this.el.offsetHeight / -2,
    //   1,
    //   1000
    // );

    // // lookAt()はcameraがscene.position(0, 0, 0)、ようは原点を見るように設定
    // this.camera.lookAt(this.scene.position);
    // // z軸に対して少し移動
    // this.camera.position.z = 1;

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.z = 30;
  }

  async createMesh() {
    const texLoader = new THREE.TextureLoader();
    const texture = await texLoader.loadAsync('/images/spring.jpg');
    const material = new THREE.MeshBasicMaterial({ map: texture });

    // const geometry = new THREE.PlaneBufferGeometry(
    //   this.el.offsetWidth,
    //   this.el.offsetHeight,
    //   1
    // );

    const geometry = new THREE.PlaneGeometry(40, 20);
    // const geometry = new THREE.TorusGeometry(10, 3, 200, 20);
    // メッシュの作成　geometryとmaterialを追加
    const mesh = new THREE.Mesh(geometry, material);
    // const mesh = new THREE.Mesh(geometry, material);
    // メッシュをシーンに追加
    this.scene.add(mesh);
  }

  render() {
    // this.render()を使いシーンとカメラをレンダリング
    this.renderer.render(this.scene, this.camera);
  }

  animation() {
    let i = 0;
    requestAnimationFrame(this.animation.bind(this));

    this.renderer.render(this.scene, this.camera);
  }

  init() {
    this.setup();
    this.cameraSetup();
    this.createMesh();
    // this.render();
    this.animation();
  }
}
// const slider = new Slider();

class SlideChange {
  constructor() {
    this.canvas = document.querySelector('#canvas');
    this.image = '../images/spring.jpg';
    this.inner = document.querySelector('.slider__inner');

    this.init();
  }

  createScene() {
    this.scene = new THREE.Scene();
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.z = 100;
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      // canvas: this.canvas,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000);
    this.inner.appendChild(this.renderer.domElement);
  }

  createMesh() {
    const geometry = new THREE.PlaneGeometry(40, 20);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  async createMeshTex() {
    // this.geometry = new THREE.PlaneGeometry(10, 10);
    this.geometry = new THREE.PlaneBufferGeometry(
      window.innerWidth / 2,
      window.innerHeight / 2,

      1
    );
    this.texLoader = new THREE.TextureLoader();
    this.texLoader.crossOrigin = '';
    // const texture = texLoader.load('/images/spring.jpg');

    this.texture = await this.texLoader.loadAsync(this.image);
    this.material = new THREE.MeshBasicMaterial({ map: this.texture });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  render() {
    // this.render()を使いシーンとカメラをレンダリング
    this.renderer.render(this.scene, this.camera);
  }

  animation() {
    let i = 0;
    requestAnimationFrame(this.animation.bind(this));

    this.renderer.render(this.scene, this.camera);
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    // this.createMesh();
    this.createMeshTex();
    this.animation();
    // this.render();
  }
}

const slideChange = new SlideChange();

// init();
async function init() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const canvasElement = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvasElement,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);

  const geometry = new THREE.PlaneGeometry(40, 20);
  const texLoader = new THREE.TextureLoader();
  const texture = await texLoader.loadAsync('/images/spring.jpg');
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 30;

  let i = 0;
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
}
