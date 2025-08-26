// BlockCraft Pause Menu System
// Handles in-game pause menu with save/load functionality

class PauseMenu {
    constructor() {
        this.isVisible = false;
        this.pauseContainer = null;
        this.init();
    }
    
    init() {
        this.createPauseContainer();
        this.bindEvents();
    }
    
    createPauseContainer() {
        // Remove old pause menu if exists
        const oldPause = document.getElementById('pauseMenu');
        if (oldPause) oldPause.remove();
        
        // Create pause menu container
        this.pauseContainer = document.createElement('div');
        this.pauseContainer.id = 'pauseMenu';
        this.pauseContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            font-family: 'Press Start 2P', monospace;
            color: white;
        `;
        
        document.body.appendChild(this.pauseContainer);
    }
    
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.pauseContainer.style.display = 'flex';
        
        // Pause game rendering
        if (typeof Render !== 'undefined') {
            Render = false;
        }
        
        // Release pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Render pause menu content
        this.renderPauseMenu();
        
        // Add styles
        this.addPauseStyles();
        
        // Bind pause menu events
        this.bindPauseMenuEvents();
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.pauseContainer.style.display = 'none';
        
        // Resume game rendering
        if (typeof Render !== 'undefined') {
            Render = true;
        }
        
        // Re-lock pointer if controls exist
        if (typeof controls !== 'undefined' && controls.lock) {
            // Small delay to prevent immediate re-lock
            setTimeout(() => {
                controls.lock();
            }, 100);
        }
    }
    
    renderPauseMenu() {
        const currentWorldName = worldManager.currentWorld || 'Unknown World';
        
        this.pauseContainer.innerHTML = `
            <div class="pause-content">
                <h1 class="pause-title">Game Paused</h1>
                <div class="world-info">
                    <p>World: ${currentWorldName}</p>
                    <p>Seed: ${worldManager.worldData ? worldManager.worldData.seed : 'Unknown'}</p>
                </div>
                <div class="pause-buttons">
                    <button id="resumeGame" class="pause-button primary-button">Resume Game</button>
                    <button id="saveWorld" class="pause-button secondary-button">Save World</button>
                    <button id="saveAndExport" class="pause-button secondary-button">Save & Export JSON</button>
                    <button id="loadWorld" class="pause-button secondary-button">Load World JSON</button>
                    <button id="exitToMenu" class="pause-button danger-button">Exit to Main Menu</button>
                </div>
                <div class="save-status" id="saveStatus"></div>
            </div>
            
            <!-- Hidden file input for loading worlds -->
            <input type="file" id="worldFileInput" accept=".json,.bcworld" style="display: none;">
        `;
    }
    
    addPauseStyles() {
        // Remove existing pause styles
        const existingStyle = document.getElementById('pauseStyles');
        if (existingStyle) existingStyle.remove();
        
        const style = document.createElement('style');
        style.id = 'pauseStyles';
        style.textContent = `
            .pause-content {
                background: linear-gradient(to bottom, #C6C6C6 0%, #8B8B8B 100%);
                padding: 30px;
                border: 4px solid #000000;
                border-top: 4px solid #FFFFFF;
                border-left: 4px solid #FFFFFF;
                border-right: 4px solid #555555;
                border-bottom: 4px solid #555555;
                text-align: center;
                max-width: 500px;
                width: 90%;
                image-rendering: pixelated;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.3), 0 0 30px rgba(0,0,0,0.8);
            }
            
            .pause-title {
                font-size: 20px;
                margin-bottom: 20px;
                color: #000000;
                text-shadow: 1px 1px 0px #FFFFFF;
                font-weight: bold;
            }
            
            .world-info {
                margin-bottom: 25px;
                padding: 12px;
                background: linear-gradient(to bottom, #DDDDDD 0%, #AAAAAA 100%);
                border: 2px solid #000000;
                border-top: 2px solid #FFFFFF;
                border-left: 2px solid #FFFFFF;
                border-right: 2px solid #666666;
                border-bottom: 2px solid #666666;
                image-rendering: pixelated;
            }
            
            .world-info p {
                margin: 4px 0;
                font-size: 8px;
                color: #000000;
                text-shadow: 1px 1px 0px #FFFFFF;
            }
            
            .pause-buttons {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .pause-button {
                background: linear-gradient(to bottom, #C6C6C6 0%, #8B8B8B 50%, #5A5A5A 51%, #8B8B8B 100%);
                border: 2px solid #000000;
                border-top: 2px solid #FFFFFF;
                border-left: 2px solid #FFFFFF;
                border-right: 2px solid #555555;
                border-bottom: 2px solid #555555;
                color: #FFFFFF;
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                padding: 10px 20px;
                text-shadow: 1px 1px 0px #000000;
                cursor: pointer;
                transition: all 0.05s ease;
                min-width: 180px;
                image-rendering: pixelated;
                position: relative;
                overflow: hidden;
            }
            
            .pause-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, 
                    rgba(255,255,255,0.2) 0%, 
                    rgba(255,255,255,0.1) 25%, 
                    rgba(0,0,0,0.1) 75%, 
                    rgba(0,0,0,0.2) 100%);
                pointer-events: none;
            }
            
            .pause-button:hover {
                background: linear-gradient(to bottom, #E0E0E0 0%, #A0A0A0 50%, #707070 51%, #A0A0A0 100%);
                transform: translateY(-1px);
            }
            
            .pause-button:active {
                background: linear-gradient(to bottom, #808080 0%, #606060 50%, #404040 51%, #606060 100%);
                border-top: 2px solid #333333;
                border-left: 2px solid #333333;
                border-right: 2px solid #FFFFFF;
                border-bottom: 2px solid #FFFFFF;
                transform: translateY(1px);
            }
            
            .primary-button {
                background: linear-gradient(to bottom, #55FF55 0%, #00AA00 50%, #008800 51%, #00AA00 100%) !important;
                border-top: 2px solid #AAFFAA !important;
                border-left: 2px solid #AAFFAA !important;
                border-right: 2px solid #004400 !important;
                border-bottom: 2px solid #004400 !important;
            }
            
            .primary-button:hover {
                background: linear-gradient(to bottom, #77FF77 0%, #22CC22 50%, #00AA00 51%, #22CC22 100%) !important;
            }
            
            .secondary-button {
                background: linear-gradient(to bottom, #5555FF 0%, #0000AA 50%, #000088 51%, #0000AA 100%) !important;
                border-top: 2px solid #AAAAFF !important;
                border-left: 2px solid #AAAAFF !important;
                border-right: 2px solid #000044 !important;
                border-bottom: 2px solid #000044 !important;
            }
            
            .secondary-button:hover {
                background: linear-gradient(to bottom, #7777FF 0%, #2222CC 50%, #0000AA 51%, #2222CC 100%) !important;
            }
            
            .danger-button {
                background: linear-gradient(to bottom, #FF5555 0%, #AA0000 50%, #880000 51%, #AA0000 100%) !important;
                border-top: 2px solid #FFAAAA !important;
                border-left: 2px solid #FFAAAA !important;
                border-right: 2px solid #440000 !important;
                border-bottom: 2px solid #440000 !important;
            }
            
            .danger-button:hover {
                background: linear-gradient(to bottom, #FF7777 0%, #CC2222 50%, #AA0000 51%, #CC2222 100%) !important;
            }
            
            .save-status {
                min-height: 20px;
                font-size: 10px;
                color: #4CAF50;
                margin-top: 10px;
            }
            
            .save-status.error {
                color: #f44336;
            }
            
            .save-status.success {
                color: #4CAF50;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    bindEvents() {
        // P key to toggle pause menu
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyP') {
                event.preventDefault();
                if (this.isVisible) {
                    this.hide();
                } else {
                    // Only show pause menu if game is running (not in main menu)
                    if (typeof Render !== 'undefined' && Render) {
                        this.show();
                    }
                }
            }
        });
    }
    
    bindPauseMenuEvents() {
        // Resume game
        document.getElementById('resumeGame').addEventListener('click', () => {
            this.hide();
        });
        
        // Save world
        document.getElementById('saveWorld').addEventListener('click', () => {
            this.saveCurrentWorld();
        });
        
        // Save and export world as JSON
        document.getElementById('saveAndExport').addEventListener('click', () => {
            this.saveAndExportWorld();
        });
        
        // Load world from JSON
        document.getElementById('loadWorld').addEventListener('click', () => {
            this.loadWorldFromFile();
        });
        
        // Exit to main menu
        document.getElementById('exitToMenu').addEventListener('click', () => {
            this.exitToMainMenu();
        });
        
        // File input change event
        document.getElementById('worldFileInput').addEventListener('change', (event) => {
            this.handleWorldFileLoad(event);
        });
    }
    
    saveCurrentWorld() {
        const statusEl = document.getElementById('saveStatus');
        statusEl.textContent = 'Saving world...';
        statusEl.className = 'save-status';
        
        try {
            // Save current chunks before saving world
            this.saveCurrentChunks();
            
            // Save world data
            const success = worldManager.saveWorld();
            
            if (success) {
                statusEl.textContent = 'World saved successfully!';
                statusEl.className = 'save-status success';
            } else {
                statusEl.textContent = 'Failed to save world';
                statusEl.className = 'save-status error';
            }
        } catch (error) {
            console.error('Save error:', error);
            statusEl.textContent = 'Error saving world: ' + error.message;
            statusEl.className = 'save-status error';
        }
        
        // Clear status after 3 seconds
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'save-status';
        }, 3000);
    }
    
    saveAndExportWorld() {
        const statusEl = document.getElementById('saveStatus');
        statusEl.textContent = 'Exporting world...';
        statusEl.className = 'save-status';
        
        try {
            // Save current chunks first
            this.saveCurrentChunks();
            
            // Save to localStorage
            worldManager.saveWorld();
            
            // Export as JSON file
            const worldData = JSON.stringify(worldManager.worldData, worldManager.mapReplacer, 2);
            const blob = new Blob([worldData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${worldManager.currentWorld || 'world'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            statusEl.textContent = 'World exported successfully!';
            statusEl.className = 'save-status success';
        } catch (error) {
            console.error('Export error:', error);
            statusEl.textContent = 'Error exporting world: ' + error.message;
            statusEl.className = 'save-status error';
        }
        
        // Clear status after 3 seconds
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'save-status';
        }, 3000);
    }
    
    loadWorldFromFile() {
        const fileInput = document.getElementById('worldFileInput');
        fileInput.click();
    }
    
    handleWorldFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const statusEl = document.getElementById('saveStatus');
        statusEl.textContent = 'Loading world...';
        statusEl.className = 'save-status';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const worldData = JSON.parse(e.target.result, worldManager.mapReviver);
                
                // Validate world data
                if (!worldData.name || !worldData.seed) {
                    throw new Error('Invalid world file format');
                }
                
                // Load the world data
                worldManager.worldData = worldData;
                worldManager.currentWorld = worldData.name;
                
                // Save to localStorage
                worldManager.saveWorld();
                
                statusEl.textContent = 'World loaded! Restart to apply changes.';
                statusEl.className = 'save-status success';
                
                // Clear file input
                event.target.value = '';
                
            } catch (error) {
                console.error('Load error:', error);
                statusEl.textContent = 'Error loading world: ' + error.message;
                statusEl.className = 'save-status error';
            }
        };
        
        reader.readAsText(file);
        
        // Clear status after 5 seconds
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'save-status';
        }, 5000);
    }
    
    saveCurrentChunks() {
        // Save all currently loaded chunks to world data
        if (typeof loadedChunks !== 'undefined' && worldManager) {
            for (const [chunkKey, chunkData] of loadedChunks.entries()) {
                const [cx, cz] = chunkKey.split(',').map(Number);
                
                // Store chunk data in world manager
                const chunkBlocks = [];
                chunkData.group.children.forEach(child => {
                    // Only save mesh objects (blocks), not lights
                    if (child instanceof THREE.Mesh) {
                        const materialType = this.getMaterialType(child.material);
                        chunkBlocks.push({
                            x: child.position.x,
                            y: child.position.y,
                            z: child.position.z,
                            material: materialType,
                            type: materialType,
                            isLight: materialType === 'light',
                            hasLight: child.userData && child.userData.light ? true : false
                        });
                    }
                });
                
                worldManager.worldData.chunks.set(chunkKey, {
                    blocks: chunkBlocks,
                    lastSaved: Date.now(),
                    playerModified: true
                });
            }
        }
    }
    
    getMaterialType(material) {
        // Helper to identify material type from Three.js material
        if (!material) return 'grass';
        
        // Check for light blocks first (they have emissive properties)
        if (material.emissive && material.emissive.getHex() > 0) {
            return 'light';
        }
        
        if (!material.map) return 'grass';
        
        const textureName = material.map.image?.src || '';
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
    
    exitToMainMenu() {
        if (confirm('Are you sure you want to exit to main menu? Unsaved progress will be lost.')) {
            // Save current state first
            this.saveCurrentChunks();
            worldManager.saveWorld();
            
            // Hide pause menu
            this.hide();
            
            // Clear the scene
            if (typeof scene !== 'undefined') {
                while (scene.children.length > 0) {
                    scene.remove(scene.children[0]);
                }
            }
            
            // Clear loaded chunks
            if (typeof loadedChunks !== 'undefined') {
                loadedChunks.clear();
            }
            
            // Stop rendering
            if (typeof Render !== 'undefined') {
                Render = false;
            }
            
            // Show main menu
            if (typeof menuSystem !== 'undefined') {
                menuSystem.menuContainer.style.display = 'flex';
                menuSystem.showMainMenu();
            }
            
            // Show version overlay
            const versionOverlay = document.getElementById('GameVersionOverlay');
            if (versionOverlay) versionOverlay.style.display = 'block';
            
            // Hide game UI
            const hotbar = document.getElementById('hotbar');
            const crosshair = document.getElementById('crosshair');
            if (hotbar) hotbar.style.display = 'none';
            if (crosshair) crosshair.style.display = 'none';
        }
    }
}

// Global pause menu instance
const pauseMenu = new PauseMenu();