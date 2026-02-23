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
        
        // Load boss attack images
        this.attackImages = {};
        this.loadAttackImages();
    }
    
    loadAttackImages() {
        const imagePaths = {
            'lav': 'image/obje/lav.webp',
            'zehir': 'image/obje/zehir.webp',
            'glitch': 'image/obje/glitch.webp'
        };
        
        Object.keys(imagePaths).forEach(key => {
            const img = new Image();
            img.src = imagePaths[key];
            img.onload = () => {
                this.attackImages[key] = img;
                console.log(`✅ Boss attack image ${key} loaded`);
            };
            img.onerror = () => {
                console.warn(`⚠️ Boss attack image ${key} failed to load, using emoji fallback`);
            };
        });
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
            rotSpeed: 0,
            // Particle effect data
            particleType: 'rain',
            trail: []
        };
    }

    // Rain particle effect
    drawRainParticles(ctx, hearts) {
        hearts.forEach(heart => {
            if (heart.type.isRain) {
                ctx.save();
                
                // Water droplet trail
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = '#4dd0e1';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(heart.x, heart.y - 10);
                ctx.lineTo(heart.x, heart.y - 30);
                ctx.stroke();
                
                // Splash effect when moving
                if (Math.random() < 0.2) {
                    for (let i = 0; i < 3; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * 5;
                        ctx.fillStyle = 'rgba(77, 208, 225, 0.4)';
                        ctx.beginPath();
                        ctx.arc(
                            heart.x + Math.cos(angle) * dist,
                            heart.y + Math.sin(angle) * dist,
                            2,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
                
                ctx.restore();
            }
        });
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
            vy: 5, // Fall speed (reduced from 8 for slower descent)
            radius: 30, // Smaller radius for easier dodging (reduced from 35)
            lifetime: 2.0, // 2 seconds after landing (reduced from 2.5)
            createdAt: Date.now(),
            landed: false
        });
    }

    updateLavaBombs(dt, hearts, bossX, bossY, gameW, gameH) {
        // Spawn lava bombs randomly across the screen (VERY RARE - mobile friendly)
        // Only spawn if no lava bomb currently exists
        const hasActiveBomb = this.lavaBombs.length > 0;
        if (!hasActiveBomb && Math.random() < 0.004) { // Reduced from 0.008 to 0.004 (half again - 4x less than original)
            const targetX = Math.random() * gameW; // Use parameter instead of this.ctx.gameW
            const targetY = gameH - 40; // Land closer to ground (was 80, now 40 for better collision)
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
            // Increased collision radius slightly for better detection (radius + 10)
            return Math.sqrt(dx * dx + dy * dy) < (bomb.radius + 10);
        });
    }

    drawLavaBombs(ctx) {
        this.lavaBombs.forEach(bomb => {
            ctx.save();
            
            if (!bomb.landed) {
                // Falling bomb - draw as falling fireball with enhanced particles
                ctx.globalAlpha = 0.8;
                
                // Smoke trail particles
                for (let i = 0; i < 5; i++) {
                    const trailY = bomb.y - (i * 12);
                    const trailAlpha = 0.4 - (i * 0.08);
                    const offset = Math.sin(Date.now() * 0.01 + i) * 5;
                    
                    ctx.globalAlpha = trailAlpha;
                    // Smoke puffs
                    ctx.fillStyle = '#555555';
                    ctx.beginPath();
                    ctx.arc(bomb.x + offset, trailY, 8 - i, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Fire particles around main fireball
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i + Date.now() * 0.005;
                    const dist = 15 + Math.sin(Date.now() * 0.01 + i) * 5;
                    ctx.globalAlpha = 0.6;
                    ctx.fillStyle = i % 2 === 0 ? '#ff6600' : '#ffaa00';
                    ctx.beginPath();
                    ctx.arc(
                        bomb.x + Math.cos(angle) * dist,
                        bomb.y + Math.sin(angle) * dist,
                        4,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
                
                // Main fireball with glow
                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ff4400';
                
                // Check if we have lava image
                const lavaImg = this.attackImages['lav'];
                if (lavaImg && lavaImg.complete) {
                    const imgSize = 50;
                    ctx.drawImage(lavaImg, bomb.x - imgSize / 2, bomb.y - imgSize / 2, imgSize, imgSize);
                } else {
                    // Fallback to emoji
                    ctx.font = '40px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#000000';
                    ctx.fillText('🔥', bomb.x, bomb.y);
                }
                
                ctx.shadowBlur = 0;
                
            } else {
                // Landed bomb - draw as lava pool with bubbles
                const age = (Date.now() - bomb.landedAt) / 1000;
                const alpha = 1 - (age / bomb.lifetime);
                
                ctx.globalAlpha = alpha * 0.6;
                
                // Lava circle with animated gradient
                const gradient = ctx.createRadialGradient(bomb.x, bomb.y, 0, bomb.x, bomb.y, bomb.radius);
                gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.6)');
                gradient.addColorStop(1, 'rgba(200, 0, 0, 0.2)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Bubbling particles
                for (let i = 0; i < 5; i++) {
                    const bubbleTime = Date.now() * 0.003 + i;
                    const bubbleX = bomb.x + Math.cos(bubbleTime) * (bomb.radius * 0.6);
                    const bubbleY = bomb.y + Math.sin(bubbleTime * 1.3) * (bomb.radius * 0.6);
                    const bubbleSize = 3 + Math.sin(bubbleTime * 2) * 2;
                    
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.fillStyle = '#ff8800';
                    ctx.beginPath();
                    ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Warning symbol
                ctx.globalAlpha = alpha;
                
                // Check if we have lava image
                const lavaImg = this.attackImages['lav'];
                if (lavaImg && lavaImg.complete) {
                    const imgSize = 40;
                    ctx.drawImage(lavaImg, bomb.x - imgSize / 2, bomb.y - imgSize / 2, imgSize, imgSize);
                } else {
                    // Fallback to emoji
                    ctx.font = '30px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#000000';
                    ctx.fillText('🔥', bomb.x, bomb.y);
                }
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
            
            const time = Date.now() * 0.001;
            
            // Animated ice crystals
            for (let i = 0; i < 30; i++) {
                const x = (Math.sin(time * 0.5 + i) * 0.5 + 0.5) * gameW;
                const y = (Math.cos(time * 0.3 + i * 0.5) * 0.5 + 0.5) * gameH;
                const size = 3 + Math.sin(time * 2 + i) * 2;
                
                // Crystal glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ffff';
                ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Crystal sparkle
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Snowflake particles
            for (let i = 0; i < 15; i++) {
                const x = (i / 15) * gameW + Math.sin(time + i) * 50;
                const y = ((time * 30 + i * 50) % gameH);
                const rotation = time + i;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 2;
                
                // Draw snowflake
                for (let j = 0; j < 6; j++) {
                    ctx.rotate(Math.PI / 3);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, 10);
                    ctx.stroke();
                }
                ctx.restore();
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

    // Wind particle effect
    drawWindParticles(ctx, gameW, gameH, gameTime) {
        if (!this.activeEffects.has('windy_day')) return;
        
        ctx.save();
        const windStrength = Math.sin(gameTime * 2);
        
        // Wind streaks
        for (let i = 0; i < 20; i++) {
            const y = (i / 20) * gameH;
            const x = ((gameTime * 100 * windStrength + i * 30) % (gameW + 100)) - 50;
            const length = 30 + Math.abs(windStrength) * 40;
            
            ctx.globalAlpha = 0.3 * Math.abs(windStrength);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + length * Math.sign(windStrength), y);
            ctx.stroke();
        }
        
        // Swirling leaves/debris
        for (let i = 0; i < 10; i++) {
            const t = gameTime + i;
            const x = ((t * 80 * windStrength + i * 60) % (gameW + 100)) - 50;
            const y = gameH * 0.3 + Math.sin(t * 2 + i) * (gameH * 0.4);
            const rotation = t * 3;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#90ee90';
            ctx.fillRect(-5, -2, 10, 4);
            ctx.restore();
        }
        
        ctx.restore();
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

    // Mirror particle effect
    drawMirrorParticles(ctx, gameW, gameH, gameTime) {
        if (!this.activeEffects.has('jealousy_mirror')) return;
        
        ctx.save();
        
        // Mirror shards floating
        for (let i = 0; i < 15; i++) {
            const x = (i / 15) * gameW + Math.sin(gameTime + i) * 50;
            const y = gameH * 0.3 + Math.sin(gameTime * 1.5 + i * 0.5) * (gameH * 0.4);
            const rotation = gameTime * 2 + i;
            const size = 15 + Math.sin(gameTime + i) * 5;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            
            // Mirror shard with reflection
            const gradient = ctx.createLinearGradient(-size, -size, size, size);
            gradient.addColorStop(0, 'rgba(200, 200, 255, 0.6)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(1, 'rgba(200, 200, 255, 0.6)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size * 0.5, 0);
            ctx.lineTo(0, size);
            ctx.lineTo(-size * 0.5, 0);
            ctx.closePath();
            ctx.fill();
            
            // Sparkle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Reflection distortion waves
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 5; i++) {
            const y = ((gameTime * 50 + i * 100) % gameH);
            ctx.strokeStyle = '#9d4edd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < gameW; x += 10) {
                const waveY = y + Math.sin(x * 0.05 + gameTime * 2) * 10;
                if (x === 0) ctx.moveTo(x, waveY);
                else ctx.lineTo(x, waveY);
            }
            ctx.stroke();
        }
        
        ctx.restore();
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
        
        const time = Date.now() * 0.001;
        
        // Animated fog layers
        for (let layer = 0; layer < 3; layer++) {
            const layerSpeed = 0.5 + layer * 0.3;
            const layerAlpha = 0.25 + layer * 0.05;
            
            for (let i = 0; i < 15; i++) {
                const x = ((time * 20 * layerSpeed + i * 80) % (gameW + 200)) - 100;
                const y = (i / 15) * gameH + Math.sin(time + i + layer) * 30;
                const size = 60 + layer * 20;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
                gradient.addColorStop(0, `rgba(150, 150, 150, ${layerAlpha})`);
                gradient.addColorStop(1, 'rgba(150, 150, 150, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Create fog overlay
        ctx.fillStyle = 'rgba(100, 100, 100, 0.85)';
        ctx.fillRect(0, 0, gameW, gameH);
        
        // Create spotlight around player with soft edges
        const gradient = ctx.createRadialGradient(playerX, playerY, 0, playerX, playerY, 150);
        gradient.addColorStop(0, 'rgba(100, 100, 100, 0)');
        gradient.addColorStop(0.7, 'rgba(100, 100, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0.85)');
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(playerX, playerY, 150, 0, Math.PI * 2);
        ctx.fill();
        
        // Fog particles in spotlight
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i + time;
            const dist = 50 + Math.sin(time * 2 + i) * 30;
            const px = playerX + Math.cos(angle) * dist;
            const py = playerY + Math.sin(angle) * dist;
            
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#cccccc';
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
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

    drawEgoWall(ctx, gameW, gameH, bossX, bossY, bossHP, bossMaxHP) {
        if (!this.wallActive) return;

        ctx.save();
        
        // Wall height based on boss HP (proportional)
        const hpRatio = Math.max(0, bossHP / bossMaxHP);
        const maxWallHeight = gameH * 0.6;
        const wallHeight = maxWallHeight * hpRatio;
        
        // If wall is destroyed, disable it
        if (wallHeight <= 0) {
            this.disableEgoWall();
            ctx.restore();
            return;
        }
        
        // Draw massive wall
        const wallWidth = 100;
        const wallX = bossX - wallWidth / 2;
        const wallY = bossY; // Wall starts from boss position and grows downward
        
        // Wall gradient
        const gradient = ctx.createLinearGradient(wallX, wallY, wallX + wallWidth, wallY);
        gradient.addColorStop(0, '#555555');
        gradient.addColorStop(0.5, '#888888');
        gradient.addColorStop(1, '#555555');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(wallX, wallY, wallWidth, wallHeight);
        
        // Wall cracks (more cracks as HP decreases)
        const crackCount = Math.ceil(5 * (1 - hpRatio) + 2);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        for (let i = 0; i < crackCount; i++) {
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
        ctx.fillText('🧱', bossX, wallY + wallHeight / 2);
        
        // HP indicator on wall
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        const hpText = `${Math.ceil(bossHP)}/${bossMaxHP}`;
        ctx.strokeText(hpText, bossX, wallY + wallHeight - 20);
        ctx.fillText(hpText, bossX, wallY + wallHeight - 20);
        
        ctx.restore();
    }

    checkWallCollision(heartX, heartY, bossX, bossY, bossHP, bossMaxHP) {
        if (!this.wallActive) return false;
        
        const hpRatio = Math.max(0, bossHP / bossMaxHP);
        const maxWallHeight = this.ctx.gameH * 0.6;
        const wallHeight = maxWallHeight * hpRatio;
        
        if (wallHeight <= 0) return false;
        
        const wallWidth = 100;
        const wallX = bossX - wallWidth / 2;
        const wallY = bossY; // Wall starts from boss position

        
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
        // Spawn poison zones much less frequently (reduced by 1/6: 0.015 → 0.0025)
        if (Math.random() < 0.0025) { // 1/6 of original rate
            // Spawn near player or random location
            const spawnX = Math.random() < 0.5 ? playerX + (Math.random() - 0.5) * 200 : Math.random() * 600;
            this.spawnPoisonZone(spawnX, gameH - 40); // Changed from 60 to 40 for better collision
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
            // Increased collision radius slightly for better detection (radius + 10)
            return Math.sqrt(dx * dx + dy * dy) < (zone.radius + 10);
        });
    }

    drawPoisonZones(ctx) {
        this.poisonZones.forEach(zone => {
            const age = (Date.now() - zone.createdAt) / 1000;
            const alpha = 1 - (age / zone.lifetime);
            const time = Date.now() * 0.001;
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            
            // Poison circle with pulsing effect
            const pulseRadius = zone.radius + Math.sin(time * 3) * 5;
            const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, pulseRadius);
            gradient.addColorStop(0, 'rgba(150, 0, 255, 0.6)');
            gradient.addColorStop(0.5, 'rgba(100, 0, 200, 0.4)');
            gradient.addColorStop(1, 'rgba(50, 0, 150, 0.2)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, pulseRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Toxic bubbles rising
            for (let i = 0; i < 8; i++) {
                const bubbleTime = time * 2 + i * 0.5;
                const angle = (Math.PI * 2 / 8) * i;
                const dist = (zone.radius * 0.7) * (1 - (bubbleTime % 1));
                const bubbleY = zone.y - (bubbleTime % 1) * 30;
                const bubbleX = zone.x + Math.cos(angle + bubbleTime) * (zone.radius * 0.3);
                const bubbleAlpha = alpha * (1 - (bubbleTime % 1));
                
                ctx.globalAlpha = bubbleAlpha * 0.6;
                ctx.fillStyle = '#9d00ff';
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Poison mist particles
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i + time;
                const dist = zone.radius * 0.8 + Math.sin(time * 2 + i) * 10;
                const px = zone.x + Math.cos(angle) * dist;
                const py = zone.y + Math.sin(angle) * dist;
                
                ctx.globalAlpha = alpha * 0.4;
                ctx.fillStyle = '#8b00cc';
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Snake emoji with glow
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#9d00ff';
            
            // Check if we have poison image
            const poisonImg = this.attackImages['zehir'];
            if (poisonImg && poisonImg.complete) {
                const imgSize = 35;
                ctx.drawImage(poisonImg, zone.x - imgSize / 2, zone.y - imgSize / 2, imgSize, imgSize);
            } else {
                // Fallback to emoji
                ctx.font = '25px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#000000';
                ctx.fillText('🐍', zone.x, zone.y);
            }
            
            ctx.shadowBlur = 0;
            
            ctx.restore();
        });
    }

    // ============================================
    // PHASE 3: ABSTRACT AND META OBSTACLES
    // ============================================

    // Boss 9: Glitch - Input Lag
    enableGlitch() {
        this.activeEffects.add('glitch');
        this.inputLag = 0.25; // 250ms delay (reduced from 500ms)
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
        
        // RGB split effect with chromatic aberration
        if (Math.random() < 0.3) {
            ctx.globalCompositeOperation = 'screen';
            const offset = Math.random() * 15 - 7.5;
            ctx.fillStyle = `rgba(255, 0, 0, ${0.15 * this.glitchIntensity})`;
            ctx.fillRect(offset, 0, gameW, gameH);
            ctx.fillStyle = `rgba(0, 255, 0, ${0.15 * this.glitchIntensity})`;
            ctx.fillRect(-offset, 0, gameW, gameH);
            ctx.fillStyle = `rgba(0, 0, 255, ${0.15 * this.glitchIntensity})`;
            ctx.fillRect(offset * 0.5, 0, gameW, gameH);
        }
        
        // Digital noise particles
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * gameW;
            const y = Math.random() * gameH;
            const size = Math.random() * 3 + 1;
            ctx.globalAlpha = this.glitchIntensity * 0.5;
            ctx.fillStyle = Math.random() < 0.5 ? '#00ff00' : '#ff00ff';
            ctx.fillRect(x, y, size, size);
        }
        
        // Scan lines with animation
        ctx.globalAlpha = 0.15 * this.glitchIntensity;
        const scanOffset = (gameTime * 100) % 8;
        for (let y = scanOffset; y < gameH; y += 4) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, y, gameW, 2);
        }
        
        // Random pixel corruption blocks
        if (Math.random() < 0.15) {
            const blockX = Math.random() * gameW;
            const blockY = Math.random() * gameH;
            const blockW = Math.random() * 80 + 20;
            const blockH = Math.random() * 40 + 10;
            
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
            ctx.fillRect(blockX, blockY, blockW, blockH);
        }
        
        // Matrix-style falling code
        ctx.globalAlpha = 0.3 * this.glitchIntensity;
        ctx.font = '12px monospace';
        ctx.fillStyle = '#00ff00';
        for (let i = 0; i < 10; i++) {
            const x = (i / 10) * gameW;
            const y = ((gameTime * 200 + i * 50) % (gameH + 100));
            ctx.fillText(Math.random().toString(36).substring(2, 4), x, y);
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

    // Time distortion particle effect
    drawTimeParticles(ctx, gameW, gameH, gameTime) {
        if (!this.activeEffects.has('time_thief')) return;
        
        ctx.save();
        
        const cycle = Math.sin(gameTime * 0.5);
        const isSlow = cycle > 0.5;
        const isFast = cycle < -0.5;
        
        // Clock particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const radius = 100 + Math.sin(gameTime * 2 + i) * 20;
            const x = gameW / 2 + Math.cos(angle + gameTime) * radius;
            const y = gameH / 2 + Math.sin(angle + gameTime) * radius;
            
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = isSlow ? '#4dd0e1' : isFast ? '#ff6b6b' : '#ffd700';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Time ripples
        const rippleCount = 5;
        for (let i = 0; i < rippleCount; i++) {
            const rippleTime = (gameTime * 2 + i * 0.5) % 2;
            const rippleRadius = rippleTime * 150;
            const rippleAlpha = 1 - rippleTime / 2;
            
            ctx.globalAlpha = rippleAlpha * 0.4;
            ctx.strokeStyle = isSlow ? '#4dd0e1' : isFast ? '#ff6b6b' : '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(gameW / 2, gameH / 2, rippleRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Speed lines when fast
        if (isFast) {
            ctx.globalAlpha = 0.4;
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 / 30) * i;
                const startR = 50;
                const endR = 200;
                const x1 = gameW / 2 + Math.cos(angle) * startR;
                const y1 = gameH / 2 + Math.sin(angle) * startR;
                const x2 = gameW / 2 + Math.cos(angle) * endR;
                const y2 = gameH / 2 + Math.sin(angle) * endR;
                
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        
        // Slow motion trails when slow
        if (isSlow) {
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * gameW;
                const y = ((gameTime * 10 + i * 30) % gameH);
                const size = 3 + Math.random() * 3;
                
                ctx.fillStyle = '#4dd0e1';
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
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

    // Routine/grayscale particle effect
    drawRoutineParticles(ctx, gameW, gameH, gameTime) {
        if (!this.activeEffects.has('routine')) return;
        
        ctx.save();
        
        // Falling gray squares (representing monotony)
        for (let i = 0; i < 25; i++) {
            const x = (i / 25) * gameW + Math.sin(gameTime * 0.5 + i) * 20;
            const y = ((gameTime * 40 + i * 30) % (gameH + 50));
            const size = 8 + Math.sin(gameTime + i) * 4;
            const rotation = gameTime * 0.5 + i;
            const gray = 100 + Math.sin(gameTime + i) * 50;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(-size / 2, -size / 2, size, size);
            ctx.restore();
        }
        
        // Static noise overlay
        if (Math.random() < 0.3) {
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * gameW;
                const y = Math.random() * gameH;
                const gray = Math.random() * 255;
                ctx.globalAlpha = 0.1;
                ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                ctx.fillRect(x, y, 2, 2);
            }
        }
        
        // Desaturation waves
        for (let i = 0; i < 3; i++) {
            const y = ((gameTime * 60 + i * 200) % (gameH + 100)) - 50;
            const gradient = ctx.createLinearGradient(0, y - 30, 0, y + 30);
            gradient.addColorStop(0, 'rgba(128, 128, 128, 0)');
            gradient.addColorStop(0.5, 'rgba(128, 128, 128, 0.3)');
            gradient.addColorStop(1, 'rgba(128, 128, 128, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, y - 30, gameW, 60);
        }
        
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
