let Render = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    xr: { enabled: true },
    antialias: false, // Disable antialiasing for performance
    powerPreference: "high-performance", // Use dedicated GPU
    precision: "lowp", // Use low precision for better performance
    logarithmicDepthBuffer: false,
    preserveDrawingBuffer: false
});

renderer.xr.enabled = true;

// Auto-enter VR when available
function tryEnterVR() {
    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                // Auto-request VR session with proper options
                navigator.xr.requestSession('immersive-vr', {
                    requiredFeatures: ['local-floor'],
                    optionalFeatures: ['bounded-floor']
                }).then((session) => {
                    renderer.xr.setSession(session);
                    
                    // Set up WebGL layer for VR
                    session.updateRenderState({ 
                        baseLayer: new XRWebGLLayer(session, renderer.getContext()) 
                    });
                    
                    // Don't mess with camera position - let VR handle it
                    
                    setupVRControllers();
                }).catch((error) => {
                    console.log('VR failed:', error);
                    // Try with basic tracking space
                    navigator.xr.requestSession('immersive-vr', {
                        requiredFeatures: ['viewer']
                    }).then((session) => {
                        renderer.xr.setSession(session);
                        
                        // Set up WebGL layer for basic VR
                        session.updateRenderState({ 
                            baseLayer: new XRWebGLLayer(session, renderer.getContext()) 
                        });
                        
                        setupVRControllers();
                    }).catch(() => {
                        console.log('VR not available');
                    });
                });
            }
        });
    }
}


const grassTexture1 = textureLoader.load('Grass.png');
const GrassMaterial = new THREE.MeshLambertMaterial({ map: grassTexture1 });
const dirtTexture1 = textureLoader.load('Dirt.png');
const dirtMaterial = new THREE.MeshLambertMaterial({ map: dirtTexture1 });
const playerSize = new THREE.Vector3(0.8, 2.5, 1);
const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
scene.fog = new THREE.Fog(0x87CEEB, 0, 60);
camera.add(listener);
ChangeBM();

const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const musicSound = new THREE.Audio(listener);

const MusicEnabled = true;

if (MusicEnabled)
{
  audioLoader.load('Songs/TheGoodNight.mp3', (buffer) => {
    musicSound.setBuffer(buffer);
    musicSound.setLoop(true);
    musicSound.setVolume(0.5);
    musicSound.play();
  });
}

let currentTime = 1;
const fullPeriod   = 20 * 60 * 1000;  // 20 minutes in ms
const halfPeriod   = fullPeriod / 2;   // 10 minutes

const start = performance.now();  

// Additional performance optimizations
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping; // Disable tone mapping for performance
renderer.info.autoReset = false; // Manual reset for better performance monitoring

// Set size and add to DOM
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Back to original chunk system

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Soft global light
scene.add(ambientLight);

let sunLight = new THREE.DirectionalLight(0xffffff, currentTime); // Sunlight
sunLight.position.set(100, 200, 100);
sunLight.castShadow = false; // No shadows
scene.add(sunLight);

renderer.shadowMap.enabled = false; // Disable all shadows

initControls(camera);
scene.add(controls.getObject());

// Simple VR setup - just like Vivecraft

const worldWidth = 100;
const worldDepth = 100;
const worldHeight = 1;

const blocks = [];


setupBlockActions(camera, blockGeometry, getCurrentMaterial);

// Set camera position normally (will be overridden by world data if available)
camera.position.set(worldWidth / 2, 10, worldDepth + 10);
camera.lookAt(worldWidth / 2, 0, worldDepth / 2);

// Function to start the game with proper UI setup
function startGame() {
    // Show game UI
    const hotbar = document.getElementById('hotbar');
    const crosshair = document.getElementById('crosshair');
    if (hotbar) hotbar.style.display = 'block';
    if (crosshair) crosshair.style.display = 'block';
    
    // Hide version overlay during gameplay
    const versionOverlay = document.getElementById('GameVersionOverlay');
    if (versionOverlay) versionOverlay.style.display = 'none';
    
    // Start rendering
    Render = true;
    
    // Start auto-save
    if (typeof worldManager !== 'undefined') {
        worldManager.startAutoSave(2); // Auto-save every 2 minutes
    }
    
    console.log('Game started');
}

// VR Controllers setup function
function setupVRControllers() {
    const controller1 = renderer.xr.getController(0); // Left controller
    const controller2 = renderer.xr.getController(1); // Right controller
    scene.add(controller1);
    scene.add(controller2);
    
    // Get controller input sources for joysticks and buttons
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    scene.add(controllerGrip1);
    scene.add(controllerGrip2);
    
    // Raycaster for VR controllers
    const vrRaycaster = new THREE.Raycaster();
    
    // Movement variables
    const moveSpeed = 0.1;
    let isMoving = false;

    // Controller events - Triggers
    controller1.addEventListener('selectstart', () => {
        // Left trigger - break blocks
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller1.matrixWorld);
        vrRaycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
        vrRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        
        const intersects = vrRaycaster.intersectObjects(getAllBlocks());
        
        if (intersects.length > 0) {
            const block = intersects[0].object;
            // If it's a light block, also remove its light
            if (block.userData.light) {
                block.parent.remove(block.userData.light);
            }
            block.parent.remove(block);
        }
    });

    controller2.addEventListener('selectstart', () => {
        // Right trigger - place blocks
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller2.matrixWorld);
        vrRaycaster.ray.origin.setFromMatrixPosition(controller2.matrixWorld);
        vrRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        
        const intersects = vrRaycaster.intersectObjects(getAllBlocks());
        
        if (intersects.length > 0) {
            const block = intersects[0].object;
            const normal = intersects[0].face.normal;
            const pos = block.position.clone().add(normal);
            
            const exists = getAllBlocks().some(b => b.position.equals(pos));
            if (!exists) {
                // Check if placing a light block
                if (getCurrentTexture() === Light1) {
                    const newBlock = createLightBlock(blockGeometry, pos, block.parent);
                } else {
                    const newMaterial = getCurrentMaterial();
                    const newBlock = new THREE.Mesh(blockGeometry, newMaterial);
                    newBlock.position.copy(pos);
                    block.parent.add(newBlock);
                }
            }
        }
    });
    
    // VR Movement and controls update function
    function updateVRControls() {
        const session = renderer.xr.getSession();
        if (!session) return;
        
        // Get input sources (controllers)
        for (const source of session.inputSources) {
            if (source.gamepad) {
                const gamepad = source.gamepad;
                
                // Left controller - movement with joystick
                if (source.handedness === 'left') {
                    const xAxis = gamepad.axes[2]; // Left joystick X
                    const yAxis = gamepad.axes[3]; // Left joystick Y
                    
                    if (Math.abs(xAxis) > 0.1 || Math.abs(yAxis) > 0.1) {
                        // Get camera direction for movement
                        const cameraDirection = new THREE.Vector3();
                        camera.getWorldDirection(cameraDirection);
                        
                        // Calculate movement direction
                        const right = new THREE.Vector3();
                        right.crossVectors(cameraDirection, camera.up).normalize();
                        
                        const forward = new THREE.Vector3();
                        forward.copy(cameraDirection);
                        forward.y = 0; // Keep movement horizontal
                        forward.normalize();
                        
                        // Simple movement - just like Vivecraft
                        const movement = new THREE.Vector3();
                        movement.addScaledVector(right, xAxis * moveSpeed);
                        movement.addScaledVector(forward, -yAxis * moveSpeed);
                        
                        // Move the camera directly
                        camera.position.add(movement);
                    }
                }
                
                // Right controller - block type switching with A button
                if (source.handedness === 'right') {
                    // A button is usually button index 4 on Quest controllers
                    if (gamepad.buttons[4] && gamepad.buttons[4].pressed) {
                        if (!isMoving) { // Prevent multiple presses
                            isMoving = true;
                            // Cycle through block types (simulate number key presses)
                            const blockTypes = ['1', '2', '3', '4', '5', '6', '7'];
                            const currentIndex = blockTypes.indexOf(getCurrentBlockType());
                            const nextIndex = (currentIndex + 1) % blockTypes.length;
                            simulateKeyPress('Digit' + blockTypes[nextIndex]);
                        }
                    } else {
                        isMoving = false;
                    }
                }
            }
        }
    }
    
    // Store the update function globally so we can call it from animate
    window.updateVRControls = updateVRControls;
}

// Helper function to get current block type
function getCurrentBlockType() {
    if (currentTexture === grassTexture) return '1';
    if (currentTexture === stoneTexture) return '2';
    if (currentTexture === dirtTexture) return '3';
    if (currentTexture === sandTexture) return '4';
    if (currentTexture === oakLogTexture) return '5';
    if (currentTexture === Leaves) return '6';
    if (currentTexture === glassTexture) return '7';
    return '1';
}

// Helper function to simulate key press for block switching
function simulateKeyPress(code) {
    const event = new KeyboardEvent('keydown', { code: code });
    document.dispatchEvent(event);
}

// Performance optimization variables
let frameCount = 0;
let lastChunkUpdate = 0;
const CHUNK_UPDATE_INTERVAL = 500; // Update chunks every 500ms instead of every frame
let lastPlayerChunkX = null;
let lastPlayerChunkZ = null;

// FPS Counter
let fpsCounter = 0;
let lastFpsUpdate = performance.now();
let currentFps = 0;

function animate() {
  frameCount++;
  fpsCounter++;
  
  if (Render) {
    // Only update expensive operations occasionally
    const now = performance.now();
    
    // Update FPS counter
    if (now - lastFpsUpdate > 1000) {
      currentFps = fpsCounter;
      fpsCounter = 0;
      lastFpsUpdate = now;
      
      // Update FPS display
      const versionOverlay = document.getElementById('GameVersionOverlay');
      if (versionOverlay) {
        versionOverlay.textContent = `BlockCraft BETA V0.0.4 | FPS: ${currentFps}`;
      }
    }
    
    // Update day/night cycle and Minecraft lighting less frequently (every 10 frames)
    if (frameCount % 10 === 0) {
      const elapsed = (now - start) % fullPeriod;
      const normalized = elapsed / fullPeriod;
      const dayFactor = Math.sin(normalized * Math.PI * 2) * 0.5 + 0.5;
      
      // Lighting updates disabled for now
      
      sunLight.intensity = dayFactor;
      const dayColor = new THREE.Color(0x87CEEB);
      const nightColor = new THREE.Color(0x000011);
      scene.background = nightColor.clone().lerp(dayColor, dayFactor);
    }
    
    updateControls();
    
    // Update VR controls if in VR
    if (window.updateVRControls) {
      window.updateVRControls();
    }
    
    // Only update chunks when player moves to new chunk or after interval
    const currentChunkX = Math.floor(camera.position.x / CHUNK_SIZE);
    const currentChunkZ = Math.floor(camera.position.z / CHUNK_SIZE);
    
    if (now - lastChunkUpdate > CHUNK_UPDATE_INTERVAL || 
        currentChunkX !== lastPlayerChunkX || 
        currentChunkZ !== lastPlayerChunkZ) {
      
      // Use original chunk system (optimized system disabled due to issues)
      updateChunks(
        camera.position.x,
        camera.position.z,
        blockGeometry,
        GrassMaterial,
        scene
      );
      
      lastChunkUpdate = now;
      lastPlayerChunkX = currentChunkX;
      lastPlayerChunkZ = currentChunkZ;
    }
    
    renderer.render(scene, camera);
  }
}
renderer.setAnimationLoop(animate);


window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
