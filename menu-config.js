// BlockCraft Menu Configuration
// Super easy to customize - just edit the values below!

const MENU_CONFIG = {
    // Game Info
    gameTitle: "BlockCraft",
    gameVersion: "BETA V0.0.4",
    updateBanner: "The better game update!",
    
    // Menu Buttons - Easy to add/remove/modify
    mainButtons: [
        {
            id: "singleplayer",
            text: "Singleplayer",
            action: "showWorldSelection"
        },
        {
            id: "multiplayer", 
            text: "Multiplayer",
            action: "showComingSoon",
            disabled: true
        },
        {
            id: "options",
            text: "Options",
            action: "showOptions"
        },
        {
            id: "about",
            text: "About",
            action: "showAbout"
        },
        {
            id: "quit",
            text: "Quit Game",
            action: "quitGame",
            style: "secondary"
        }
    ],
    
    // World Creation Settings
    worldSettings: [
        {
            id: "worldName",
            label: "World Name",
            type: "text",
            default: "New World",
            description: "Name your world"
        },
        {
            id: "worldType",
            label: "World Type",
            type: "select",
            options: "presets", // Special flag to load from presets
            default: "default",
            description: "Choose a world preset"
        },
        {
            id: "seed",
            label: "Seed (Optional)",
            type: "text",
            default: "",
            description: "Leave empty for random seed"
        },
        {
            id: "renderDistance",
            label: "Render Distance",
            type: "number",
            min: 0.5,
            max: 32,
            default: 1,
            description: "How far chunks render (affects performance)"
        }
    ],
    
    // About Text
    aboutText: `
        <h2>About BlockCraft</h2>
        <p>BlockCraft is a voxel-based building game where you can create and explore infinite worlds.</p>
        
        <h3>Features:</h3>
        <ul>
            <li>🎮 VR Support (Meta Quest 2/3)</li>
            <li>🌍 Infinite world generation</li>
            <li>🧱 Multiple block types</li>
            <li>💡 Dynamic lighting system</li>
            <li>🌅 Day/night cycle</li>
            <li>🔧 Fully moddable</li>
        </ul>
        
        <h3>Controls:</h3>
        <ul>
            <li>WASD - Move</li>
            <li>Mouse - Look around</li>
            <li>Left Click - Break blocks</li>
            <li>Right Click - Place blocks</li>
            <li>1-8 - Select block type</li>
            <li>P - Open pause menu</li>
            <li>O - Toggle fly mode</li>
            <li>L - End fly mode</li>
        </ul>
        
        <p><strong>Developer:</strong> Derek Errigo (kinkajou-games)</p>
        <p><strong>Version:</strong> BETA V0.0.4</p>
        
        <p><em>This game is in early development. Join our community to help shape the future!</em></p>
    `,
    
    // Menu Styling - More Minecraft-like
    style: {
        backgroundColor: "url('Dirt.png')",
        backgroundOverlay: "rgba(0, 0, 0, 0.5)", // Lighter overlay for more authentic look
        primaryColor: "#55FF55", // Bright Minecraft green
        secondaryColor: "#AAAAAA", 
        textColor: "#FFFFFF",
        buttonHoverColor: "#AAFFAA",
        fontFamily: "'Press Start 2P', monospace",
        
        // Authentic Minecraft button styling
        buttonStyle: {
            background: "linear-gradient(to bottom, #C6C6C6 0%, #8B8B8B 50%, #5A5A5A 51%, #8B8B8B 100%)",
            border: "2px solid #000000",
            borderTop: "2px solid #FFFFFF",
            borderLeft: "2px solid #FFFFFF", 
            borderRight: "2px solid #555555",
            borderBottom: "2px solid #555555",
            borderRadius: "0px",
            color: "#FFFFFF",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "14px",
            padding: "10px 20px",
            textShadow: "1px 1px 0px #000000",
            cursor: "pointer",
            transition: "all 0.05s ease",
            imageRendering: "pixelated",
            minHeight: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }
    }
};