// BlockCraft World Presets
// Predefined world types with special seeds and settings

const WORLD_PRESETS = {
    default: {
        name: "Default",
        description: "Balanced world with varied terrain",
        seed: null, // Random seed
        settings: {
            baseHeight: 4,
            chunkSize: 16,
            renderDistance: 1,
            biome: 'mixed',
            caves: true,
            structures: true
        },
        icon: "🌍"
    },
    
    infiniteForest: {
        name: "Infinite Forest",
        description: "Endless forests with tall trees and dense vegetation",
        seed: null, // Random seed for variety
        settings: {
            baseHeight: 5,
            chunkSize: 16,
            renderDistance: 1,
            biome: 'forest',
            caves: true,
            structures: true
        },
        icon: "🌲"
    },
    
    endlessDesert: {
        name: "Endless Desert",
        description: "Vast sandy dunes and desert landscapes",
        seed: null, // Random seed for variety
        settings: {
            baseHeight: 3,
            chunkSize: 16,
            renderDistance: 1,
            biome: 'desert',
            caves: true,
            structures: false
        },
        icon: "🏜️"
    },
    
    mountainous: {
        name: "Mountainous",
        description: "High peaks and mountain terrain",
        seed: null, // Random seed for variety
        settings: {
            baseHeight: 6,
            chunkSize: 16,
            renderDistance: 1,
            biome: 'mountain',
            caves: true,
            structures: true
        },
        icon: "⛰️"
    },
    
    flatlands: {
        name: "Flatlands",
        description: "Mostly flat terrain perfect for building",
        seed: null, // Random seed for variety
        settings: {
            baseHeight: 4,
            chunkSize: 16,
            renderDistance: 1,
            biome: 'plains',
            caves: false,
            structures: false
        },
        icon: "🌾"
    },
    
    archipelago: {
        name: "Archipelago",
        description: "Islands scattered across vast oceans",
        seed: null, // Random seed for variety
        settings: {
            baseHeight: 2,
            chunkSize: 16,
            renderDistance: 1,
            biome: 'mixed',
            caves: true,
            structures: true
        },
        icon: "🏝️"
    },
    
    underground: {
        name: "Underground",
        description: "Start deep underground in a cave system",
        seed: null, // Random seed for variety
        settings: {
            baseHeight: 8,
            chunkSize: 16,
            renderDistance: 1,
            biome: 'mixed',
            caves: true,
            structures: false
        },
        icon: "🕳️"
    },
    
    skylands: {
        name: "Skylands",
        description: "Floating islands high in the sky",
        seed: null, // Random seed for variety
        settings: {
            baseHeight: 20,
            chunkSize: 16,
            renderDistance: 1,
            biome: 'mixed',
            caves: false,
            structures: true
        },
        icon: "☁️"
    }
};

// Simple Minecraft-like terrain generation
class BiomeGenerator {
    constructor(seed, biome, settings) {
        this.seed = seed;
        this.biome = biome;
        this.settings = settings;
    }
    
    // Simple seeded random function
    seededRandom(x, z, offset = 0) {
        const seed = this.seed + offset;
        let hash = seed;
        hash = ((hash << 5) - hash) + x;
        hash = ((hash << 5) - hash) + z;
        hash = hash & hash; // Convert to 32-bit integer
        return Math.abs(hash % 1000) / 1000; // Return 0-1
    }
    
    // Simple noise using seeded random
    noise2D(x, z, scale = 1, offset = 0) {
        const scaledX = Math.floor(x / scale);
        const scaledZ = Math.floor(z / scale);
        return this.seededRandom(scaledX, scaledZ, offset);
    }
    
    // Generate height at world coordinates - SIMPLE like Minecraft
    getHeightAt(worldX, worldZ) {
        let height = this.settings.baseHeight || 4;
        
        // Simple terrain based on biome
        switch (this.biome) {
            case 'forest':
                // Rolling hills with trees
                height += Math.floor(this.noise2D(worldX, worldZ, 8) * 4);
                height += Math.floor(this.noise2D(worldX, worldZ, 16, 100) * 2);
                break;
                
            case 'desert':
                // Sandy dunes
                height += Math.floor(this.noise2D(worldX, worldZ, 12) * 3);
                height += Math.floor(this.noise2D(worldX, worldZ, 6, 200) * 2);
                break;
                
            case 'mountain':
                // Higher terrain with peaks
                height += Math.floor(this.noise2D(worldX, worldZ, 20) * 8);
                height += Math.floor(this.noise2D(worldX, worldZ, 10, 300) * 4);
                break;
                
            case 'plains':
                // Mostly flat
                height += Math.floor(this.noise2D(worldX, worldZ, 16) * 2);
                break;
                
            case 'mixed':
            default:
                // Varied terrain
                height += Math.floor(this.noise2D(worldX, worldZ, 10) * 3);
                height += Math.floor(this.noise2D(worldX, worldZ, 20, 400) * 2);
                break;
        }
        
        return Math.max(1, height); // Minimum height of 1
    }
    
    // Simple cave generation
    shouldHaveCave(worldX, worldY, worldZ) {
        if (!this.settings.caves || worldY > this.getHeightAt(worldX, worldZ) - 2) return false;
        
        // Simple cave system - only underground
        const caveChance = this.seededRandom(worldX, worldZ, worldY + 1000);
        return caveChance < 0.15; // 15% chance of cave
    }
    
    // Get block type for position - SIMPLE
    getBlockTypeAt(worldX, worldY, worldZ) {
        const surfaceHeight = this.getHeightAt(worldX, worldZ);
        
        // Check for caves first
        if (this.shouldHaveCave(worldX, worldY, worldZ)) {
            return null; // Air (cave)
        }
        
        // Above surface = air
        if (worldY > surfaceHeight) {
            return null;
        }
        
        // Surface block based on biome
        if (worldY === surfaceHeight) {
            switch (this.biome) {
                case 'desert':
                    return 'sand';
                case 'mountain':
                    return worldY > 8 ? 'stone' : 'grass';
                default:
                    return 'grass';
            }
        }
        
        // Underground blocks
        if (worldY > surfaceHeight - 3) {
            // Subsurface layer
            switch (this.biome) {
                case 'desert':
                    return 'sand';
                case 'mountain':
                    return 'stone';
                default:
                    return 'dirt';
            }
        } else {
            // Deep underground - always stone
            return 'stone';
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WORLD_PRESETS, BiomeGenerator };
}