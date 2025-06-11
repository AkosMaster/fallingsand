
//Our input texture

  varying vec2 vUvs;
  uniform vec2 screenSize;

  // we need to do this differently than in the computeShader, and I don't know why.
  // webGL works in mysterious ways...
  vec4 GetColorAtOffset(vec2 _offset) {
    
    vec2 offset = vec2(_offset.x, _offset.y) / uResolution.xy;  
    // Apply offset and sample texture   
    vec4 lookup = texture2D(uTexture, vUvs + offset); 
            
    return lookup;
  }

void main() {
    //special method to sample from texture
    vec4 initTexture = texture2D(uTexture, vUvs);

    vec4 color = initTexture.rgba;

    //TODO: make this nicer
    if (near(color.w, AIR)) {
      float mod = (color.w - AIR)/EPSILON;
      gl_FragColor = vec4(0.0,0.0,0.0, 1.0);
    } else if (near(color.w, SAND)) {
      float mod = (color.w - SAND)/EPSILON;
      gl_FragColor = vec4(194.0,178.0,128.0, 255.0)/255.0 + vec4(0.2, 0.2, 0.2, 0.0) * mod;
    } else if (near(color.w, WATER)) {
      float mod = (color.w - WATER)/EPSILON;
      gl_FragColor = vec4(/*255.0 * color.z + */0.0,0.0,128.0 + mod*10.0, 255.0)/255.0;
    } else if (near(color.w, WOOD)) {
      float mod = (color.w - WOOD)/EPSILON;
      gl_FragColor = vec4(139.0,90.0,43.0, 255.0)/255.0 + vec4(0.1, 0.1, 0.1, 0.0)/2.0 * mod;
    } else if (near(color.w, SMOKE)) {
      float mod = (color.w - SMOKE)/EPSILON;
      gl_FragColor = vec4(100.0,100.0,100.0, 255.0)/255.0 + vec4(0.3, 0.3, 0.3, 0.0)/2.0 * mod;
    } else if (near(color.w, FLAME)) {
      float mod = (color.w - FLAME)/EPSILON;
      if (mod > 0.0) {
        gl_FragColor = vec4(160.0,0.0,0.0, 255.0)/255.0;
      } else {
        gl_FragColor = vec4(226.0, 88.0, 34.0, 255.0)/255.0;
      }
    } else if (near(color.w, ACID)) {
      float mod = (color.w - ACID)/EPSILON;
      gl_FragColor = vec4(0.0,128.0 + mod*50.0, 0.0, 255.0)/255.0;
    } else if (near(color.w, IRON)) {
      float mod = (color.w - IRON)/EPSILON;
      gl_FragColor = vec4(50.0, 50.0, 50.0, 255.0)/255.0;
    }

    int depth = 16;
    for (int i = 1; i < 16; i++) {
      if (GetColorAtOffset(vec2(0,i)).w < EPSILON) {
        depth = i-1;
        break;
      }
    }
    gl_FragColor /= sqrt(float(depth)/16.0) + 0.5;

    gl_FragColor.w = color.w;

}