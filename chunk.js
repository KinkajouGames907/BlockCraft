// --- Simple Chunk System for BlockCraft ---

// Chunk size (width and depth in blocks)
let CHUNK_SIZE = 16;
let HILL_SIZE = 5;
let HILL_HEIGHT = 2;
let HILL_FIX = 2;
let HILL_BASEH = 1;
let minTrunkHeight = 2;
let MaxTrunkHeight = 5;

// Store loaded chunks: key = "cx,cz", value = { group, blockData }
const loadedChunks = new Map();

const biomeMaterials = {
    grass: new THREE.MeshLambertMaterial({ map: textureLoader.load('Grass.png') }),
    planes: new THREE.MeshLambertMaterial({ map: textureLoader.load('Grass.png') }),
    dirt: new THREE.MeshLambertMaterial({ map: textureLoader.load('Dirt.jpg') }),
    stone: new THREE.MeshLambertMaterial({ map: textureLoader.load('Stone.jpg') }),
    sand: new THREE.MeshLambertMaterial({ map: textureLoader.load('sand.jpg') }),
    Bark:  new THREE.MeshLambertMaterial({ map: textureLoader.load('OakLog.png') }),
    Leaves: new THREE.MeshLambertMaterial({ map: textureLoader.load('Leaves.png') }),
};

const treeTrunkMaterial = biomeMaterials.Bark;
const treeLeavesMaterial = biomeMaterials.Leaves;

// filepath: c:\Users\glenn\Downloads\BlockCraft\chunk.js
function addTree(x, y, z, group, blockGeometry, blockData) {
    const trunkHeight = Math.floor(Math.random() * (MaxTrunkHeight - minTrunkHeight + 1)) + minTrunkHeight;

    // Build trunk (3 blocks tall)
    for (let i = 0; i < trunkHeight; i++) {
        const trunk = new THREE.Mesh(blockGeometry, treeTrunkMaterial);
        trunk.position.set(x, y + i, z);
        trunk.geometry.computeBoundingBox();
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk); // Add to chunk group, not scene
        blockData.push({ x: x, y: y + i, z: z }); // Same structure as terrain
    }
    for (let dy = 0; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (Math.abs(dx) + Math.abs(dz) < 3) {
                    const leaf = new THREE.Mesh(blockGeometry, treeLeavesMaterial);
                    leaf.position.set(x + dx, y + trunkHeight + dy, z + dz);
                    leaf.geometry.computeBoundingBox();
                    leaf.castShadow = true; 
                    leaf.receiveShadow = true;
                    group.add(leaf);
                    blockData.push({ x: x + dx, y: y + trunkHeight + dy, z: z + dz });
                }
            }
        }
    }
}

// Helper to get chunk key from coordinates
function chunkKey(cx, cz) {
    return `${cx},${cz}`;
}

function getBiome(x, z) {
    const noise = Math.sin(x / 50) + Math.cos(z / 50);

    if (noise < -0.5) return 'dirt';
    else if (noise < 0.3) return 'grass';
    else if (noise < 0.7) return 'sand';
    else if (noise < 1.0) return 'planes';
    else return 'stone';
}

// Generate a chunk at chunk coordinates (cx, cz)
function generateChunk(cx, cz, blockGeometry, blockMaterial, scene) {
    if (loadedChunks.has(chunkKey(cx, cz))) return; // Already loaded

    const group = new THREE.Group();
    const blockData = [];

    // Example: random terrain height
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;

            const biome = getBiome(worldX, worldZ);
            const material = biomeMaterials[biome];

            let height = Math.max(1, Math.floor(HILL_BASEH + HILL_FIX * Math.sin(worldX / HILL_SIZE) + HILL_HEIGHT * Math.cos(worldZ / 7)));
            for (let y = 0; y < height; y++) {
                const block = new THREE.Mesh(blockGeometry, material.clone());
                block.position.set(cx * CHUNK_SIZE + x, y, cz * CHUNK_SIZE + z);
                block.castShadow = true;
                block.receiveShadow = true;
                group.add(block);
                blockData.push({ x: cx * CHUNK_SIZE + x, y, z: cz * CHUNK_SIZE + z });
            }

            if (biome === 'grass' && Math.random() < 0.08 && height > 0)
            {
                addTree(cx * CHUNK_SIZE + x, height, cz * CHUNK_SIZE + z, group, blockGeometry, blockData);
            }

            if (biome === 'planes' && Math.random() < 0.001 && height > 0)
            {
                addTree(cx * CHUNK_SIZE + x, height, cz * CHUNK_SIZE + z, group, blockGeometry, blockData);
            }

            switch(biome)
            {
                case 'stone':
                    HILL_HEIGHT = 5;
                    HILL_FIX = 5;
                    break;
                case 'dirt':
                    HILL_HEIGHT = 2;
                    HILL_FIX = 2;
                    break;
                case 'sand':
                    HILL_HEIGHT = 1;
                    HILL_FIX = 1;
                    break;
                case 'planes':
                    HILL_HEIGHT = 0;
                    HILL_FIX = 0;
                    break;
                default:
                    HILL_HEIGHT = 0.3;
                    HILL_FIX = 0.3;
            }
        }
    }
    scene.add(group);
    loadedChunks.set(chunkKey(cx, cz), { group, blockData });
}

// Unload a chunk at chunk coordinates (cx, cz)
function unloadChunk(cx, cz, scene) {
    const chunk = loadedChunks.get(chunkKey(cx, cz));
    if (chunk) {
        scene.remove(chunk.group);
        loadedChunks.delete(chunkKey(cx, cz));
    }
}

// Update which chunks are loaded based on player position
function updateChunks(playerX, playerZ, blockGeometry, blockMaterial, scene) {
    const playerChunkX = Math.floor(playerX / CHUNK_SIZE);
    const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE);
    const viewDistance = 2; // How many chunks to keep loaded in each direction

    // Load nearby chunks
    for (let dx = -viewDistance; dx <= viewDistance; dx++) {
        for (let dz = -viewDistance; dz <= viewDistance; dz++) {
            generateChunk(
                playerChunkX + dx,
                playerChunkZ + dz,
                blockGeometry,
                blockMaterial,
                scene
            );
        }
    }

    // Unload far chunks
    for (const key of Array.from(loadedChunks.keys())) {
        const [cx, cz] = key.split(',').map(Number);
        if (
            Math.abs(cx - playerChunkX) > viewDistance ||
            Math.abs(cz - playerChunkZ) > viewDistance
        ) {
            unloadChunk(cx, cz, scene);
        }
    }
}

// --- How to use in your game.js ---
// 1. Include chunk.js before game.js in your HTML
// 2. In your animate loop, call:
// updateChunks(controls.getObject().position.x, controls.getObject().position.z, blockGeometry, blockMaterial, scene);
