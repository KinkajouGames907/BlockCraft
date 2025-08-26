// --- Enhanced Chunk System for BlockCraft ---

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

// Global biome generator (will be set when world is created)
let currentBiomeGenerator = null;

const biomeMaterials = {
    grass: new THREE.MeshLambertMaterial({ map: textureLoader.load('Grass.png'), side: THREE.FrontSide  }),
    planes: new THREE.MeshLambertMaterial({ map: textureLoader.load('Grass.png'), side: THREE.FrontSide  }),
    dirt: new THREE.MeshLambertMaterial({ map: textureLoader.load('Dirt.jpg'), side: THREE.FrontSide  }),
    stone: new THREE.MeshLambertMaterial({ map: textureLoader.load('Stone.jpg'), side: THREE.FrontSide  }),
    sand: new THREE.MeshLambertMaterial({ map: textureLoader.load('sand.jpg'), side: THREE.FrontSide  }),
    Bark:  new THREE.MeshLambertMaterial({ map: textureLoader.load('OakLog.png'), side: THREE.FrontSide  }),
    Leaves: new THREE.MeshLambertMaterial({ map: textureLoader.load('Leaves.png'), side: THREE.FrontSide  }),
};

const treeTrunkMaterial = biomeMaterials.Bark;
const treeLeavesMaterial = biomeMaterials.Leaves;

// filepath: c:\Users\glenn\Downloads\BlockCraft\chunk.js
function addTree(x, y, z, group, blockGeometry, blockData) {
    const trunkHeight = Math.floor(Math.random() * (MaxTrunkHeight - minTrunkHeight + 1)) + minTrunkHeight;

    // Build trunk
    for (let i = 0; i < trunkHeight; i++) {
        const trunk = new THREE.Mesh(blockGeometry, treeTrunkMaterial);
        trunk.position.set(x, y + i, z);
        trunk.geometry.computeBoundingBox();
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);
        blockData.push({ x: x, y: y + i, z: z });
    }
    
    // Build leaves in a proper tree shape
    const leafY = y + trunkHeight;
    
    // Bottom layer of leaves (3x3)
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            // Skip center (trunk goes through)
            if (dx === 0 && dz === 0) continue;
            
            const leaf = new THREE.Mesh(blockGeometry, treeLeavesMaterial);
            leaf.position.set(x + dx, leafY, z + dz);
            leaf.geometry.computeBoundingBox();
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            group.add(leaf);
            blockData.push({ x: x + dx, y: leafY, z: z + dz });
        }
    }
    
    // Top layer of leaves (smaller, 3x3 including center)
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            const leaf = new THREE.Mesh(blockGeometry, treeLeavesMaterial);
            leaf.position.set(x + dx, leafY + 1, z + dz);
            leaf.geometry.computeBoundingBox();
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            group.add(leaf);
            blockData.push({ x: x + dx, y: leafY + 1, z: z + dz });
        }
    }
    
    // Top single leaf block
    const topLeaf = new THREE.Mesh(blockGeometry, treeLeavesMaterial);
    topLeaf.position.set(x, leafY + 2, z);
    topLeaf.geometry.computeBoundingBox();
    topLeaf.castShadow = true;
    topLeaf.receiveShadow = true;
    group.add(topLeaf);
    blockData.push({ x: x, y: leafY + 2, z: z });
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
    const key = chunkKey(cx, cz);
    if (loadedChunks.has(key)) return; // Already loaded

    const group = new THREE.Group();
    const blockData = [];

    // Check if we have saved chunk data
    const savedChunkData = worldManager ? worldManager.loadChunkData(key) : null;
    
    if (savedChunkData && savedChunkData.blocks) {
        // Load from saved data
        console.log(`Loading saved chunk ${key} with ${savedChunkData.blocks.length} blocks`);
        loadChunkFromSavedData(savedChunkData.blocks, blockGeometry, group, blockData);
    } else {
        // Generate new chunk
        console.log(`Generating new chunk ${key}`);
        // Use legacy generation for now (enhanced system disabled)
        generateLegacyChunk(cx, cz, blockGeometry, group, blockData);
    }

    scene.add(group);
    loadedChunks.set(key, { group, blockData });
}

// Load chunk from saved block data
function loadChunkFromSavedData(savedBlocks, blockGeometry, group, blockData) {
    savedBlocks.forEach(blockInfo => {
        const blockType = blockInfo.material || blockInfo.type;
        
        if (blockType === 'light') {
            // Create light block with proper light source
            const lightBlock = createLightBlock(blockGeometry, 
                new THREE.Vector3(blockInfo.x, blockInfo.y, blockInfo.z), 
                group);
            blockData.push({
                x: blockInfo.x,
                y: blockInfo.y,
                z: blockInfo.z,
                type: 'light'
            });
        } else {
            // Create regular block
            const material = getBlockMaterial(blockType);
            if (material) {
                const block = new THREE.Mesh(blockGeometry, material);
                block.position.set(blockInfo.x, blockInfo.y, blockInfo.z);
                block.receiveShadow = true;
                group.add(block);
                blockData.push({
                    x: blockInfo.x,
                    y: blockInfo.y,
                    z: blockInfo.z,
                    type: blockType
                });
            }
        }
    });
}

// Simple chunk generation using BiomeGenerator
function generateEnhancedChunk(cx, cz, blockGeometry, group, blockData) {
    const chunkStartX = cx * CHUNK_SIZE;
    const chunkStartZ = cz * CHUNK_SIZE;

    // Generate terrain for each block position in chunk
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = chunkStartX + x;
            const worldZ = chunkStartZ + z;

            // Get surface height from biome generator
            const surfaceHeight = currentBiomeGenerator.getHeightAt(worldX, worldZ);
            if (surfaceHeight === null) continue; // Skip if no terrain

            // Generate blocks from 0 to surface height + a bit underground
            for (let y = 0; y <= surfaceHeight + 5; y++) {
                // Check for custom placed blocks first
                const customBlock = worldManager.getBlockAt({x: worldX, y: y, z: worldZ});
                if (customBlock) {
                    // Use custom block
                    const material = getBlockMaterial(customBlock.type);
                    if (material) {
                        const block = new THREE.Mesh(blockGeometry, material);
                        block.position.set(worldX, y, worldZ);
                        block.receiveShadow = true;
                        group.add(block);
                        blockData.push({ x: worldX, y, z: worldZ, type: customBlock.type });
                    }
                    continue;
                }

                // Generate natural terrain
                const blockType = currentBiomeGenerator.getBlockTypeAt(worldX, y, worldZ);
                if (blockType) {
                    const material = getBlockMaterial(blockType);
                    if (material) {
                        const block = new THREE.Mesh(blockGeometry, material);
                        block.position.set(worldX, y, worldZ);
                        block.receiveShadow = true;
                        group.add(block);
                        blockData.push({ x: worldX, y, z: worldZ, type: blockType });
                    }
                }
            }

            // Add trees on surface (simple)
            if (shouldGenerateTree(worldX, worldZ, surfaceHeight)) {
                addEnhancedTree(worldX, surfaceHeight + 1, worldZ, group, blockGeometry, blockData);
            }
        }
    }
}

// Improved chunk generation with better terrain
function generateLegacyChunk(cx, cz, blockGeometry, group, blockData) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;

            const biome = getBiome(worldX, worldZ);
            const material = biomeMaterials[biome];

            // Much smoother terrain generation
            let height = HILL_BASEH;
            
            // Very gentle large hills only
            height += Math.sin(worldX / 60) * (HILL_HEIGHT * 0.5);
            height += Math.cos(worldZ / 55) * (HILL_HEIGHT * 0.5);
            
            // Minimal variation for smoothness
            height += Math.sin(worldX / 30) * (HILL_HEIGHT * 0.2);
            
            // Remove random variation for smoother terrain
            
            height = Math.max(1, Math.floor(height));
            
            for (let y = 0; y < height; y++) {
                const block = new THREE.Mesh(blockGeometry, material.clone());
                block.position.set(worldX, y, worldZ);
                block.receiveShadow = true;
                group.add(block);
                blockData.push({ x: worldX, y, z: worldZ });
            }

            // Better tree generation
            if (biome === 'grass' && Math.random() < 0.05 && height > 2) {
                addTree(worldX, height, worldZ, group, blockGeometry, blockData);
            }
        }
    }
}

// Get material for block type
function getBlockMaterial(blockType) {
    switch (blockType) {
        case 'grass': return biomeMaterials.grass;
        case 'dirt': return biomeMaterials.dirt;
        case 'stone': return biomeMaterials.stone;
        case 'sand': return biomeMaterials.sand;
        case 'oakLog': return biomeMaterials.Bark;
        case 'leaves': return biomeMaterials.Leaves;
        case 'light': 
            // Return the light material from block.js
            if (typeof lightMaterial !== 'undefined') {
                return lightMaterial;
            }
            return biomeMaterials.grass; // Fallback
        case 'glass':
            // Return glass material if available
            if (typeof glassMaterial !== 'undefined') {
                return glassMaterial;
            }
            return biomeMaterials.grass; // Fallback
        default: return biomeMaterials.grass;
    }
}

// Check if tree should generate at position
function shouldGenerateTree(worldX, worldZ, surfaceHeight) {
    if (!currentBiomeGenerator) return false;
    
    const biome = currentBiomeGenerator.biome;
    const treeChance = getTreeChance(biome);
    
    // Use simple seeded random for consistent tree placement
    const random = currentBiomeGenerator.seededRandom(worldX, worldZ, 5000);
    
    return random < treeChance && surfaceHeight > 2;
}

// Get tree generation chance based on biome
function getTreeChance(biome) {
    switch (biome) {
        case 'forest': return 0.12;
        case 'plains': return 0.03;
        case 'mountain': return 0.06;
        case 'desert': return 0.001;
        case 'mixed': return 0.08;
        default: return 0.05;
    }
}

// Simple tree generation
function addEnhancedTree(x, y, z, group, blockGeometry, blockData) {
    const trunkHeight = 4; // Fixed height for simplicity

    // Build trunk
    for (let i = 0; i < trunkHeight; i++) {
        const trunk = new THREE.Mesh(blockGeometry, treeTrunkMaterial);
        trunk.position.set(x, y + i, z);
        trunk.receiveShadow = true;
        group.add(trunk);
        blockData.push({ x: x, y: y + i, z: z, type: 'oakLog' });
    }

    // Build simple leaves (cross pattern)
    const leafPositions = [
        // Layer 1 (top of trunk)
        [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
        // Layer 2 (above trunk)
        [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]
    ];
    
    leafPositions.forEach(([dx, dz], index) => {
        const leafY = y + trunkHeight + (index < 5 ? 0 : 1);
        const leaf = new THREE.Mesh(blockGeometry, treeLeavesMaterial);
        leaf.position.set(x + dx, leafY, z + dz);
        leaf.receiveShadow = true;
        group.add(leaf);
        blockData.push({ x: x + dx, y: leafY, z: z + dz, type: 'leaves' });
    });
}

// Initialize biome generator for current world
function initializeBiomeGenerator() {
    if (worldManager && worldManager.worldData) {
        const worldData = worldManager.worldData;
        
        // Ensure settings exist
        if (!worldData.settings) {
            worldData.settings = {
                biome: 'mixed',
                baseHeight: 4,
                chunkSize: 16,
                renderDistance: 1
            };
        }
        
        // Create biome generator if BiomeGenerator class exists
        if (typeof BiomeGenerator !== 'undefined') {
            currentBiomeGenerator = new BiomeGenerator(
                worldData.seed,
                worldData.settings.biome || 'mixed',
                worldData.settings
            );
            console.log(`Initialized biome generator for ${worldData.settings.biome || 'mixed'} biome with seed ${worldData.seed}`);
        } else {
            console.warn('BiomeGenerator class not found, using legacy generation');
            currentBiomeGenerator = null;
        }
    } else {
        console.warn('No world data available for biome generator initialization');
    }
}

// Unload a chunk at chunk coordinates (cx, cz)
function unloadChunk(cx, cz, scene) {
    const chunk = loadedChunks.get(chunkKey(cx, cz));
    if (chunk) {
        scene.remove(chunk.group);
        loadedChunks.delete(chunkKey(cx, cz));
    }
}

// Save chunk data and then unload it
function saveAndUnloadChunk(cx, cz, scene) {
    const key = chunkKey(cx, cz);
    const chunk = loadedChunks.get(key);
    
    if (chunk && worldManager) {
        // Extract block data from chunk
        const chunkBlocks = [];
        chunk.group.children.forEach(child => {
            // Only save mesh objects (blocks), not lights
            if (child instanceof THREE.Mesh) {
                const blockType = getMaterialTypeFromMesh(child);
                chunkBlocks.push({
                    x: child.position.x,
                    y: child.position.y,
                    z: child.position.z,
                    material: blockType,
                    type: blockType,
                    // Store additional info for light blocks
                    isLight: blockType === 'light',
                    hasLight: child.userData && child.userData.light ? true : false
                });
            }
        });
        
        // Save chunk data to world manager
        worldManager.saveChunkData(key, chunkBlocks);
        
        console.log(`Saved and unloaded chunk ${key} with ${chunkBlocks.length} blocks (including ${chunkBlocks.filter(b => b.isLight).length} light blocks)`);
    }
    
    // Unload the chunk
    unloadChunk(cx, cz, scene);
}

// Helper function to determine material type from mesh
function getMaterialTypeFromMesh(mesh) {
    if (!mesh.material) return 'grass';
    
    // Check for light blocks first (they have emissive properties)
    if (mesh.material.emissive && mesh.material.emissive.getHex() > 0) {
        return 'light';
    }
    
    if (!mesh.material.map) return 'grass';
    
    const textureName = mesh.material.map.image?.src || '';
    if (textureName.includes('Light')) return 'light';
    if (textureName.includes('Grass')) return 'grass';
    if (textureName.includes('Dirt')) return 'dirt';
    if (textureName.includes('Stone')) return 'stone';
    if (textureName.includes('sand')) return 'sand';
    if (textureName.includes('OakLog')) return 'oakLog';
    if (textureName.includes('Leaves')) return 'leaves';
    if (textureName.includes('Glass')) return 'glass';
    
    return 'grass'; // Default
}

// Helper function to determine block type from mesh
function getBlockTypeFromMesh(mesh) {
    return getMaterialTypeFromMesh(mesh); // Same logic for now
}

// Update which chunks are loaded based on player position
function updateChunks(playerX, playerZ, blockGeometry, blockMaterial, scene) {
    const playerChunkX = Math.floor(playerX / CHUNK_SIZE);
    const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE);
    
    // Get render distance from world settings or default
    let viewDistance = 1; // Default render distance set to 1
    if (worldManager && worldManager.worldData && worldManager.worldData.settings) {
        viewDistance = worldManager.worldData.settings.renderDistance || 1;
    }

    // Initialize biome generator if not done yet
    if (!currentBiomeGenerator && worldManager && worldManager.worldData) {
        initializeBiomeGenerator();
    }

    // Load nearby chunks in a spiral pattern for better performance
    const chunksToLoad = [];
    for (let radius = 0; radius <= viewDistance; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                if (Math.abs(dx) === radius || Math.abs(dz) === radius) {
                    chunksToLoad.push({
                        x: playerChunkX + dx,
                        z: playerChunkZ + dz,
                        priority: radius
                    });
                }
            }
        }
    }

    // Load chunks in order of priority (closest first)
    chunksToLoad.forEach(chunk => {
        generateChunk(chunk.x, chunk.z, blockGeometry, blockMaterial, scene);
    });

    // Save and unload far chunks
    for (const key of Array.from(loadedChunks.keys())) {
        const [cx, cz] = key.split(',').map(Number);
        const distance = Math.max(Math.abs(cx - playerChunkX), Math.abs(cz - playerChunkZ));
        if (distance > viewDistance + 1) { // Keep one extra chunk buffer
            saveAndUnloadChunk(cx, cz, scene);
        }
    }
}

// Save chunk modifications to world data
function saveChunkModifications() {
    if (!worldManager) return;
    
    // This will be called when blocks are placed/removed
    // The actual saving is handled by the world manager
    worldManager.saveWorld();
}

// Get all blocks in loaded chunks (for raycasting)
function getAllBlocks() {
    const allBlocks = [];
    for (const chunk of loadedChunks.values()) {
        chunk.group.children.forEach(block => {
            if (block instanceof THREE.Mesh) {
                allBlocks.push(block);
            }
        });
    }
    return allBlocks;
}

// --- How to use in your game.js ---
// 1. Include chunk.js before game.js in your HTML
// 2. In your animate loop, call:
// updateChunks(controls.getObject().position.x, controls.getObject().position.z, blockGeometry, blockMaterial, scene);
