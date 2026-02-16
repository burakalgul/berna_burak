// ============================================
// BOSS MECHANICS SYSTEM - Modular Boss Controller
// ============================================

class BossController {
    constructor(gameContext) {
        this.ctx = gameContext;
        this.activeEffects = new Set();
        this.lavaBombs = [];
        this.poisonZones = [];
        this.inputQueue = [];
        this.timeScale = 1.0;
        this.grayscaleActive = false;
        this.fogActive = false;
        this.wallActive = false;
        this.invertedControls = false;
        this.playerFrozen = false;
        this.freezeTimer = 0;
        this.slowDebuff = 1.0;
        this.inputLag = 0;
        this.glitchIntensity = 0;
    }

    // ============================================
    // PHASE 1: NATURAL OBSTACLES
    // ============================================

    // Boss 1: Doubt Cloud - Rain and Slow Debuff
    enableDoubtCloud() {
        this.activeEffects.add('doubt_cloud');
        this.slowDebuff = 0.4; // 60% slower (more challenging!)
    }

    spawnRainDrop(x, y) {
        return {
            x: x,
            y: y,
            vy: 3,
            vx: (Math.random() - 0.5) * 0.5,
            type: { emoji: '💧', points: 0, size: 20, speed: 3, isRain: true },
            rotation: 0,
            rotSpeed: 0
        };
    }

    updateRainEffect(hearts, bossX, bossY) {
        // Spawn rain drops from boss (RARE - only 1.5% chance per frame)
        if (Math.random() < 0.015) {
            hearts.push(this.spawnRainDrop(
                bossX + (Math.random() - 0.5) * 100,
                bossY + 40
            ));
        }
    }

    // Boss 2: Rage Flame - Lava Bombs and Area Denial
    enableRageFlame() {
        this.activeEffects.add('rage_flame');
    }

    spawnLavaBomb(x, startY, targetY) {
        this.lavaBombs.push({
            x: x,
            y: startY,
            targetY: targetY, // Where it should land
            vy: 8, // Fall speed
            radius: 30, // Smaller radius for easier dodging (reduced from 35)
            lifetime: 2.0, // 2 seconds after landing (reduced from 2.5)
            createdAt: Date.now(),
            landed: false
        });
    }

    updateLavaBombs(dt, hearts, bossX, bossY, gameW, gameH) {
        // Spawn lava bombs randomly across the screen (VERY RARE - mobile friendly)
        if (Math.random() < 0.004) { // Reduced from 0.008 to 0.004 (half again - 4x less than original)
            const targetX = Math.random() * gameW; // Use parameter instead of this.ctx.gameW
            const targetY = gameH - 80; // Land near the ground
            this.spawnLavaBomb(targetX, bossY + 40, targetY);
        }

        // Update existing bombs
        const now = Date.now();
        this.lavaBombs = this.lavaBombs.filter(bomb => {
            // If not landed yet, make it fall
            if (!bomb.landed) {
                bomb.y += bomb.vy;
                if (bomb.y >= bomb.targetY) {
                    bomb.y = bomb.targetY;
                    bomb.landed = true;
                    bomb.landedAt = Date.now();
                }
                return true; // Keep falling bombs
            }
            
            // If landed, check lifetime
            const age = (now - bomb.landedAt) / 1000;
            return age < bomb.lifetime;
        });
    }

    isInLavaBomb(x, y) {
        return this.lavaBombs.some(bomb => {
            // Only check collision if bomb has landed
            if (!bomb.landed) return false;
            
            const dx = x - bomb.x;
            const dy = y - bomb.y;
            return Math.sqrt(dx * dx + dy * dy) < bomb.radius;
        });
    }

    drawLavaBombs(ctx) {
        this.lavaBombs.forEach(bomb => {
            ctx.save();
            
            if (!bomb.landed) {
                // Falling bomb - draw as falling fireball
                ctx.globalAlpha = 0.8;
                
                // Fireball trail
                for (let i = 0; i < 3; i++) {
                    const trailY = bomb.y - (i * 15);
                    const trailAlpha = 0.3 - (i * 0.1);
                    ctx.globalAlpha = trailAlpha;
                    ctx.font = '35px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#000000';
                    ctx.fillText('🔥', bomb.x, trailY);
                }
                
                // Main fireball
                ctx.globalAlpha = 1.0;
                ctx.font = '40px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#000000';
                ctx.fillText('🔥', bomb.x, bomb.y);
                
            } else {
                // Landed bomb - draw as lava pool
                const age = (Date.now() - bomb.landedAt) / 1000;
                const alpha = 1 - (age / bomb.lifetime);
                
                ctx.globalAlpha = alpha * 0.6;
                
                // Lava circle
                const gradient = ctx.createRadialGradient(bomb.x, bomb.y, 0, bomb.x, bomb.y, bomb.radius);
                gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.6)');
                gradient.addColorStop(1, 'rgba(200, 0, 0, 0.2)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Warning symbol
                ctx.globalAlpha = alpha;
                ctx.font = '30px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#000000';
                ctx.fillText('🔥', bomb.x, bomb.y);
            }
            
            ctx.restore();
        });
    }

    // Boss 3: Cold Distance - Freeze Stun
    enableColdDistance() {
        this.activeEffects.add('cold_distance');
    }

    freezePlayer(duration = 2.0) {
        this.playerFrozen = true;
        this.freezeTimer = duration;
    }

    updateFreezeEffect(dt) {
        if (this.playerFrozen) {
            this.freezeTimer -= dt;
            if (this.freezeTimer <= 0) {
                this.playerFrozen = false;
                this.freezeTimer = 0;
            }
        }
    }

    drawFreezeEffect(ctx, gameW, gameH) {
        if (this.playerFrozen) {
            // Ice overlay
            ctx.save();
            ctx.fillStyle = `rgba(100, 200, 255, ${0.3 * (this.freezeTimer / 2.0)})`;
            ctx.fillRect(0, 0, gameW, gameH);
            
            // Ice crystals
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * gameW;
                const y = Math.random() * gameH;
                ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // Boss 4: Windy Day - Strong Wind Physics
    enableWindyDay() {
        this.activeEffects.add('windy_day');
        this.kineticCharge = 0; // Kinetic energy charge (0-100)
        this.windDirection = 1; // Current wind direction
    }

    applyWindPhysics(hearts, gameTime) {
        const windStrength = Math.sin(gameTime * 2) * 5;
        this.windDirection = Math.sign(windStrength) || 1;
        hearts.forEach(heart => {
            heart.vx += windStrength * 0.05;
        });
    }

    // Update kinetic charge based on player movement against wind
    updateKineticCharge(playerVelocityX, dt) {
        if (!this.activeEffects.has('windy_day')) return 0;
        
        // If player moves against wind, charge increases
        if (Math.sign(playerVelocityX) === -this.windDirection && Math.abs(playerVelocityX) > 0.5) {
            this.kineticCharge = Math.min(100, this.kineticCharge + dt * 30);
        } else {
            // Slowly decay if not charging
            this.kineticCharge = Math.max(0, this.kineticCharge - dt * 10);
        }
        
        return this.kineticCharge;
    }

    isKineticCharged() {
        return this.kineticCharge >= 100;
    }

    // ============================================
    // PHASE 2: PSYCHOLOGICAL OBSTACLES
    // ============================================

    // Boss 5: Jealousy Mirror - Inverted Controls
    enableJealousyMirror() {
        this.activeEffects.add('jealousy_mirror');
        this.invertedControls = true;
    }

    disableJealousyMirror() {
        this.invertedControls = false;
        this.activeEffects.delete('jealousy_mirror');
    }

    applyControlInversion(input) {
        if (this.invertedControls) {
            return -input; // Reverse direction
        }
        return input;
    }

    // Boss 6: Fog of Forgetting - Spotlight Vision
    enableFogForgetting() {
        this.activeEffects.add('fog_forgetting');
        this.fogActive = true;
    }

    disableFogForgetting() {
        this.fogActive = false;
        this.activeEffects.delete('fog_forgetting');
    }

    drawFogEffect(ctx, gameW, gameH, playerX, playerY) {
        if (!this.fogActive) return;

        ctx.save();
        
        // Create fog overlay
        ctx.fillStyle = 'rgba(100, 100, 100, 0.85)';
        ctx.fillRect(0, 0, gameW, gameH);
        
        // Create spotlight around player
        const gradient = ctx.createRadialGradient(playerX, playerY, 0, playerX, playerY, 150);
        gradient.addColorStop(0, 'rgba(100, 100, 100, 0)');
        gradient.addColorStop(0.7, 'rgba(100, 100, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0.85)');
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(playerX, playerY, 150, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // Boss 7: Ego Wall - Physical Block
    enableEgoWall() {
        this.activeEffects.add('ego_wall');
        this.wallActive = true;
    }

    disableEgoWall() {
        this.wallActive = false;
        this.activeEffects.delete('ego_wall');
    }

    drawEgoWall(ctx, gameW, gameH, bossX, bossY) {
        if (!this.wallActive) return;

        ctx.save();
        
        // Draw massive wall
        const wallWidth = 100;
        const wallHeight = gameH * 0.6;
        const wallX = bossX - wallWidth / 2;
        const wallY = bossY;
        
        // Wall gradient
        const gradient = ctx.createLinearGradient(wallX, wallY, wallX + wallWidth, wallY);
        gradient.addColorStop(0, '#555555');
        gradient.addColorStop(0.5, '#888888');
        gradient.addColorStop(1, '#555555');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(wallX, wallY, wallWidth, wallHeight);
        
        // Wall cracks
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(wallX + Math.random() * wallWidth, wallY + Math.random() * wallHeight);
            ctx.lineTo(wallX + Math.random() * wallWidth, wallY + Math.random() * wallHeight);
            ctx.stroke();
        }
        
        // Boss emoji on wall
        ctx.font = '60px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.fillText('🧱', bossX, bossY + wallHeight / 2);
        
        ctx.restore();
    }

    checkWallCollision(heartX, heartY, bossX, bossY) {
        if (!this.wallActive) return false;
        
        const wallWidth = 100;
        const wallHeight = this.ctx.gameH * 0.6;
        const wallX = bossX - wallWidth / 2;
        const wallY = bossY;
        
        return heartX > wallX && heartX < wallX + wallWidth &&
               heartY > wallY && heartY < wallY + wallHeight;
    }

    // Boss 8: Gossip Snake - Poison DOT
    enableGossipSnake() {
        this.activeEffects.add('gossip_snake');
    }

    spawnPoisonZone(x, y) {
        this.poisonZones.push({
            x: x,
            y: y,
            radius: 35, // Reduced from 50 to 35 for mobile
            lifetime: 4.0, // Reduced from 5.0 to 4.0 seconds
            createdAt: Date.now()
        });
    }

    updatePoisonZones(dt, playerX, playerY, gameH) {
        // Spawn poison zones less frequently for mobile (reduced from 0.05 to 0.015)
        if (Math.random() < 0.015) { // Much less frequent spawning
            // Spawn near player or random location
            const spawnX = Math.random() < 0.5 ? playerX + (Math.random() - 0.5) * 200 : Math.random() * 600;
            this.spawnPoisonZone(spawnX, gameH - 60);
        }

        // Update existing zones
        const now = Date.now();
        this.poisonZones = this.poisonZones.filter(zone => {
            const age = (now - zone.createdAt) / 1000;
            return age < zone.lifetime;
        });

        // Check if player is in poison
        return this.isInPoison(playerX, playerY);
    }

    isInPoison(x, y) {
        return this.poisonZones.some(zone => {
            const dx = x - zone.x;
            const dy = y - zone.y;
            return Math.sqrt(dx * dx + dy * dy) < zone.radius;
        });
    }

    drawPoisonZones(ctx) {
        this.poisonZones.forEach(zone => {
            const age = (Date.now() - zone.createdAt) / 1000;
            const alpha = 1 - (age / zone.lifetime);
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            
            // Poison circle
            const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
            gradient.addColorStop(0, 'rgba(150, 0, 255, 0.6)');
            gradient.addColorStop(0.5, 'rgba(100, 0, 200, 0.4)');
            gradient.addColorStop(1, 'rgba(50, 0, 150, 0.2)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Snake emoji
            ctx.globalAlpha = alpha;
            ctx.font = '25px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000000';
            ctx.fillText('🐍', zone.x, zone.y);
            
            ctx.restore();
        });
    }

    // ============================================
    // PHASE 3: ABSTRACT AND META OBSTACLES
    // ============================================

    // Boss 9: Glitch - Input Lag
    enableGlitch() {
        this.activeEffects.add('glitch');
        this.inputLag = 0.5; // 500ms delay
        this.glitchIntensity = 1.0;
    }

    disableGlitch() {
        this.inputLag = 0;
        this.glitchIntensity = 0;
        this.activeEffects.delete('glitch');
    }

    queueInput(input, timestamp) {
        this.inputQueue.push({
            input: input,
            timestamp: timestamp,
            executeAt: timestamp + (this.inputLag * 1000)
        });
    }

    processInputQueue(currentTime) {
        const readyInputs = [];
        this.inputQueue = this.inputQueue.filter(item => {
            if (currentTime >= item.executeAt) {
                readyInputs.push(item.input);
                return false;
            }
            return true;
        });
        return readyInputs;
    }

    drawGlitchEffect(ctx, gameW, gameH, gameTime) {
        if (this.glitchIntensity <= 0) return;

        ctx.save();
        
        // RGB split effect
        if (Math.random() < 0.3) {
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(255, 0, 0, ${0.1 * this.glitchIntensity})`;
            ctx.fillRect(Math.random() * 10 - 5, 0, gameW, gameH);
            ctx.fillStyle = `rgba(0, 255, 0, ${0.1 * this.glitchIntensity})`;
            ctx.fillRect(Math.random() * 10 - 5, 0, gameW, gameH);
            ctx.fillStyle = `rgba(0, 0, 255, ${0.1 * this.glitchIntensity})`;
            ctx.fillRect(Math.random() * 10 - 5, 0, gameW, gameH);
        }
        
        // Scan lines
        ctx.globalAlpha = 0.1 * this.glitchIntensity;
        for (let y = 0; y < gameH; y += 4) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, y, gameW, 2);
        }
        
        // Random pixel corruption
        if (Math.random() < 0.1) {
            ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
            ctx.fillRect(Math.random() * gameW, Math.random() * gameH, 50, 50);
        }
        
        ctx.restore();
    }

    // Boss 10: Time Thief - Bullet Time
    enableTimeThief() {
        this.activeEffects.add('time_thief');
    }

    updateTimeScale(gameTime) {
        // Oscillate between slow and fast (more balanced)
        const cycle = Math.sin(gameTime * 0.5);
        if (cycle > 0.5) {
            this.timeScale = 0.5; // Slow (was 0.3)
        } else if (cycle < -0.5) {
            this.timeScale = 1.5; // Fast (was 2.0)
        } else {
            this.timeScale = 1.0; // Normal
        }
    }

    // Boss 11: Routine - Grayscale Mode
    enableRoutine() {
        this.activeEffects.add('routine');
        this.grayscaleActive = true;
    }

    disableRoutine() {
        this.grayscaleActive = false;
        this.activeEffects.delete('routine');
    }

    applyGrayscaleFilter(ctx, gameW, gameH) {
        if (!this.grayscaleActive) return;

        ctx.save();
        ctx.filter = 'grayscale(100%)';
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
        ctx.fillRect(0, 0, gameW, gameH);
        ctx.restore();
    }

    // Boss 12: Dark Reflection - Multi-phase Final Boss
    enableDarkReflection() {
        this.activeEffects.add('dark_reflection');
        this.finalBossPlatforms = [];
        this.bernaTrapped = false;
        this.finalBeamActive = false;
        this.finalBeamProgress = 0;
    }

    // Initialize platforms for phase 3
    initFinalBossPlatforms(gameW, gameH) {
        this.finalBossPlatforms = [
            { x: gameW * 0.2, y: gameH * 0.7, width: 100, height: 15 },
            { x: gameW * 0.7, y: gameH * 0.6, width: 100, height: 15 },
            { x: gameW * 0.4, y: gameH * 0.5, width: 100, height: 15 },
            { x: gameW * 0.6, y: gameH * 0.35, width: 100, height: 15 },
            { x: gameW * 0.3, y: gameH * 0.25, width: 120, height: 15 }
        ];
    }

    drawFinalBossPlatforms(ctx) {
        ctx.save();
        ctx.fillStyle = '#ff1744';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        this.finalBossPlatforms.forEach(platform => {
            ctx.fillRect(platform.x - platform.width / 2, platform.y, platform.width, platform.height);
            ctx.strokeRect(platform.x - platform.width / 2, platform.y, platform.width, platform.height);
        });
        ctx.restore();
    }

    checkPlatformCollision(playerX, playerY, playerVY) {
        if (playerVY <= 0) return null; // Only collide when falling
        
        for (let platform of this.finalBossPlatforms) {
            const px = platform.x - platform.width / 2;
            const py = platform.y;
            
            if (playerX > px && playerX < px + platform.width &&
                playerY > py - 20 && playerY < py + 5) {
                return platform;
            }
        }
        return null;
    }

    activateFinalBeam() {
        this.finalBeamActive = true;
        this.finalBeamProgress = 0;
    }

    updateFinalBeam(dt) {
        if (this.finalBeamActive) {
            this.finalBeamProgress += dt * 0.5; // 2 seconds animation
            return this.finalBeamProgress >= 1.0;
        }
        return false;
    }

    drawFinalBeam(ctx, gameW, gameH, burakX, burakY, bernaX, bernaY, bossX, bossY) {
        if (!this.finalBeamActive) return;

        const progress = Math.min(1, this.finalBeamProgress);
        
        ctx.save();
        
        // Beam from Burak and Berna to Boss
        const centerX = (burakX + bernaX) / 2;
        const centerY = (burakY + bernaY) / 2;
        
        // Gradient beam
        const gradient = ctx.createLinearGradient(centerX, centerY, bossX, bossY);
        gradient.addColorStop(0, `rgba(255, 23, 68, ${progress})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${progress})`);
        gradient.addColorStop(1, `rgba(255, 23, 68, ${progress})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 30 * progress;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(bossX, bossY);
        ctx.stroke();
        
        // Particles along beam
        for (let i = 0; i < 20; i++) {
            const t = (i / 20) * progress;
            const x = centerX + (bossX - centerX) * t;
            const y = centerY + (bossY - centerY) * t;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${progress})`;
            ctx.beginPath();
            ctx.arc(x, y, 5 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Heart symbol at center
        ctx.font = `${60 * progress}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 23, 68, ${progress})`;
        ctx.fillText('💖', centerX, centerY);
        
        ctx.restore();
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    reset() {
        this.activeEffects.clear();
        this.lavaBombs = [];
        this.poisonZones = [];
        this.inputQueue = [];
        this.timeScale = 1.0;
        this.grayscaleActive = false;
        this.fogActive = false;
        this.wallActive = false;
        this.invertedControls = false;
        this.playerFrozen = false;
        this.freezeTimer = 0;
        this.slowDebuff = 1.0;
        this.inputLag = 0;
        this.glitchIntensity = 0;
        this.kineticCharge = 0;
        this.windDirection = 1;
        this.finalBossPlatforms = [];
        this.bernaTrapped = false;
        this.finalBeamActive = false;
        this.finalBeamProgress = 0;
    }

    getSlowMultiplier() {
        return this.slowDebuff;
    }

    isPlayerFrozen() {
        return this.playerFrozen;
    }

    getTimeScale() {
        return this.timeScale;
    }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BossController;
}
