// Optimized Chunk System with Face Culling and Minecraft Lighting
// Only renders visible faces to dramatically improve performance

class OptimizedChunk {
    constructor(cx, cz, chunkSize = 16) {
        this.cx = cx;
        this.cz = cz;
        this.chunkSize = chunkSize;
        this.blocks = new Map(); // Store block data: "x,y,z" -> blockType
        this.mesh = null;
        this.lightLevels = new Map(); // Store light levels: "x,y,z" -> lightLevel (0-15)
        
        // Chunk boundaries
        this.startX = cx * chunkSize;
        this.startZ = cz * chunkSize;
        this.endX = this.startX + chunkSize;
        this.endZ = this.startZ + chunkSize;
    }
    
    // Set block at position
    setBlock(x, y, z, blockType) {
        const key = `${x},${y},${z}`;
        if (blockType === null) {
            this.blocks.delete(key);
        } else {
            this.blocks.set(key, blockType);
        }
    }
    
    // Get block at position
    getBlock(x, y, z) {
        return this.blocks.get(`${x},${y},${z}`) || null;
    }
    
    // Check if block exists (solid)
    isBlockSolid(x, y, z) {
        const blockType = this.getBlock(x, y, z);
        return blockType !== null && blockType !== 'air';
    }
    
    // Generate chunk terrain
    generateTerrain() {
        if (!currentBiomeGenerator) return;
        
        for (let x = this.startX; x < this.endX; x++) {
            for (let z = this.startZ; z < this.endZ; z++) {
                const surfaceHeight = currentBiomeGenerator.getHeightAt(x, z);
                if (surfaceHeight === null) continue;
                
                // Generate blocks from 0 to surface + some underground
                for (let y = 0; y <= surfaceHeight + 3; y++) {
                    const blockType = currentBiomeGenerator.getBlockTypeAt(x, y, z);
                    if (blockType) {
                        this.setBlock(x, y, z, blockType);
                    }
                }
            }
        }
        
        // Calculate lighting after terrain generation
        this.calculateLighting();
    }
    
    // Calculate simple lighting (0-15)
    calculateLighting() {
        // Simplified lighting - just based on height and exposure to sky
        for (let x = this.startX; x < this.endX; x++) {
            for (let z = this.startZ; z < this.endZ; z++) {
                let lightLevel = 15; // Full sunlight
                
                // Go from top down
                for (let y = 32; y >= 0; y--) {
                    const key = `${x},${y},${z}`;
                    
                    if (this.isBlockSolid(x, y, z)) {
                        // Solid blocks get no light
                        this.lightLevels.set(key, 0);
                        // Reduce light for blocks below
                        lightLevel = Math.max(0, lightLevel - 3);
                    } else {
                        // Air blocks get current light level
                        this.lightLevels.set(key, lightLevel);
                        // Light decreases slowly through air
                        lightLevel = Math.max(0, lightLevel - 1);
                    }
                }
            }
        }
    }
    
    // Simple light spreading (removed complex algorithm for performance)
    spreadLight() {
        // Skip complex light spreading for now to improve performance
        // The basic top-down lighting should be sufficient
    }
    
    // Get light level at position
    getLightLevel(x, y, z) {
        return this.lightLevels.get(`${x},${y},${z}`) || 0;
    }
    
    // Check if face should be rendered (face culling)
    shouldRenderFace(x, y, z, face) {
        const directions = {
            'top': [0, 1, 0],
            'bottom': [0, -1, 0],
            'north': [0, 0, -1],
            'south': [0, 0, 1],
            'east': [1, 0, 0],
            'west': [-1, 0, 0]
        };
        
        const [dx, dy, dz] = directions[face];
        const neighborX = x + dx;
        const neighborY = y + dy;
        const neighborZ = z + dz;
        
        // Always render if neighbor is outside chunk (for now)
        if (neighborX < this.startX || neighborX >= this.endX ||
            neighborZ < this.startZ || neighborZ >= this.endZ ||
            neighborY < 0 || neighborY > 64) {
            return true;
        }
        
        // Don't render if neighbor is solid (except glass)
        const neighborBlock = this.getBlock(neighborX, neighborY, neighborZ);
        return !neighborBlock || neighborBlock === 'glass' || neighborBlock === 'air';
    }
    
    // Generate optimized mesh with face culling
    generateMesh() {
        if (this.mesh) {
            this.mesh.parent?.remove(this.mesh);
            this.mesh = null;
        }
        
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const uvs = [];
        const colors = [];
        const indices = [];
        
        let vertexIndex = 0;
        
        // Face definitions (vertices, normals, UVs)
        const faceData = {
            top: {
                vertices: [
                    [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]
                ],
                normal: [0, 1, 0],
                uvs: [[0, 0], [1, 0], [1, 1], [0, 1]]
            },
            bottom: {
                vertices: [
                    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5]
                ],
                normal: [0, -1, 0],
                uvs: [[0, 1], [1, 1], [1, 0], [0, 0]]
            },
            north: {
                vertices: [
                    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]
                ],
                normal: [0, 0, -1],
                uvs: [[1, 1], [0, 1], [0, 0], [1, 0]]
            },
            south: {
                vertices: [
                    [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5]
                ],
                normal: [0, 0, 1],
                uvs: [[1, 1], [0, 1], [0, 0], [1, 0]]
            },
            east: {
                vertices: [
                    [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5]
                ],
                normal: [1, 0, 0],
                uvs: [[1, 1], [0, 1], [0, 0], [1, 0]]
            },
            west: {
                vertices: [
                    [-0.5, -0.5, 0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [-0.5, 0.5, 0.5]
                ],
                normal: [-1, 0, 0],
                uvs: [[1, 1], [0, 1], [0, 0], [1, 0]]
            }
        };
        
        // Generate faces for each block
        for (const [posKey, blockType] of this.blocks) {
            const [x, y, z] = posKey.split(',').map(Number);
            
            // Skip air blocks
            if (!blockType || blockType === 'air') continue;
            
            // Get light level for this block
            const lightLevel = this.getLightLevel(x, y, z);
            const lightIntensity = lightLevel / 15; // Convert to 0-1 range
            
            // Generate each face if it should be rendered
            for (const [faceName, face] of Object.entries(faceData)) {
                if (this.shouldRenderFace(x, y, z, faceName)) {
                    // Add vertices
                    for (const vertex of face.vertices) {
                        vertices.push(
                            x + vertex[0],
                            y + vertex[1],
                            z + vertex[2]
                        );
                        
                        // Add normal
                        normals.push(...face.normal);
                        
                        // Add color based on light level
                        colors.push(lightIntensity, lightIntensity, lightIntensity);
                    }
                    
                    // Add UVs
                    for (const uv of face.uvs) {
                        uvs.push(...uv);
                    }
                    
                    // Add indices for two triangles
                    indices.push(
                        vertexIndex, vertexIndex + 1, vertexIndex + 2,
                        vertexIndex, vertexIndex + 2, vertexIndex + 3
                    );
                    
                    vertexIndex += 4;
                }
            }
        }
        
        // Set geometry attributes
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        
        // Create simple material with vertex colors for lighting
        const material = new THREE.MeshLambertMaterial({
            map: textureLoader.load('Grass.png'),
            vertexColors: true,
            side: THREE.FrontSide
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        return this.mesh;
    }
}

// Optimized Chunk Manager
class OptimizedChunkManager {
    constructor() {
        this.chunks = new Map();
        this.chunkSize = 16;
    }
    
    getChunkKey(cx, cz) {
        return `${cx},${cz}`;
    }
    
    getChunk(cx, cz) {
        const key = this.getChunkKey(cx, cz);
        if (!this.chunks.has(key)) {
            const chunk = new OptimizedChunk(cx, cz, this.chunkSize);
            chunk.generateTerrain();
            this.chunks.set(key, chunk);
        }
        return this.chunks.get(key);
    }
    
    updateChunks(playerX, playerZ, scene, renderDistance = 4) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkZ = Math.floor(playerZ / this.chunkSize);
        
        // Load chunks around player
        for (let dx = -renderDistance; dx <= renderDistance; dx++) {
            for (let dz = -renderDistance; dz <= renderDistance; dz++) {
                const cx = playerChunkX + dx;
                const cz = playerChunkZ + dz;
                
                const chunk = this.getChunk(cx, cz);
                
                // Generate mesh if not already in scene
                if (chunk.mesh && !chunk.mesh.parent) {
                    scene.add(chunk.mesh);
                } else if (!chunk.mesh) {
                    const mesh = chunk.generateMesh();
                    if (mesh) {
                        scene.add(mesh);
                    }
                }
            }
        }
        
        // Unload distant chunks
        for (const [key, chunk] of this.chunks) {
            const [cx, cz] = key.split(',').map(Number);
            const distance = Math.max(
                Math.abs(cx - playerChunkX),
                Math.abs(cz - playerChunkZ)
            );
            
            if (distance > renderDistance + 1) {
                if (chunk.mesh && chunk.mesh.parent) {
                    scene.remove(chunk.mesh);
                }
                this.chunks.delete(key);
            }
        }
    }
    
    // Get all blocks for collision detection
    getAllBlocks() {
        const blocks = [];
        for (const chunk of this.chunks.values()) {
            if (chunk.mesh) {
                blocks.push(chunk.mesh);
            }
        }
        return blocks;
    }
}

// Global optimized chunk manager
const optimizedChunkManager = new OptimizedChunkManager();