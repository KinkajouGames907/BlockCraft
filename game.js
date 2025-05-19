const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
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

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Soft global light
scene.add(ambientLight);

let sunLight = new THREE.DirectionalLight(0xffffff, currentTime); // Sunlight
sunLight.position.set(100, 200, 100);
scene.add(sunLight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

initControls(camera);
scene.add(controls.getObject());

const worldWidth = 100;
const worldDepth = 100;
const worldHeight = 1;

let Render = false;

const blocks = [];


setupBlockActions(camera, blockGeometry, getCurrentTexture);

camera.position.set(worldWidth / 2, 10, worldDepth + 10);
camera.lookAt(worldWidth / 2, 0, worldDepth / 2);

function animate() {
  requestAnimationFrame(animate);

  // 1) compute dayFactor
  const elapsed    = (performance.now() - start) % fullPeriod;
  const normalized = elapsed / fullPeriod;  // 0 → 1
  const dayFactor  = Math.sin(normalized * Math.PI * 2) * 0.5 + 0.5;

  // 2) apply to sun and sky
  sunLight.intensity = dayFactor;
  const dayColor   = new THREE.Color(0x87CEEB);
  const nightColor = new THREE.Color(0x000011);
  scene.background  = nightColor.clone().lerp(dayColor, dayFactor);

  if (Render) {
    updateControls();
    renderer.render(scene, camera);
    updateChunks(
      controls.getObject().position.x,
      controls.getObject().position.z,
      blockGeometry,
      GrassMaterial,
      scene
    );
  }
}
animate();


window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
