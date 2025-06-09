

  precision mediump float;
  //Our input texture
  uniform sampler2D uTexture; 
  uniform vec2 uResolution;

  uniform int tick;
  
  varying vec2 vUvs;
  
  

void swap(inout vec4 a, inout vec4 b)
{
    vec4 tmp = a;
    a = b;
    b = tmp;
}

  vec4 GetColorAtUv(vec2 p, vec2 _offset) {
    

            // Scale the offset down
            vec2 offset = vec2(_offset.x, _offset.y) / uResolution.xy;	
            // Apply offset and sample texture	 
            vec4 lookup = texture2D(uTexture, p + offset); 
            
            return lookup;
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

  vec2 marg_getBase(vec2 pos) {
    float offsetx = 0.0;
    float offsety = 0.0;
    switch(tick%4) {
      case 0:
        offsetx = 0.0; offsety = 0.0;
        break;
      case 1:
        offsetx = 1.0; offsety = 0.0;
        break;
      case 2:
        offsetx = 0.0; offsety = 1.0;
        break;
      case 3:
        offsetx = 1.0; offsety = 1.0;
        break;
      default:
        offsetx = 0.0; offsety = 0.0;
        break;
    }
    //TODO make this nicer
    return vec2(int((pos.x + offsetx)/2.0)*2 - int(offsetx), int((pos.y + offsety)/2.0)*2 - int(offsety));
  }

  void simulate_move(inout vec4 t00, inout vec4 t10, inout vec4 t01, inout vec4 t11) {
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
      } else if (t11.x < t01.x) {
        swap(t11, t01);
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
        if (tick%2 == 0) {
          t01 = FLAME_VEC;
        } else {
          t01 = SMOKE_VEC;
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

  void main() {
    vec2 pos = vec2(int(gl_FragCoord.x), int(gl_FragCoord.y));
    vec2 margBase = marg_getBase(pos);
    

    vec2 offset = pos - margBase;

    vec4 t00 = GetColorAt(margBase, vec2(0,0));
    vec4 t10 = GetColorAt(margBase, vec2(1,0));
    vec4 t01 = GetColorAt(margBase, vec2(0,1));
    vec4 t11 = GetColorAt(margBase, vec2(1,1));

    if (t00 == vec4(0.0,0.0,0.0,0.0) && t10 == vec4(0.0,0.0,0.0,0.0) && t01 == vec4(0.0,0.0,0.0,0.0) && t11 == vec4(0.0,0.0,0.0,0.0)) {
      gl_FragColor = vec4(0.0,0.0,0.0,0.0);
      return;
    }

    float r = random(vec3(margBase.x, margBase.y, tick));

    if (r < 0.5) {
      simulate_move(t00,t10,t01,t11);
      if (r < 0.25) {
        simulate_interact(t00,t10,t01,t11);
      } else {
        simulate_interact(t10,t00,t11,t01);
      }
    } else {
      // flip around vertical axis
      simulate_move(t10, t00, t11, t01);
      if (r < 0.75) {
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

    
  }