
  

  uniform uint tick;
  uniform vec4 brushType;
  uniform vec2 brushPos;
  uniform float brushScale;

  varying vec2 vUvs;
  


void swap(inout vec4 a, inout vec4 b)
{
    vec4 tmp = a;
    a = b;
    b = tmp;
}

  vec4 GetColorAt(vec2 _p, vec2 _offset) {
    // Scale the pos down
    vec2 p = vec2(_p.x, _p.y) / uResolution.xy; 
    // Scale the offset down
    vec2 offset = vec2(_offset.x, _offset.y) / uResolution.xy;  
    // Apply offset and sample texture   
    vec4 lookup = texture2D(uTexture, p + offset); 
            
    return lookup;
  }

  

  vec2 marg_getBase(int posx, int posy) {
    int offsetx = 0;
    int offsety = 0;
    switch(tick%4u) {
      case 0u:
        offsetx = 0; offsety = 0;
        break;
      case 1u:
        offsetx = 1; offsety = 0;
        break;
      case 2u:
        offsetx = 0; offsety = 1;
        break;
      case 3u:
        offsetx = 1; offsety = 1;
        break;
      default:
        offsetx = 0; offsety = 0;
        break;
    }
    //TODO make this nicer
    int ux = posx + offsetx;
    int uy = posy + offsety;
    ux -= ux%2;
    uy -= uy%2;
    return vec2(ux - offsetx, uy - offsety); //int((posx + offsetx)/2.0)*2, int((posy + offsety)/2.0)*2
  }

  float rand1;
  float rand2; // USED FOR: brush and creating particles
  float rand3; // USED FOR: fire creating smoke

  void simulate_move(inout vec4 t00, inout vec4 t10, inout vec4 t01, inout vec4 t11, float flip) {
    // SAND
    if (near(t01.w, SAND)) {
      if (t00.x < t01.x) {
        swap(t00, t01);
      } else if (t10.x < t01.x) {
        swap(t10, t01);
      }
    }

    // WATER
    if (near(t01.w, WATER)) {
      if (t00.x < t01.x) {
        swap(t00, t01);
      } else if (t10.x < t01.x) {
        swap(t10, t01);
      } else if (near(t01.z, flip)) {
        if (t11.x < t01.x) {
          swap(t11, t01);
        } else {
          t01.z = 1.0 - t01.z;
        }
      }
    }

    // SMOKE
    if (near(t00.w, SMOKE)) {
      if (t01.x < t00.x) {
        swap(t01, t00);
      } else if (t11.x < t00.x) {
        swap(t11, t00);
      } else if (t10.x < t00.x) {
        swap(t10, t00);
      }
    }

    // FLAME
    if (near(t00.w, FLAME)) {
      if (t11.x < t00.x) {
        swap(t11, t00);
      } else if (t10.x < t00.x) {
        swap(t10, t00);
      }
    }
  }

  void simulate_interact(inout vec4 t00, inout vec4 t10, inout vec4 t01, inout vec4 t11) {
    // FLAME
    if (near(t00.w, FLAME)) {
      if (near(t01.w, WOOD)) {
        if (rand3 < 0.9) {
          t01 = FLAME_VEC;
          t10.w += (rand2-0.5) * EPSILON;
        } else {
          t01 = SMOKE_VEC;
          t10.w += (rand2-0.5) * EPSILON;
        }
      }

      if (near(t10.w, WOOD)) {
        if (rand3 < 0.9) {
          t10 = FLAME_VEC;
          t10.w += (rand2-0.5) * EPSILON;
        } else {
          t10 = SMOKE_VEC;
          t10.w += (rand2-0.5) * EPSILON;
        }
      }

      t00.z -= 0.01;
      if (t00.z <= 0.0) {
        t00 = AIR_VEC;
      }

    }
  }

  float random (vec3 seed)
  {
    return fract(sin(dot(seed,vec3(12.9898,78.233, 89.5435)))*43758.5453123);
  }
  

  void brush() {
    if (dot(gl_FragCoord.xy - brushPos, gl_FragCoord.xy - brushPos) < brushScale*brushScale) { 
      gl_FragColor = brushType;
      gl_FragColor.w += (rand2-0.5) * EPSILON;
    }
    
  }

  void main() {

    rand1 = random(vec3(gl_FragCoord.x, gl_FragCoord.y, (tick+51u)%999u));
    rand2 = random(vec3(gl_FragCoord.x, gl_FragCoord.y, (tick+191u)%777u));
    rand3 = random(vec3(gl_FragCoord.x, gl_FragCoord.y, (tick+5u)%123u));

    vec2 pos = vec2(int(gl_FragCoord.x), int(gl_FragCoord.y));
    vec2 margBase = marg_getBase(int(gl_FragCoord.x), int(gl_FragCoord.y));

    vec2 offset = pos - margBase;

    vec4 t00 = GetColorAt(margBase, vec2(0,0));
    vec4 t10 = GetColorAt(margBase, vec2(1,0));
    vec4 t01 = GetColorAt(margBase, vec2(0,1));
    vec4 t11 = GetColorAt(margBase, vec2(1,1));

    if (t00 == vec4(0.0,0.0,0.0,0.0) && t10 == vec4(0.0,0.0,0.0,0.0) && t01 == vec4(0.0,0.0,0.0,0.0) && t11 == vec4(0.0,0.0,0.0,0.0)) {
      gl_FragColor = vec4(0.0,0.0,0.0,0.0);
      brush();
    } else {

      // this random should only be used here, it is important that this is mostly independent
      float rand4 = random(vec3(margBase.x, margBase.y, tick%1000u));

      if (rand4 < 0.5) {
        simulate_move(t00,t10,t01,t11, 0.0);
        if (rand4 < 0.25) {
          simulate_interact(t00,t10,t01,t11);
        } else {
          simulate_interact(t10,t00,t11,t01);
        }
      } else {
        // flip around vertical axis
        simulate_move(t10, t00, t11, t01, 1.0);
        if (rand4 < 0.75) {
          simulate_interact(t01,t11,t00,t10);
        } else {
          simulate_interact(t11,t01,t10,t00);
        }
      }

      if (offset.x < 0.5 && offset.y < 0.5) {
        gl_FragColor = t00;
      } else if (offset.x < 0.5 && offset.y > 0.5) {
        gl_FragColor = t01;
      } else if (offset.x > 0.5 && offset.y < 0.5) {
        gl_FragColor = t10;
      } else {
       gl_FragColor = t11;
      }

      brush();
    }
  }