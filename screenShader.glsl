
  precision mediump float;
//Our input texture
uniform sampler2D uTexture; 
  varying vec2 vUvs;

void main() {
    //special method to sample from texture
    vec4 initTexture = texture2D(uTexture, vUvs);

    vec4 color = initTexture.rgba;

    if (near(color.w, AIR)) {
      gl_FragColor = vec4(0.0,0.0,0.0, 1.0);
    } else if (near(color.w, SAND)) {
      gl_FragColor = vec4(194.0,178.0,128.0, 255.0)/255.0;
    } else if (near(color.w, WATER)) {
      gl_FragColor = vec4(0.0,0.0,128.0, 255.0)/255.0;
    } else if (near(color.w, WOOD)) {
      gl_FragColor = vec4(192.0,64.0,0.0, 255.0)/255.0;
    } else if (near(color.w, SMOKE)) {
      gl_FragColor = vec4(100.0,100.0,100.0, 255.0)/255.0;
    } else if (near(color.w, FLAME)) {
      gl_FragColor = vec4(160.0,0.0,0.0, 255.0)/255.0;
    }
}