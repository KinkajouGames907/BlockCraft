# BlockCraft Save System

## New Features Added

### 🎮 Pause Menu
- Press **P** during gameplay to open the pause menu
- Options available:
  - **Resume Game** - Continue playing
  - **Save World** - Save current progress
  - **Save & Export JSON** - Save and download world as JSON file
  - **Load World JSON** - Import a world from JSON file
  - **Exit to Main Menu** - Return to main menu (with save prompt)

### 💾 World Saving & Loading
- **Automatic Saving**: Worlds auto-save every 2 minutes and when blocks are changed
- **Chunk Persistence**: When you leave a chunk, it's automatically saved so your builds persist
- **Player Position**: Your exact position and rotation are saved
- **Block Changes**: All blocks you place/destroy are tracked and saved

### 📁 JSON Import/Export
- **Export**: Download your world as a `.json` file to share or backup
- **Import**: Upload world JSON files in the world selection menu
- **Format**: Standard JSON format with all world data included

### 🌍 World Management
- **World List**: See all saved worlds with creation date and seed
- **Upload Worlds**: Import worlds from JSON files in the main menu
- **Unique Names**: Uploaded worlds get unique names to avoid conflicts

## How to Use

### In-Game Saving
1. Play the game normally - it auto-saves every 2 minutes
2. Press **P** to open pause menu for manual save options
3. Use "Save & Export JSON" to download your world

### Sharing Worlds
1. In pause menu, click "Save & Export JSON"
2. Share the downloaded `.json` file with friends
3. Friends can upload it via "Upload World JSON" in world selection

### Console Commands (for debugging)
Open browser console (F12) and use:
- `exportWorld()` - Export current world
- `importWorld()` - Import world from file
- `worldStats()` - Show world statistics
- `listWorlds()` - List all saved worlds
- `saveWorld()` - Manual save
- `chunkInfo()` - Show current chunk info

## Technical Details

### Save Data Structure
```json
{
  "name": "World Name",
  "seed": 123456,
  "playerPosition": {"x": 0, "y": 20, "z": 0},
  "playerRotation": {"x": 0, "y": 0, "z": 0},
  "chunks": {}, // Saved chunk data
  "blocks": {}, // Individual block changes
  "settings": {}, // World generation settings
  "createdAt": 1234567890,
  "lastPlayed": 1234567890,
  "version": "0.0.3_1"
}
```

### Chunk Persistence
- Chunks are automatically saved when you move away from them
- Saved chunks include all blocks and their materials
- When you return to a chunk, it loads your saved version
- This ensures your builds don't disappear when you explore

### Performance
- Auto-save is debounced to prevent lag during rapid building
- Chunk saving only happens when leaving areas
- JSON export/import is optimized for large worlds

## Troubleshooting

### World Won't Load
- Check browser console for errors
- Ensure JSON file is valid format
- Try refreshing the page

### Save Not Working
- Check browser storage isn't full
- Ensure you have a world loaded
- Try manual save via pause menu

### Performance Issues
- Reduce render distance in world settings
- Clear old worlds you don't need
- Use `WorldUtils.clearAllWorlds()` to reset (careful!)

## File Locations
- **Pause Menu**: `pause-menu.js`
- **World Manager**: `world-manager.js` (enhanced)
- **Chunk System**: `chunk.js` (enhanced)
- **Menu System**: `menu-system.js` (enhanced)
- **Utilities**: `world-utils.js`

Enjoy building and sharing your worlds! 🎮✨