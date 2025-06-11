
  
  precision mediump float;
  uniform vec2 uResolution;
  uniform sampler2D uTexture; 

  #define EPSILON 0.05

  #define AIR    0.0
  #define SAND   0.1
  #define WATER  0.2
  #define WOOD   0.3
  #define SMOKE  0.4
  #define FLAME  0.5
  #define ACID   0.6
  #define IRON   0.7

  bool near(float x, float y) {
    return abs(x - y) < EPSILON;
  }

  

  #define AIR_VEC vec4(0.00, 0.0, 0.0, AIR)
  #define FLAME_VEC vec4(0.09, 0.0, 0.3, FLAME)
  #define SMOKE_VEC vec4(0.1, 0.0, 0.0, SMOKE)