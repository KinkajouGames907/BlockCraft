const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('Grass.png');
const stoneTexture = textureLoader.load('Stone.jpg');
const dirtTexture = textureLoader.load('Dirt.jpg');
const sandTexture = textureLoader.load('sand.jpg');
const oakLogTexture = textureLoader.load('OakLog.png');
const Leaves = textureLoader.load('Leaves.png');

let currentTexture = grassTexture; // Default texture

const blockMaterial = new THREE.MeshLambertMaterial({ map: currentTexture });

function getCurrentTexture() {
    return currentTexture;
}

function ChangeBM()
{
    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'Digit1': currentTexture = grassTexture; break;   // G key pressed
            case 'Digit2': currentTexture = stoneTexture; break;
            case 'Digit3': currentTexture = dirtTexture; break;  // S key pressed
            case 'Digit4': currentTexture = sandTexture; break;
            case 'Digit5': currentTexture = oakLogTexture; break;
            case 'Digit6': currentTexture = Leaves; break;
        }

        blockMaterial.map = currentTexture;
        blockMaterial.needsUpdate = true;
    });
}