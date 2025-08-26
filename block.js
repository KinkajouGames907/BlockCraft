const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('Grass.png');
const stoneTexture = textureLoader.load('Stone.jpg');
const dirtTexture = textureLoader.load('Dirt.jpg');
const sandTexture = textureLoader.load('sand.jpg');
const oakLogTexture = textureLoader.load('OakLog.png');
const Leaves = textureLoader.load('Leaves.png');
const Light1 = textureLoader.load('Light1.png');

const glassTexture = textureLoader.load('Glass.png');

let currentTexture = grassTexture; // Default texture

const blockMaterial = new THREE.MeshLambertMaterial({ map: currentTexture, side: THREE.FrontSide });

const glassMaterial = new THREE.MeshLambertMaterial({ 
    map: glassTexture,
    transparent: true,
    opacity: 0.5,
    alphaTest: 0.5,
    side: THREE.FrontSide
});

// Light block material - glows!
const lightMaterial = new THREE.MeshLambertMaterial({ 
    map: Light1,
    emissive: 0xffffaa,  // Yellow glow
    emissiveIntensity: 0.3,
    side: THREE.FrontSide
});

function getCurrentTexture() {
    return currentTexture;
}

function getCurrentMaterial() {
    if (currentTexture === glassTexture) {
        return glassMaterial;
    }
    if (currentTexture === Light1) {
        return lightMaterial;
    }
    // Create a NEW material for each block so they don't share references
    return new THREE.MeshLambertMaterial({ map: currentTexture, side: THREE.FrontSide});
}

// Function to create a light block with actual light
function createLightBlock(geometry, position, parent) {
    // Create the glowing block
    const lightBlock = new THREE.Mesh(geometry, lightMaterial);
    lightBlock.position.copy(position);
    
    // Create point light that doesn't cast shadows and works with directional light
    const pointLight = new THREE.PointLight(0xffffaa, 0.8, 12); // Yellow light, moderate intensity, good range
    pointLight.position.copy(position);
    pointLight.castShadow = false; // Don't cast shadows - let the sun handle that
    
    // Add both block and light to parent
    parent.add(lightBlock);
    parent.add(pointLight);
    
    // Store reference to light on the block for easy removal
    lightBlock.userData.light = pointLight;
    
    return lightBlock;
}

function ChangeBM()
{
    // Block material changing is now handled by the hotbar system
    // This function is kept for compatibility but does nothing
}