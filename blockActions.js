// Get all block meshes from all loaded chunks
function getAllBlocks() {
    // Use original system only
    const allBlocks = [];
    if (typeof loadedChunks !== 'undefined') {
        for (const chunk of loadedChunks.values()) {
            if (chunk.group && chunk.group.children) {
                chunk.group.children.forEach(child => allBlocks.push(child));
            }
        }
    }
    
    // Debug: log block count occasionally
    if (Math.random() < 0.01) { // 1% chance to log
        console.log(`getAllBlocks found ${allBlocks.length} blocks from ${loadedChunks ? loadedChunks.size : 0} chunks`);
    }
    
    return allBlocks;
}

function setupBlockActions(camera, blockGeometry, getCurrentMaterial) {
    const raycaster = new THREE.Raycaster();

    window.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('mousedown', (event) => {
        raycaster.setFromCamera({ x: 0, y: 0 }, camera);
        const intersects = raycaster.intersectObjects(getAllBlocks());

        if (intersects.length > 0) {
            const block = intersects[0].object;

            if (event.button === 0) { // Left click: break block
                const blockPos = {
                    x: block.position.x,
                    y: block.position.y,
                    z: block.position.z
                };
                
                // Save block removal to world manager
                if (typeof worldManager !== 'undefined') {
                    worldManager.saveBlockChange(blockPos, null, null);
                }
                
                // Remove light if it exists
                if (block.userData.light) {
                    block.parent.remove(block.userData.light);
                }
                
                // Remove the block
                block.parent.remove(block);
                
                console.log(`Removed block at ${blockPos.x}, ${blockPos.y}, ${blockPos.z}`);
            }

            if (event.button === 2) { // Right click: place block
                const normal = intersects[0].face.normal;
                const pos = block.position.clone().add(normal);

                // Check if position is already occupied
                const exists = getAllBlocks().some(b => b.position.equals(pos));
                if (!exists) {
                    let newBlock;
                    let blockType = 'grass'; // Default
                    
                    // Check if placing a light block
                    if (typeof getCurrentTexture === 'function' && typeof Light1 !== 'undefined' && getCurrentTexture() === Light1) {
                        newBlock = createLightBlock(blockGeometry, pos, block.parent);
                        blockType = 'light';
                    } else {
                        const newMaterial = getCurrentMaterial();
                        newBlock = new THREE.Mesh(blockGeometry, newMaterial);
                        newBlock.position.copy(pos);
                        block.parent.add(newBlock);
                        
                        // Determine block type from material
                        blockType = getBlockTypeFromMaterial(newMaterial);
                    }
                    
                    // Save block placement to world manager
                    if (typeof worldManager !== 'undefined') {
                        const blockPos = {
                            x: pos.x,
                            y: pos.y,
                            z: pos.z
                        };
                        worldManager.saveBlockChange(blockPos, blockType, blockType);
                    }
                    
                    console.log(`Placed ${blockType} block at ${pos.x}, ${pos.y}, ${pos.z}`);
                }
            }
        }
    });
}

// Helper function to determine block type from material
function getBlockTypeFromMaterial(material) {
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