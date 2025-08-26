// BlockCraft World Utilities
// Helper functions for world management and debugging

class WorldUtils {
    // Export current world to downloadable JSON file
    static exportCurrentWorld() {
        if (!worldManager || !worldManager.currentWorld) {
            console.error('No world currently loaded');
            return false;
        }
        
        try {
            const worldData = worldManager.exportWorldAsJSON();
            if (!worldData) {
                console.error('Failed to export world data');
                return false;
            }
            
            const blob = new Blob([worldData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${worldManager.currentWorld}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`Exported world "${worldManager.currentWorld}" successfully`);
            return true;
            
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        }
    }
    
    // Import world from JSON file (opens file picker)
    static importWorldFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.bcworld';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const success = worldManager.importWorldFromJSON(e.target.result);
                    if (success) {
                        console.log('World imported successfully');
                    } else {
                        console.error('Failed to import world');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // Get world statistics
    static getWorldStats() {
        if (!worldManager || !worldManager.worldData) {
            console.log('No world loaded');
            return null;
        }
        
        const data = worldManager.worldData;
        const stats = {
            name: data.name,
            seed: data.seed,
            version: data.version,
            created: new Date(data.createdAt).toLocaleString(),
            lastPlayed: new Date(data.lastPlayed).toLocaleString(),
            playerPosition: data.playerPosition,
            totalBlocks: data.blocks ? data.blocks.size : 0,
            totalChunks: data.chunks ? data.chunks.size : 0,
            settings: data.settings
        };
        
        console.table(stats);
        return stats;
    }
    
    // Clear all saved worlds (use with caution!)
    static clearAllWorlds() {
        // Skip confirmation dialogs - just delete
        console.log('Clearing all worlds...');
        
        try {
            const worlds = worldManager.getSavedWorlds();
            worlds.forEach(world => {
                worldManager.deleteWorld(world.name);
            });
            
            console.log(`Deleted ${worlds.length} worlds`);
            return true;
            
        } catch (error) {
            console.error('Failed to clear worlds:', error);
            return false;
        }
    }
    
    // List all saved worlds
    static listWorlds() {
        const worlds = worldManager.getSavedWorlds();
        console.log('Saved worlds:');
        worlds.forEach((world, index) => {
            console.log(`${index + 1}. ${world.name} (Seed: ${world.seed}, Last played: ${new Date(world.lastPlayed).toLocaleString()})`);
        });
        return worlds;
    }
    
    // Save current world manually
    static saveCurrentWorld() {
        if (!worldManager || !worldManager.currentWorld) {
            console.error('No world currently loaded');
            return false;
        }
        
        try {
            const success = worldManager.saveWorld();
            if (success) {
                console.log('World saved successfully');
            } else {
                console.error('Failed to save world');
            }
            return success;
        } catch (error) {
            console.error('Save error:', error);
            return false;
        }
    }
    
    // Debug: Show current chunk information
    static showChunkInfo() {
        if (typeof camera === 'undefined') {
            console.log('Camera not available');
            return;
        }
        
        const playerX = camera.position.x;
        const playerZ = camera.position.z;
        const chunkX = Math.floor(playerX / (typeof CHUNK_SIZE !== 'undefined' ? CHUNK_SIZE : 16));
        const chunkZ = Math.floor(playerZ / (typeof CHUNK_SIZE !== 'undefined' ? CHUNK_SIZE : 16));
        
        console.log(`Player position: ${playerX.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${playerZ.toFixed(2)}`);
        console.log(`Current chunk: ${chunkX}, ${chunkZ}`);
        
        if (typeof loadedChunks !== 'undefined') {
            console.log(`Loaded chunks: ${loadedChunks.size}`);
            console.log('Chunk keys:', Array.from(loadedChunks.keys()));
        }
    }
}

// Make utilities available globally for console debugging
window.WorldUtils = WorldUtils;

// Console shortcuts
window.exportWorld = () => WorldUtils.exportCurrentWorld();
window.importWorld = () => WorldUtils.importWorldFromFile();
window.worldStats = () => WorldUtils.getWorldStats();
window.listWorlds = () => WorldUtils.listWorlds();
window.saveWorld = () => WorldUtils.saveCurrentWorld();
window.chunkInfo = () => WorldUtils.showChunkInfo();