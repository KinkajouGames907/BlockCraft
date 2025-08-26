// BlockCraft Hotbar System
// Manages the hotbar UI and block selection

class Hotbar {
    constructor() {
        this.selectedSlot = 0;
        this.blocks = [
            { type: 'grass', texture: 'grassTexture', image: 'Grass.png' },
            { type: 'stone', texture: 'stoneTexture', image: 'Stone.jpg' },
            { type: 'dirt', texture: 'dirtTexture', image: 'Dirt.jpg' },
            { type: 'sand', texture: 'sandTexture', image: 'sand.jpg' },
            { type: 'oakLog', texture: 'oakLogTexture', image: 'OakLog.png' },
            { type: 'leaves', texture: 'Leaves', image: 'Leaves.png' },
            { type: 'glass', texture: 'glassTexture', image: 'Glass.png' },
            { type: 'light', texture: 'Light1', image: 'Light1.png' },
            { type: 'stone', texture: 'stoneTexture', image: 'Stone.jpg' }
        ];
        
        this.setupEventListeners();
        this.initializeSlotTextures();
        
        // Initialize with first slot selected
        setTimeout(() => {
            this.selectSlot(0);
        }, 100);
    }
    
    initializeSlotTextures() {
        // Set texture backgrounds for each slot
        const slots = document.querySelectorAll('.hotbar-slot');
        slots.forEach((slot, index) => {
            if (index < this.blocks.length) {
                const block = this.blocks[index];
                slot.style.backgroundImage = `url('${block.image}')`;
                slot.style.backgroundSize = 'cover';
                slot.style.backgroundPosition = 'center';
                slot.style.imageRendering = 'pixelated';
                slot.textContent = ''; // Remove emoji
            }
        });
    }
    
    setupEventListeners() {
        // Number key selection (1-9)
        document.addEventListener('keydown', (event) => {
            const key = event.code;
            if (key >= 'Digit1' && key <= 'Digit9') {
                const slot = parseInt(key.replace('Digit', '')) - 1;
                if (slot < this.blocks.length) {
                    this.selectSlot(slot);
                }
            }
        });
        
        // Mouse wheel selection
        document.addEventListener('wheel', (event) => {
            if (this.isVisible()) {
                event.preventDefault();
                const direction = event.deltaY > 0 ? 1 : -1;
                let newSlot = this.selectedSlot + direction;
                
                // Wrap around
                if (newSlot >= this.blocks.length) newSlot = 0;
                if (newSlot < 0) newSlot = this.blocks.length - 1;
                
                this.selectSlot(newSlot);
            }
        });
        
        // Click on hotbar slots
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('hotbar-slot')) {
                const slot = parseInt(event.target.getAttribute('data-slot'));
                this.selectSlot(slot);
            }
        });
    }
    
    selectSlot(slot) {
        if (slot < 0 || slot >= this.blocks.length) return;
        
        // Update visual selection
        const slots = document.querySelectorAll('.hotbar-slot');
        slots.forEach((slotElement, index) => {
            if (index === slot) {
                slotElement.classList.add('selected');
                slotElement.style.border = '2px solid rgba(255, 255, 255, 0.8)';
            } else {
                slotElement.classList.remove('selected');
                slotElement.style.border = '2px solid rgba(255, 255, 255, 0.3)';
            }
        });
        
        this.selectedSlot = slot;
        
        // Update current texture for block placement
        this.updateCurrentTexture();
        
        console.log(`Selected slot ${slot}: ${this.getSelectedBlock().type}`);
    }
    
    updateCurrentTexture() {
        const selectedBlock = this.getSelectedBlock();
        
        // Update the global currentTexture variable used by the block system
        switch (selectedBlock.texture) {
            case 'grassTexture':
                if (typeof grassTexture !== 'undefined') currentTexture = grassTexture;
                break;
            case 'stoneTexture':
                if (typeof stoneTexture !== 'undefined') currentTexture = stoneTexture;
                break;
            case 'dirtTexture':
                if (typeof dirtTexture !== 'undefined') currentTexture = dirtTexture;
                break;
            case 'sandTexture':
                if (typeof sandTexture !== 'undefined') currentTexture = sandTexture;
                break;
            case 'oakLogTexture':
                if (typeof oakLogTexture !== 'undefined') currentTexture = oakLogTexture;
                break;
            case 'Leaves':
                if (typeof Leaves !== 'undefined') currentTexture = Leaves;
                break;
            case 'glassTexture':
                if (typeof glassTexture !== 'undefined') currentTexture = glassTexture;
                break;
            case 'Light1':
                if (typeof Light1 !== 'undefined') currentTexture = Light1;
                break;
        }
        
        // Update block material if it exists
        if (typeof blockMaterial !== 'undefined' && typeof currentTexture !== 'undefined') {
            blockMaterial.map = currentTexture;
            blockMaterial.needsUpdate = true;
        }
    }
    
    getSelectedBlock() {
        return this.blocks[this.selectedSlot];
    }
    
    show() {
        const hotbar = document.getElementById('hotbar');
        if (hotbar) {
            hotbar.style.display = 'block';
        }
    }
    
    hide() {
        const hotbar = document.getElementById('hotbar');
        if (hotbar) {
            hotbar.style.display = 'none';
        }
    }
    
    isVisible() {
        const hotbar = document.getElementById('hotbar');
        return hotbar && hotbar.style.display !== 'none';
    }
    
    // Update block type in a slot
    setSlotBlock(slot, blockType, icon, material) {
        if (slot >= 0 && slot < this.blocks.length) {
            this.blocks[slot] = { type: blockType, icon: icon, material: material };
            
            // Update visual
            const slotElement = document.querySelector(`[data-slot="${slot}"]`);
            if (slotElement) {
                slotElement.textContent = icon;
            }
        }
    }
}

// Global hotbar instance
const hotbar = new Hotbar();

// Function to update current block type (will be called by block placement system)
function updateCurrentBlockType(blockType) {
    // This will be used by the block placement system
    if (typeof currentBlockType !== 'undefined') {
        window.currentBlockType = blockType;
    }
}