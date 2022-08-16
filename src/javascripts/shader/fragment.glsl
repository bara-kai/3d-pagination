   varying vec2 vUv;

    uniform sampler2D disp;
    uniform sampler2D texCurrent;
    uniform sampler2D texNext;

    uniform float dispPower;
    uniform float intensity;
    uniform float wheel;

    uniform vec2 size;
    uniform vec2 res;

    vec2 backgroundCoverUv( vec2 screenSize, vec2 imageSize, vec2 uv ) {
      float screenRatio = screenSize.x / screenSize.y;
      float imageRatio = imageSize.x / imageSize.y;
      vec2 newSize = screenRatio < imageRatio 
          ? vec2(imageSize.x * (screenSize.y / imageSize.y), screenSize.y)
          : vec2(screenSize.x, imageSize.y * (screenSize.x / imageSize.x));
      vec2 newOffset = (screenRatio < imageRatio 
          ? vec2((newSize.x - screenSize.x) / 2.0, 0.0) 
          : vec2(0.0, (newSize.y - screenSize.y) / 2.0)) / newSize;
      return uv * screenSize / newSize + newOffset;
    }

    void main() {
      vec2 uv = vUv;
      
      vec4 disp = texture2D(disp, uv);
      // x軸y軸のズレを調整
      vec2 dispVec = vec2(disp.x * 0.0, disp.y * 5.0);
      
      vec2 distPos1 = uv + (dispVec * intensity* 0.5 * dispPower);
      // 条件分岐するために仮定義
      vec2 distPos2 =  vec2(0.0, 0.0);

    // wheelのup、downで切り替えの向きを変更
      if (wheel > 0.0) {
        distPos2 = uv + (dispVec * (intensity * (1.0 - dispPower)));
      } else {
        distPos2 = uv + -(dispVec * (intensity * (1.0 - dispPower)));
      }
    
      
      vec4 _texCurrent = texture2D(texCurrent, distPos1);
      vec4 _texNext = texture2D(texNext, distPos2);
      
      gl_FragColor = mix(_texCurrent, _texNext, dispPower);
    }