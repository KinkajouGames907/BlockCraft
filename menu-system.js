// BlockCraft Menu System
// Handles all menu functionality and rendering

class MenuSystem {
    constructor() {
        this.currentScreen = 'main';
        this.menuContainer = null;
        this.init();
    }
    
    init() {
        this.createMenuContainer();
        this.showMainMenu();
    }
    
    createMenuContainer() {
        // Remove old menu if exists
        const oldMenu = document.getElementById('mainMenu');
        if (oldMenu) oldMenu.remove();
        
        // Create new menu container
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'mainMenu';
        this.menuContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${MENU_CONFIG.style.backgroundColor};
            background-size: 64px 64px;
            background-repeat: repeat;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            z-index: 1000;
            font-family: ${MENU_CONFIG.style.fontFamily};
            color: ${MENU_CONFIG.style.textColor};
            overflow-y: auto;
            overflow-x: hidden;
        `;
        
        document.body.appendChild(this.menuContainer);
    }
    
    showMainMenu() {
        this.currentScreen = 'main';
        this.menuContainer.innerHTML = `
            <div class="menu-background"></div>
            <div class="menu-content">
                ${MENU_CONFIG.updateBanner ? `<div class="update-banner">${MENU_CONFIG.updateBanner}</div>` : ''}
                <h1 class="game-title">${MENU_CONFIG.gameTitle}</h1>
                <div class="version-info">${MENU_CONFIG.gameVersion}</div>
                <div class="main-buttons">
                    ${this.renderMainButtons()}
                </div>
            </div>
        `;
        
        this.addMenuStyles();
        this.bindMainMenuEvents();
    }
    
    renderMainButtons() {
        return MENU_CONFIG.mainButtons.map(button => {
            const disabled = button.disabled ? 'disabled' : '';
            const styleClass = button.style === 'secondary' ? 'secondary-button' : 'primary-button';
            
            return `
                <button 
                    id="${button.id}" 
                    class="menu-button ${styleClass}" 
                    ${disabled}
                    data-action="${button.action}"
                >
                    ${button.text}
                </button>
            `;
        }).join('');
    }
    
    showWorldSelection() {
        this.currentScreen = 'worldSelection';
        const savedWorlds = worldManager.getSavedWorlds();
        
        this.menuContainer.innerHTML = `
            <div class="menu-background"></div>
            <div class="menu-content">
                <h2 class="screen-title">Select World</h2>
                <div class="world-list">
                    ${savedWorlds.length > 0 ? this.renderWorldList(savedWorlds) : '<p class="no-worlds">No saved worlds found</p>'}
                </div>
                <div class="world-buttons">
                    <button id="createNewWorld" class="menu-button primary-button">Create New World</button>
                    <button id="uploadWorld" class="menu-button secondary-button">Upload World JSON</button>
                    <button id="backToMain" class="menu-button secondary-button">Back</button>
                </div>
                
                <!-- Hidden file input for uploading worlds -->
                <input type="file" id="worldUploadInput" accept=".json,.bcworld" style="display: none;">
            </div>
        `;
        
        this.addMenuStyles();
        this.bindWorldSelectionEvents();
    }

    renderWorldList(worlds) {
        return worlds.map(world => {
            const lastPlayed = new Date(world.lastPlayed).toLocaleDateString();
            return `
                <div class="world-item" data-world-name="${world.name}">
                    <div class="world-info">
                        <h3 class="world-name">${world.name}</h3>
                        <p class="world-details">Seed: ${world.seed} | Last played: ${lastPlayed}</p>
                        <p class="world-version">Version: ${world.version}</p>
                    </div>
                    <div class="world-actions">
                        <button class="world-play-btn" data-world-name="${world.name}">Play</button>
                        <button class="world-delete-btn" data-world-name="${world.name}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showWorldCreation() {
        this.currentScreen = 'worldCreation';
        this.menuContainer.innerHTML = `
            <div class="menu-background"></div>
            <div class="menu-content">
                <h2 class="screen-title">Create New World</h2>
                <div class="world-presets">
                    <h3>World Presets</h3>
                    <div class="preset-grid">
                        ${this.renderWorldPresets()}
                    </div>
                </div>
                <div class="world-settings">
                    ${this.renderWorldSettings()}
                </div>
                <div class="world-buttons">
                    <button id="createWorld" class="menu-button primary-button">Create World</button>
                    <button id="backToWorldSelection" class="menu-button secondary-button">Cancel</button>
                </div>
            </div>
        `;
        
        this.addMenuStyles();
        this.bindWorldCreationEvents();
    }

    renderWorldPresets() {
        return Object.entries(WORLD_PRESETS).map(([key, preset]) => `
            <div class="preset-item ${key === 'default' ? 'selected' : ''}" data-preset="${key}">
                <div class="preset-icon">${preset.icon}</div>
                <div class="preset-name">${preset.name}</div>
                <div class="preset-description">${preset.description}</div>
            </div>
        `).join('');
    }
    
    renderWorldSettings() {
        return MENU_CONFIG.worldSettings.map(setting => {
            let input = '';
            
            if (setting.type === 'number') {
                input = `
                    <input 
                        type="number" 
                        id="${setting.id}" 
                        min="${setting.min}" 
                        max="${setting.max}" 
                        value="${setting.default}"
                        class="setting-input"
                    >
                `;
            } else if (setting.type === 'text') {
                input = `
                    <input 
                        type="text" 
                        id="${setting.id}" 
                        value="${setting.default}"
                        class="setting-input"
                    >
                `;
            } else if (setting.type === 'select' && setting.options === 'presets') {
                const options = Object.entries(WORLD_PRESETS).map(([key, preset]) => 
                    `<option value="${key}" ${key === setting.default ? 'selected' : ''}>${preset.name}</option>`
                ).join('');
                input = `
                    <select id="${setting.id}" class="setting-input">
                        ${options}
                    </select>
                `;
            }
            
            return `
                <div class="setting-row">
                    <label for="${setting.id}" class="setting-label">${setting.label}:</label>
                    ${input}
                    <div class="setting-description">${setting.description}</div>
                </div>
            `;
        }).join('');
    }
    
    showAbout() {
        this.currentScreen = 'about';
        this.menuContainer.innerHTML = `
            <div class="menu-background"></div>
            <div class="menu-content">
                <div class="about-content">
                    ${MENU_CONFIG.aboutText}
                </div>
                <div class="about-buttons">
                    <button id="backToMain" class="menu-button primary-button">Back</button>
                </div>
            </div>
        `;
        
        this.addMenuStyles();
        this.bindAboutEvents();
    }
    
    showComingSoon() {
        this.currentScreen = 'comingSoon';
        this.menuContainer.innerHTML = `
            <div class="menu-background"></div>
            <div class="menu-content">
                <h2 class="screen-title">Coming Soon!</h2>
                <p class="coming-soon-text">This feature is currently in development.</p>
                <p class="coming-soon-text">Stay tuned for future updates!</p>
                <div class="coming-soon-buttons">
                    <button id="backToMain" class="menu-button primary-button">Back</button>
                </div>
            </div>
        `;
        
        this.addMenuStyles();
        this.bindComingSoonEvents();
    }
    
    addMenuStyles() {
        // Remove existing styles
        const existingStyle = document.getElementById('menuStyles');
        if (existingStyle) existingStyle.remove();
        
        const style = document.createElement('style');
        style.id = 'menuStyles';
        style.textContent = `
            .menu-background {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: ${MENU_CONFIG.style.backgroundColor};
                background-size: 64px 64px;
                background-repeat: repeat;
                z-index: -1;
            }
            
            .menu-background::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: ${MENU_CONFIG.style.backgroundOverlay};
                z-index: 1;
            }
            
            .menu-content {
                position: relative;
                z-index: 1001;
                text-align: center;
                max-width: 800px;
                width: 100%;
                padding: 20px;
                margin: 20px auto;
                min-height: calc(100vh - 40px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                box-sizing: border-box;
            }
            
            .update-banner {
                background: linear-gradient(to bottom, #FFFF55 0%, #FFAA00 100%);
                color: #000000;
                padding: 6px 12px;
                border: 2px solid #000000;
                border-top: 2px solid #FFFFFF;
                border-left: 2px solid #FFFFFF;
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 20px;
                text-shadow: none;
                image-rendering: pixelated;
            }
            
            .game-title {
                font-size: 48px;
                margin: 30px 0;
                color: #FFFFFF;
                text-shadow: 3px 3px 0px #000000;
                letter-spacing: 2px;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
            }
            
            .version-info {
                font-size: 12px;
                color: #ccc;
                margin-bottom: 40px;
            }
            
            .screen-title {
                font-size: 32px;
                margin-bottom: 30px;
                text-shadow: 2px 2px 0px #000;
            }
            
            .main-buttons, .world-buttons, .about-buttons, .coming-soon-buttons {
                display: flex;
                flex-direction: column;
                gap: 15px;
                align-items: center;
            }
            
            .menu-button {
                ${Object.entries(MENU_CONFIG.style.buttonStyle).map(([key, value]) => 
                    `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`
                ).join(' ')}
                min-width: 200px;
                position: relative;
                overflow: hidden;
            }
            
            .menu-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, 
                    rgba(255,255,255,0.3) 0%, 
                    rgba(255,255,255,0.1) 25%, 
                    rgba(0,0,0,0.1) 75%, 
                    rgba(0,0,0,0.3) 100%);
                pointer-events: none;
            }
            
            .menu-button:hover:not(:disabled) {
                background: linear-gradient(to bottom, #E0E0E0 0%, #A0A0A0 50%, #707070 51%, #A0A0A0 100%);
                border-top: 2px solid #FFFFFF;
                border-left: 2px solid #FFFFFF;
                border-right: 2px solid #333333;
                border-bottom: 2px solid #333333;
                transform: translateY(-1px);
            }
            
            .menu-button:active:not(:disabled) {
                background: linear-gradient(to bottom, #808080 0%, #606060 50%, #404040 51%, #606060 100%);
                border-top: 2px solid #333333;
                border-left: 2px solid #333333;
                border-right: 2px solid #FFFFFF;
                border-bottom: 2px solid #FFFFFF;
                transform: translateY(1px);
            }
            
            .menu-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                background: linear-gradient(to bottom, #666 0%, #444 50%, #333 51%, #444 100%);
                color: #999999;
            }
            
            .secondary-button {
                background: linear-gradient(to bottom, #999999 0%, #666666 50%, #444444 51%, #666666 100%) !important;
            }
            
            .secondary-button:hover:not(:disabled) {
                background: linear-gradient(to bottom, #BBBBBB 0%, #888888 50%, #666666 51%, #888888 100%) !important;
            }
            
            .world-settings {
                background: linear-gradient(to bottom, #C6C6C6 0%, #8B8B8B 100%);
                padding: 20px;
                border: 3px solid #000000;
                border-top: 3px solid #FFFFFF;
                border-left: 3px solid #FFFFFF;
                border-right: 3px solid #555555;
                border-bottom: 3px solid #555555;
                margin-bottom: 30px;
                text-align: left;
                max-height: 300px;
                overflow-y: auto;
                image-rendering: pixelated;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
            }
            
            .world-settings::-webkit-scrollbar {
                width: 8px;
            }
            
            .world-settings::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.3);
                border-radius: 4px;
            }
            
            .world-settings::-webkit-scrollbar-thumb {
                background: ${MENU_CONFIG.style.primaryColor};
                border-radius: 4px;
            }
            
            .setting-row {
                margin-bottom: 20px;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .setting-label {
                font-size: 14px;
                font-weight: bold;
            }
            
            .setting-input {
                padding: 6px 10px;
                font-size: 12px;
                font-family: ${MENU_CONFIG.style.fontFamily};
                background: linear-gradient(to bottom, #FFFFFF 0%, #CCCCCC 100%);
                color: #000000;
                border: 2px solid #000000;
                border-top: 2px solid #555555;
                border-left: 2px solid #555555;
                border-right: 2px solid #FFFFFF;
                border-bottom: 2px solid #FFFFFF;
                max-width: 200px;
                image-rendering: pixelated;
            }
            
            .setting-input:focus {
                outline: none;
                background: linear-gradient(to bottom, #FFFFAA 0%, #DDDDAA 100%);
                border-color: #000000;
            }
            
            .setting-description {
                font-size: 10px;
                color: #aaa;
                font-style: italic;
            }
            
            .about-content {
                background: rgba(0,0,0,0.8);
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 30px;
                text-align: left;
                max-height: 500px;
                overflow-y: auto;
                border: 2px solid #666;
            }
            
            .about-content::-webkit-scrollbar {
                width: 12px;
            }
            
            .about-content::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.3);
                border-radius: 6px;
            }
            
            .about-content::-webkit-scrollbar-thumb {
                background: ${MENU_CONFIG.style.primaryColor};
                border-radius: 6px;
                border: 2px solid rgba(0,0,0,0.3);
            }
            
            .about-content::-webkit-scrollbar-thumb:hover {
                background: ${MENU_CONFIG.style.buttonHoverColor};
            }
            
            .about-content h2 {
                color: ${MENU_CONFIG.style.primaryColor};
                margin-top: 0;
            }
            
            .about-content h3 {
                color: #ccc;
                margin-top: 20px;
            }
            
            .about-content ul {
                padding-left: 20px;
            }
            
            .about-content li {
                margin-bottom: 5px;
                line-height: 1.4;
            }
            
            .coming-soon-text {
                font-size: 18px;
                margin: 20px 0;
                color: #ccc;
            }

            .world-list {
                max-height: 400px;
                overflow-y: auto;
                margin-bottom: 20px;
                background: linear-gradient(to bottom, #C6C6C6 0%, #8B8B8B 100%);
                padding: 10px;
                border: 3px solid #000000;
                border-top: 3px solid #FFFFFF;
                border-left: 3px solid #FFFFFF;
                border-right: 3px solid #555555;
                border-bottom: 3px solid #555555;
                image-rendering: pixelated;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
            }
            
            .world-list::-webkit-scrollbar {
                width: 12px;
            }
            
            .world-list::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.3);
                border-radius: 6px;
            }
            
            .world-list::-webkit-scrollbar-thumb {
                background: ${MENU_CONFIG.style.primaryColor};
                border-radius: 6px;
                border: 2px solid rgba(0,0,0,0.3);
            }
            
            .world-list::-webkit-scrollbar-thumb:hover {
                background: ${MENU_CONFIG.style.buttonHoverColor};
            }

            .world-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                margin-bottom: 8px;
                background: linear-gradient(to bottom, #DDDDDD 0%, #AAAAAA 100%);
                border: 2px solid #000000;
                border-top: 2px solid #FFFFFF;
                border-left: 2px solid #FFFFFF;
                border-right: 2px solid #666666;
                border-bottom: 2px solid #666666;
                image-rendering: pixelated;
            }

            .world-item:hover {
                background: linear-gradient(to bottom, #EEEEEE 0%, #BBBBBB 100%);
                border-top: 2px solid #FFFFFF;
                border-left: 2px solid #FFFFFF;
                border-right: 2px solid #555555;
                border-bottom: 2px solid #555555;
            }

            .world-info {
                flex: 1;
                text-align: left;
            }

            .world-name {
                margin: 0 0 5px 0;
                font-size: 14px;
                color: #000000;
                text-shadow: 1px 1px 0px #FFFFFF;
                font-weight: bold;
            }

            .world-details, .world-version {
                margin: 0;
                font-size: 8px;
                color: #333333;
                text-shadow: 1px 1px 0px #FFFFFF;
            }

            .world-actions {
                display: flex;
                gap: 10px;
            }

            .world-play-btn, .world-delete-btn {
                padding: 6px 12px;
                font-size: 10px;
                font-family: ${MENU_CONFIG.style.fontFamily};
                border: 2px solid #000000;
                cursor: pointer;
                transition: all 0.1s;
                image-rendering: pixelated;
                text-shadow: 1px 1px 0px #000000;
            }

            .world-play-btn {
                background: linear-gradient(to bottom, #55FF55 0%, #00AA00 100%);
                color: #FFFFFF;
                border-top: 2px solid #AAFFAA;
                border-left: 2px solid #AAFFAA;
                border-right: 2px solid #004400;
                border-bottom: 2px solid #004400;
            }

            .world-play-btn:hover {
                background: linear-gradient(to bottom, #77FF77 0%, #22CC22 100%);
            }

            .world-delete-btn {
                background: linear-gradient(to bottom, #FF5555 0%, #AA0000 100%);
                color: #FFFFFF;
                border-top: 2px solid #FFAAAA;
                border-left: 2px solid #FFAAAA;
                border-right: 2px solid #440000;
                border-bottom: 2px solid #440000;
            }

            .world-delete-btn:hover {
                background: linear-gradient(to bottom, #FF7777 0%, #CC2222 100%);
            }

            .no-worlds {
                text-align: center;
                color: #aaa;
                font-style: italic;
                padding: 40px;
            }

            .world-presets {
                margin-bottom: 30px;
                background: rgba(0,0,0,0.8);
                padding: 20px;
                border-radius: 8px;
                border: 2px solid #666;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .world-presets::-webkit-scrollbar {
                width: 8px;
            }
            
            .world-presets::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.3);
                border-radius: 4px;
            }
            
            .world-presets::-webkit-scrollbar-thumb {
                background: ${MENU_CONFIG.style.primaryColor};
                border-radius: 4px;
            }

            .world-presets h3 {
                margin-bottom: 15px;
                color: ${MENU_CONFIG.style.primaryColor};
            }

            .preset-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }

            .preset-item {
                padding: 12px;
                background: linear-gradient(to bottom, #BBBBBB 0%, #888888 100%);
                border: 2px solid #000000;
                border-top: 2px solid #CCCCCC;
                border-left: 2px solid #CCCCCC;
                border-right: 2px solid #444444;
                border-bottom: 2px solid #444444;
                cursor: pointer;
                transition: all 0.1s;
                text-align: center;
                image-rendering: pixelated;
            }

            .preset-item:hover {
                background: linear-gradient(to bottom, #CCCCCC 0%, #999999 100%);
                border-top: 2px solid #DDDDDD;
                border-left: 2px solid #DDDDDD;
                border-right: 2px solid #333333;
                border-bottom: 2px solid #333333;
            }

            .preset-item.selected {
                background: linear-gradient(to bottom, #DDDDDD 0%, #AAAAAA 100%);
                border-top: 2px solid #FFFFFF;
                border-left: 2px solid #FFFFFF;
                border-right: 2px solid #666666;
                border-bottom: 2px solid #666666;
                box-shadow: inset 0 0 8px rgba(85, 255, 85, 0.3);
            }

            .preset-icon {
                font-size: 32px;
                margin-bottom: 10px;
            }

            .preset-name {
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #000000;
                text-shadow: 1px 1px 0px #FFFFFF;
            }

            .preset-description {
                font-size: 7px;
                color: #333333;
                line-height: 1.3;
                text-shadow: 1px 1px 0px #FFFFFF;
            }
            
            /* Global scrollbar styling */
            * {
                scrollbar-width: thin;
                scrollbar-color: ${MENU_CONFIG.style.primaryColor} rgba(0,0,0,0.3);
            }
            
            /* Smooth scrolling for the main container */
            #mainMenu {
                scroll-behavior: smooth;
            }
            
            /* Mobile scrolling improvements */
            @media (max-width: 768px) {
                .menu-content {
                    padding: 10px;
                    margin: 10px auto;
                }
                
                .world-list {
                    max-height: 250px;
                }
                
                .world-presets {
                    max-height: 300px;
                }
                
                .about-content {
                    max-height: 350px;
                    padding: 20px;
                }
                
                .preset-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Ensure content doesn't get cut off */
            .main-buttons, .world-buttons, .about-buttons, .coming-soon-buttons {
                margin-top: auto;
                padding-top: 20px;
            }
            
            /* Better spacing for scrollable areas */
            .world-item:last-child {
                margin-bottom: 0;
            }
            
            .setting-row:last-child {
                margin-bottom: 0;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    bindMainMenuEvents() {
        MENU_CONFIG.mainButtons.forEach(button => {
            const element = document.getElementById(button.id);
            if (element && !button.disabled) {
                element.addEventListener('click', () => {
                    this.handleAction(button.action);
                });
            }
        });
    }
    
    bindWorldSelectionEvents() {
        document.getElementById('createNewWorld').addEventListener('click', () => {
            this.showWorldCreation();
        });
        
        document.getElementById('uploadWorld').addEventListener('click', () => {
            document.getElementById('worldUploadInput').click();
        });
        
        document.getElementById('backToMain').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Bind world play buttons
        document.querySelectorAll('.world-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const worldName = e.target.getAttribute('data-world-name');
                this.loadAndStartGame(worldName);
            });
        });

        // Bind world delete buttons
        document.querySelectorAll('.world-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const worldName = e.target.getAttribute('data-world-name');
                if (confirm(`Are you sure you want to delete "${worldName}"?`)) {
                    worldManager.deleteWorld(worldName);
                    this.showWorldSelection(); // Refresh the list
                }
            });
        });
        
        // Bind world upload input
        document.getElementById('worldUploadInput').addEventListener('change', (e) => {
            this.handleWorldUpload(e);
        });
    }

    bindWorldCreationEvents() {
        // Preset selection
        document.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.preset-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                const presetKey = item.getAttribute('data-preset');
                const preset = WORLD_PRESETS[presetKey];
                
                // Update world type selector
                const worldTypeSelect = document.getElementById('worldType');
                if (worldTypeSelect) {
                    worldTypeSelect.value = presetKey;
                }
                
                // Auto-fill seed if preset has one
                const seedInput = document.getElementById('seed');
                if (seedInput && preset.seed) {
                    seedInput.value = preset.seed;
                }
            });
        });

        document.getElementById('createWorld').addEventListener('click', () => {
            this.createAndStartGame();
        });
        
        document.getElementById('backToWorldSelection').addEventListener('click', () => {
            this.showWorldSelection();
        });
    }
    
    bindAboutEvents() {
        document.getElementById('backToMain').addEventListener('click', () => {
            this.showMainMenu();
        });
    }
    
    bindComingSoonEvents() {
        document.getElementById('backToMain').addEventListener('click', () => {
            this.showMainMenu();
        });
    }
    
    handleAction(action) {
        switch(action) {
            case 'showWorldSelection':
                this.showWorldSelection();
                break;
            case 'showWorldCreation':
                this.showWorldCreation();
                break;
            case 'showAbout':
                this.showAbout();
                break;
            case 'showOptions':
                this.showComingSoon();
                break;
            case 'showComingSoon':
                this.showComingSoon();
                break;
            case 'quitGame':
                if (confirm('Are you sure you want to quit?')) {
                    window.close();
                }
                break;
        }
    }
    
    createAndStartGame() {
        // Get world settings
        const worldName = document.getElementById('worldName').value || 'New World';
        const worldType = document.getElementById('worldType').value || 'default';
        const seedInput = document.getElementById('seed').value;
        const renderDistance = parseInt(document.getElementById('renderDistance').value) || 8;
        
        // Get preset settings
        const preset = WORLD_PRESETS[worldType];
        // Always generate random seed unless user provides specific seed
        const seed = seedInput ? (parseInt(seedInput) || worldManager.generateSeed(seedInput)) : null;
        
        // Create world with preset settings
        const worldSettings = {
            ...preset.settings,
            renderDistance: renderDistance
        };
        
        worldManager.createWorld(worldName, worldSettings, seed);
        this.startGameWithWorld();
    }

    loadAndStartGame(worldName) {
        if (worldManager.loadWorld(worldName)) {
            this.startGameWithWorld();
        } else {
            alert(`Failed to load world "${worldName}"`);
        }
    }

    handleWorldUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // Get a unique name for the uploaded world
                const baseName = file.name.replace(/\.(json|bcworld)$/, '');
                let worldName = baseName;
                let counter = 1;
                
                // Ensure unique name
                const existingWorlds = worldManager.getSavedWorlds();
                while (existingWorlds.some(w => w.name === worldName)) {
                    worldName = `${baseName}_${counter}`;
                    counter++;
                }
                
                // Import the world
                const success = worldManager.importWorldFromJSON(e.target.result, worldName);
                
                if (success) {
                    alert(`World "${worldName}" uploaded successfully!`);
                    this.showWorldSelection(); // Refresh the world list
                } else {
                    alert('Failed to upload world. Please check the file format.');
                }
                
            } catch (error) {
                console.error('Upload error:', error);
                alert('Error uploading world: ' + error.message);
            }
            
            // Clear file input
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }

    startGameWithWorld() {
        // Hide menu and start game
        this.menuContainer.style.display = 'none';
        
        // Hide version overlay
        const versionOverlay = document.getElementById('GameVersionOverlay');
        if (versionOverlay) versionOverlay.style.display = 'none';
        
        // Clear existing scene and chunks
        if (typeof scene !== 'undefined') {
            // Remove all existing chunks from scene
            const objectsToRemove = [];
            scene.traverse((child) => {
                if (child.type === 'Group' && child !== scene) {
                    objectsToRemove.push(child);
                }
            });
            objectsToRemove.forEach(obj => scene.remove(obj));
        }
        
        // Clear loaded chunks
        if (typeof loadedChunks !== 'undefined') {
            loadedChunks.clear();
        }
        
        // Initialize biome generator for the world
        if (typeof initializeBiomeGenerator === 'function') {
            initializeBiomeGenerator();
        }
        
        // Check if we have saved world data to restore
        const hasSavedChunks = worldManager.worldData && worldManager.worldData.chunks && 
                              Object.keys(worldManager.worldData.chunks).length > 0;
        
        if (hasSavedChunks) {
            console.log('Restoring saved world chunks...');
            this.restoreWorldChunks();
        } else {
            console.log('No saved chunks found, generating new world...');
            // Force initial chunk generation around player for new worlds
            if (typeof camera !== 'undefined' && typeof updateChunks === 'function') {
                setTimeout(() => {
                    updateChunks(
                        camera.position.x,
                        camera.position.z,
                        typeof blockGeometry !== 'undefined' ? blockGeometry : new THREE.BoxGeometry(1, 1, 1),
                        null,
                        scene
                    );
                    console.log('Generated initial chunks for new world');
                    // Setup lighting after chunk generation
                    this.setupWorldLighting();
                }, 100);
            }
        }
        
        // Always setup lighting when starting a world
        setTimeout(() => {
            this.setupWorldLighting();
        }, 200);
        
        // Show game UI
        const hotbar = document.getElementById('hotbar');
        const crosshair = document.getElementById('crosshair');
        if (hotbar) hotbar.style.display = 'block';
        if (crosshair) crosshair.style.display = 'block';
        
        // Set camera to safe spawn position
        if (typeof camera !== 'undefined') {
            if (worldManager.worldData) {
                // Use saved position if available
                const pos = worldManager.worldData.playerPosition;
                const rot = worldManager.worldData.playerRotation;
                camera.position.set(pos.x, pos.y, pos.z);
                if (rot) {
                    camera.rotation.set(rot.x, rot.y, rot.z);
                }
                console.log(`Loaded player at position: ${pos.x}, ${pos.y}, ${pos.z}`);
            } else {
                // Default spawn position
                camera.position.set(0, 20, 0);
            }
        }
        
        // Start rendering
        if (typeof Render !== 'undefined') {
            Render = true;
        }
        
        // Start auto-save
        if (typeof worldManager !== 'undefined') {
            worldManager.startAutoSave(2); // Auto-save every 2 minutes
        }
        
        console.log('Game started with world:', worldManager.currentWorld);
        
        if (typeof hotbar !== 'undefined' && hotbar.show) {
            hotbar.show();
        } else {
            // Fallback: show hotbar element directly
            const hotbarElement = document.getElementById('hotbar');
            if (hotbarElement) {
                hotbarElement.style.display = 'block';
            }
        }
        
        // Original chunk system will generate chunks automatically
        
        // Try to enter VR
        if (typeof tryEnterVR === 'function') {
            tryEnterVR();
        }
    }
    
    restoreWorldChunks() {
        if (!worldManager.worldData || !worldManager.worldData.chunks) {
            console.log('No saved chunks to restore');
            return;
        }
        
        const chunks = worldManager.worldData.chunks;
        console.log('Restoring saved chunks...', chunks);
        
        // Handle different chunk data structures
        let chunkEntries = [];
        
        if (chunks instanceof Map) {
            chunkEntries = Array.from(chunks.entries());
        } else if (typeof chunks === 'object') {
            chunkEntries = Object.entries(chunks);
        } else {
            console.error('Invalid chunks data structure:', chunks);
            return;
        }
        
        console.log(`Restoring ${chunkEntries.length} saved chunks...`);
        
        let restoredChunks = 0;
        let restoredBlocks = 0;
        
        // Restore each chunk
        for (const [chunkKey, chunkData] of chunkEntries) {
            if (chunkData && chunkData.blocks) {
                // Parse chunk coordinates from key
                const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
                
                // Create chunk group
                const chunkGroup = new THREE.Group();
                chunkGroup.name = `chunk_${chunkX}_${chunkZ}`;
                
                // Handle different block data structures
                let blockEntries = [];
                
                if (chunkData.blocks instanceof Map) {
                    blockEntries = Array.from(chunkData.blocks.entries());
                } else if (typeof chunkData.blocks === 'object') {
                    blockEntries = Object.entries(chunkData.blocks);
                } else {
                    console.warn('Invalid block data structure for chunk:', chunkKey);
                    continue;
                }
                
                // Restore blocks in this chunk
                for (const [blockKey, blockData] of blockEntries) {
                    if (blockData && blockData.type && blockData.type !== 'air') {
                        try {
                            this.createBlockFromData(blockData, chunkGroup);
                            restoredBlocks++;
                        } catch (error) {
                            console.error('Error creating block:', blockData, error);
                        }
                    }
                }
                
                // Only add chunk if it has blocks
                if (chunkGroup.children.length > 0) {
                    // Add chunk to scene and loaded chunks
                    if (typeof scene !== 'undefined') {
                        scene.add(chunkGroup);
                    }
                    
                    if (typeof loadedChunks !== 'undefined') {
                        loadedChunks.set(chunkKey, {
                            group: chunkGroup,
                            blocks: chunkData.blocks,
                            lastAccessed: Date.now()
                        });
                    }
                    
                    restoredChunks++;
                }
            }
        }
        
        console.log(`World chunks restored successfully: ${restoredChunks} chunks, ${restoredBlocks} blocks`);
        
        // Ensure proper lighting after restoration
        this.setupWorldLighting();
    }
    
    createBlockFromData(blockData, chunkGroup) {
        // Create block geometry and material
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let material;
        
        // Get material based on block type using the existing material system
        const textureLoader = new THREE.TextureLoader();
        
        switch (blockData.type) {
            case 'grass':
                if (typeof GrassMaterial !== 'undefined') {
                    material = GrassMaterial;
                } else {
                    material = new THREE.MeshLambertMaterial({ map: textureLoader.load('Grass.png') });
                }
                break;
            case 'dirt':
                if (typeof dirtMaterial !== 'undefined') {
                    material = dirtMaterial;
                } else {
                    material = new THREE.MeshLambertMaterial({ map: textureLoader.load('Dirt.jpg') });
                }
                break;
            case 'stone':
                if (typeof stoneMaterial !== 'undefined') {
                    material = stoneMaterial;
                } else {
                    material = new THREE.MeshLambertMaterial({ map: textureLoader.load('Stone.jpg') });
                }
                break;
            case 'sand':
                material = new THREE.MeshLambertMaterial({ map: textureLoader.load('sand.jpg') });
                break;
            case 'oakLog':
                material = new THREE.MeshLambertMaterial({ map: textureLoader.load('OakLog.png') });
                break;
            case 'leaves':
                material = new THREE.MeshLambertMaterial({ map: textureLoader.load('Leaves.png') });
                break;
            case 'glass':
                material = new THREE.MeshLambertMaterial({ 
                    map: textureLoader.load('Glass.png'),
                    transparent: true,
                    opacity: 0.7
                });
                break;
            case 'light':
                material = new THREE.MeshLambertMaterial({ 
                    map: textureLoader.load('Light1.png'),
                    emissive: 0xFFFFAA,
                    emissiveIntensity: 0.3
                });
                break;
            default:
                // Fallback material
                material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        }
        
        // Create mesh
        const blockMesh = new THREE.Mesh(geometry, material);
        blockMesh.position.set(blockData.x, blockData.y, blockData.z);
        blockMesh.userData = {
            blockType: blockData.type,
            x: blockData.x,
            y: blockData.y,
            z: blockData.z
        };
        
        // Add to chunk group
        chunkGroup.add(blockMesh);
    }
    
    setupWorldLighting() {
        if (typeof scene === 'undefined') {
            console.warn('Scene not available for lighting setup');
            return;
        }
        
        // Remove existing lights to avoid duplicates
        const lightsToRemove = [];
        scene.traverse((child) => {
            if (child instanceof THREE.Light) {
                lightsToRemove.push(child);
            }
        });
        lightsToRemove.forEach(light => scene.remove(light));
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        ambientLight.name = 'worldAmbientLight';
        scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.name = 'worldDirectionalLight';
        scene.add(directionalLight);
        
        // Add point light for better visibility
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight.position.set(0, 20, 0);
        pointLight.name = 'worldPointLight';
        scene.add(pointLight);
        
        console.log('World lighting setup complete');
    }
    
    findSafeSpawnPosition() {
        // Try to find a good spawn position
        let spawnX = 0;
        let spawnZ = 0;
        let spawnY = 10;
        
        // If we have a biome generator, use it to find surface
        if (typeof currentBiomeGenerator !== 'undefined' && currentBiomeGenerator) {
            for (let attempts = 0; attempts < 10; attempts++) {
                const testX = Math.random() * 100 - 50; // Random position within 100 blocks
                const testZ = Math.random() * 100 - 50;
                
                const surfaceHeight = currentBiomeGenerator.getHeightAt(testX, testZ);
                if (surfaceHeight !== null && surfaceHeight > 0) {
                    spawnX = testX;
                    spawnZ = testZ;
                    spawnY = surfaceHeight + 3; // Spawn 3 blocks above surface
                    break;
                }
            }
        }
        
        // Set camera position
        camera.position.set(spawnX, spawnY, spawnZ);
        
        // Update world data if available
        if (worldManager && worldManager.worldData) {
            worldManager.worldData.playerPosition = {
                x: spawnX,
                y: spawnY,
                z: spawnZ
            };
        }
        
        console.log(`Spawned at: ${spawnX}, ${spawnY}, ${spawnZ}`);
    }
    
    show() {
        this.menuContainer.style.display = 'flex';
        
        // Hide crosshair and hotbar when menu is shown
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'none';
        
        if (typeof hotbar !== 'undefined') {
            hotbar.hide();
        }
    }
    
    hide() {
        this.menuContainer.style.display = 'none';
        
        // Show crosshair and hotbar when menu is hidden
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'block';
        
        if (typeof hotbar !== 'undefined') {
            hotbar.show();
        }
    }
}

// Initialize menu system when page loads
let menuSystem;
window.addEventListener('load', () => {
    // Wait a bit to ensure all scripts are loaded
    setTimeout(() => {
        menuSystem = new MenuSystem();
    }, 100);
});