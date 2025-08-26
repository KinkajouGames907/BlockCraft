// BlockCraft World Manager
// Handles world saving, loading, and management

class WorldManager {
    constructor() {
        this.currentWorld = null;
        this.worldData = {
            name: '',
            seed: 0,
            playerPosition: { x: 0, y: 10, z: 0 },
            playerRotation: { x: 0, y: 0, z: 0 },
            chunks: new Map(),
            blocks: new Map(), // Custom placed/removed blocks
            settings: {},
            createdAt: Date.now(),
            lastPlayed: Date.now(),
            version: '0.0.3_1'
        };
    }

    // Generate a seed from world name or use random
    generateSeed(worldName) {
        if (!worldName) return Math.floor(Math.random() * 1000000);
        
        let hash = 0;
        for (let i = 0; i < worldName.length; i++) {
            const char = worldName.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    // Generate random seed for presets
    generateRandomSeed() {
        return Math.floor(Math.random() * 1000000);
    }

    // Create a new world
    createWorld(name, settings = {}, presetSeed = null) {
        // Use preset seed if provided, otherwise generate random seed
        const seed = presetSeed !== null ? presetSeed : this.generateRandomSeed();
        
        this.worldData = {
            name: name,
            seed: seed,
            playerPosition: { x: 0, y: 20, z: 0 }, // Start at origin, higher up
            playerRotation: { x: 0, y: 0, z: 0 },
            chunks: new Map(),
            blocks: new Map(),
            settings: {
                baseHeight: settings.baseHeight || 4,
                chunkSize: settings.chunkSize || 16,
                renderDistance: settings.renderDistance || 1,
                biome: settings.biome || 'mixed',
                caves: settings.caves !== false,
                structures: settings.structures !== false
            },
            createdAt: Date.now(),
            lastPlayed: Date.now(),
            version: 'BETA V0.0.4'
        };

        this.currentWorld = name;
        
        // Apply settings to global variables
        if (typeof HILL_BASEH !== 'undefined') HILL_BASEH = this.worldData.settings.baseHeight;
        if (typeof CHUNK_SIZE !== 'undefined') CHUNK_SIZE = this.worldData.settings.chunkSize;
        
        console.log(`Created world "${name}" with seed: ${seed} (biome: ${settings.biome})`);
        return this.worldData;
    }

    // Save current world state
    saveWorld() {
        if (!this.currentWorld) return false;

        try {
            // Update player position if camera exists
            if (typeof camera !== 'undefined') {
                this.worldData.playerPosition = {
                    x: camera.position.x,
                    y: camera.position.y,
                    z: camera.position.z
                };
                this.worldData.playerRotation = {
                    x: camera.rotation.x,
                    y: camera.rotation.y,
                    z: camera.rotation.z
                };
            }

            // Update last played time
            this.worldData.lastPlayed = Date.now();

            // Optimize world data before saving
            this.optimizeWorldData();

            // Save to localStorage as BCWorld file
            const worldFileName = `${this.currentWorld}.bcworld`;
            const worldDataString = JSON.stringify(this.worldData, this.mapReplacer);
            
            // Check if data is too large
            if (worldDataString.length > 5000000) { // 5MB limit
                console.warn('World data is very large, compressing...');
                this.compressWorldData();
                const compressedString = JSON.stringify(this.worldData, this.mapReplacer);
                localStorage.setItem(worldFileName, compressedString);
            } else {
                localStorage.setItem(worldFileName, worldDataString);
            }
            
            // Also save to world list
            this.updateWorldList();
            
            console.log(`World "${this.currentWorld}" saved successfully (${(worldDataString.length / 1024).toFixed(1)}KB)`);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded. Attempting cleanup...');
                this.cleanupOldWorlds();
                // Try saving again after cleanup
                try {
                    const worldFileName = `${this.currentWorld}.bcworld`;
                    const worldDataString = JSON.stringify(this.worldData, this.mapReplacer);
                    localStorage.setItem(worldFileName, worldDataString);
                    console.log(`World "${this.currentWorld}" saved successfully after cleanup`);
                    return true;
                } catch (secondError) {
                    console.error('Failed to save world even after cleanup:', secondError);
                    alert('Storage is full! Please delete some old worlds or export important worlds as JSON files.');
                    return false;
                }
            } else {
                console.error('Failed to save world:', error);
                return false;
            }
        }
    }
    
    // Optimize world data to reduce size
    optimizeWorldData() {
        // Remove empty chunks
        if (this.worldData.chunks) {
            for (const [key, chunk] of this.worldData.chunks.entries()) {
                if (!chunk.blocks || chunk.blocks.length === 0) {
                    this.worldData.chunks.delete(key);
                }
            }
        }
        
        // Remove duplicate block entries
        if (this.worldData.blocks) {
            const uniqueBlocks = new Map();
            for (const [key, block] of this.worldData.blocks.entries()) {
                if (!uniqueBlocks.has(key)) {
                    uniqueBlocks.set(key, block);
                }
            }
            this.worldData.blocks = uniqueBlocks;
        }
    }
    
    // Compress world data by removing unnecessary information
    compressWorldData() {
        // Remove old timestamps and metadata
        if (this.worldData.chunks) {
            for (const [key, chunk] of this.worldData.chunks.entries()) {
                if (chunk.blocks) {
                    chunk.blocks = chunk.blocks.map(block => ({
                        x: block.x,
                        y: block.y,
                        z: block.z,
                        type: block.type || block.material
                    }));
                }
                // Remove unnecessary metadata
                delete chunk.lastSaved;
                delete chunk.playerModified;
            }
        }
    }
    
    // Clean up old worlds to free space
    cleanupOldWorlds() {
        try {
            const worlds = this.getSavedWorlds();
            // Sort by last played (oldest first)
            worlds.sort((a, b) => a.lastPlayed - b.lastPlayed);
            
            // Remove oldest worlds if we have more than 5
            if (worlds.length > 5) {
                const worldsToDelete = worlds.slice(0, worlds.length - 5);
                worldsToDelete.forEach(world => {
                    if (world.name !== this.currentWorld) {
                        this.deleteWorld(world.name);
                        console.log(`Deleted old world: ${world.name}`);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to cleanup old worlds:', error);
        }
    }

    // Load a world
    loadWorld(worldName) {
        try {
            const worldFileName = `${worldName}.bcworld`;
            const worldDataString = localStorage.getItem(worldFileName);
            
            if (!worldDataString) {
                console.error(`World "${worldName}" not found`);
                return false;
            }

            this.worldData = JSON.parse(worldDataString, this.mapReviver);
            this.currentWorld = worldName;

            // Apply world settings to global variables
            if (typeof HILL_HEIGHT !== 'undefined' && this.worldData.settings.hillHeight) {
                HILL_HEIGHT = this.worldData.settings.hillHeight;
            }
            if (typeof HILL_BASEH !== 'undefined' && this.worldData.settings.baseHeight) {
                HILL_BASEH = this.worldData.settings.baseHeight;
            }
            if (typeof CHUNK_SIZE !== 'undefined' && this.worldData.settings.chunkSize) {
                CHUNK_SIZE = this.worldData.settings.chunkSize;
            }

            // Clear any existing chunks when loading a world
            if (typeof loadedChunks !== 'undefined') {
                loadedChunks.clear();
            }
            
            // Reset biome generator
            if (typeof currentBiomeGenerator !== 'undefined') {
                currentBiomeGenerator = null;
            }

            console.log(`Applied world settings: baseHeight=${HILL_BASEH}, chunkSize=${CHUNK_SIZE}, biome=${this.worldData.settings.biome}`);

            // Note: Player position will be set by the menu system

            console.log(`World "${worldName}" loaded successfully`);
            return true;
        } catch (error) {
            console.error('Failed to load world:', error);
            return false;
        }
    }

    // Get list of saved worlds
    getSavedWorlds() {
        const worlds = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.endsWith('.bcworld')) {
                try {
                    const worldData = JSON.parse(localStorage.getItem(key));
                    worlds.push({
                        name: worldData.name,
                        lastPlayed: worldData.lastPlayed,
                        createdAt: worldData.createdAt,
                        seed: worldData.seed,
                        version: worldData.version
                    });
                } catch (error) {
                    console.error(`Failed to parse world: ${key}`, error);
                }
            }
        }
        
        // Sort by last played (most recent first)
        return worlds.sort((a, b) => b.lastPlayed - a.lastPlayed);
    }

    // Delete a world
    deleteWorld(worldName) {
        try {
            const worldFileName = `${worldName}.bcworld`;
            localStorage.removeItem(worldFileName);
            this.updateWorldList();
            console.log(`World "${worldName}" deleted`);
            return true;
        } catch (error) {
            console.error('Failed to delete world:', error);
            return false;
        }
    }

    // Update world list in localStorage
    updateWorldList() {
        const worlds = this.getSavedWorlds();
        localStorage.setItem('blockcraft_worlds', JSON.stringify(worlds));
    }

    // Save a block change
    saveBlockChange(position, blockType, material) {
        const key = `${position.x},${position.y},${position.z}`;
        if (blockType === null) {
            // Block removed
            this.worldData.blocks.delete(key);
        } else {
            // Block placed/changed
            this.worldData.blocks.set(key, {
                type: blockType,
                material: material,
                timestamp: Date.now()
            });
        }
        
        // Auto-save after block changes (debounced)
        this.debouncedAutoSave();
    }
    
    // Save chunk data when player leaves area
    saveChunkData(chunkKey, chunkBlocks) {
        if (!this.worldData.chunks) {
            this.worldData.chunks = new Map();
        }
        
        this.worldData.chunks.set(chunkKey, {
            blocks: chunkBlocks,
            lastSaved: Date.now(),
            playerModified: true
        });
        
        console.log(`Saved chunk ${chunkKey} with ${chunkBlocks.length} blocks`);
    }
    
    // Load chunk data when player enters area
    loadChunkData(chunkKey) {
        if (!this.worldData.chunks) return null;
        return this.worldData.chunks.get(chunkKey);
    }
    
    // Get all chunks that have been modified by player
    getModifiedChunks() {
        const modifiedChunks = new Map();
        if (this.worldData.chunks) {
            for (const [key, data] of this.worldData.chunks.entries()) {
                if (data.playerModified) {
                    modifiedChunks.set(key, data);
                }
            }
        }
        return modifiedChunks;
    }

    // Get block at position
    getBlockAt(position) {
        const key = `${position.x},${position.y},${position.z}`;
        return this.worldData.blocks.get(key);
    }

    // Helper functions for Map serialization
    mapReplacer(key, value) {
        if (value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries())
            };
        }
        return value;
    }

    mapReviver(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value);
            }
        }
        return value;
    }

    // Auto-save functionality
    startAutoSave(intervalMinutes = 5) {
        setInterval(() => {
            if (this.currentWorld) {
                this.saveWorld();
                console.log('Auto-saved world');
            }
        }, intervalMinutes * 60 * 1000);
    }
    
    // Debounced auto-save for frequent block changes
    debouncedAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            if (this.currentWorld) {
                this.saveWorld();
                console.log('Auto-saved after block changes');
            }
        }, 2000); // Save 2 seconds after last block change
    }
    
    // Export world as JSON string
    exportWorldAsJSON() {
        if (!this.currentWorld) return null;
        
        // Update player position before export
        if (typeof camera !== 'undefined') {
            this.worldData.playerPosition = {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z
            };
            this.worldData.playerRotation = {
                x: camera.rotation.x,
                y: camera.rotation.y,
                z: camera.rotation.z
            };
        }
        
        this.worldData.lastPlayed = Date.now();
        
        return JSON.stringify(this.worldData, this.mapReplacer, 2);
    }
    
    // Import world from JSON string
    importWorldFromJSON(jsonString, worldName = null) {
        try {
            const worldData = JSON.parse(jsonString, this.mapReviver);
            
            // Validate required fields
            if (!worldData.name || worldData.seed === undefined) {
                throw new Error('Invalid world data: missing name or seed');
            }
            
            // Use provided name or keep original
            if (worldName) {
                worldData.name = worldName;
            }
            
            // Ensure all required fields exist
            worldData.chunks = worldData.chunks || new Map();
            worldData.blocks = worldData.blocks || new Map();
            worldData.settings = worldData.settings || {};
            worldData.version = worldData.version || 'BETA V0.0.4';
            worldData.lastPlayed = Date.now();
            
            this.worldData = worldData;
            this.currentWorld = worldData.name;
            
            // Save to localStorage
            this.saveWorld();
            
            console.log(`Imported world "${worldData.name}" with seed ${worldData.seed}`);
            return true;
            
        } catch (error) {
            console.error('Failed to import world:', error);
            return false;
        }
    }
}

// Global world manager instance
const worldManager = new WorldManager();