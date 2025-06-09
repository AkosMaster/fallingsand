//import * as THREE from "https://cdn.skypack.dev/three@0.146.0";

async function downloadFile(file) {
  let response = await fetch(file);
    
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
  width: 1920/3,
  height: 1080/3
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

const onWindowResize = () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    // camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //update uniforms
    quadMaterial.uniforms.uResolution.value.x = sizes.width
    quadMaterial.uniforms.uResolution.value.y = sizes.height
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

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const updateDirections = [
  new THREE.Vector2(1,0),
  new THREE.Vector2(1,1),
  new THREE.Vector2(0,1),
  new THREE.Vector2(-1,1),
  new THREE.Vector2(-1,0),
  new THREE.Vector2(-1,-1),
  new THREE.Vector2(0,-1),
  new THREE.Vector2(1,-1),
]
var tickCount = 0;

const tick = () => {
    tickCount++;
   // Explicitly set renderBufferA as the framebuffer to render to
   //the output of this rendering pass will be stored in the texture associated with renderBufferA
    renderer.setRenderTarget(renderBufferA)
    // This will contain the ping-pong accumulated texture
    renderer.render(bufferScene, camera)
    
    mesh.material.uniforms.uTexture.value = renderBufferA.texture;
    
    //This will set the default framebuffer (i.e. the screen) back to being the output
    renderer.setRenderTarget(null)
  //Render to screen
    renderer.render(scene, camera);
    
    // Ping-pong the framebuffers by swapping them
    // at the end of each frame render
    //Now prepare for the next cycle by swapping renderBufferA and renderBufferB
    //so that the previous frame's *output* becomes the next frame's *input*
    const temp = renderBufferA
    renderBufferA = renderBufferB
    renderBufferB = temp
    bufferMaterial.uniforms.uTexture.value = renderBufferB.texture;
    bufferMaterial.uniforms.tick.value = tickCount;

    
    //console.log(bufferMaterial.uniforms)

    // Call tick again on the next frame
    /*setTimeout(
    ()=>{window.requestAnimationFrame(tick)}
    , 2000)*/
    window.requestAnimationFrame(tick)

}

tick()
//setInterval(tick, 10);

/**
 * CREATE RANDOM NOISY TEXTURE
 */

function createDataTexture() {
  // create a buffer with color data

  var size = sizes.width * sizes.height;
  var data = new Uint8Array(4 * size);

  for (var i = 0; i < size; i++) {
    var stride = i * 4;

    var rand = Math.random();
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
