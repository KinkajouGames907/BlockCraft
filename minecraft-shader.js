// Minecraft-style Lighting Shader
// Implements 0-15 light levels with smooth transitions

const MinecraftShader = {
    vertexShader: `
        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            #ifdef USE_COLOR
                vColor = color;
            #else
                vColor = vec3(1.0, 1.0, 1.0);
            #endif
            
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            vPosition = position;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    
    fragmentShader: `
        uniform sampler2D map;
        uniform vec3 ambientLight;
        uniform vec3 directionalLightColor;
        uniform vec3 directionalLightDirection;
        uniform float minecraftAmbient;
        
        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            // Sample texture
            vec4 texColor = texture2D(map, vUv);
            
            // Minecraft-style lighting calculation
            float lightLevel = (vColor.r + vColor.g + vColor.b) / 3.0;
            
            // Ensure minimum light level (like Minecraft's minimum brightness)
            lightLevel = max(lightLevel, minecraftAmbient);
            
            // Directional lighting (sun)
            float directionalLight = max(dot(vNormal, normalize(-directionalLightDirection)), 0.0);
            directionalLight = directionalLight * 0.6 + 0.4; // Soften shadows
            
            // Combine lighting
            vec3 finalColor = texColor.rgb * lightLevel * directionalLight;
            
            // Add slight ambient
            finalColor += texColor.rgb * ambientLight * 0.3;
            
            // Minecraft-style color banding (optional)
            finalColor = floor(finalColor * 16.0) / 16.0;
            
            gl_FragColor = vec4(finalColor, texColor.a);
        }
    `,
    
    uniforms: {
        map: { value: null },
        ambientLight: { value: new THREE.Color(0.4, 0.4, 0.6) },
        directionalLightColor: { value: new THREE.Color(1.0, 1.0, 0.9) },
        directionalLightDirection: { value: new THREE.Vector3(0.5, 1.0, 0.3) },
        minecraftAmbient: { value: 0.1 } // Minimum light level (like Minecraft)
    }
};

// Create Minecraft-style material
function createMinecraftMaterial(texture) {
    // Use standard MeshLambertMaterial with vertex colors for now
    // This avoids shader conflicts while still providing lighting
    return new THREE.MeshLambertMaterial({
        map: texture,
        vertexColors: true,
        side: THREE.FrontSide
    });
}

// Update lighting based on time of day (simplified for standard materials)
function updateMinecraftLighting(material, timeOfDay = 0.5) {
    // For standard materials, we'll just adjust the overall brightness
    // This is simpler and avoids shader conflicts
    
    // Time of day: 0 = midnight, 0.5 = noon, 1 = midnight
    const sunIntensity = Math.max(0.2, Math.sin(timeOfDay * Math.PI));
    
    // Update material properties if possible
    if (material.emissive) {
        // Adjust emissive for night/day cycle
        const nightGlow = timeOfDay < 0.2 || timeOfDay > 0.8 ? 0.1 : 0.0;
        material.emissive.setRGB(nightGlow, nightGlow, nightGlow * 1.2);
    }
}