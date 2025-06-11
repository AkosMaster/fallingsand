//import * as THREE from "https://cdn.skypack.dev/three@0.146.0";

async function downloadFile(file) {
  let response = await fetch(file, {cache: "no-store"});
    
  if(response.status != 200) {
    throw new Error("Server Error");
  }
    
  // read response stream as text
  let text_data = await response.text();

  return text_data;
}

/**
 * Base
 */

// Scenes
const scene = new THREE.Scene();
const bufferScene = new THREE.Scene();

/**
 * Sizes
 */
const sizes = {
  width: 1920/8,
  height: 1080/8
};

/**
 * Textures
 */
const dataTexture = createDataTexture();

/**
 * Meshes
 */
// Geometry
const geometry = new THREE.PlaneGeometry(2, 2);

//Screen resolution
const resolution = new THREE.Vector3(
  sizes.width,
  sizes.height,
  window.devicePixelRatio
);

/**
 * Render Buffers
 */
// Create a new framebuffer we will use to render to
// the video card memory
let renderBufferA = new THREE.WebGLRenderTarget(
    sizes.width,
    sizes.height,
    {
        // In this demo UV coordinates are float values in the range of [0,1]. 
        // If you render these values into a 32bit RGBA buffer (a render target in format RGBA and type UnsignedByte), you will lose precision since you can only store 8 bit (256 possible integer values) per color channel. 
        // This loss is visible if you use the sampled uv coordinates for a texture fetch.
        // You can fix the issue if you add this parameter when creating the render target type: THREE.FloatType. 
        // The underlying texture is now a float texture that can hold your uv coordinates and retain precision.
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        stencilBuffer: false
    }
)

let renderBufferB = new THREE.WebGLRenderTarget(
    sizes.width,
    sizes.height,
    {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        stencilBuffer: false
    }
)

// Buffer Material
const bufferMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: dataTexture },
        uResolution: {
            value: resolution
        },
        tick: {
          value: 0
        },
        brushType: {
          value: new THREE.Vector4(0.0,0.0,0.0,0.0)
        },
        brushPos: {
          value: new THREE.Vector2(0.0,0.0)
        },
        brushScale: {
          value: 0
        }
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: await downloadFile("common.glsl") + await downloadFile("computeShader.glsl")
});

//Screen Material
const quadMaterial = new THREE.ShaderMaterial({
  uniforms: {
    //The screen will receive it's texture from our off screen framebuffer
    uTexture: { value: null },
    uResolution: {
      value: resolution
    },
    screenSize: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    }
  },
  vertexShader: document.getElementById("vertexShader").textContent,
  fragmentShader: await downloadFile("common.glsl") + await downloadFile("screenShader.glsl")
});

// Meshes
const mesh = new THREE.Mesh(geometry, quadMaterial);
scene.add(mesh)

// Meshes
const bufferMesh = new THREE.Mesh(geometry, bufferMaterial);
bufferScene.add(bufferMesh)
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
var canvasElement = document.body.appendChild(renderer.domElement);
canvasElement.style.top = "0px";
canvasElement.style.left = "0px";
canvasElement.style.position="absolute";

//var context = canvasElement.getContext("webgl2", {preserveDrawingBuffer: true});

const onWindowResize = () => {
    /*// Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    // camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    //renderer.setSize(sizes.width, sizes.height)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //update uniforms
    quadMaterial.uniforms.uResolution.value.x = sizes.width
    quadMaterial.uniforms.uResolution.value.y = sizes.height*/
}

window.addEventListener('resize', onWindowResize)

/**
 * Camera
 */
// Base camera
const camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);


/**
 * Animate
 */

var tickCount = 0;

const tick = () => {
    

    var iters = 4;
    for (var i = 0; i < iters; i++) {
      tickCount++;
      // Explicitly set renderBufferA as the framebuffer to render to
      //the output of this rendering pass will be stored in the texture associated with renderBufferA
      renderer.setRenderTarget(renderBufferA)
      // This will contain the ping-pong accumulated texture
      renderer.render(bufferScene, camera)
    
      mesh.material.uniforms.uTexture.value = renderBufferA.texture;
    
      if (i == iters-1) {
        //This will set the default framebuffer (i.e. the screen) back to being the output
        renderer.setRenderTarget(null)
        //Render to screen
        renderer.render(scene, camera);
        
      }

      // Ping-pong the framebuffers by swapping them
      // at the end of each frame render
      //Now prepare for the next cycle by swapping renderBufferA and renderBufferB
      //so that the previous frame's *output* becomes the next frame's *input*
      const temp = renderBufferA
      renderBufferA = renderBufferB
      renderBufferB = temp
      bufferMaterial.uniforms.uTexture.value = renderBufferB.texture;
      bufferMaterial.uniforms.tick.value = tickCount;
    
    }
    //console.log(bufferMaterial.uniforms)

    // Call tick again on the next frame
    /*setTimeout(
    ()=>{window.requestAnimationFrame(tick)}
    , 2000)*/
    /*var imgd = context.getImageData(cursorX, cursorY, 1, 1);
    var pix = imgd.data;
    console.log(pix)*/

    /*var ctx = context
    const pixels = new Uint8Array(1 * 1 * 4);
    ctx.readPixels(0,0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels)
    document.getElementById("colorDisp").innerHTML = pixels[0].toString() + " " + pixels[1].toString() + " " + pixels[2].toString() + " " + (pixels[3]).toString();
*/
    window.requestAnimationFrame(tick)


    // w/h: width/height of the region to read
    // x/y: bottom-left corner of that region
    
}

tick()

/* CONTROLS */
var cursorX = 0;
var cursorY = 0;
document.addEventListener('mousemove', function(event) {
    bufferMaterial.uniforms.brushPos.value = new THREE.Vector2(event.clientX * sizes.width/window.innerWidth,sizes.height - event.clientY*sizes.height/window.innerHeight);
    cursorX = event.clientX;
    cursorY = /*window.innerHeight - */event.clientY;
});

var brushScale = 1;
renderer.domElement.addEventListener('mousedown', function(event) {
    bufferMaterial.uniforms.brushScale.value = brushScale;
});

renderer.domElement.addEventListener('mouseup', function(event) {
    bufferMaterial.uniforms.brushScale.value = 0;
});

document.addEventListener('keydown', function(event) {
  console.log(event.key);
  switch(event.key) {
    case '+':
      brushScale++;
      if (bufferMaterial.uniforms.brushScale.value > 0) {
        bufferMaterial.uniforms.brushScale.value = brushScale;
      }
      break;
    case '-':
      if (brushScale > 1) {
        brushScale--;
        if (bufferMaterial.uniforms.brushScale.value > 0) {
          bufferMaterial.uniforms.brushScale.value = brushScale;
        }
      }
      break;
  }
});

/**
 * CREATE RANDOM NOISY TEXTURE
 */

function createDataTexture() {
  // create a buffer with color data

  var size = sizes.width * sizes.height;
  var data = new Uint8Array(4 * size);

  for (var i = 0; i < size; i++) {
    var stride = i * 4;

    var rand = 1//Math.random();
    if (rand < 0.5) {
      data[stride] = 255*0.5;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 255*0.1;
    } else if (rand < 0.53) {
      data[stride] = 255*0.25;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 255*0.2;
    } else if (rand < 0.7) {
      data[stride] = 255*1;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 255*0.3;
    } else if (rand < 0.72) {
      data[stride] = 255*0.09;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 255*0.5;
    } else {
      data[stride] = 0;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 0;
    }
  }

  // used the buffer to create a DataTexture

  console.log(data);
  var texture = new THREE.DataTexture(
    data,
    sizes.width,
    sizes.height,
    THREE.RGBAFormat
  );

  // just a weird thing that Three.js wants you to do after you set the data for the texture
  texture.needsUpdate = true;
  return texture;
}

/* ELEMENT SELECTOR */

var elements = [
  new THREE.Vector4(0.0,0.0,0.0,0.0), //AIR
  new THREE.Vector4(0.5,0.0,0.0,0.1), //SAND
  new THREE.Vector4(0.25,0.0,0.0,0.2), //WATER
  new THREE.Vector4(1.0,0.0,0.0,0.3), //WOOD
  new THREE.Vector4(0.1,0.0,0.0,0.4), //SMOKE
  new THREE.Vector4(0.09,0.0,0.3,0.5), //FLAME
  new THREE.Vector4(0.25,0.0,0.0,0.6), //ACID
  new THREE.Vector4(1.0,0.0,0.0,0.7), //IRON
]

var elementColors = [
  new THREE.Vector4(0.0,0.0,0.0,0.0), //AIR
  new THREE.Vector4(194.0,178.0,128.0, 255.0), //SAND
  new THREE.Vector4(0.0,0.0,128.0, 255.0), //WATER
  new THREE.Vector4(139.0,90.0,43.0, 255.0), //WOOD
  new THREE.Vector4(100.0,100.0,100.0, 255.0), //SMOKE
  new THREE.Vector4(160.0,0.0,0.0, 255.0), //FLAME
  new THREE.Vector4(0.0,128.0,0.0, 255.0), //ACID
  new THREE.Vector4(50.0,50.0,50.0, 255.0) //IRON
]

for (var i = 0; i < elements.length; i++) {
  var vec = elementColors[i];
  
  var btn = document.createElement("BUTTON"); 
  btn.style.position="absolute";
  btn.style.width = "50px";
  btn.style.height = "50px";
  btn.style.left = (15 + 60*i).toString() + "px";
  btn.style.zIndex = "1";
  btn.style.background = "rgb(" + (vec.x).toString() + ", " + (vec.y).toString() + ", " + (vec.z).toString() + ")";

  btn.element = elements[i];

  btn.onclick = function () {
    console.log(bufferMaterial.uniforms.brushType.value)
    console.log(this.element)
    bufferMaterial.uniforms.brushType.value = this.element;
  }

  document.body.appendChild(btn);
}


