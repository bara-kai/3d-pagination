import '../stylesheets/vendors/css-reset.css';
// import '../stylesheets/style.scss';
import '../stylesheets/style.scss';

import '../images/hero.png';
import '../images/sakura_nega.jpg';
import '../images/azisai_nega.jpg';
import '../images/momizi_nega.jpg';
import '../images/uem_nega.jpg';
import '../images/displavement/noise_1.png';

// jsライブラリー読み込み
import $, { get } from 'jquery';
import { scrollify } from 'jquery-scrollify/jquery.scrollify';
import * as THREE from 'three';
import vertexShader from './shader/vertex.glsl';
import fragmentShader from './shader/fragment.glsl';
import { gsap } from 'gsap';
import { constant, sample, times, update } from 'lodash';
import { Material, NoBlending } from 'three';

window.onload = function () {
  const spinner = document.getElementById('loading');
  spinner.classList.add('loaded');
};

class Slider {
  constructor() {
    this.bindAll();

    this.vert = vertexShader;
    this.frag = fragmentShader;

    this.el = document.querySelector('.js-slider');
    this.inner = this.el.querySelector('.js-slider__inner');
    this.slides = [...this.el.querySelectorAll('.js-slide')];

    // 画面要素
    this.centerNavs = document.querySelectorAll('.center-nav__item');
    this.centerNav = document.querySelector('.center-nav');

    this.subNavs = document.querySelectorAll('.sub-nav__item');
    this.centerLine = document.querySelector('.center-line');
    this.rotateLink = document.querySelector('.rotate-link');
    this.alphaContent = [];
    this.alphaContent.push(
      this.centerNavs,
      this.subNavs,
      this.centerLine,
      this.rotateLink
    );

    this.renderer = null;
    this.scene = null;
    this.clock = null;
    this.camera = null;

    this.images = [
      '../images/hero.png',
      '../images/sakura_nega.jpg',
      '../images/azisai_nega.jpg',
      '../images/momizi_nega.jpg',
      '../images/uem_nega.jpg',
    ];

    this.data = {
      current: 0,
      next: 1,
      prev: this.images.length - 1,
      total: this.images.length - 1,
      delta: 0,
    };

    this.state = {
      animating: true,
      text: false,
      initial: true,
      currentHero: true,
    };

    this.textures = null;

    this.init();
  }

  bindAll() {
    ['render', 'nextSlide'].forEach((fn) => (this[fn] = this[fn].bind(this)));
  }

  setStyles() {
    const heroText = document.querySelectorAll('.js-slider__text.hero__text');

    this.slides.forEach((slide, index) => {
      if (index === 0) return;

      gsap.set(slide, { autoAlpha: 0 });
    });

    this.alphaContent.forEach((el) => {
      gsap.set(el, { autoAlpha: 0 });
    });

    gsap.fromTo(
      heroText,
      {
        alpha: 0,
      },
      {
        alpha: 1,
        duration: 2,
        onComplete: () => {
          this.state.animating = false;
        },
      },
      1
    );
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
        intensity: { type: 'f', value: 0.5 },
        res: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        wheel: { value: 1 },
        size: { value: new THREE.Vector2(1, 1) },
        texCurrent: { type: 't', value: this.textures[0] },
        texNext: { type: 't', value: this.textures[1] },
        disp: { type: 't', value: this.disp },
        uTick: 0,
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

  transitionNextAnimation() {
    if (this.wheelY > 0) {
      this.current = this.slides[this.data.current];
      this.next = this.slides[this.data.next];
      this.nData = this.data.next;
      this.cY = -100;
      this.nY = 100;
    } else if (this.wheelY < 0) {
      this.current = this.slides[this.data.current];
      this.next = this.slides[this.data.prev];
      this.nData = this.data.prev;
      this.cY = 100;
      this.nY = -100;
    }

    // center-nabのアクティブ設定
    this.setActive('.center-nav__item');
    // sub-nabのアクティブ設定
    this.setActive('.sub-nav__item');

    // hero__text
    const cHeroText = this.current.querySelector('.js-slider__text.hero__text');
    const nHeroText = this.next.querySelector('.js-slider__text.hero__text');

    // main__text
    const cMainText = this.current.querySelector('.js-slider__text.main__text');
    const nMainText = this.next.querySelector('.js-slider__text.main__text');

    // img
    const cImg = this.current.querySelector('.slider__image img');
    const nImg = this.next.querySelector('.slider__image img');

    // content
    const cContent = this.current.querySelector('.slider__content .more');
    const nContent = this.next.querySelector('.slider__content .more');

    if (this.state.currentHero) {
      this.state.currentHero = false;
    } else if (this.nData === 0) {
      this.state.currentHero = true;
    }

    // centernav
    this.centernavAnimation();

    // timeline
    const tl = new gsap.timeline({ paused: true });

    if (cHeroText) {
      tl.to(cHeroText, {
        duration: 1.5,
        alpha: 0,
        ease: 'Power4.easeInOut',
      });
    }

    if (this.state.currentHero) {
      tl.fromTo(
        cMainText,
        {
          alpha: 1,
          y: 0,
        },
        {
          alpha: 0,
          y: this.cY,
          duration: 1.3,
          ease: 'Power4.easeInOut',
        }
      )
        .fromTo(
          cImg,
          {
            alpha: 1,
            y: 0,
          },
          {
            alpha: 0,
            y: this.cY,
            duration: 1.5,
            ease: 'Power4.easeInOut',
          },
          '<'
        )
        .fromTo(
          cContent,
          {
            alpha: 0.5,
          },
          {
            alpha: 0,
          },
          '<'
        )
        .to(
          this.centerNavs,
          {
            alpha: 0,
            duration: 0.5,
          },
          '<'
        )
        .to(
          this.subNavs,
          {
            alpha: 0,
            duration: 0.0,
          },
          '<'
        )
        .to(
          this.centerLine,
          {
            alpha: 0,
            duration: 0.5,
          },
          '<'
        )
        .to(
          this.rotateLink,
          {
            alpha: 0,
            duration: 0.5,
          },
          '<'
        );
    } else {
      tl.fromTo(
        cMainText,
        {
          alpha: 1,
          y: 0,
        },
        {
          alpha: 0,
          y: this.cY,
          duration: 1.3,
          ease: 'Power4.easeInOut',
        }
      )
        .fromTo(
          cImg,
          {
            alpha: 1,
            y: 0,
          },
          {
            alpha: 0,
            y: this.cY,
            duration: 1.5,
            ease: 'Power4.easeInOut',
          },
          '<'
        )
        .fromTo(
          cContent,
          {
            alpha: 0.5,
          },
          {
            alpha: 0,
          },
          '<'
        );
    }

    tl.set(this.current, {
      autoAlpha: 0,
    }).set(
      this.next,
      {
        autoAlpha: 1,
      },
      1.0
    );

    if (nHeroText) {
      tl.to(nHeroText, {
        duration: 2,
        alpha: 1,
      });
    }

    if (nMainText && nImg) {
      tl.fromTo(
        nMainText,
        {
          alpha: 0,
          y: this.nY,
        },
        {
          alpha: 1,
          y: 0,
          duration: 1,
          ease: 'Power4.easeInOut',
        },
        '<'
      )
        .fromTo(
          nImg,
          {
            alpha: 0,
            y: this.nY,
          },
          {
            alpha: 1,
            y: 0,
            duration: 1,
            ease: 'Power4.easeInOut',
          },
          '<'
        )
        .fromTo(
          nContent,
          {
            alpha: 0.5,
          },
          {
            alpha: 0.5,
            duration: 1,
          },
          '<'
        )
        .to(
          this.centerNavs,
          {
            autoAlpha: 1,
            duration: 1,
          },
          '<'
        )
        .to(
          this.subNavs,
          {
            autoAlpha: 1,
            duration: 0,
          },
          '<'
        )
        .to(
          this.centerLine,
          {
            autoAlpha: 1,
            duration: 1,
          },
          '<'
        )
        .to(
          this.rotateLink,
          {
            autoAlpha: 1,
            duration: 1,
          },
          '<'
        );
    }

    tl.play();
  }

  centernavAnimation() {
    if (!(this.nData === 0)) {
      const fsSize = window.innerWidth;

      const nNum = this.nData - 1;
      const constant = -(fsSize * 0.02 * nNum + (fsSize * 0.02 * nNum) / 2);

      gsap.to(this.centerNav, {
        y: constant,
        duration: 2,
        ease: 'Power4.easeInOut',
      });
    }
  }

  nextSlide(e) {
    if (this.state.animating) return;

    this.state.animating = true;
    this.wheelY = e.deltaY;

    this.transitionNext();
    this.transitionNextAnimation();

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

  setActive(el) {
    this.navs = document.querySelectorAll(el);
    if (!(this.nData === 0)) {
      this.navs.forEach((n) => {
        n.classList.remove('is-active');
      });

      const nav = this.navs[this.nData - 1];
      nav.classList.add('is-active');
    } else {
      this.navs.forEach((n) => {
        n.classList.remove('is-active');
      });
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

const slider = new Slider();

// rotate-link
class RotateAnimation {
  constructor(el) {
    this.DOM = {};
    this.DOM.el = el instanceof HTMLElement ? el : document.querySelector(el);
    this.chars = this.DOM.el.innerHTML.trim().split('');
    this.DOM.el.innerHTML = this._splitText();
    this._styleRotate();
  }

  _splitText() {
    return this.chars.reduce((acc, curr) => {
      curr = curr.replace(/\s+/, '&nbsp;');
      return `${acc}<span class="char">${curr}</span>`;
    }, '');
  }

  _styleRotate() {
    const chars = this.DOM.el.querySelectorAll('.char');
    const charsTotal = chars.length - 1;
    const incDeg = 240 / charsTotal;
    chars.forEach((char, index) => {
      let rotateDeg = incDeg * index;
      char.style.setProperty('transform', `rotate( ${rotateDeg}deg)`);
    });
  }
}

const roatteAnimation = new RotateAnimation('.rotate-link__rotate-text');
