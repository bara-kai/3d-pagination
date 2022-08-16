// scss読み込み
import '../stylesheets/vendors/css-reset.css';
import '../stylesheets/style.scss';

import '../images/hero.png';
import '../images/spring.jpg';
import '../images/summer.jpg';
import '../images/autumn.jpg';
import '../images/winter.jpg';
import '../images/displavement/noise_1.png';

// jsライブラリー読み込み
import $ from 'jquery';
import { scrollify } from 'jquery-scrollify/jquery.scrollify';
import * as THREE from 'three';
import vertexShader from './shader/vertex.glsl';
import fragmentShader from './shader/fragment.glsl';
import { gsap } from 'gsap';
import { sample, times } from 'lodash';

class SlideChange {
  constructor() {
    this.bindAll();

    this.vert = vertexShader;
    this.frag = fragmentShader;

    this.canvas = document.querySelector('#canvas');
    this.image = '../images/spring.jpg';
    this.el = document.querySelector('.slider');
    this.inner = this.el.querySelector('.slider__inner');
    this.slides = [...this.el.querySelectorAll('.slide')];

    // 変数の初期化
    this.renderer = null;
    this.scene = null;
    this.clock = null;
    this.camera = null;

    this.images = [
      '../images/hero.png',
      '../images/spring.jpg',
      '../images/summer.jpg',
      '../images/autumn.jpg',
      '../images/winter.jpg',
    ];

    // this.images = [
    //   'https://s3-us-west-2.amazonaws.com/s.cdpn.io/58281/bg1.jpg',
    //   'https://s3-us-west-2.amazonaws.com/s.cdpn.io/58281/bg2.jpg',
    //   'https://s3-us-west-2.amazonaws.com/s.cdpn.io/58281/bg3.jpg',
    //   'https://s3-us-west-2.amazonaws.com/s.cdpn.io/58281/bg1.jpg',
    //   'https://s3-us-west-2.amazonaws.com/s.cdpn.io/58281/bg2.jpg',
    // ];

    // 必要な数値データを設定
    this.data = {
      total: this.images.length - 1,
      current: 0,
      prev: this.images.length - 1,
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

    this.init();
  }

  bindAll() {
    // 配列に指定した関数名をbindしている => this.nrextSlide.bind(this)という形
    ['render', 'nextPrevSlide'].forEach(
      (fn) => (this[fn] = this[fn].bind(this))
    );
  }

  createScene() {
    this.scene = new THREE.Scene();
  }

  createCamera() {
    this.camera = new THREE.OrthographicCamera(
      this.el.offsetWidth / -2,
      this.el.offsetWidth / 2,
      this.el.offsetHeight / 2,
      this.el.offsetHeight / -2,
      1,
      1000
    );

    // lookAt()はcameraがscene.position(0, 0, 0)、ようは原点を見るように設定
    this.camera.lookAt(this.scene.position);
    // z軸に対して少し移動
    this.camera.position.z = 1;
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight);

    this.inner.appendChild(this.renderer.domElement);
  }

  async loadTextures() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = '';
    this.textures = [];
    this.images.forEach((image, index) => {
      const texture = loader.load(image, this.render);
      // const texture = loader.load(image + '?v=' + Date.now());

      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      if (index === 0 && this.mat) {
        this.mat.uniforms.size.value = [
          texture.image.naturalWidth,
          texture.image.naturalHeight,
        ];
      }
      this.textures.push(texture);
    });

    for (const [index, image] of this.images.entries()) {
      const texture = loader.load(image, this.render);
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      if (index === 0 && this.mat) {
        this.mat.uniforms.size.value = [
          texture.image.naturalWidth,
          texture.image.naturalHeight,
        ];
      }
      this.textures.push(texture);
    }

    // ノイズ画像の取得
    this.disp = await loader.loadAsync('../images/noise_1.png', this.render);
    // mapFIlter：テクセルが 1 ピクセル未満をカバーする場合のテクスチャのサンプリング方法
    // LinearFilter:縮小時にはディティールが失われるが、拡大時はブロックノイズが少なくなる高度なフィルタ
    this.disp.magFilter = this.disp.minFilter = THREE.LinearFilter;
    // リピート方法の指定。wrapS：x軸、wrapT：y軸
    this.disp.wrapS = this.disp.wrapT = THREE.RepeatWrapping;
  }

  createMesh() {
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        dispPower: { type: 'f', value: 0.0 },
        intensity: { type: 'f', value: 0.5 },
        res: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        size: { value: new THREE.Vector2(1, 1) },
        texture1: { type: 't', value: this.textures[0] },
        texture2: { type: 't', value: this.textures[1] },
        texturePrev: { type: 't', value: this.textures[4] },
        textureCurrent: { type: 't', value: this.textures[0] },
        textureNext: { type: 't', value: this.textures[1] },
        disp: { type: 't', value: this.disp },
      },
      transparent: true,
      vertexShader: this.vert,
      fragmentShader: this.frag,
    });

    const geometry = new THREE.PlaneBufferGeometry(
      this.el.offsetWidth,
      this.el.offsetHeight,
      700,
      400,
      1
    );

    this.mesh = new THREE.Mesh(geometry, this.mat);

    this.scene.add(this.mesh);
  }

  setStyles() {
    this.slides.forEach((slide, index) => {
      if (index === 0) return;

      gsap.set(slide, { autoAlpha: 0 });
    });
  }

  render() {
    // this.render()を使いシーンとカメラをレンダリング
    this.renderer.render(this.scene, this.camera);
  }

  listeners() {
    window.addEventListener('wheel', this.nextPrevSlide, { passive: true });
  }

  nextPrevSlide(e) {
    // 初回スクロールでリターン
    if (this.state.animating) return;
    // stateのanimatingプロパティをtrue
    this.state.animating = true;
    this.transitionNext();
    this.wheelY = e.deltaY;

    // スクロールに応じてdataのcurrentとnextの値を+1する。totalに達すると0に戻る処理
    if (this.wheelY > 0) {
      this.data.current =
        this.data.current === this.data.total ? 0 : this.data.current + 1;
      this.data.next =
        this.data.current === this.data.total ? 0 : this.data.current + 1;
      this.data.prev = this.data.current === 0 ? 4 : this.data.current - 1;
    } else if (this.wheelY < 0) {
      this.data.current =
        this.data.current === 0 ? this.data.total : this.data.current - 1;
      this.data.next =
        this.data.current === this.data.total ? 0 : this.data.current + 1;
      this.data.prev = this.data.current === 0 ? 4 : this.data.current - 1;
    }
  }

  transitionNext() {
    gsap.to(this.mat.uniforms.dispPower, {
      duration: 2.5,
      value: 1,
      ease: 'Expo.easeInOut',
      onUpdate: this.render,
      onComplete: () => {
        this.mat.uniforms.dispPower.value = 0.0;
        if (this.wheelY > 0) {
          this.wheelUpTexture();
        } else if (this.wheelY < 0) {
          this.wheelDownTexture();
        }
        this.render.bind(this);
        this.state.animating = false;
      },
    });

    const current = this.slides[this.data.current];
    const next = this.slides[this.data.next];

    const tl = new gsap.timeline({ paused: true });

    // tl.play();
  }

  wheelUpTexture() {
    this.mat.uniforms.texture1.value = this.textures[this.data.current];
    this.mat.uniforms.texture2.value = this.textures[this.data.next];
    console.log(this.mesh.material.uniforms);
  }

  wheelDownTexture() {
    this.mat.uniforms.texture1.value = this.textures[this.data.current];
    this.mat.uniforms.texture2.value = this.textures[this.data.prev];
  }

  animation() {
    requestAnimationFrame(this.animation.bind(this));
    // console.log(this.mat.uniforms.dispPower.value);
    this.renderer.render(this.scene, this.camera);
  }

  async creatThree() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild(renderer.domElement);
    this.inner.appendChild(renderer.domElement);

    // const geometry = new THREE.BoxGeometry();
    const geometry = new THREE.PlaneGeometry(20, 10);
    // const geometry = new THREE.SphereGeometry();
    // const geometry = new THREE.TorusGeometry(10, 3, 200, 20);
    const texLoader = new THREE.TextureLoader();
    const texture = await texLoader.loadAsync('../images/hero.png');
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 30;

    let i = 0;
    function animate() {
      requestAnimationFrame(animate);
      // console.log(i++);
      cube.rotation.x = cube.rotation.x + 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
    }

    animate();
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.loadTextures();
    this.createMesh();
    this.setStyles();
    this.render();
    this.listeners();
    // this.animation();
    // this.creatThree();
  }
}

// const slideChange = new SlideChange();

// init();
async function init() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // const geometry = new THREE.BoxGeometry();
  const geometry = new THREE.PlaneGeometry(20, 10);
  // const geometry = new THREE.SphereGeometry();
  // const geometry = new THREE.TorusGeometry(10, 3, 200, 20);
  const texLoader = new THREE.TextureLoader();
  const texture = await texLoader.loadAsync('../images/hero.png', () => {
    renderer.render(scene, camera);
  });
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // function render() {
  //   renderer.render(scene, camera);
  // }
  camera.position.z = 30;

  let i = 0;
  function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
  }

  // animate();
}
