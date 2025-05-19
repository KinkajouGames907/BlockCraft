// Get all block meshes from all loaded chunks
function getAllBlocks() {
    const allBlocks = [];
    for (const chunk of loadedChunks.values()) {
        chunk.group.children.forEach(child => allBlocks.push(child));
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
                block.parent.remove(block); // Remove from chunk group
            }

            if (event.button === 2) { // Right click: place block
                const normal = intersects[0].face.normal;
                const pos = block.position.clone().add(normal);

                // Prevent placing if a block already exists at that position
                const exists = getAllBlocks().some(b => b.position.equals(pos));
                if (!exists) {
                    const newMaterial = new THREE.MeshLambertMaterial({ map: getCurrentTexture() });
                    const newBlock = new THREE.Mesh(blockGeometry, newMaterial);
                    newBlock.position.copy(pos);
                    renderer.shadowMap.enabled = true;
                    sunLight.castShadow = true;
                    block.parent.add(newBlock); // Add to the same chunk group
                }
            }
        }
    });
}