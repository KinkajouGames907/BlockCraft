let controls;

const move = { forward: false, backward: false, left: false, right: false, crouch: false, down: false, up: false, sprint: false, fly: false, endFly: false};

let Grounded = false;
let gravity = 0;
let velocity = 0.005;
let playerHeight = 0.9;
const eyeOffset = 2;
let grvty = true;

/**
 * @param {THREE.Camera} camera
 * @returns
 */
function initControls(camera)
{
    controls = new THREE.PointerLockControls(camera, document.body);


    document.body.addEventListener('click', () => {
        if (Render)
        {
            controls.lock();
        }
    });

    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW': move.forward = true; break;   // W key pressed
            case 'KeyS': move.backward = true; break;  // S key pressed
            case 'KeyA': move.left = true; break;      // A key pressed
            case 'KeyD': move.right = true; break;
            case "Space": move.up = true; break;
            case "KeyE": move.down = true; break; 
            case "ShiftLeft": move.sprint = true; break; 
            case "KeyO": move.fly = true; break;
            case "KeyL": move.endFly = true; break;
        }
    });

    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW': move.forward = false; break;   // W key pressed
            case 'KeyS': move.backward = false; break;  // S key pressed
            case 'KeyA': move.left = false; break;      // A key pressed
            case 'KeyD': move.right = false; break;
            case "Space": move.up = false; break;
            case "KeyE": move.down = false; break;      // D key pressed
            case "ShiftLeft": move.sprint = false; break;
            case "KeyO": move.fly = false; break;
            case "KeyL": move.endFly = false; break;
        }
    });

    return controls;
}

// Cache for collision detection
let collisionCache = new Map();
let lastCollisionUpdate = 0;
const COLLISION_CACHE_DURATION = 100; // Update every 100ms

function checkCollision(newPosition)
{
    // ROBUST COLLISION DETECTION - ALWAYS WORKS
    
    // Player collision box - covers ENTIRE player height including feet
    const playerWidth = 0.8;
    const playerDepth = 0.8;
    
    // Player bounding box from feet to head
    const playerBox = new THREE.Box3(
        new THREE.Vector3(
            newPosition.x - playerWidth/2, 
            newPosition.y - playerHeight,  // Bottom at feet
            newPosition.z - playerDepth/2
        ),
        new THREE.Vector3(
            newPosition.x + playerWidth/2, 
            newPosition.y,                 // Top at eye level
            newPosition.z + playerDepth/2
        )
    );

    // Get all blocks and check collision
    const blocks = getAllBlocks();
    let hasCollision = false;
    let isGrounded = false;
    
    // ALWAYS check collision even if no blocks found - use grid-based detection as fallback
    if (blocks.length === 0) {
        console.warn('No blocks found, using grid-based collision detection');
        return checkGridBasedCollision(newPosition);
    }
    
    // Check every single block for collision
    for (const block of blocks) {
        // Skip light sources only
        if (block instanceof THREE.PointLight) {
            continue;
        }
        
        // Get block position - handle all possible formats
        let blockX, blockY, blockZ;
        
        if (block.position) {
            blockX = block.position.x;
            blockY = block.position.y;
            blockZ = block.position.z;
        } else if (block.x !== undefined && block.y !== undefined && block.z !== undefined) {
            blockX = block.x;
            blockY = block.y;
            blockZ = block.z;
        } else {
            continue; // Skip invalid blocks
        }
        
        // Create block bounding box - ALWAYS 1x1x1 centered on block position
        const blockBox = new THREE.Box3(
            new THREE.Vector3(blockX - 0.5, blockY - 0.5, blockZ - 0.5),
            new THREE.Vector3(blockX + 0.5, blockY + 0.5, blockZ + 0.5)
        );
        
        // STRICT collision detection - if ANY part of player intersects block
        if (playerBox.intersectsBox(blockBox)) {
            hasCollision = true;
            console.log(`COLLISION: Player at (${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(2)}, ${newPosition.z.toFixed(2)}) hit block at (${blockX}, ${blockY}, ${blockZ})`);
            break; // Stop checking once collision found
        }
        
        // Check for grounding - block directly below player feet
        const feetY = newPosition.y - playerHeight;
        const blockTop = blockY + 0.5;
        
        // Player is grounded if standing on top of a block
        if (Math.abs(blockTop - feetY) < 0.1 && 
            Math.abs(blockX - newPosition.x) < 0.9 &&
            Math.abs(blockZ - newPosition.z) < 0.9) {
            isGrounded = true;
        }
    }
    
    Grounded = isGrounded;
    return hasCollision;
}

// Fallback collision detection using grid-based approach
function checkGridBasedCollision(newPosition) {
    // Check blocks in a grid around the player position
    const playerWidth = 0.8;
    // use the global playerHeight so collision matches player eye/feet
    
    // Calculate grid bounds to check
    const minX = Math.floor(newPosition.x - playerWidth/2);
    const maxX = Math.floor(newPosition.x + playerWidth/2);
    const minY = Math.floor(newPosition.y - playerHeight);
    const maxY = Math.floor(newPosition.y);
    const minZ = Math.floor(newPosition.z - playerWidth/2);
    const maxZ = Math.floor(newPosition.z + playerWidth/2);
    
    // Check each grid position for blocks
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                // Check if there's a block at this position using scene traversal
                let hasBlockHere = false;
                
                if (typeof scene !== 'undefined') {
                    scene.traverse((child) => {
                        if (child.isMesh && child.position) {
                            const blockX = Math.round(child.position.x);
                            const blockY = Math.round(child.position.y);
                            const blockZ = Math.round(child.position.z);
                            
                            if (blockX === x && blockY === y && blockZ === z) {
                                hasBlockHere = true;
                            }
                        }
                    });
                }
                
                if (hasBlockHere) {
                    console.log(`Grid-based collision detected at (${x}, ${y}, ${z})`);
                    return true;
                }
            }
        }
    }
    
    return false;
}

function checkCollisionOptimized(playerBox, newPosition) {
    // Smaller player collision box for better movement
    const playerSize = new THREE.Vector3(0.5, playerHeight, 0.5);
    const boxCenter = new THREE.Vector3(
        newPosition.x,
        newPosition.y - playerHeight / 2,
        newPosition.z
    );
    const adjustedPlayerBox = new THREE.Box3().setFromCenterAndSize(boxCenter, playerSize);
    
    // Only check blocks that could actually collide
    const minX = Math.floor(adjustedPlayerBox.min.x);
    const maxX = Math.floor(adjustedPlayerBox.max.x);
    const minY = Math.floor(adjustedPlayerBox.min.y);
    const maxY = Math.floor(adjustedPlayerBox.max.y);
    const minZ = Math.floor(adjustedPlayerBox.min.z);
    const maxZ = Math.floor(adjustedPlayerBox.max.z);
    
    let hasCollision = false;
    let isGrounded = false;
    
    // Check for ground first (blocks directly below player)
    const feetY = Math.floor(newPosition.y - playerHeight);
    const playerX = Math.floor(newPosition.x);
    const playerZ = Math.floor(newPosition.z);
    
    // Check 3x3 area below player for grounding
    for (let x = playerX - 1; x <= playerX + 1; x++) {
        for (let z = playerZ - 1; z <= playerZ + 1; z++) {
            if (performanceChunkManager.hasBlockAt(x, feetY, z)) {
                const blockTop = feetY + 1;
                const playerFeet = newPosition.y - playerHeight;
                if (Math.abs(blockTop - playerFeet) < 0.2) {
                    isGrounded = true;
                }
            }
        }
    }
    
    // Check for solid collisions
    for (let x = minX; x <= maxX; x++) {
        for (let y = Math.max(0, minY); y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                if (performanceChunkManager.hasBlockAt(x, y, z)) {
                    const blockBox = new THREE.Box3(
                        new THREE.Vector3(x, y, z),
                        new THREE.Vector3(x + 1, y + 1, z + 1)
                    );
                    
                    if (adjustedPlayerBox.intersectsBox(blockBox)) {
                        hasCollision = true;
                        break;
                    }
                }
            }
            if (hasCollision) break;
        }
        if (hasCollision) break;
    }
    
    Grounded = isGrounded;
    return hasCollision;
}

function updateControls() {
    let baseSpeed = 0.15;
    let sprintSpeed = 0.25;
    let speed = move.sprint ? sprintSpeed : baseSpeed;
    
    const player = controls.getObject();
    const currentPosition = player.position.clone();
    const direction = new THREE.Vector3();

    // Handle flying mode
    if (move.fly) {
        grvty = false;
    }
    if (move.endFly) {
        grvty = true;
        move.fly = false;
    }

    // Calculate movement vectors
    let moveX = 0, moveZ = 0, moveY = 0;

    // Forward/backward movement
    if (move.forward || move.backward) {
        player.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        
        if (move.forward) {
            moveX += direction.x * speed;
            moveZ += direction.z * speed;
        }
        if (move.backward) {
            moveX -= direction.x * speed;
            moveZ -= direction.z * speed;
        }
    }

    // Left/right movement
    if (move.left || move.right) {
        player.getWorldDirection(direction);
        const right = new THREE.Vector3().crossVectors(direction, player.up).normalize();
        
        if (move.right) {
            moveX += right.x * speed;
            moveZ += right.z * speed;
        }
        if (move.left) {
            moveX -= right.x * speed;
            moveZ -= right.z * speed;
        }
    }

    // Try horizontal movement (X and Z axes separately)
    if (moveX !== 0) {
        const testPosition = currentPosition.clone();
        testPosition.x += moveX;
        
        if (!checkCollision(testPosition)) {
            currentPosition.x = testPosition.x;
        }
    }

    if (moveZ !== 0) {
        const testPosition = currentPosition.clone();
        testPosition.z += moveZ;
        
        if (!checkCollision(testPosition)) {
            currentPosition.z = testPosition.z;
        }
    }

    // Handle vertical movement and gravity
    if (!grvty) {
        // Flying mode
        if (move.up) {
            moveY += speed;
        }
        if (move.down) {
            moveY -= speed;
        }
    } else {
        // Normal gravity mode - SIMPLIFIED
        
    // Check if player is on ground - use playerHeight so value stays in sync
    const groundTestPosition = currentPosition.clone();
    groundTestPosition.y -= (playerHeight - 0.1); // Check just below player feet
        
        const onGround = checkCollision(groundTestPosition);
        
        if (onGround) {
            Grounded = true;
            if (velocity > 0) {
                velocity = 0; // Stop falling when hit ground
            }
            gravity = 0;
        } else {
            Grounded = false;
            // Apply gravity when in air
            velocity += 0.008; // Gravity acceleration
            gravity = velocity;
        }

        // Jumping - SIMPLE
        if (move.up && Grounded) {
            velocity = -0.18; // Jump velocity (upward is negative) - reduced strength
            gravity = velocity;
            Grounded = false;
            console.log("Jump!"); // Debug log
        }

        // Apply vertical movement
        moveY = -gravity; // Negative because gravity pulls down
    }

    // Try vertical movement
    if (moveY !== 0) {
        const testPosition = currentPosition.clone();
        testPosition.y += moveY;
        
        if (!checkCollision(testPosition)) {
            currentPosition.y = testPosition.y;
        } else {
            // Hit something, stop vertical movement
            if (moveY < 0) {
                // Hit ground while falling
                Grounded = true;
                gravity = 0;
                velocity = 0;
            } else {
                // Hit ceiling while jumping
                velocity = 0;
                gravity = 0;
            }
        }
    }

    // Update player position
    player.position.copy(currentPosition);
}