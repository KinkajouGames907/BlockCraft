let controls;

const move = { forward: false, backward: false, left: false, right: false, crouch: false, down: false, up: false, sprint: false, fly: false, endFly: false};

let Grounded = false;
let gravity = 0;
let velocity = 0.005;
let playerHeight = 1.5;
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
            case "KeyP": move.endFly = true; break;
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
            case "KeyP": move.endFly = false; break;
        }
    });

    return controls;
}

function checkCollision(newPosition)
{
    const playerSize = new THREE.Vector3(0.3, playerHeight, 0.3);
    // Center the box so its top is at newPosition.y (eye level)
    const boxCenter = new THREE.Vector3(
        newPosition.x,
        newPosition.y - playerHeight / 2.3,
        newPosition.z
    );
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        boxCenter,
        playerSize
    );

    const blocks = getAllBlocks();
    for (const block of blocks) {
        const blockBox = new THREE.Box3().setFromObject(block);
        if (playerBox.intersectsBox(blockBox)) {
            Grounded = true;
            return true; // Collision detected
        }
    }
    Grounded = false;
    return false;
}

function updateControls() {
    let baseSpeed = 0.1;
    let sprintSpeed = 0.2;
    let speed = move.sprint ? sprintSpeed : baseSpeed;
    
    const JumpForce = 1;
    const player = controls.getObject();
    const newPosition = player.position.clone();
    const direction = new THREE.Vector3();

    gravity += velocity;

    if (Grounded)
    {
        console.log("Grounded");
        gravity = 0;
        velocity = 0;
    }
    if (!Grounded && grvty)
    {
        velocity = 0.005;
    }

    // Calculate new position for forward/backward movement.
    if (move.forward) {
        player.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        newPosition.addScaledVector(direction, speed);
    }
    if (move.backward) {
        player.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        newPosition.addScaledVector(direction, -speed);
    }
    // Calculate new position for left/right movement.
    if (move.left) {
        player.getWorldDirection(direction);
        const left = new THREE.Vector3().crossVectors(player.up, direction).normalize();
        newPosition.addScaledVector(left, speed);
    }
    if (move.right) {
        player.getWorldDirection(direction);
        const right = new THREE.Vector3().crossVectors(direction, player.up).normalize();
        newPosition.addScaledVector(right, speed);
    }
    // Up and down movements.
    if (move.up && Grounded) {
        newPosition.y += gravity;
        gravity = 0;
        velocity = -0.12;
    }

    if (move.down && !grvty)
    {
        newPosition.y -= speed;
    }

    if (move.up && !grvty)
    {
        newPosition.y += speed;
    }

    if (grvty)
    {
        newPosition.y -= gravity;
    }

    if (move.fly)
    {
        grvty = false;
        move.flyEnd = false;
    }

    if (move.endFly)
    {
        grvty = true;
        move.fly = false;
    }

    // Only update the player's position if there's no collision.
    if (!checkCollision(newPosition)) {
        player.position.copy(newPosition);
    }
}