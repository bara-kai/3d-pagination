import '../stylesheets/vendors/css-reset.css';
// import '../stylesheets/style.scss';
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
import { sample, times, update } from 'lodash';

class Slider {
  constructor() {
    this.bindAll();

    this.vert = vertexShader;
    this.frag = fragmentShader;

    this.el = document.querySelector('.js-slider');
    this.inner = this.el.querySelector('.js-slider__inner');
    this.slides = [...this.el.querySelectorAll('.js-slide')];

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

    this.data = {
      current: 0,
      next: 1,
      prev: this.images.length - 1,
      total: this.images.length - 1,
      delta: 0,
    };

    this.state = {
      animating: false,
      text: false,
      initial: true,
    };

    this.textures = null;

    this.init();
  }

  bindAll() {
    ['render', 'nextSlide'].forEach((fn) => (this[fn] = this[fn].bind(this)));
  }

  setStyles() {
    this.slides.forEach((slide, index) => {
      if (index === 0) return;

      gsap.set(slide, { autoAlpha: 0 });
    });
  }

  cameraSetup() {
    this.camera = new THREE.OrthographicCamera(
      this.el.offsetWidth / -2,
      this.el.offsetWidth / 2,
      this.el.offsetHeight / 2,
      this.el.offsetHeight / -2,
      1,
      1000
    );

    this.camera.lookAt(this.scene.position);
    this.camera.position.z = 1;
  }

  setup() {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock(true);

    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight);

    this.inner.appendChild(this.renderer.domElement);
  }

  loadTextures() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = '';

    this.textures = [];
    this.images.forEach((image, index) => {
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
    });

    // ノイズ
    this.disp = loader.load('../images/noise_1.png', this.render);
    this.disp.magFilter = this.disp.minFilter = THREE.LinearFilter;
    this.disp.wrapS = this.disp.wrapT = THREE.RepeatWrapping;
  }

  createMesh() {
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        dispPower: { type: 'f', value: 0.0 },
        intensity: { type: 'f', value: 0.1 },
        res: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        wheel: { value: 1 },
        size: { value: new THREE.Vector2(1, 1) },
        texCurrent: { type: 't', value: this.textures[0] },
        texNext: { type: 't', value: this.textures[1] },
        disp: { type: 't', value: this.disp },
      },
      transparent: true,
      vertexShader: this.vert,
      fragmentShader: this.frag,
    });

    const geometry = new THREE.PlaneBufferGeometry(
      this.el.offsetWidth,
      this.el.offsetHeight,
      1
    );

    const mesh = new THREE.Mesh(geometry, this.mat);

    this.scene.add(mesh);
  }

  transitionNext() {
    // wheelのup,downで呼び出す処理を変更
    if (this.wheelY > 0) {
      this.mat.uniforms.wheel.value = 1;
      this.wheelUpTexture();
    } else if (this.wheelY < 0) {
      this.mat.uniforms.wheel.value = 0;
      this.wheelDownTexture();
    }

    gsap.to(this.mat.uniforms.dispPower, {
      duration: 2.0,
      value: 1,
      ease: 'Expo.easeInOut',
      onUpdate: this.render,
      onComplete: () => {
        this.mat.uniforms.dispPower.value = 0.0;
        this.render.bind(this);
        this.state.animating = false;
      },
    });
  }

  nextSlide(e) {
    if (this.state.animating) return;

    this.state.animating = true;
    this.wheelY = e.deltaY;

    this.transitionNext();

    // wheelのup,downでdataを変更
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

  // 元画像と変更画像を定義　変更先：next画像
  wheelUpTexture() {
    this.mat.uniforms.texCurrent.value = this.textures[this.data.current];
    this.mat.uniforms.texNext.value = this.textures[this.data.next];
  }
  // 元画像と変更画像を定義　変更先：prev画像
  wheelDownTexture() {
    this.mat.uniforms.texCurrent.value = this.textures[this.data.current];
    this.mat.uniforms.texNext.value = this.textures[this.data.prev];
  }

  listeners() {
    window.addEventListener('wheel', this.nextSlide, { passive: true });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  init() {
    this.setup();
    this.cameraSetup();
    this.loadTextures();
    this.createMesh();
    this.setStyles();
    this.render();
    this.listeners();
  }
}

// Toggle active link
const links = document.querySelectorAll('.js-nav a');

links.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    links.forEach((other) => other.classList.remove('is-active'));
    link.classList.add('is-active');
  });
});

// Init classes
const slider = new Slider();
