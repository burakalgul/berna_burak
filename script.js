document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const introText = document.getElementById('intro-text');
    const mainContent = document.getElementById('main-content');
    const bgMusic = document.getElementById('bg-music');
    const gameMusic = document.getElementById('game-music');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const musicControl = document.getElementById('music-control');
    const counterEl = document.getElementById('counter');
    
    // Main Menu Elements
    const mainMenu = document.getElementById('main-menu');
    const menuPlay = document.getElementById('menu-play');
    const menuStats = document.getElementById('menu-stats');
    const menuHowto = document.getElementById('menu-howto');
    const menuSettings = document.getElementById('menu-settings');
    
    // Settings Modal Elements
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.getElementById('settings-close');
    const settingMusic = document.getElementById('setting-music');
    const settingSfx = document.getElementById('setting-sfx');
    const settingHaptic = document.getElementById('setting-haptic');
    const settingParticles = document.getElementById('setting-particles');
    
    // How To Play Modal Elements
    const howtoModal = document.getElementById('howto-modal');
    const howtoClose = document.getElementById('howto-close');
    
    // Stats Modal Elements
    const statsModal = document.getElementById('stats-modal');
    const statsClose = document.getElementById('stats-close');

    // State Variables
    let width, height;
    let particles = [];
    let state = 'INTRO'; // INTRO, EXPLODING, MAIN_TRANSITIONING, MAIN
    let introClickable = false;
    let isMusicPlaying = false;
    let lastFireworkTime = 0;
    
    // Settings State
    let settings = {
        music: true,
        sfx: true,
        haptic: true,
        particles: true
    };
    
    // Load settings from localStorage
    function loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            settings = { ...settings, ...JSON.parse(saved) };
        }
        
        // Apply settings to UI
        if (settingMusic) settingMusic.checked = settings.music;
        if (settingSfx) settingSfx.checked = settings.sfx;
        if (settingHaptic) settingHaptic.checked = settings.haptic;
        if (settingParticles) settingParticles.checked = settings.particles;
        
        // Apply settings to game
        mobileSettings.hapticEnabled = settings.haptic;
        if (!settings.music) {
            bgMusic.pause();
            isMusicPlaying = false;
        }
    }
    
    // Save settings to localStorage
    function saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(settings));
    }

    // Mobile Check (Enhanced)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Mobile-specific settings
    const mobileSettings = {
        particleReduction: isMobile ? 0.5 : 1, // 50% fewer particles on mobile
        hapticEnabled: true,
        swipeEnabled: true,
        fullscreenEnabled: true
    };
    
    // ===================================================================
    // MAIN MENU FUNCTIONALITY
    // ===================================================================
    
    // Menu button handlers
    if (menuPlay) {
        menuPlay.addEventListener('click', () => {
            if (mainMenu) mainMenu.classList.add('hidden');
            // Start game immediately
            startGame();
        });
    }
    
    if (menuStats) {
        menuStats.addEventListener('click', () => {
            openStatsModal();
        });
    }
    
    if (menuHowto) {
        menuHowto.addEventListener('click', () => {
            if (howtoModal) howtoModal.classList.add('active');
        });
    }
    
    if (menuSettings) {
        menuSettings.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.add('active');
        });
    }
    
    // Settings modal handlers
    if (settingsClose) {
        settingsClose.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.remove('active');
        });
    }
    
    if (settingMusic) {
        settingMusic.addEventListener('change', (e) => {
            settings.music = e.target.checked;
            saveSettings();
            
            if (settings.music && state === 'MAIN') {
                bgMusic.play().catch(() => {});
                isMusicPlaying = true;
            } else {
                bgMusic.pause();
                isMusicPlaying = false;
            }
        });
    }
    
    if (settingSfx) {
        settingSfx.addEventListener('change', (e) => {
            settings.sfx = e.target.checked;
            saveSettings();
        });
    }
    
    if (settingHaptic) {
        settingHaptic.addEventListener('change', (e) => {
            settings.haptic = e.target.checked;
            mobileSettings.hapticEnabled = e.target.checked;
            saveSettings();
        });
    }
    
    if (settingParticles) {
        settingParticles.addEventListener('change', (e) => {
            settings.particles = e.target.checked;
            saveSettings();
        });
    }
    
    // How to play modal handlers
    if (howtoClose) {
        howtoClose.addEventListener('click', () => {
            if (howtoModal) howtoModal.classList.remove('active');
        });
    }
    
    // Stats modal close handler (for menu stats button)
    if (statsClose) {
        statsClose.addEventListener('click', () => {
            if (statsModal) statsModal.classList.remove('active');
        });
    }
    
    // Close modals on background click
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
        });
    }
    
    if (howtoModal) {
        howtoModal.addEventListener('click', (e) => {
            if (e.target === howtoModal) {
                howtoModal.classList.remove('active');
            }
        });
    }
    
    if (statsModal) {
        statsModal.addEventListener('click', (e) => {
            if (e.target === statsModal) {
                statsModal.classList.remove('active');
            }
        });
    }
    
    // Load settings on init
    loadSettings();

    // ===================================================================
    // MOBILE ENHANCEMENTS - Haptic Feedback System
    // ===================================================================
    const HapticFeedback = {
        // Vibration patterns
        patterns: {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 20, 10],
            error: [50, 30, 50],
            warning: [20, 10, 20, 10, 20],
            heartCatch: [5],
            diamondCatch: [10, 5, 10],
            bossDamage: [30, 20, 30],
            bossDefeat: [50, 30, 50, 30, 100],
            combo: [5, 5, 5],
            powerup: [15, 10, 15]
        },
        
        vibrate(pattern) {
            if (!mobileSettings.hapticEnabled || !navigator.vibrate) return;
            
            // iOS doesn't support pattern arrays, only single values
            if (isIOS) {
                const duration = Array.isArray(pattern) ? pattern[0] : pattern;
                navigator.vibrate(duration);
            } else {
                navigator.vibrate(pattern);
            }
        },
        
        light() { this.vibrate(this.patterns.light); },
        medium() { this.vibrate(this.patterns.medium); },
        heavy() { this.vibrate(this.patterns.heavy); },
        success() { this.vibrate(this.patterns.success); },
        error() { this.vibrate(this.patterns.error); },
        warning() { this.vibrate(this.patterns.warning); },
        heartCatch() { this.vibrate(this.patterns.heartCatch); },
        diamondCatch() { this.vibrate(this.patterns.diamondCatch); },
        bossDamage() { this.vibrate(this.patterns.bossDamage); },
        bossDefeat() { this.vibrate(this.patterns.bossDefeat); },
        combo() { this.vibrate(this.patterns.combo); },
        powerup() { this.vibrate(this.patterns.powerup); }
    };

    // ===================================================================
    // MOBILE ENHANCEMENTS - Swipe Gesture System
    // ===================================================================
    const SwipeGesture = {
        startX: 0,
        startY: 0,
        startTime: 0,
        
        init() {
            if (!mobileSettings.swipeEnabled || !isMobile) return;
            
            document.addEventListener('touchstart', (e) => {
                this.startX = e.touches[0].clientX;
                this.startY = e.touches[0].clientY;
                this.startTime = Date.now();
            }, { passive: true });
            
            document.addEventListener('touchend', (e) => {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const endTime = Date.now();
                
                const deltaX = endX - this.startX;
                const deltaY = endY - this.startY;
                const deltaTime = endTime - this.startTime;
                
                // Detect swipe (fast movement)
                if (deltaTime < 300 && Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                        this.onSwipeRight();
                    } else {
                        this.onSwipeLeft();
                    }
                }
                
                if (deltaTime < 300 && Math.abs(deltaY) > 50) {
                    if (deltaY > 0) {
                        this.onSwipeDown();
                    } else {
                        this.onSwipeUp();
                    }
                }
            }, { passive: true });
        },
        
        onSwipeRight() {
            // Could be used for special moves
            console.log('Swipe Right');
        },
        
        onSwipeLeft() {
            console.log('Swipe Left');
        },
        
        onSwipeUp() {
            // BOSS MECHANIC: Reflect heart back to boss
            if (gameActive && bossActive && !bossIntroTimer && !bossDefeatedTimer) {
                reflectHeartToBoss();
            }
        },
        
        onSwipeDown() {
            console.log('Swipe Down');
        }
    };

    // ===================================================================
    // BOSS SPECIAL MECHANICS
    // ===================================================================
    
    let lastReflectTime = 0;
    let bossSpecialHeartTimer = 0;
    
    function reflectHeartToBoss() {
        // Cooldown check (1 second)
        const now = Date.now();
        if (now - lastReflectTime < 1000) {
            addCatchEffect(gameW / 2, gameH / 2, '⏱️ Bekle!', false);
            return;
        }
        lastReflectTime = now;
        
        // Find closest heart to Burak
        const burakTop = gameH - BURAK_SPRITE_SIZE / 2;
        let closestHeart = null;
        let closestDist = Infinity;
        
        for (let i = 0; i < fallingHearts.length; i++) {
            const h = fallingHearts[i];
            const dist = Math.sqrt(Math.pow(h.x - burakX, 2) + Math.pow(h.y - burakTop, 2));
            if (dist < closestDist && dist < 150) { // Within 150px
                closestDist = dist;
                closestHeart = { heart: h, index: i };
            }
        }
        
        if (closestHeart) {
            const h = closestHeart.heart;
            
            // Remove from falling hearts
            fallingHearts.splice(closestHeart.index, 1);
            
            // Create reflected projectile
            const angle = Math.atan2(bossY - h.y, bossX - h.x);
            const speed = 8;
            
            // Add to special projectiles array
            if (!window.bossProjectiles) window.bossProjectiles = [];
            window.bossProjectiles.push({
                x: h.x,
                y: h.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                emoji: '⚡',
                size: 35,
                damage: 1
            });
            
            // Visual feedback
            addCatchEffect(h.x, h.y, '⚡ YANSIMA!', true);
            playSound('combo');
            HapticFeedback.medium();
            
            // Particle trail
            for (let i = 0; i < 5; i++) {
                catchEffects.push({
                    x: h.x,
                    y: h.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    life: 0.8,
                    color: '#ffeb3b',
                    size: 3,
                    sparkle: true
                });
            }
        } else {
            addCatchEffect(gameW / 2, gameH / 2, '❌ Kalp Yok!', false);
        }
    }
    
    function updateBossProjectiles(dt) {
        if (!window.bossProjectiles) window.bossProjectiles = [];
        
        for (let i = window.bossProjectiles.length - 1; i >= 0; i--) {
            const proj = window.bossProjectiles[i];
            
            // Update position
            proj.x += proj.vx;
            proj.y += proj.vy;
            
            // Check collision with boss
            const renderBossY = bossY + Math.sin(gameTime * 2) * 20;
            const dist = Math.sqrt(Math.pow(proj.x - bossX, 2) + Math.pow(proj.y - renderBossY, 2));
            
            if (dist < 60) {
                // Hit boss!
                damageBoss(proj.damage, 'projectile');
                window.bossProjectiles.splice(i, 1);
                continue;
            }
            
            // Remove if off screen
            if (proj.y < -50 || proj.x < -50 || proj.x > gameW + 50) {
                window.bossProjectiles.splice(i, 1);
                continue;
            }
            
            // Draw projectile
            gameCtx.save();
            gameCtx.translate(proj.x, proj.y);
            
            // Glow effect
            gameCtx.shadowBlur = 20;
            gameCtx.shadowColor = '#ffeb3b';
            
            gameCtx.font = `${proj.size}px serif`;
            gameCtx.textAlign = 'center';
            gameCtx.textBaseline = 'middle';
            gameCtx.fillStyle = '#000000';
            gameCtx.fillText(proj.emoji, 0, 0);
            
            gameCtx.restore();
            
            // Trail effect
            if (gameFrameCount % 2 === 0) {
                catchEffects.push({
                    x: proj.x,
                    y: proj.y,
                    vx: 0,
                    vy: 0,
                    life: 0.5,
                    color: '#ffeb3b',
                    size: 2
                });
            }
        }
    }
    
    function spawnBossSpecialHeart() {
        // Boss drops special hearts that damage it when caught
        const bossConfig = WAVES[currentWave - 1]?.boss || {};
        const specialHeart = bossConfig.specialHeart || { emoji: '⭐', name: 'Özel Kalp', damage: 1 };
        
        fallingHearts.push({
            x: bossX + (Math.random() - 0.5) * 50,
            y: bossY + 40,
            vy: 2.5,
            vx: (Math.random() - 0.5) * 0.5,
            type: {
                emoji: specialHeart.emoji,
                points: 50,
                size: 32,
                speed: 2.5,
                isBossWeakness: true,
                bossDamage: specialHeart.damage // Special flag for damage amount
            },
            rotation: 0,
            rotSpeed: 0.1
        });
        
        // Visual effect
        addCatchEffect(bossX, bossY, `${specialHeart.emoji} ${specialHeart.name}!`, true);
    }

    // ===================================================================
    // MOBILE ENHANCEMENTS - Fullscreen & Orientation
    // ===================================================================
    const MobileScreen = {
        init() {
            if (!isMobile) return;
            
            // Request fullscreen on first interaction
            document.addEventListener('touchstart', () => {
                this.requestFullscreen();
            }, { once: true });
            
            // Handle orientation changes
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    resize();
                    if (gameActive) resizeGameCanvas();
                }, 100);
            });
            
            // Prevent pull-to-refresh on iOS
            document.body.addEventListener('touchmove', (e) => {
                if (e.target === document.body) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            // Prevent double-tap zoom
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        },
        
        requestFullscreen() {
            if (!mobileSettings.fullscreenEnabled) return;
            
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(() => {});
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        },
        
        exitFullscreen() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    // Initialize mobile enhancements
    if (isMobile) {
        SwipeGesture.init();
        MobileScreen.init();
    }

    // ===================================================================
    // MOBILE ENHANCEMENTS - Performance Optimization
    // ===================================================================
    function getMobileParticleCount(desktopCount) {
        return Math.ceil(desktopCount * mobileSettings.particleReduction);
    }

    // -----------------------------------------------------------------
    // RESIZE HANDLING
    // -----------------------------------------------------------------
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // -----------------------------------------------------------------
    // RELATIONSHIP COUNTER
    // -----------------------------------------------------------------
    function updateCounter() {
        const startDate = new Date('November 2, 2024 22:00:00');
        const now = new Date();

        if (now < startDate) {
            counterEl.innerHTML = "Gelecekte buluşacağız...";
            return;
        }

        // Calculate months
        let months = (now.getFullYear() - startDate.getFullYear()) * 12;
        months += now.getMonth() - startDate.getMonth();

        // Adjust if current day hasn't passed start day yet
        const tempDate = new Date(startDate);
        tempDate.setMonth(tempDate.getMonth() + months);
        if (tempDate > now) {
            months--;
            tempDate.setMonth(tempDate.getMonth() - 1);
        }

        // Remaining time after months
        const diff = now.getTime() - tempDate.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        counterEl.innerHTML = `
            <div class="time-unit"><span class="time-number">${months}</span><span class="time-label">Ay</span></div>
            <div class="time-unit"><span class="time-number">${days}</span><span class="time-label">Gün</span></div>
            <div class="time-unit"><span class="time-number">${hours}</span><span class="time-label">Saat</span></div>
            <div class="time-unit"><span class="time-number">${minutes}</span><span class="time-label">Dakika</span></div>
            <div class="time-unit"><span class="time-number">${seconds}</span><span class="time-label">Saniye</span></div>
        `;
    }
    setInterval(updateCounter, 1000);
    updateCounter();

    // -----------------------------------------------------------------
    // MUSIC CONTROL
    // -----------------------------------------------------------------
    if (musicControl) {
        musicControl.addEventListener('click', () => {
            if (isMusicPlaying) {
                bgMusic.pause();
                musicControl.classList.remove('playing');
                isMusicPlaying = false;
            } else {
                bgMusic.play();
                musicControl.classList.add('playing');
                isMusicPlaying = true;
            }
        });
    }

    // -----------------------------------------------------------------
    // PARTICLE CLASS
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // PRE-RENDERING (PERFORMANCE BOOST)
    // -----------------------------------------------------------------
    const particleSprites = [];
    function createParticleSprites() {
        const hues = [0, 355, 350, 5, 358]; // Deep reds

        hues.forEach(hue => {
            const size = 20;
            const pCanvas = document.createElement('canvas');
            pCanvas.width = size * 2;
            pCanvas.height = size * 2;
            const pCtx = pCanvas.getContext('2d');

            // Draw a mini heart shape
            const cx = size;
            const cy = size;
            const s = size * 0.85; // Scale to fit canvas

            pCtx.beginPath();
            pCtx.moveTo(cx, cy + s * 0.4); // Bottom tip
            // Left curve
            pCtx.bezierCurveTo(cx - s * 1.1, cy - s * 0.1, cx - s * 0.6, cy - s * 0.9, cx, cy - s * 0.4);
            // Right curve
            pCtx.bezierCurveTo(cx + s * 0.6, cy - s * 0.9, cx + s * 1.1, cy - s * 0.1, cx, cy + s * 0.4);
            pCtx.closePath();

            // Gradient fill for depth
            const gradient = pCtx.createRadialGradient(
                cx - s * 0.2, cy - s * 0.2, 0,
                cx, cy, s
            );
            gradient.addColorStop(0, '#ffcccc');
            gradient.addColorStop(0.25, `hsl(${hue}, 100%, 50%)`);
            gradient.addColorStop(0.7, `hsl(${hue}, 100%, 30%)`);
            gradient.addColorStop(1, '#330000');

            pCtx.fillStyle = gradient;
            pCtx.fill();

            particleSprites.push({ hue: hue, canvas: pCanvas });
        });
    }
    createParticleSprites();

    class Particle {
        constructor(type) {
            this.type = type;
            this.x = 0;
            this.y = 0;
            this.baseTargetX = 0;
            this.baseTargetY = 0;
            this.vx = 0;
            this.vy = 0;
            this.friction = 0.93;
            this.spring = 0.002;
            // Pre-assign a sprite based on random hue match
            this.spriteIndex = Math.floor(Math.random() * particleSprites.length);
            this.angle = Math.random() * Math.PI * 2; // For spiral rotation
            this.arrived = false; // Track if close to target

            this.size = 0;
            this.hue = 0;
            this.life = 1;

            if (type === 'heart_intro') {
                const angle = Math.random() * Math.PI * 2;
                const dist = (Math.max(width, height) * 0.8) + (Math.random() * width);
                this.x = width / 2 + Math.cos(angle) * dist;
                this.y = height / 2 + Math.sin(angle) * dist;

                const rand = Math.random();
                if (rand < 0.5) {
                    this.size = isMobile ? Math.random() * 3 + 2 : Math.random() * 4 + 3;
                } else if (rand < 0.85) {
                    this.size = isMobile ? Math.random() * 4 + 4 : Math.random() * 5 + 5;
                } else {
                    this.size = isMobile ? Math.random() * 5 + 6 : Math.random() * 6 + 8;
                }

            } else if (type === 'background_float') {
                this.x = Math.random() * width;
                this.y = height + Math.random() * 100;
                this.size = Math.random() * 6 + 2;
                this.vy = Math.random() * 0.5 + 0.2;
                this.vx = Math.random() * 0.4 - 0.2;
                this.hue = Math.random() * 30 + 330;

            } else if (type === 'rose_petal') {
                this.x = Math.random() * width;
                this.y = -Math.random() * height; // Start above screen
                this.size = Math.random() * 4 + 2;
                this.vy = Math.random() * 0.6 + 0.3; // Slow gentle fall
                this.vx = 0;
                this.angle = Math.random() * Math.PI * 2;
                this.spin = (Math.random() - 0.5) * 0.015; // Gentle tumble
                this.hue = Math.random() * 25 + 335; // Pink range
                this.opacity = Math.random() * 0.3 + 0.4; // 0.4 - 0.7
                this.swayOffset = Math.random() * Math.PI * 2; // unique phase
                this.swayAmplitude = Math.random() * 0.8 + 0.3; // unique sway strength

            } else if (type === 'love_envelope') {
                this.x = Math.random() * width;
                this.y = height + Math.random() * 100; // Start below
                this.size = isMobile ? 25 : 35; // Bigger touch target
                this.vy = Math.random() * 0.5 + 0.5; // Rise speed
                this.vx = Math.random() * 0.5 - 0.25;

            } else if (type === 'shooting_star') {
                // Start from random top/left edge
                this.x = Math.random() * width * 0.7;
                this.y = Math.random() * height * 0.3;
                this.size = Math.random() * 2 + 1.5;
                this.vx = Math.random() * 4 + 3;  // Fast diagonal
                this.vy = Math.random() * 2 + 1;
                this.life = 1;
                this.trail = []; // Store previous positions for trail
                this.maxTrailLength = 15;

            } else if (type === 'firework') {
                this.friction = 0.92;
                this.life = 1;
                this.size = Math.random() * 3 + 2;
                this.hue = Math.random() * 60 + 320;
            }
        }

        update(pulseScale) {
            if (state === 'INTRO') {
                const centerX = width / 2;
                const centerY = height / 2;
                const targetX = centerX + this.baseTargetX * pulseScale;
                const targetY = centerY + this.baseTargetY * pulseScale;
                const dx = targetX - this.x;
                const dy = targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Progressive spring: starts slow, gets stronger as particles approach
                const springForce = dist > 100 ? 0.002 : 0.006;

                // Add slight spiral/curve to the approach
                if (dist > 30 && !this.arrived) {
                    const perpX = -dy * 0.0008; // Perpendicular force for spiral
                    const perpY = dx * 0.0008;
                    this.vx += perpX;
                    this.vy += perpY;
                } else {
                    this.arrived = true;
                }

                this.vx += dx * springForce;
                this.vy += dy * springForce;
                this.vx *= this.friction;
                this.vy *= this.friction;
                this.x += this.vx;
                this.y += this.vy;

                // Gentle rotation while flying
                if (!this.arrived) {
                    this.angle += 0.02;
                }
            }
            else if (state === 'EXPLODING') {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.12; // Lighter gravity for floatier feel
                this.vx *= 0.995; // Slight air resistance
                this.vy *= 0.995;
                this.life -= 0.008; // Gradual fade
                this.angle += this.spinSpeed || 0; // Spin while flying
                this.size *= 0.998; // Slowly shrink
            }
            else if (state === 'MAIN') {
                if (this.type === 'background_float' || this.type === 'love_envelope') {
                    this.y -= this.vy;
                    this.x += this.vx;
                    this.x += Math.sin(this.y * 0.005) * 0.3; // Gentle sway

                    if (this.y < -50) {
                        this.y = height + 50;
                        this.x = Math.random() * width;
                    }
                } else if (this.type === 'rose_petal') {
                    this.y += this.vy;
                    // Organic sway using unique phase offset
                    this.x += Math.sin(time * 0.8 + this.swayOffset) * this.swayAmplitude;
                    this.angle += this.spin;
                    // Slight flutter in fall speed
                    this.vy += Math.sin(time * 2 + this.swayOffset) * 0.002;
                    this.vy = Math.max(0.2, Math.min(1.2, this.vy)); // Clamp speed

                    if (this.y > height + 50) {
                        this.y = -50;
                        this.x = Math.random() * width;
                    }
                } else if (this.type === 'shooting_star') {
                    // Store trail position
                    this.trail.push({ x: this.x, y: this.y });
                    if (this.trail.length > this.maxTrailLength) this.trail.shift();

                    this.x += this.vx;
                    this.y += this.vy;
                    this.life -= 0.012;

                    if (this.x > width + 50 || this.y > height + 50 || this.life <= 0) {
                        this.life = 0; // Mark for removal
                    }
                } else if (this.type === 'firework') {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += 0.15;
                    this.vx *= this.friction;
                    this.vy *= this.friction;
                    this.life -= 0.025;
                }
            }
        }

        draw() {
            if (this.size < 0.5 || this.life <= 0) return;

            // BACKGROUND FLOATERS
            if (this.type === 'background_float' && state === 'MAIN') {
                ctx.globalAlpha = 1;
                ctx.font = `${this.size * 2}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = `hsla(340, 80%, 60%, 0.4)`;
                ctx.fillText('❤️', this.x, this.y);
            }
            // LOVE ENVELOPES
            else if (this.type === 'love_envelope' && state === 'MAIN') {
                ctx.globalAlpha = 1;
                ctx.font = `${this.size}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Glow effect for interactivity hint
                ctx.shadowBlur = 15;
                ctx.shadowColor = "#ff4d6d";
                ctx.fillText('💌', this.x, this.y);
                ctx.shadowBlur = 0;
            }
            // ROSE PETALS (Teardrop shape)
            else if (this.type === 'rose_petal' && state === 'MAIN') {
                ctx.globalAlpha = this.opacity;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);

                // Teardrop/petal shape using bezier curves
                const s = this.size;
                ctx.beginPath();
                ctx.moveTo(0, -s);
                ctx.bezierCurveTo(s * 0.8, -s * 0.5, s * 0.6, s * 0.5, 0, s);
                ctx.bezierCurveTo(-s * 0.6, s * 0.5, -s * 0.8, -s * 0.5, 0, -s);
                ctx.closePath();

                // Gradient fill for depth
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
                grad.addColorStop(0, `hsla(${this.hue}, 70%, 70%, 1)`);
                grad.addColorStop(1, `hsla(${this.hue}, 80%, 45%, 0.6)`);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
            }
            // SHOOTING STARS
            else if (this.type === 'shooting_star' && state === 'MAIN') {
                // Draw trail
                if (this.trail.length > 1) {
                    for (let i = 1; i < this.trail.length; i++) {
                        const alpha = (i / this.trail.length) * this.life * 0.5;
                        const trailSize = this.size * (i / this.trail.length);
                        ctx.globalAlpha = alpha;
                        ctx.beginPath();
                        ctx.arc(this.trail[i].x, this.trail[i].y, trailSize, 0, Math.PI * 2);
                        ctx.fillStyle = '#ffffff';
                        ctx.fill();
                    }
                }
                // Draw star head (bright white with glow)
                ctx.globalAlpha = this.life;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffffcc';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }
            // FIREWORKS
            else if (this.type === 'firework') {
                ctx.globalAlpha = this.life;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            // INTRO PARTICLES - USE PRE-RENDERED SPIRTES
            else {
                ctx.globalAlpha = Math.max(0, this.life);
                const sprite = particleSprites[this.spriteIndex].canvas;
                // Draw image centered at x,y with scaled size
                const drawSize = Math.max(2, this.size * 2.5);
                // Apply rotation for flying/exploding hearts
                if (this.type === 'heart_intro' && (!this.arrived || state === 'EXPLODING')) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.angle);
                    ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
                    ctx.restore();
                } else {
                    ctx.drawImage(sprite, this.x - drawSize / 2, this.y - drawSize / 2, drawSize, drawSize);
                }
                ctx.globalAlpha = 1;
            }
        }
    }

    // -----------------------------------------------------------------
    // INIT LOGIC
    // -----------------------------------------------------------------
    function initIntro() {
        // High count for better visuals (balanced for mobile: 750 is sweet spot)
        const particleCount = isMobile ? 2500 : 2500;
        const scale = Math.min(width, height) / 50;

        particles = [];
        for (let i = 0; i < particleCount; i++) {
            const p = new Particle('heart_intro');
            let done = false;
            let attempts = 0;
            // Heart Equation Rejection Sampling
            while (!done && attempts < 100) {
                attempts++;
                let x = (Math.random() * 3 - 1.5);
                let y = (Math.random() * 3 - 1.5);
                const a = x * x + y * y - 1;
                if (a * a * a - x * x * y * y * y <= 0) {
                    p.baseTargetX = x * scale * 17;
                    p.baseTargetY = -y * scale * 17;
                    done = true;
                }
            }
            // Fallback used (center) if rejection loop fails
            if (!done) { p.baseTargetX = 0; p.baseTargetY = 0; }
            particles.push(p);
        }

        setTimeout(() => {
            introText.style.opacity = 1;
            introClickable = true;
        }, 1500);
    }

    // -----------------------------------------------------------------
    // ANIMATION LOOP
    // -----------------------------------------------------------------
    let time = 0;

    // Realistic heartbeat function (lub-dub pattern)
    function heartbeatPulse(t) {
        // Full cycle = ~1.2 seconds (72 BPM)
        const cycle = t % (Math.PI * 2);
        const normalized = cycle / (Math.PI * 2); // 0 to 1

        // "Lub" - first strong beat (0.0 - 0.15)
        if (normalized < 0.15) {
            const p = normalized / 0.15; // 0 to 1
            return Math.sin(p * Math.PI) * 0.12;
        }
        // Brief pause (0.15 - 0.25)
        else if (normalized < 0.25) {
            return 0;
        }
        // "Dub" - second softer beat (0.25 - 0.38)
        else if (normalized < 0.38) {
            const p = (normalized - 0.25) / 0.13;
            return Math.sin(p * Math.PI) * 0.07;
        }
        // Rest period (0.38 - 1.0)
        else {
            return 0;
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        time += 0.05;

        let pulseScale = 1;
        if (state === 'INTRO') {
            // Realistic heartbeat: ~75 BPM (slower, natural rhythm)
            pulseScale = 1 + heartbeatPulse(time * 0.5);
            // Sort small to large for depth effect (Enabled for all for quality)
            particles.sort((a, b) => a.size - b.size);

            // Sync "Kalbe Dokun" text with heartbeat
            const beatValue = heartbeatPulse(time * 0.5);
            const textScale = 1 + beatValue * 1.2; // Amplify for text
            const glowIntensity = 10 + beatValue * 80; // Glow on beat
            introText.style.transform = `scale(${textScale})`;
            introText.style.textShadow = `0 0 ${glowIntensity}px #ff4d6d`;
        }

        // Filter out dead fireworks and shooting stars
        if (state === 'MAIN') {
            particles = particles.filter(p => {
                if (p.type === 'firework' || p.type === 'shooting_star') return p.life > 0;
                return true;
            });

            // Randomly spawn shooting stars (roughly every 3-6 seconds)
            if (Math.random() < 0.005) {
                particles.push(new Particle('shooting_star'));
            }
        }

        particles.forEach(p => {
            p.update(pulseScale);
            p.draw();
        });

        if (state === 'EXPLODING') {
            // Remove fully faded particles
            particles = particles.filter(p => p.life > 0.01 && p.size > 0.3);
            if (particles.length < 50) {
                if (state !== 'MAIN_TRANSITIONING') {
                    state = 'MAIN_TRANSITIONING';
                    startMainSequence();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    // Start
    initIntro();
    animate();

    // -----------------------------------------------------------------
    // MAIN SEQUENCE TRANSITION
    // -----------------------------------------------------------------
    function startMainSequence() {
        particles = [];
        state = 'MAIN';

        // Background floaters (Hearts)
        const floaterCount = isMobile ? 20 : 50; // Reduced slightly to make room for petals
        for (let i = 0; i < floaterCount; i++) {
            particles.push(new Particle('background_float'));
        }

        // Falling Rose Petals
        const petalCount = isMobile ? 15 : 40;
        for (let i = 0; i < petalCount; i++) {
            particles.push(new Particle('rose_petal'));
        }

        // Clickable Love Envelopes
        const envelopeCount = isMobile ? 3 : 5; // Keep scarce to make them special
        for (let i = 0; i < envelopeCount; i++) {
            particles.push(new Particle('love_envelope'));
        }

        const introEl = document.getElementById('intro');
        if (introEl) introEl.style.display = 'none';

        mainContent.classList.remove('hidden');
        mainContent.classList.add('visible');

        const nameWrappers = document.querySelectorAll('.name-wrapper');
        nameWrappers.forEach(wrapper => {
            wrapper.innerHTML = wrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
        });

        const timeline = anime.timeline({ loop: false });

        timeline
            .add({
                targets: '.card-container',
                scale: [0.5, 1],
                opacity: [0, 1],
                duration: 1000,
                easing: 'easeOutExpo'
            })
            .add({
                targets: '.heart-svg',
                scale: [0, 1],
                opacity: [0, 1],
                easing: 'spring(1, 80, 10, 0)',
                duration: 1200
            }, '-=800')
            .add({
                targets: '.name-wrapper .letter',
                opacity: [0, 1],
                translateY: [20, 0],
                easing: "easeOutExpo",
                duration: 800,
                delay: (el, i) => 30 * i
            }, '-=1000')
            .add({
                targets: '.amp',
                opacity: [0, 1],
                zoom: [0.5, 1],
                duration: 600,
                easing: 'easeOutExpo'
            }, '-=600')
            .add({
                targets: '.counter-container',
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 800,
                easing: 'easeOutExpo'
            }, '-=400');

        setTimeout(typeWriter, 2000);
    }

    // -----------------------------------------------------------------
    // TYPEWRITER EFFECT
    // -----------------------------------------------------------------
    const message = "Sevgililer Günün Kutlu Olsun Aşkım ❤️";
    const messageEl = document.getElementById('message');
    document.getElementById('message').innerHTML = '';
    let index = 0;
    function typeWriter() {
        if (index < message.length) {
            messageEl.innerHTML += message.charAt(index);
            index++;
            setTimeout(typeWriter, 100);
        }
    }

    // -----------------------------------------------------------------
    // LOVE REASONS DATA
    // -----------------------------------------------------------------
    const loveReasons = [
        "Gülüşünle dünyamı aydınlatıyorsun.",
        "Bana her zaman huzur veriyorsun.",
        "Senin yanındayken zaman duruyor.",
        "En kötü günlerimi bile güzelleştiriyorsun.",
        "Beni olduğum gibi seviyorsun.",
        "Gözlerinin içinde kaybolmayı seviyorum.",
        "Kalbimin atma sebebisin.",
        "Seninle yaşlanma hayali bile çok güzel.",
        "Sesini duymak günümü güzelleştiriyor.",
        "Varlığın bana güç veriyor.",
        "Sen benim en iyi arkadaşımsın.",
        "Ellerini tuttuğumda evimde hissediyorum.",
        "Her sabah seni düşünerek uyanıyorum.",
        "Bana aşkın ne demek olduğunu öğrettin.",
        "Birlikte saçmalamayı seviyorum.",
        "Bana her zaman destek oluyorsun.",
        "Seninle her anımız bir macera.",
        "Kokun bana huzur veriyor.",
        "Bana baktığında kendimi özel hissediyorum.",
        "Seninle susmak bile çok güzel.",
        "Benim için yaptığın küçük sürprizleri seviyorum.",
        "Bana güveniyorsun ve ben de sana güveniyorum.",
        "Seninle gelecek hayalleri kurmayı seviyorum.",
        "Beni her zaman güldürmeyi başarıyorsun.",
        "Zor zamanlarımda hep yanımda oldun.",
        "Seninleyken kendimin en iyi versiyonu oluyorum.",
        "Bana kattığın güzellikler için minnettarım.",
        "Sadece varlığınla bile beni mutlu ediyorsun.",
        "Seninle her şey daha anlamlı.",
        "Gözlerin bana her şeyi anlatıyor.",
        "Seninle geçirdiğim her saniye çok kıymetli.",
        "Bana sarıldığında tüm dertlerim uçup gidiyor.",
        "Seninle aynı şarkıları söylemeyi seviyorum.",
        "Bana yemek yapmanı özlüyorum :)",
        "Seninle film izlemek bile bir başka keyifli.",
        "Bana öğrettiğin her şey için teşekkür ederim.",
        "Seninle tartışsak bile hemen barışmamızı seviyorum.",
        "Benim en büyük şansımsın.",
        "Seni her halinle seviyorum.",
        "Benim huzur limanımsın.",
        "Seninle yaşlanmak istiyorum.",
        "Her gün seni daha çok seviyorum.",
        "Bana ilham veriyorsun.",
        "Seninle her şey mümkün.",
        "Hayatıma girdiğin için şükrediyorum.",
        "Sen benim sonsuzumsun.",
        "Birlikte kurduğumuz hayallerin peşinden koşuyoruz.",
        "Seninle her yere gelirim.",
        "Bana aşkla bakışını seviyorum.",
        "Sen benim diğer yarımsın.",
        "İyi ki varsın sevgilim.",
        "Seni kelimelerin anlatamayacağı kadar çok seviyorum.",
        "Seninle her gün sevgililer günü.",
        "Benim biricik sevgilimsin."
    ];

    const modal = document.getElementById('love-modal');
    const noteText = document.getElementById('note-text');
    const closeBtn = document.getElementById('close-note');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // -----------------------------------------------------------------
    // INTRO INTERACTION
    // -----------------------------------------------------------------
    document.addEventListener('click', (e) => {
        if (state === 'INTRO' && introClickable) {
            introClickable = false;
            introText.style.opacity = 0;

            if (!isMusicPlaying) {
                bgMusic.volume = 0.5;
                bgMusic.play().then(() => {
                    isMusicPlaying = true;
                    if (musicControl) musicControl.classList.add('playing');
                }).catch(e => console.log("Audio prevented"));
            }

            state = 'EXPLODING';
            const centerX = width / 2;
            const centerY = height / 2;

            particles.forEach(p => {
                const dx = p.x - centerX;
                const dy = p.y - (centerY + 50);
                const angle = Math.atan2(dy, dx);
                const distFromCenter = Math.sqrt(dx * dx + dy * dy);

                // Varied force: outer particles fly faster
                const baseForce = Math.random() * 15 + 8;
                const distBonus = Math.min(distFromCenter * 0.02, 5);
                const force = baseForce + distBonus;

                // Add slight angle randomness for organic spread
                const angleVariance = (Math.random() - 0.5) * 0.5;

                p.vx = Math.cos(angle + angleVariance) * force;
                p.vy = Math.sin(angle + angleVariance) * force;
                p.friction = 0.98;
                p.spinSpeed = (Math.random() - 0.5) * 0.15; // Random spin
                p.life = 1; // Reset life for fadeout
            });
        }
    });

    // -----------------------------------------------------------------
    // MAIN INTERACTION (Fireworks & Envelopes)
    // -----------------------------------------------------------------

    // Helper function to get canvas-relative coordinates
    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        // Handle touch or mouse event
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // Unified interaction handler
    function handleInteraction(e) {
        if (state !== 'MAIN') return;
        if (gameActive) return; // Disable background interaction when game is on

        // Prevent background interaction if clicking on the main heart card
        if (e.target.closest('.heart-container')) return;

        const coords = getCanvasCoords(e);
        const clickX = coords.x;
        const clickY = coords.y;

        // Check for Love Envelope Clicks
        let clickedEnvelope = false;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            if (p.type === 'love_envelope') {
                const dx = clickX - p.x;
                const dy = clickY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Hitbox slightly larger than visual size
                if (dist < p.size * 2 + 20) {
                    const reason = loveReasons[Math.floor(Math.random() * loveReasons.length)];
                    noteText.textContent = reason;
                    modal.classList.add('active');

                    // Remove the clicked envelope
                    particles.splice(i, 1);
                    // Spawn a replacement immediately elsewhere
                    particles.push(new Particle('love_envelope'));

                    clickedEnvelope = true;
                    break;
                }
            }
        }

        if (clickedEnvelope) return; // Don't spawn firework if clicked envelope
        if (e.target.closest('.card-container') || e.target.closest('.music-control') || e.target.closest('.note-card')) return;

        const now = Date.now();
        if (now - lastFireworkTime > 100) {
            spawnFirework(clickX, clickY);
            lastFireworkTime = now;
        }
    }

    // Add both touch and click listeners
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction);

    function spawnFirework(x, y) {
        if (particles.length > 500 && isMobile) return;
        if (particles.length > 1000) return;

        const count = isMobile ? 8 : 15;
        for (let i = 0; i < count; i++) {
            const p = new Particle('firework');
            p.x = x;
            p.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            particles.push(p);
        }
    }

    // =================================================================
    // KALPLERI YAKALA MINI GAME - ENHANCED WITH CHIBI SPRITES
    // =================================================================
    const gameOverlay = document.getElementById('game-overlay');
    const bernaEl = document.getElementById('berna-char'); // DOM element for GIF
    const burakEl = document.getElementById('burak-char'); // DOM element for GIF
    const gameCanvas = document.getElementById('game-canvas');
    const gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null;
    const gameScoreEl = document.getElementById('game-score');
    const gameLivesEl = document.getElementById('game-lives');
    const gameWaveEl = document.getElementById('game-wave');
    const gameWaveNameEl = document.getElementById('game-wave-name');
    const gameComboEl = document.getElementById('game-combo');
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameOverTitle = document.getElementById('game-over-title');
    const finalScoreEl = document.getElementById('final-score');
    const finalWaveEl = document.getElementById('final-wave');
    const gameOverMsgEl = document.getElementById('game-over-msg');
    const gameCloseBtn = document.getElementById('game-close');
    const gameRestartBtn = document.getElementById('game-restart');
    const gameQuitBtn = document.getElementById('game-quit');
    const gameStatsBtn = document.getElementById('game-stats-btn');
    // statsModal and statsClose already declared at top
    const waveBanner = document.getElementById('game-wave-banner');
    const heartEasterEgg = document.getElementById('heart-easter-egg');

    // GIF images are handled by DOM elements bernaEl and burakEl

    let gameActive = false;
    let gameSessionId = 0; // NEW: Track unique game sessions to prevent overlapping loops
    let gameScore = 0;
    let gameLives = 5; // Increased from 3 to 5 for better balance
    let gameCombo = 1;
    let gameConsecutiveCatches = 0;
    let gameAnimFrame = null;
    let fallingHearts = [];
    let catchEffects = [];
    let gameStars = [];
    let gamePowerUps = [];
    let burakX = 0;
    let gameW = 0;
    let gameH = 0;
    let bernaX = 0;
    let bernaDir = 1;
    let gameTime = 0;
    let gameFrameCount = 0;
    let currentWave = 1;
    let waveScoreEarned = 0; // NEW: track points in current wave
    let waveTransitioning = false;
    let shieldActive = false;
    let shieldTimer = 0;
    let magnetActive = false;
    let magnetTimer = 0;
    let slowMoActive = false;
    let slowMoTimer = 0;
    let damageFlash = 0;
    let invulnerableTimer = 0; // NEW: Invulnerability timer
    let bernaAngryTimer = 0; // Berna anger timer for broken heart reaction

    // --- NEW: Love Blast State ---
    let loveBlastActive = false;
    let loveBlastTimer = 0;

    // --- NEW: Additional Power-up States ---
    let doublePointsActive = false;
    let doublePointsTimer = 0;
    let precisionActive = false;
    let precisionTimer = 0;
    let streakProtectActive = false;
    let streakProtectTimer = 0;

    // --- NEW: Background Theme State ---
    let currentBg1 = { r: 13, g: 0, b: 26 };
    let currentBg2 = { r: 26, g: 5, b: 32 };
    let targetBg1 = { r: 13, g: 0, b: 26 };
    let targetBg2 = { r: 26, g: 5, b: 32 };

    // --- NEW: Stats tracking ---
    let totalHeartsCaught = 0;
    let longestCombo = 0;
    let bossesDefeated = 0;
    let gamePaused = false;

    // --- NEW: Boss State Variables ---
    let bossActive = false;
    let bossHP = 0;
    let bossMaxHP = 3;
    let bossX = 0;
    let bossY = 0;
    let bossDir = 1;
    let bossHitFlash = 0;
    let bossPhase = 1; // NEW: Boss phase (1, 2, 3 based on HP)
    let bossIntroTimer = 0; // NEW: Boss entrance animation timer
    let bossDefeatedTimer = 0; // NEW: Boss death animation timer
    let bossWarningShown = false; // NEW: Warning before boss appears
    let bossClickCooldown = 0; // NEW: Prevent spam clicking (0.5s cooldown)
    let bossLastDamageTime = 0; // NEW: Track last damage time
    let bernaLastSpecialHeartTime = 0; // NEW: Cooldown for special heart spawning
    
    // --- NEW: Boss Controller Instance ---
    let bossController = null;
    if (typeof BossController !== 'undefined') {
        bossController = new BossController({
            gameW: 0, // Will be set when game starts
            gameH: 0
        });
    }
    
    // --- NEW: Achievement System Instance ---
    let achievementSystem = null;
    if (typeof AchievementSystem !== 'undefined') {
        achievementSystem = new AchievementSystem();
        console.log('Achievement System initialized');
    }

    // --- NEW: DOM refs ---
    const gamePauseBtn = document.getElementById('game-pause');
    const gamePausedScreen = document.getElementById('game-paused-screen');
    const gameTutorial = document.getElementById('game-tutorial');
    const gameHighscoreText = document.getElementById('game-highscore-text');
    const statHeartsEl = document.getElementById('stat-hearts');
    const statComboEl = document.getElementById('stat-combo');
    const statTimeEl = document.getElementById('stat-time');
    const statBossesEl = document.getElementById('stat-bosses');
    const statsGridEl = document.getElementById('game-stats-grid');

    if (gamePauseBtn) {
        gamePauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!gameActive) return;
            gamePaused = !gamePaused;
            if (gamePausedScreen) {
                gamePausedScreen.classList.toggle('active', gamePaused);
            }
            if (!gamePaused) {
                // Resume loop if it was stopped
                gameLoop(gameSessionId);
            }
            playSound('combo'); // Brief feedback sound
        });
    }

    // Pause screen buttons
    const pauseResumeBtn = document.getElementById('pause-resume');
    const pauseQuitBtn = document.getElementById('pause-quit');

    if (pauseResumeBtn) {
        pauseResumeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            gamePaused = false;
            if (gamePausedScreen) gamePausedScreen.classList.remove('active');
            gameLoop(gameSessionId);
            playSound('combo');
        });
    }

    if (pauseQuitBtn) {
        pauseQuitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            gamePaused = false;
            if (gamePausedScreen) gamePausedScreen.classList.remove('active');
            closeGame();
        });
    }

    // --- NEW: Sound System (Web Audio API) ---
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playSound(type) {
        // Check if SFX is enabled
        if (!settings.sfx) return;
        
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.15;

            if (type === 'catch') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
                osc.frequency.linearRampToValueAtTime(784, ctx.currentTime + 0.1); // G5
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'diamond') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(784, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(1047, ctx.currentTime + 0.1);
                osc.frequency.linearRampToValueAtTime(1319, ctx.currentTime + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'damage') {
                osc.type = 'sawtooth';
                gain.gain.value = 0.1;
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'levelup') {
                // Arpeggio: C-E-G-C
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'sine';
                    o.frequency.value = freq;
                    g.gain.value = 0.12;
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15 * (i + 1) + 0.15);
                    o.start(ctx.currentTime + 0.12 * i);
                    o.stop(ctx.currentTime + 0.12 * i + 0.2);
                });
                return;
            } else if (type === 'combo') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.12);
            } else if (type === 'boss') {
                osc.type = 'sawtooth';
                gain.gain.value = 0.08;
                osc.frequency.setValueAtTime(80, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.3);
                osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.5);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
            } else if (type === 'bosshit') {
                osc.type = 'square';
                gain.gain.value = 0.08;
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.05);
                osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'freeze') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2000, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.35);
            } else if (type === 'powerup') {
                // Rising arpeggio for power-up
                const notes = [440, 554, 659, 880];
                notes.forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    g.gain.value = 0.1;
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1 * (i + 1) + 0.1);
                    o.start(ctx.currentTime + 0.08 * i);
                    o.stop(ctx.currentTime + 0.08 * i + 0.15);
                });
                return;
            } else if (type === 'bossdefeat') {
                // Victory fanfare
                const melody = [523, 659, 784, 1047, 1319];
                melody.forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'sine';
                    o.frequency.value = freq;
                    g.gain.value = 0.15;
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15 * (i + 1) + 0.2);
                    o.start(ctx.currentTime + 0.12 * i);
                    o.stop(ctx.currentTime + 0.12 * i + 0.25);
                });
                return;
            } else if (type === 'achievement') {
                // Special achievement sound
                const notes = [659, 784, 1047, 1319, 1568];
                notes.forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'sine';
                    o.frequency.value = freq;
                    g.gain.value = 0.12;
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1 * (i + 1) + 0.15);
                    o.start(ctx.currentTime + 0.08 * i);
                    o.stop(ctx.currentTime + 0.08 * i + 0.2);
                });
                return;
            } else if (type === 'wavecomplete') {
                // Wave complete jingle
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    g.gain.value = 0.13;
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12 * (i + 1) + 0.18);
                    o.start(ctx.currentTime + 0.1 * i);
                    o.stop(ctx.currentTime + 0.1 * i + 0.22);
                });
                return;
            }
        } catch (e) { /* Audio not supported */ }
    }

    // --- Game Music System (Love-themed background music) ---
    let gameMusicNodes = null;
    let gameMusicPlaying = false;
    
    function startGameMusic() {
        // Check if music is enabled in settings
        if (!settings.music) return;
        if (gameMusicPlaying) return;
        
        try {
            const ctx = getAudioCtx();
            gameMusicPlaying = true;
            
            // Create a romantic, upbeat melody using Web Audio API
            // Chord progression: C - Am - F - G (I - vi - IV - V)
            const chordProgression = [
                [261.63, 329.63, 392.00], // C major (C-E-G)
                [220.00, 261.63, 329.63], // A minor (A-C-E)
                [174.61, 220.00, 261.63], // F major (F-A-C)
                [196.00, 246.94, 293.66]  // G major (G-B-D)
            ];
            
            const melodyNotes = [
                523.25, 587.33, 659.25, 587.33, // C5 D5 E5 D5
                523.25, 440.00, 493.88, 523.25, // C5 A4 B4 C5
                698.46, 659.25, 587.33, 523.25, // F5 E5 D5 C5
                587.33, 659.25, 587.33, 523.25  // D5 E5 D5 C5
            ];
            
            gameMusicNodes = {
                oscillators: [],
                gains: []
            };
            
            // Play chord progression (bass)
            function playChordLoop() {
                if (!gameMusicPlaying) return;
                
                chordProgression.forEach((chord, chordIndex) => {
                    chord.forEach((freq, noteIndex) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        
                        osc.type = 'sine';
                        osc.frequency.value = freq * 0.5; // Lower octave for bass
                        
                        const startTime = ctx.currentTime + (chordIndex * 2);
                        const duration = 1.8;
                        
                        gain.gain.setValueAtTime(0, startTime);
                        gain.gain.linearRampToValueAtTime(0.03, startTime + 0.1);
                        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                        
                        osc.start(startTime);
                        osc.stop(startTime + duration);
                    });
                });
                
                // Loop every 8 seconds (4 chords × 2 seconds each)
                setTimeout(playChordLoop, 8000);
            }
            
            // Play melody (lead)
            function playMelodyLoop() {
                if (!gameMusicPlaying) return;
                
                melodyNotes.forEach((freq, index) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    
                    const startTime = ctx.currentTime + (index * 0.5);
                    const duration = 0.4;
                    
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.08, startTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                    
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                });
                
                // Loop every 8 seconds (16 notes × 0.5 seconds each)
                setTimeout(playMelodyLoop, 8000);
            }
            
            // Add heartbeat rhythm (kick drum)
            function playHeartbeatLoop() {
                if (!gameMusicPlaying) return;
                
                for (let i = 0; i < 8; i++) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.value = 60;
                    
                    const startTime = ctx.currentTime + (i * 1);
                    const duration = 0.15;
                    
                    gain.gain.setValueAtTime(0.15, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                    
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                }
                
                setTimeout(playHeartbeatLoop, 8000);
            }
            
            // Start all music layers
            playChordLoop();
            playMelodyLoop();
            playHeartbeatLoop();
            
        } catch (e) {
            console.log("Game music error:", e);
        }
    }
    
    function stopGameMusic() {
        gameMusicPlaying = false;
        
        if (gameMusicNodes) {
            // Clean up any remaining nodes
            gameMusicNodes.oscillators.forEach(osc => {
                try { osc.stop(); } catch (e) {}
            });
            gameMusicNodes = null;
        }
    }

    // --- NEW: Color Translation Helpers ---
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function lerp(a, b, u) {
        return a + (b - a) * u;
    }

    function updateBackgroundTheme(dt) {
        if (!gameOverlay) return;

        // Smoothly interpolate current colors towards targets
        const speed = 0.5 * dt; // Adjust transition speed
        currentBg1.r = lerp(currentBg1.r, targetBg1.r, speed);
        currentBg1.g = lerp(currentBg1.g, targetBg1.g, speed);
        currentBg1.b = lerp(currentBg1.b, targetBg1.b, speed);

        currentBg2.r = lerp(currentBg2.r, targetBg2.r, speed);
        currentBg2.g = lerp(currentBg2.g, targetBg2.g, speed);
        currentBg2.b = lerp(currentBg2.b, targetBg2.b, speed);

        // Apply to CSS variables
        const rgb1 = `rgb(${Math.round(currentBg1.r)}, ${Math.round(currentBg1.g)}, ${Math.round(currentBg1.b)})`;
        const rgb2 = `rgb(${Math.round(currentBg2.r)}, ${Math.round(currentBg2.g)}, ${Math.round(currentBg2.b)})`;
        gameOverlay.style.setProperty('--bg-1', rgb1);
        gameOverlay.style.setProperty('--bg-2', rgb2);
    }

    const BURAK_SPRITE_SIZE = 120;
    const BERNA_SPRITE_SIZE = 100;
    const BURAK_CATCH_W = 100;

    // ---- WAVE SYSTEM (Relationship stages) - EXPANDED WITH UNIQUE BOSSES ----
    const WAVES = [
        {
            name: "Şüphe Bulutu ☁️",
            scoreTarget: 400, // Reduced from 500
            spawnRate: 0.025,
            speedMul: 1.0,
            brokenWeight: 5,
            boss: {
                emoji: '☁️',
                color: '#94a3b8',
                ability: 'doubt_cloud',
                name: 'Şüphe Bulutu',
                specialHeart: { emoji: '☂️', name: 'Şemsiye', damage: 1 },
                attacks: ['rain'],
                description: 'Yağmur damlaları seni yavaşlatır',
                dialogue: [
                    { character: '☁️', name: 'Şüphe Bulutu', text: 'Gerçekten beni seviyor mu acaba?' },
                    { character: '🎮', name: 'Burak', text: 'Şüpheler sadece bulut, gerçek aşk güneş gibi!' }
                ]
            },
            desc: "Şüphe bulutları yaklaşıyor...",
            colors: ['#0d001a', '#1a2e3a'],
            effect: 'rain'
        },
        {
            name: "Öfke Alevi 🔥",
            scoreTarget: 600, // Reduced from 800
            spawnRate: 0.03,
            speedMul: 1.1, // Reduced from 1.15
            brokenWeight: 10,
            boss: {
                emoji: '🔥',
                color: '#dc2626',
                ability: 'rage_flame',
                name: 'Öfke Alevi',
                specialHeart: { emoji: '💧', name: 'Su Balonu', damage: 1 },
                attacks: ['lava_bomb'],
                description: 'Lav bombaları hareket alanını daraltır'
            },
            desc: "Öfke alevleri yükseliyor!",
            colors: ['#1a2e3a', '#2d0000'],
            effect: 'fire'
        },
        {
            name: "Soğuk Mesafe ❄️",
            scoreTarget: 900, // Reduced from 1200
            spawnRate: 0.035,
            speedMul: 1.2, // Reduced from 1.25
            brokenWeight: 15,
            boss: {
                emoji: '❄️',
                color: '#06b6d4',
                ability: 'cold_distance',
                name: 'Soğuk Mesafe',
                specialHeart: { emoji: '☕', name: 'Sıcak Çay', damage: 1 },
                attacks: ['freeze'],
                description: 'Donma yeteneği seni hareketsiz bırakır'
            },
            desc: "Soğuk mesafe donduruyor...",
            colors: ['#2d0000', '#001a33'],
            effect: 'ice'
        },
        {
            name: "Fırtınalı Gün 🌪️",
            scoreTarget: 1100, // Reduced from 1500
            spawnRate: 0.04,
            speedMul: 1.3, // Reduced from 1.4
            brokenWeight: 20,
            boss: {
                emoji: '🌪️',
                color: '#94a3b8',
                ability: 'windy_day',
                name: 'Fırtınalı Gün',
                specialHeart: { emoji: '⚡', name: 'Kinetik Enerji', damage: 1 },
                attacks: ['wind'],
                description: 'Şiddetli rüzgar fizik kurallarını değiştirir'
            },
            desc: "Fırtına yaklaşıyor!",
            colors: ['#001a33', '#1a2e3a'],
            effect: 'storm'
        },
        {
            name: "Kıskançlık Aynası 🪞",
            scoreTarget: 1400, // Reduced from 2000
            spawnRate: 0.045,
            speedMul: 1.4, // Reduced from 1.5
            brokenWeight: 22, // Reduced from 25
            boss: {
                emoji: '🪞',
                color: '#7c3aed',
                ability: 'jealousy_mirror',
                name: 'Kıskançlık Aynası',
                specialHeart: { emoji: '👓', name: 'Gerçeklik Gözlüğü', damage: 1 },
                attacks: ['invert'],
                description: 'Kontroller tersine döner'
            },
            desc: "Ayna seni aldatıyor...",
            colors: ['#1a2e3a', '#1a0033'],
            effect: 'mirror'
        },
        {
            name: "Unutkanlık Sisi 🌫️",
            scoreTarget: 1700, // Reduced from 2500
            spawnRate: 0.05,
            speedMul: 1.5, // Reduced from 1.6
            brokenWeight: 25, // Reduced from 30
            boss: {
                emoji: '🌫️',
                color: '#64748b',
                ability: 'fog_forgetting',
                name: 'Unutkanlık Sisi',
                specialHeart: { emoji: '🔦', name: 'Fener', damage: 1 },
                attacks: ['fog'],
                description: 'Sis görüş alanını kısıtlar'
            },
            desc: "Sis her şeyi gizliyor...",
            colors: ['#1a0033', '#2d2d3a'],
            effect: 'fog'
        },
        {
            name: "Ego Duvarı 🧱",
            scoreTarget: 2000, // Reduced from 3000
            spawnRate: 0.055,
            speedMul: 1.6, // Reduced from 1.7
            brokenWeight: 28, // Reduced from 35
            boss: {
                emoji: '🧱',
                color: '#78716c',
                ability: 'ego_wall',
                name: 'Ego Duvarı',
                specialHeart: { emoji: '🔨', name: 'Çekiç', damage: 1 },
                attacks: ['block'],
                description: 'Duvar kalpleri engeller'
            },
            desc: "Ego duvarı yükseliyor...",
            colors: ['#2d2d3a', '#1a1a1a'],
            effect: 'wall'
        },
        {
            name: "Dedikodu Yılanı 🐍",
            scoreTarget: 2400, // Reduced from 3500
            spawnRate: 0.06,
            speedMul: 1.65, // Reduced from 1.8
            brokenWeight: 30, // Reduced from 40
            boss: {
                emoji: '🐍',
                color: '#7c3aed',
                ability: 'gossip_snake',
                name: 'Dedikodu Yılanı',
                specialHeart: { emoji: '🎧', name: 'Kulaklık', damage: 1 },
                attacks: ['poison'],
                description: 'Zehir sürekli hareket etmeyi zorlar'
            },
            desc: "Zehirli dedikodular yayılıyor...",
            colors: ['#1a1a1a', '#2d0066'],
            effect: 'poison'
        },
        {
            name: "Teknoloji Canavarı 👾",
            scoreTarget: 2800, // Reduced from 4000
            spawnRate: 0.065,
            speedMul: 1.7, // Reduced from 1.9
            brokenWeight: 32, // Reduced from 45
            boss: {
                emoji: '👾',
                color: '#22c55e',
                ability: 'glitch',
                name: 'Teknoloji Canavarı',
                specialHeart: { emoji: '🔄', name: 'Reset Tuşu', damage: 2 },
                attacks: ['lag'],
                description: 'Lag simülasyonu kontrolleri geciktirir'
            },
            desc: "Sistem bozuluyor...",
            colors: ['#2d0066', '#001a00'],
            effect: 'glitch'
        },
        {
            name: "Zaman Hırsızı ⏰",
            scoreTarget: 3200, // Reduced from 4500
            spawnRate: 0.07,
            speedMul: 1.75, // Reduced from 2.0
            brokenWeight: 33, // Reduced from 50
            boss: {
                emoji: '⏰',
                color: '#fbbf24',
                ability: 'time_thief',
                name: 'Zaman Hırsızı',
                specialHeart: { emoji: '🔋', name: 'Saat Pili', damage: 2 },
                attacks: ['time_warp'],
                description: 'Zaman manipülasyonu ritmi bozar'
            },
            desc: "Zaman çarpılıyor...",
            colors: ['#001a00', '#1a1a00'],
            effect: 'time'
        },
        {
            name: "Sıradanlık Devşiricisi 🌑",
            scoreTarget: 3600, // Reduced from 5000
            spawnRate: 0.075,
            speedMul: 1.8, // Reduced from 2.1
            brokenWeight: 34, // Reduced from 55
            boss: {
                emoji: '🌑',
                color: '#64748b',
                ability: 'routine',
                name: 'Sıradanlık Devşiricisi',
                specialHeart: { emoji: '🌈', name: 'Gökkuşağı Boyası', damage: 2 },
                attacks: ['grayscale'],
                description: 'Renkleri çalar, kalpleri ayırt edemezsin'
            },
            desc: "Her şey gri oluyor...",
            colors: ['#1a1a00', '#1a1a1a'],
            effect: 'grayscale'
        },
        {
            name: "Kara Sevda 💔",
            scoreTarget: 4000, // Changed from Infinity to 4000
            spawnRate: 0.08,
            speedMul: 1.8, // Reduced from 2.2
            brokenWeight: 35, // Reduced from 60
            boss: {
                emoji: '💔',
                color: '#000000',
                ability: 'dark_reflection',
                name: 'Kara Sevda',
                specialHeart: { emoji: '💖', name: 'Sonsuz Aşk', damage: 2 },
                attacks: ['ultimate'],
                description: 'Tüm yetenekleri birleştirir - FINAL BOSS'
            },
            desc: "Final savaş başlıyor!",
            colors: ['#1a1a1a', '#000000'],
            effect: 'darkness'
        },
        {
            name: "Buluşmalar ☕", 
            scoreTarget: 1200, 
            spawnRate: 0.035, 
            speedMul: 1.25, 
            brokenWeight: 10,
            boss: { 
                emoji: '🥰', 
                color: '#ff69b4', 
                ability: 'dreamy',
                name: 'Rüya Gibi',
                specialHeart: { emoji: '�', name: 'Pembe Bulut', damage: 1 },
                attacks: ['wave', 'float'],
                description: 'Her an yeni bir anı'
            },
            desc: "Her an yeni bir anı.",
            colors: ['#2d0a3e', '#4a0e2a'],
            effect: 'aurora'
        },
        {
            name: "Derin Bağ 🔗", 
            scoreTarget: 1500, 
            spawnRate: 0.04, 
            speedMul: 1.4, 
            brokenWeight: 15,
            boss: { 
                emoji: '😌', 
                color: '#94a3b8', 
                ability: 'calm',
                name: 'Huzurlu Ruh',
                specialHeart: { emoji: '🤍', name: 'Beyaz Güvercin', damage: 1 },
                attacks: ['wind', 'spiral'],
                description: 'Aşkınız güçleniyor'
            },
            desc: "Aşkınız güçleniyor.",
            colors: ['#4a0e2a', '#1a0b1c'],
            effect: 'wind'
        },
        {
            name: "İlk Kavga 💢", 
            scoreTarget: 2000, 
            spawnRate: 0.05, 
            speedMul: 1.6, 
            brokenWeight: 25,
            boss: { 
                emoji: '😠', 
                color: '#dc2626', 
                ability: 'angry',
                name: 'Öfke Fırtınası',
                specialHeart: { emoji: '💥', name: 'Patlama Kalbi', damage: 1 },
                attacks: ['burst', 'rage', 'lightning'],
                description: 'Zorluklar sizi yıldırmasın'
            },
            desc: "Zorluklar sizi yıldırmasın!",
            colors: ['#1a0b1c', '#2d0000'],
            effect: 'storm'
        },
        {
            name: "Barışma 🕊️", 
            scoreTarget: 2500, 
            spawnRate: 0.045, 
            speedMul: 1.4, 
            brokenWeight: 10,
            boss: { 
                emoji: '😇', 
                color: '#fbbf24', 
                ability: 'healing',
                name: 'Affedici Melek',
                specialHeart: { emoji: '✨', name: 'Işık Kalbi', damage: 1 },
                attacks: ['heal', 'bless', 'shield'],
                description: 'Her şey yolunda'
            },
            desc: "Her şey yolunda.",
            colors: ['#2d0000', '#1a2e05'],
            effect: 'holy'
        },
        {
            name: "Kıskançlık 👁️", 
            scoreTarget: 3000, 
            spawnRate: 0.055, 
            speedMul: 1.7, 
            brokenWeight: 20,
            boss: { 
                emoji: '😈', 
                color: '#7c3aed', 
                ability: 'jealous',
                name: 'Karanlık Gölge',
                specialHeart: { emoji: '🖤', name: 'Karanlık Kalp', damage: 1 },
                attacks: ['mirage', 'clone', 'curse'],
                description: 'Birbirinize güvenin'
            },
            desc: "Birbirinize güvenin.",
            colors: ['#1a2e05', '#1a0033'],
            effect: 'dark'
        },
        {
            name: "Güven Krizi 🌑", 
            scoreTarget: 3500, 
            spawnRate: 0.06, 
            speedMul: 1.8, 
            brokenWeight: 30,
            boss: { 
                emoji: '👿', 
                color: '#991b1b', 
                ability: 'demon',
                name: 'İçimizdeki Şeytan',
                specialHeart: { emoji: '🔥', name: 'Cehennem Ateşi', damage: 2 },
                attacks: ['hellfire', 'teleport', 'chaos'],
                description: 'En karanlık an'
            },
            desc: "En karanlık an...",
            colors: ['#1a0033', '#330000'],
            effect: 'inferno'
        },
        {
            name: "Yeniden Doğuş 🌅", 
            scoreTarget: 4000, 
            spawnRate: 0.05, 
            speedMul: 1.5, 
            brokenWeight: 15,
            boss: { 
                emoji: '🦋', 
                color: '#06b6d4', 
                ability: 'rebirth',
                name: 'Yeniden Doğan Aşk',
                specialHeart: { emoji: '🌟', name: 'Yıldız Tozu', damage: 1 },
                attacks: ['transform', 'butterfly', 'hope'],
                description: 'Yeniden başlangıç'
            },
            desc: "Yeniden başlangıç.",
            colors: ['#330000', '#001a33'],
            effect: 'rebirth'
        },
        {
            name: "Evlilik Teklifi 💍", 
            scoreTarget: 5000, 
            spawnRate: 0.055, 
            speedMul: 1.6, 
            brokenWeight: 10,
            boss: { 
                emoji: '💎', 
                color: '#38bdf8', 
                ability: 'diamond',
                name: 'Elmas Kalp',
                specialHeart: { emoji: '💍', name: 'Yüzük', damage: 1 },
                attacks: ['sparkle', 'dazzle', 'shine'],
                description: 'En özel an'
            },
            desc: "En özel an!",
            colors: ['#001a33', '#0d1a2d'],
            effect: 'diamond'
        },
        {
            name: "Düğün 👰", 
            scoreTarget: 6000, 
            spawnRate: 0.06, 
            speedMul: 1.7, 
            brokenWeight: 5,
            boss: { 
                emoji: '🤵', 
                color: '#ffffff', 
                ability: 'wedding',
                name: 'Mutlu Son',
                specialHeart: { emoji: '🎊', name: 'Kutlama', damage: 1 },
                attacks: ['celebration', 'confetti', 'joy'],
                description: 'Evet diyorum!'
            },
            desc: "Evet diyorum!",
            colors: ['#0d1a2d', '#1a1a2e'],
            effect: 'celebration'
        },
        {
            name: "Sonsuzluk ♾️", 
            scoreTarget: Infinity, 
            spawnRate: 0.065, 
            speedMul: 1.9, 
            brokenWeight: 30,
            boss: { 
                emoji: '♾️', 
                color: '#a855f7', 
                ability: 'eternal',
                name: 'Sonsuz Aşk',
                specialHeart: { emoji: '♾️', name: 'Sonsuzluk', damage: 2 },
                attacks: ['infinity', 'timeless', 'eternal', 'cosmic'],
                description: 'Aşk sonsuza kadar'
            },
            desc: "Aşk sonsuza kadar!",
            colors: ['#1a1a2e', '#0d001a'],
            effect: 'cosmos'
        },
    ];

    // Heart types (Accept lives to implement smart spawning)
    function getHeartTypes(wave, currentLives) {
        const brokenW = WAVES[Math.min(wave - 1, WAVES.length - 1)].brokenWeight;

        // Smart Spawning for Life Heart: more likely if low health
        let lifeWeight = 2;
        if (currentLives <= 1) lifeWeight = 10;
        else if (currentLives <= 2) lifeWeight = 6;
        else if (currentLives <= 3) lifeWeight = 4;

        return [
            { emoji: '❤️', points: 10, size: 28, speed: 2.5, weight: 50 },
            { emoji: '💖', points: 25, size: 32, speed: 2.0, weight: 20 },
            { emoji: '💎', points: 50, size: 26, speed: 3.5, weight: 10, isDiamond: true }, // Slightly buffed
            { emoji: '💔', points: -1, size: 28, speed: 3.0, weight: brokenW, isBroken: true },
            // Special hearts (Slightly increased weights for better late-game presence)
            { emoji: '🥇', points: 100, size: 30, speed: 4.0, weight: 5, isGold: true },
            { emoji: '🧊', points: 15, size: 28, speed: 2.8, weight: 6, isIce: true },
            { emoji: '💗', points: 20, size: 56, speed: 1.8, weight: 6, isGiant: true },
            { emoji: '🏩', points: 0, size: 28, speed: 2.2, weight: lifeWeight, isLife: true },
        ];
    }

    // Power-up types - EXPANDED
    const POWERUP_TYPES = [
        { emoji: '🛡️', type: 'shield', size: 35, speed: 1.5, duration: 8, desc: 'Kalkan' },
        { emoji: '🧲', type: 'magnet', size: 35, speed: 1.5, duration: 8, desc: 'Mıknatıs' },
        { emoji: '⏳', type: 'slowmo', size: 35, speed: 1.5, duration: 6, desc: 'Yavaşlatma' },
        { emoji: '🌈', type: 'rainbow', size: 35, speed: 1.8, duration: 8, desc: 'Aşk Patlaması' },
        { emoji: '⚡', type: 'lightning', size: 35, speed: 1.8, duration: 0, desc: 'Şimşek' }, // Instant effect
        { emoji: '💫', type: 'double', size: 35, speed: 1.5, duration: 10, desc: 'Çift Puan' },
        { emoji: '🎯', type: 'precision', size: 35, speed: 1.5, duration: 8, desc: 'Otomatik Hedefleme' },
        { emoji: '🔥', type: 'streak', size: 35, speed: 1.5, duration: 12, desc: 'Kombo Koruyucu' },
    ];

    const GAME_OVER_MESSAGES = [
        "Aşkınız puanlardan büyük! 💖",
        "Her düşüş yeni bir başlangıçtır! 🌹",
        "Her kalp sizin için atıyor! 💗",
        "Berna & Burak, sonsuza dek! ♾️",
        "Sevginiz yıldızlardan parlak! ✨",
        "Birlikte her şey daha güzel! 💑",
        "Aşk asla pes etmez! 💪",
        "Zorluklar sizi güçlendirdi! 🌈"
    ];

    // ---- EASTER EGG: Triple-click heart ----
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');
    const countdownText = document.getElementById('countdown-text');

    // Restore missing variables
    let easterEggClicks = 0;
    let easterEggTimer = null;

    // Countdown Logic
    /* function startCountdown(callback) { */
    // Floating Text Helper
    function showFloatingText(x, y, text, color = '#ff4d6d', size = '2rem') {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.position = 'fixed';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.color = color;
        el.style.fontSize = size;
        el.style.fontWeight = 'bold';
        el.style.fontFamily = "'Montserrat', sans-serif";
        el.style.textShadow = '0 0 10px rgba(0,0,0,0.5)';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '9999';
        el.style.opacity = '0';
        el.style.transition = 'all 1s ease-out';

        document.body.appendChild(el);

        // Animate
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.top = (y - 50) + 'px';
            el.style.transform = 'translate(-50%, -50%) scale(1.5)';
        });

        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 500);
        }, 800);
    }
    /*
    function startCountdown_OLD(callback) {
        if (!countdownOverlay || !countdownNumber) {
            callback();
            return;
        }

        countdownOverlay.classList.add('active');
        countdownText.textContent = "Hazır Mısın?";
        countdownText.classList.add('visible');

        // Sequence: 3 -> 2 -> 1 -> GO

        let count = 3;

        function runStep() {
            if (count > 0) {
                countdownNumber.textContent = count;
                countdownNumber.classList.remove('animate');
                void countdownNumber.offsetWidth; // Trigger reflow
                countdownNumber.classList.add('animate');
                count--;
                setTimeout(runStep, 1000);
            } else {
                // GO!
                countdownNumber.textContent = "💖";
                countdownNumber.classList.remove('animate');
                void countdownNumber.offsetWidth;
                countdownNumber.classList.add('animate');
                countdownText.textContent = "Oyun Başlıyor!";

                setTimeout(() => {
                    countdownOverlay.classList.remove('active');
                    countdownText.classList.remove('visible');
                    callback();
                }, 1000);
            }
        }

        runStep();
    } */

    if (heartEasterEgg) {
        heartEasterEgg.addEventListener('click', (e) => {
            if (state !== 'MAIN') return;
            e.stopPropagation();

            easterEggClicks++;

            // Reset if too slow (2 seconds tolerance between clicks)
            if (easterEggTimer) clearTimeout(easterEggTimer);
            easterEggTimer = setTimeout(() => {
                easterEggClicks = 0;
            }, 2000);

            const rect = heartEasterEgg.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top;

            if (easterEggClicks === 1) {
                showFloatingText(x, y - 20, "3", "#fff");
                heartEasterEgg.style.transform = 'scale(1.2)';
                setTimeout(() => heartEasterEgg.style.transform = '', 200);
            } else if (easterEggClicks === 2) {
                showFloatingText(x, y - 20, "2", "#fff");
                heartEasterEgg.style.transform = 'scale(1.3)';
                setTimeout(() => heartEasterEgg.style.transform = '', 200);
            } else if (easterEggClicks === 3) {
                showFloatingText(x, y - 20, "1", "#fff");
                heartEasterEgg.style.transform = 'scale(1.4)';
                setTimeout(() => heartEasterEgg.style.transform = '', 200);
            } else if (easterEggClicks >= 4) {
                clearTimeout(easterEggTimer);
                easterEggClicks = 0;

                showFloatingText(x, y - 40, "Oyun Başlıyor! 💖", "#ff4d6d", isMobile ? "1rem" : "1.2rem");

                // Flash the heart before opening game
                heartEasterEgg.style.transition = 'transform 0.3s';
                heartEasterEgg.style.transform = 'scale(1.5) rotate(15deg)';
                setTimeout(() => {
                    heartEasterEgg.style.transform = '';
                    // Show game overlay with main menu
                    if (gameOverlay) {
                        gameOverlay.classList.remove('hidden');
                        gameOverlay.classList.add('active');
                    }
                    if (mainMenu) {
                        mainMenu.classList.remove('hidden');
                    }
                }, 800);
            }
        });
    }

    function resizeGameCanvas() {
        if (!gameCanvas) return;
        const rect = gameCanvas.parentElement.getBoundingClientRect();
        const hudHeight = document.querySelector('.game-hud')?.offsetHeight || 60;
        gameW = Math.min(rect.width, 600);
        gameH = rect.height - hudHeight - 20;
        gameCanvas.width = gameW;
        gameCanvas.height = gameH;
    }

    // ----------------------------
    // Background Stars
    // ----------------------------
    function initGameStars() {
        gameStars = [];
        for (let i = 0; i < 60; i++) {
            gameStars.push({
                x: Math.random() * gameW,
                y: Math.random() * gameH,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 0.03 + 0.01
            });
        }
    }

    function drawGameStars() {
        if (!gameCtx) return;
        gameStars.forEach(s => {
            const alpha = s.alpha + Math.sin(gameTime * s.twinkleSpeed * 60) * 0.2;
            gameCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
            gameCtx.fillStyle = '#ffffff';
            gameCtx.beginPath();
            gameCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            gameCtx.fill();
        });
        gameCtx.globalAlpha = 1;
    }

    // ----------------------------
    // Catch Effect
    // ----------------------------
    function addCatchEffect(x, y, points, isGood) {
        const particleCount = isGood ? 12 : 6;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            catchEffects.push({
                x: x, y: y,
                vx: Math.cos(angle) * (2 + Math.random() * 4),
                vy: Math.sin(angle) * (2 + Math.random() * 4),
                life: 1,
                color: isGood ? `hsl(${340 + Math.random() * 30}, 100%, 65%)` : '#ff4444',
                size: Math.random() * 3 + 2,
                sparkle: isGood
            });
        }

        // Sparkle Ring Burst
        if (isGood) {
            catchEffects.push({
                x: x, y: y, vx: 0, vy: 0, life: 1,
                isRing: true,
                color: '#ffffff',
                size: 20
            });
        }

        // Score popup
        let text = '';
        if (typeof points === 'string') text = points;
        else text = (points > 0 ? '+' : '') + points;

        catchEffects.push({
            x: x, y: y - 15, vx: 0, vy: -2.5, life: 1,
            text: text, isText: true,
            color: isGood ? '#ff6b88' : '#ff4444',
            size: isGood ? 20 : 18
        });
    }

    // ----------------------------
    // Wave Management
    // ----------------------------
    function getCurrentWaveConfig() {
        return WAVES[Math.min(currentWave - 1, WAVES.length - 1)];
    }

    function showWaveBanner(text, subtitle) {
        if (!waveBanner) return;
        waveTransitioning = true;
        waveBanner.innerHTML = text + (subtitle ? '<br><span style="font-size:0.5em;font-family:Montserrat;opacity:0.7">' + subtitle + '</span>' : '');
        waveBanner.classList.add('active');
        if (gameWaveNameEl) gameWaveNameEl.textContent = text;

        // Trigger background color change to target wave's theme
        updateWaveColors();

        setTimeout(() => {
            waveBanner.classList.remove('active');
            setTimeout(() => { waveTransitioning = false; }, 500);
        }, 2500);
    }

    // ----------------------------
    // Boss Dialogue System
    // ----------------------------
    function showBossDialogue(dialogues) {
        const dialogueEl = document.getElementById('boss-dialogue');
        const characterEl = document.getElementById('dialogue-character');
        const nameEl = document.getElementById('dialogue-name');
        const textEl = document.getElementById('dialogue-text');
        
        if (!dialogueEl || !dialogues || dialogues.length === 0) return;
        
        let currentIndex = 0;
        
        function showNext() {
            if (currentIndex >= dialogues.length) {
                // Hide dialogue after last message
                setTimeout(() => {
                    dialogueEl.classList.add('hidden');
                }, 2500);
                return;
            }
            
            const dialogue = dialogues[currentIndex];
            characterEl.textContent = dialogue.character;
            nameEl.textContent = dialogue.name;
            textEl.textContent = dialogue.text;
            
            dialogueEl.classList.remove('hidden');
            
            currentIndex++;
            setTimeout(showNext, 3000); // Show each dialogue for 3 seconds
        }
        
        // Start showing dialogues after boss intro
        setTimeout(showNext, 2500);
    }

    function checkWaveProgress() {
        const config = getCurrentWaveConfig();
        // Boss warning at 80% progress
        if (waveScoreEarned >= config.scoreTarget * 0.8 && !bossWarningShown && !bossActive) {
            bossWarningShown = true;
            showBossWarning();
        }
        
        // Spawn boss when target reached
        if (waveScoreEarned >= config.scoreTarget && !bossActive && !waveTransitioning) {
            spawnBoss();
        }
    }

    function showBossWarning() {
        // Visual warning that boss is coming
        addCatchEffect(gameW / 2, gameH / 2 - 100, '⚠️ BOSS YAKLAŠIYOR! ⚠️', true);
        playSound('boss');
        
        // Screen flash
        damageFlash = 0.3;
        
        // Shake effect
        if (gameOverlay) {
            gameOverlay.classList.add('shake');
            setTimeout(() => gameOverlay.classList.remove('shake'), 600);
        }
    }

    function spawnBoss() {
        bossActive = true;
        const bossConfig = WAVES[currentWave - 1]?.boss || { emoji: '💔', color: '#ff4444' };
        
        // Boss HP scales with wave (more balanced)
        bossMaxHP = 3 + Math.floor(currentWave / 3); // Changed from /2 to /3
        bossHP = bossMaxHP;
        
        // Boss starts above screen
        bossX = gameW / 2;
        bossY = -100;
        bossDir = 1;
        bossHitFlash = 0;
        bossPhase = 1;
        bossIntroTimer = 2.0; // 2 second intro animation
        bossDefeatedTimer = 0;
        
        // Boss entrance announcement
        const bossName = bossConfig.name || 'Boss';
        showWaveBanner(`💀 ${bossConfig.emoji} ${bossName} ${bossConfig.emoji} 💀`);
        playSound('boss');
        
        // Show boss dialogue if available
        if (bossConfig.dialogue) {
            showBossDialogue(bossConfig.dialogue);
        }
        
        // Clear all hearts for dramatic effect
        fallingHearts = [];
        
        // Screen effects
        damageFlash = 0.5;
        
        // Tutorial hints for boss mechanics (show after intro)
        setTimeout(() => {
            if (bossActive) {
                const specialHeart = bossConfig.specialHeart || { emoji: '⭐', name: 'Özel Kalp' };
                addCatchEffect(gameW / 2, gameH / 2 - 50, `${specialHeart.emoji} ${specialHeart.name} yakala!`, true);
                setTimeout(() => {
                    if (bossActive) {
                        addCatchEffect(gameW / 2, gameH / 2, '↑ Kaydır = Yansıt!', true);
                    }
                }, 1500);
            }
        }, 2500);
    }

    function updateBossPhase() {
        const hpPercent = bossHP / bossMaxHP;
        if (hpPercent > 0.66) {
            bossPhase = 1; // Healthy
        } else if (hpPercent > 0.33) {
            bossPhase = 2; // Wounded
        } else {
            bossPhase = 3; // Critical
        }
    }

    function damageBoss(amount = 1, source = 'collision') {
        if (!bossActive || bossIntroTimer > 0 || bossDefeatedTimer > 0) return;
        
        // Cooldown check - prevent spam (0.3 second cooldown for all sources)
        const now = Date.now();
        if (now - bossLastDamageTime < 300) {
            // Show cooldown message only for click
            if (source === 'click') {
                addCatchEffect(bossX, bossY, '⏱️ Bekle!', false);
            }
            return;
        }
        bossLastDamageTime = now;
        
        bossHP -= amount;
        bossHitFlash = 8;
        updateBossPhase();
        
        // Haptic feedback
        HapticFeedback.bossDamage();
        
        const renderBossY = bossY + Math.sin(gameTime * 2) * 20;
        
        // Visual feedback based on source
        if (source === 'click') {
            addCatchEffect(bossX, renderBossY, '👊 -' + amount, true);
        } else if (source === 'weakness') {
            addCatchEffect(bossX, renderBossY, '⭐ -' + amount, true);
        } else if (source === 'projectile') {
            addCatchEffect(bossX, renderBossY, '⚡ -' + amount, true);
        } else {
            addCatchEffect(bossX, renderBossY, '💥 -' + amount, true);
        }
        
        playSound('bosshit');
        
        // Particle burst
        const particleCount = bossPhase === 3 ? 20 : 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const force = 3 + Math.random() * 5;
            catchEffects.push({
                x: bossX,
                y: renderBossY,
                vx: Math.cos(angle) * force,
                vy: Math.sin(angle) * force,
                life: 0.8,
                color: bossPhase === 3 ? '#ff0000' : ['#ff4444', '#ff8800', '#ffff00'][Math.floor(Math.random() * 3)],
                size: 4
            });
        }
        
        // Screen shake intensity based on phase
        if (gameOverlay) {
            gameOverlay.classList.add('shake');
            setTimeout(() => gameOverlay.classList.remove('shake'), 300);
        }
        
        // Knockback - push boss back up
        bossY -= 80 + (bossPhase * 20); // More knockback in later phases
        if (bossY < 80) bossY = 80;
        
        // Clear broken hearts on hit
        fallingHearts = fallingHearts.filter(h => !h.type.isBroken);
        
        // Check if boss defeated
        if (bossHP <= 0) {
            defeatBoss();
        }
    }

    function defeatBoss() {
        bossDefeatedTimer = 3.0; // 3 second death animation
        bossesDefeated++;
        gameScore += 500 + (currentWave * 100); // Bonus increases with wave
        if (gameScoreEl) gameScoreEl.textContent = gameScore;
        
        // Reset Final Boss mechanics
        window.finalBossJumpEnabled = false;
        window.playerJumpVelocity = 0;
        window.playerY = 0;
        window.playerOnGround = false;
        
        // Achievement tracking
        if (achievementSystem) {
            achievementSystem.incrementStat('totalBossesDefeated');
            achievementSystem.updateStat('highestWave', currentWave);
            achievementSystem.updateStat('bossesDefeated', bossesDefeated);
            
            // Check if defeated with 1 HP
            if (gameLives === 1) {
                achievementSystem.updateStat('bossDefeatedWith1HP', true);
            }
            
            // Check for perfect wave (no damage)
            if (achievementSystem.stats.currentWaveDamage === 0) {
                achievementSystem.incrementStat('perfectWaves');
            }
            
            // Reset wave damage counter
            achievementSystem.stats.currentWaveDamage = 0;
            
            // Check wave 3 speed
            if (currentWave === 3 && achievementSystem.stats.gameStartTime) {
                const elapsed = (Date.now() - achievementSystem.stats.gameStartTime) / 1000;
                achievementSystem.updateStat('fastestWave3', elapsed);
            }
        }
        
        // Haptic feedback for victory
        HapticFeedback.bossDefeat();
        
        // Victory announcement
        addCatchEffect(gameW / 2, gameH / 2, '🎉 BOSS YENİLDİ! 🎉', true);
        playSound('bossdefeat'); // Victory fanfare
        
        // Optimized particle explosion (reduced for performance)
        const particleCount = getMobileParticleCount(80); // 80 on desktop, 40 on mobile
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const force = 4 + Math.random() * 12;
            const renderBossY = bossY + Math.sin(gameTime * 2) * 20;
            catchEffects.push({
                x: bossX,
                y: renderBossY,
                vx: Math.cos(angle) * force,
                vy: Math.sin(angle) * force,
                life: 1.5 + Math.random() * 0.5,
                color: ['#ffd700', '#ff69b4', '#00ffff', '#ff4444', '#00ff00'][Math.floor(Math.random() * 5)],
                size: 3 + Math.random() * 4
            });
        }
        
        // Screen flash
        damageFlash = 1.0;
        
        // Clear all hearts
        fallingHearts = [];
    }

    function updateWaveColors() {
        const config = getCurrentWaveConfig();
        if (config && config.colors) {
            targetBg1 = hexToRgb(config.colors[0]);
            targetBg2 = hexToRgb(config.colors[1]);
        }
    }

    // ----------------------------
    // Damage & Lives
    // ----------------------------
    function takeDamage() {
        console.log("takeDamage called, current lives:", gameLives);
        if (shieldActive) {
            shieldActive = false;
            shieldTimer = 0;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '🛡️ Kırıldı!', false);
            return;
        }

        if (invulnerableTimer > 0) return; // Ignore damage if invulnerable

        gameLives--;
        damageFlash = 1;
        invulnerableTimer = 2.0; // 2 seconds invulnerability
        updateLivesDisplay();
        playSound('damage');

        // Enhanced screen shake
        if (gameOverlay) {
            gameOverlay.classList.add('shake');
            setTimeout(() => gameOverlay.classList.remove('shake'), 400);
        }
        // Sad character reaction
        if (burakEl) {
            burakEl.style.filter = 'drop-shadow(0 15px 10px rgba(255,0,0,0.5)) saturate(0.5)';
            burakEl.style.transform = `translate3d(${burakX - 55}px, -10px, 0) rotate(-10deg)`;
            setTimeout(() => {
                if (gameActive) burakEl.style.filter = '';
            }, 600);
        }

        if (gameLives <= 0) {
            endGame();
        }
    }

    function updateLivesDisplay() {
        if (!gameLivesEl) return;
        let hearts = '';
        for (let i = 0; i < 5; i++) {
            hearts += i < gameLives ? '❤️' : '🖤';
        }
        gameLivesEl.textContent = hearts;
    }

    // ----------------------------
    // Power-up activation - EXPANDED
    // ----------------------------
    function activatePowerUp(type) {
        HapticFeedback.powerup(); // Haptic feedback for all power-ups
        
        // Achievement tracking
        if (achievementSystem) {
            achievementSystem.updateStat('powerUpsUsed', type);
        }
        
        if (type === 'shield') {
            shieldActive = true;
            shieldTimer = 8;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '🛡️ Kalkan!', true);
            playSound('combo');
        } else if (type === 'magnet') {
            magnetActive = true;
            magnetTimer = 8;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '🧲 Mıknatıs!', true);
            playSound('combo');
        } else if (type === 'slowmo') {
            slowMoActive = true;
            slowMoTimer = 6;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '⏳ Yavaşla!', true);
            playSound('freeze');
        } else if (type === 'rainbow') {
            loveBlastActive = true;
            loveBlastTimer = 8;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '🌈 LOVE BLAST!', true);
            playSound('levelup');

            // Instantly transmute all existing broken hearts on screen
            fallingHearts.forEach(h => {
                if (h.type.isBroken) {
                    h.type = { emoji: '❤️', points: 10, size: 28, speed: 2.5, weight: 50 };
                    addCatchEffect(h.x, h.y, '✨', true);
                }
            });
        } else if (type === 'lightning') {
            // ⚡ LIGHTNING - Instant effect: Collect all hearts on screen!
            addCatchEffect(gameW / 2, gameH / 2, '⚡ ŞİMŞEK!', true);
            playSound('levelup');
            
            // Collect all non-broken hearts
            let collected = 0;
            for (let i = fallingHearts.length - 1; i >= 0; i--) {
                const h = fallingHearts[i];
                if (!h.type.isBroken) {
                    const earned = h.type.points * gameCombo;
                    gameScore += earned;
                    waveScoreEarned += earned;
                    totalHeartsCaught++;
                    collected++;
                    
                    // Lightning bolt effect from heart to Burak
                    for (let j = 0; j < 3; j++) {
                        catchEffects.push({
                            x: h.x,
                            y: h.y,
                            vx: (burakX - h.x) / 10 + (Math.random() - 0.5) * 2,
                            vy: (gameH - BURAK_SPRITE_SIZE / 2 - h.y) / 10 + (Math.random() - 0.5) * 2,
                            life: 0.6,
                            color: '#ffeb3b',
                            size: 3,
                            sparkle: true
                        });
                    }
                    
                    fallingHearts.splice(i, 1);
                }
            }
            
            if (collected > 0) {
                addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, `+${collected} ❤️`, true);
                if (gameScoreEl) gameScoreEl.textContent = gameScore;
                checkWaveProgress();
            }
            
            // Screen flash
            damageFlash = 0.8;
            
        } else if (type === 'double') {
            // 💫 DOUBLE POINTS
            doublePointsActive = true;
            doublePointsTimer = 10;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '💫 ÇİFT PUAN!', true);
            playSound('levelup');
            
        } else if (type === 'precision') {
            // 🎯 PRECISION - Auto-aim hearts towards Burak
            precisionActive = true;
            precisionTimer = 8;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '🎯 Otomatik Hedef!', true);
            playSound('combo');
            
        } else if (type === 'streak') {
            // 🔥 STREAK PROTECTOR - Prevents combo loss
            streakProtectActive = true;
            streakProtectTimer = 12;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '🔥 Kombo Koruması!', true);
            playSound('combo');
        }
    }

    // ----------------------------
    // Game Loop
    // ----------------------------

    function gameLoop(sessionId) {
        if (!gameActive || !gameCtx || gamePaused || sessionId !== gameSessionId) {
            // Silently terminate old game loops without spamming console
            return;
        }
        gameAnimFrame = requestAnimationFrame(() => gameLoop(sessionId));

        const dt = slowMoActive ? 0.008 : 0.016;
        gameTime += dt;
        gameFrameCount++;

        const config = getCurrentWaveConfig();
        const speedMul = config.speedMul * (slowMoActive ? 0.4 : 1);
        const effect = config.effect || 'none';
        const centerX = gameW / 2;
        const centerY = gameH / 2;

        // Background Transition Update
        updateBackgroundTheme(dt);

        gameCtx.setTransform(1, 0, 0, 1, 0, 0); // RESET TRANSFORM
        gameCtx.clearRect(0, 0, gameW, gameH);

        // Damage flash overlay
        if (damageFlash > 0) {
            damageFlash -= 0.03;
            gameCtx.fillStyle = `rgba(255, 255, 255, ${damageFlash})`; // Flash white for diamond/boss hit
            gameCtx.fillRect(0, 0, gameW, gameH);
        }

        drawGameStars();

        // Background Effects Render
        gameCtx.globalAlpha = 1;

        // Define burakTop early for use in boss abilities
        let burakTop = gameH - BURAK_SPRITE_SIZE / 2;

        // ============================================
        // FINAL BOSS PHASE 3: PLATFORM CLIMBING
        // ============================================
        if (bossActive && bossPhase === 3 && window.finalBossJumpEnabled) {
            const gravity = 0.8;
            const jumpPower = -15;
            
            // Apply gravity
            window.playerJumpVelocity += gravity;
            window.playerY += window.playerJumpVelocity;
            
            // Check platform collision
            const platform = bossController.checkPlatformCollision(burakX, window.playerY, window.playerJumpVelocity);
            if (platform) {
                window.playerY = platform.y - 20;
                window.playerJumpVelocity = 0;
                window.playerOnGround = true;
            }
            
            // Ground collision
            if (window.playerY >= gameH - 100) {
                window.playerY = gameH - 100;
                window.playerJumpVelocity = 0;
                window.playerOnGround = true;
            }
            
            // Jump input (tap/click anywhere)
            if (window.playerOnGround && (window.jumpPressed || window.tapJump)) {
                window.playerJumpVelocity = jumpPower;
                window.playerOnGround = false;
                window.jumpPressed = false;
                window.tapJump = false;
                playSound('catch');
            }
            
            // Check if player reached boss
            const distToBoss = Math.sqrt(Math.pow(burakX - bossX, 2) + Math.pow(window.playerY - bossY, 2));
            if (distToBoss < 80) {
                // Trigger final beam attack
                if (!bossController.finalBeamActive) {
                    bossController.activateFinalBeam();
                    addCatchEffect(gameW / 2, gameH / 2, '💖 SONSUZ AŞK IŞINI!', true);
                }
            }
            
            // Update burakTop for phase 3
            burakTop = window.playerY;
        }

        // ============================================
        // BOSS LOGIC - COMPLETELY REWRITTEN
        // ============================================
        if (bossActive) {
            const bossConfig = WAVES[currentWave - 1]?.boss || { emoji: '💔', color: '#ff4444' };
            const ability = bossConfig.ability;
            
            // Boss Intro Animation
            if (bossIntroTimer > 0) {
                bossIntroTimer -= dt;
                
                // Boss descends from above
                const introProgress = 1 - (bossIntroTimer / 2.0);
                // Adjust boss descent based on screen height (landscape mode fix)
                const bossDescentTarget = gameH < 500 ? 120 : 180; // Less descent in landscape
                bossY = -100 + (bossDescentTarget * easeOutBounce(introProgress));
                
                // Pulsing entrance effect
                const pulseScale = 1 + Math.sin(introProgress * Math.PI * 4) * 0.2;
                
                gameCtx.save();
                gameCtx.translate(bossX, bossY);
                gameCtx.scale(pulseScale, pulseScale);
                
                // Dramatic glow
                gameCtx.shadowBlur = 40;
                gameCtx.shadowColor = bossConfig.color;
                
                gameCtx.font = '85px serif';
                gameCtx.textAlign = 'center';
                gameCtx.textBaseline = 'middle';
                gameCtx.fillStyle = '#000000';
                gameCtx.fillText(bossConfig.emoji, 0, 0);
                
                gameCtx.restore();
                
                // Entrance particles
                if (gameFrameCount % 3 === 0) {
                    for (let i = 0; i < 3; i++) {
                        catchEffects.push({
                            x: bossX + (Math.random() - 0.5) * 100,
                            y: bossY + (Math.random() - 0.5) * 100,
                            vx: (Math.random() - 0.5) * 2,
                            vy: Math.random() * 2 + 1,
                            life: 1,
                            color: bossConfig.color,
                            size: 3
                        });
                    }
                }
                
                // Don't process boss logic during intro
                gameCtx.restore();
            }
            // Boss Death Animation
            else if (bossDefeatedTimer > 0) {
                bossDefeatedTimer -= dt;
                
                const deathProgress = 1 - (bossDefeatedTimer / 3.0);
                
                // Boss explodes and fades
                const scale = 1 + (deathProgress * 2);
                const alpha = 1 - deathProgress;
                const rotation = deathProgress * Math.PI * 4;
                
                gameCtx.save();
                gameCtx.translate(bossX, bossY);
                gameCtx.rotate(rotation);
                gameCtx.scale(scale, scale);
                gameCtx.globalAlpha = alpha;
                
                gameCtx.shadowBlur = 50 * (1 - deathProgress);
                gameCtx.shadowColor = bossConfig.color;
                
                gameCtx.font = '85px serif';
                gameCtx.textAlign = 'center';
                gameCtx.textBaseline = 'middle';
                gameCtx.fillStyle = '#000000';
                gameCtx.fillText(bossConfig.emoji, 0, 0);
                
                gameCtx.restore();
                
                // Continuous particle explosion
                if (gameFrameCount % 2 === 0) {
                    for (let i = 0; i < 5; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const force = 5 + Math.random() * 10;
                        catchEffects.push({
                            x: bossX,
                            y: bossY,
                            vx: Math.cos(angle) * force,
                            vy: Math.sin(angle) * force,
                            life: 1.5,
                            color: ['#ffd700', '#ff69b4', '#00ffff', '#ff4444', '#00ff00'][Math.floor(Math.random() * 5)],
                            size: 3 + Math.random() * 3
                        });
                    }
                }
                
                // When animation ends, advance wave
                if (bossDefeatedTimer <= 0) {
                    bossActive = false;
                    bossWarningShown = false;
                    
                    // Reset boss controller effects
                    if (bossController) {
                        bossController.reset();
                    }
                    
                    if (currentWave < WAVES.length) {
                        currentWave++;
                        waveScoreEarned = 0;
                        if (gameWaveEl) gameWaveEl.textContent = currentWave;
                        const newConfig = getCurrentWaveConfig();
                        showWaveBanner(newConfig.name, newConfig.desc);
                        updateWaveColors();
                        
                        if (bgMusic) {
                            bgMusic.playbackRate = Math.min(1.35, 1.0 + (currentWave - 1) * 0.05);
                        }
                    }
                    
                    // Drop reward
                    fallingHearts.push({
                        x: bossX,
                        y: bossY,
                        vy: 3,
                        vx: 0,
                        type: { emoji: '🥇', points: 100, size: 40, isGold: true },
                        rotation: 0,
                        rotSpeed: 0.05
                    });
                }
            }
            // Active Boss Fight
            else {
                gameCtx.save();
                
                // Screen shake on hit
                if (bossHitFlash > 0) {
                    gameCtx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
                    bossHitFlash--;
                }
                
                // Boss Movement Pattern
                const baseSpeed = 1.5 + (currentWave * 0.3);
                bossX += bossDir * baseSpeed;
                
                // Phase-based movement changes
                if (bossPhase === 3) {
                    // Critical phase: erratic movement
                    bossX += Math.sin(gameTime * 8) * 3;
                } else if (bossPhase === 2) {
                    // Wounded phase: faster
                    bossX += bossDir * 0.5;
                }
                
                // Bounce at edges
                if (bossX > gameW - 60) bossDir = -1;
                if (bossX < 60) bossDir = 1;
                
                // Boss slowly descends (threatening approach)
                const descentSpeed = 0.15 + (bossPhase * 0.05); // Faster descent in later phases
                // Slower descent in landscape mode to give player more space
                bossY += gameH < 500 ? descentSpeed * 0.6 : descentSpeed;
                
                // Knockback when hit (handled in damageBoss)
                // Stay within bounds - adjusted for landscape mode
                const minBossY = gameH < 500 ? 60 : 80;
                const maxBossY = gameH < 500 ? gameH * 0.5 : gameH * 0.7; // Much higher limit in landscape
                if (bossY < minBossY) bossY = minBossY;
                if (bossY > maxBossY) bossY = maxBossY; // Don't go too low
                
                // Vertical bobbing
                const renderBossY = bossY + Math.sin(gameTime * 2) * 20;
                
                // Draw Boss with phase-based effects
                gameCtx.save();
                gameCtx.translate(bossX, renderBossY);
                
                // Phase-based visual effects
                if (bossPhase === 3) {
                    // Critical: red pulsing
                    gameCtx.shadowBlur = 40 + Math.sin(gameTime * 10) * 20;
                    gameCtx.shadowColor = '#ff0000';
                } else if (bossPhase === 2) {
                    // Wounded: orange glow
                    gameCtx.shadowBlur = 30;
                    gameCtx.shadowColor = '#ff8800';
                } else {
                    // Healthy: normal glow
                    gameCtx.shadowBlur = 25;
                    gameCtx.shadowColor = bossConfig.color;
                }
                
                // Boss size scales with phase (gets smaller when damaged)
                const phaseScale = 1 - ((3 - bossPhase) * 0.1);
                gameCtx.scale(phaseScale, phaseScale);
                
                gameCtx.font = '85px serif';
                gameCtx.textAlign = 'center';
                gameCtx.textBaseline = 'middle';
                gameCtx.fillStyle = '#000000';
                gameCtx.fillText(bossConfig.emoji, 0, 0);
                
                gameCtx.restore();
                
                // Boss Collision Detection - REMOVED
                // Boss can only be damaged by special mechanics (reflect hearts, catch special hearts)
                
                // Boss Attack Patterns (Phase-based) - UNIQUE PER BOSS
                let attackChance = 0.007 + (currentWave * 0.001);
                if (bossPhase === 3) attackChance *= 2.5; // Critical phase attacks more
                else if (bossPhase === 2) attackChance *= 1.5;
                
                // Boss Special Heart Spawning - NOW HANDLED BY BERNA
                // Berna throws special hearts during boss fight
                // (See Berna heart spawning section above)
                
                // UNIQUE BOSS ABILITIES - Each boss has different attack patterns
                if (ability === 'doubt_cloud') {
                    // Boss 1: Doubt Cloud - Rain and Slow Debuff
                    // Enable slow debuff (only once per boss fight)
                    if (!bossController.activeEffects.has('doubt_cloud')) {
                        bossController.enableDoubtCloud();
                    }
                    bossController.updateRainEffect(fallingHearts, bossX, renderBossY);
                    
                    // Also spawn some broken hearts
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 80,
                            y: renderBossY + 40,
                            vy: 2.0,
                            vx: (Math.random() - 0.5) * 1,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.0, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.1
                        });
                    }
                    
                } else if (ability === 'rage_flame') {
                    // Boss 2: Rage Flame - Lava Bombs and Area Denial
                    // Enable rage flame (only once per boss fight)
                    if (!bossController.activeEffects.has('rage_flame')) {
                        bossController.enableRageFlame();
                    }
                    bossController.updateLavaBombs(dt, fallingHearts, bossX, renderBossY, gameW, gameH);
                    
                    // Also spawn broken hearts
                    attackChance *= 1.5;
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 100,
                            y: renderBossY + 40,
                            vy: 3.0 + Math.random(),
                            vx: (Math.random() - 0.5) * 2,
                            type: { emoji: '💔', points: -1, size: 28, speed: 3.0, isBroken: true },
                            rotation: Math.random() * Math.PI * 2,
                            rotSpeed: 0.15
                        });
                    }
                    
                } else if (ability === 'cold_distance') {
                    // Boss 3: Cold Distance - Freeze Stun
                    // Enable freeze (only once per boss fight)
                    if (!bossController.activeEffects.has('cold_distance')) {
                        bossController.enableColdDistance();
                    }
                    bossController.updateFreezeEffect(dt);
                    
                    // Random freeze attacks (RARE - mobile friendly)
                    if (Math.random() < 0.005) { // 0.5% chance per frame (reduced from 1%)
                        bossController.freezePlayer(2.0); // 2 seconds freeze
                        addCatchEffect(bossX, renderBossY, '❄️ DONMA!', true);
                        playSound('freeze');
                    }
                    
                    // Also spawn broken hearts
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 80,
                            y: renderBossY + 40,
                            vy: 2.5,
                            vx: (Math.random() - 0.5) * 1.5,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.5, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.1
                        });
                    }
                    
                } else if (ability === 'windy_day') {
                    // Boss 4: Windy Day - Strong Wind Physics
                    // Enable wind (only once per boss fight)
                    if (!bossController.activeEffects.has('windy_day')) {
                        bossController.enableWindyDay();
                    }
                    bossController.applyWindPhysics(fallingHearts, gameTime);
                    
                    // Also spawn broken hearts with wind effect
                    attackChance *= 1.3;
                    if (Math.random() < attackChance) {
                        const windStrength = Math.sin(gameTime * 2) * 3;
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 100,
                            y: renderBossY + 40,
                            vy: 2.8,
                            vx: windStrength + (Math.random() - 0.5) * 2,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.8, isBroken: true },
                            rotation: Math.random() * Math.PI * 2,
                            rotSpeed: 0.12
                        });
                    }
                    
                } else if (ability === 'jealousy_mirror') {
                    // Boss 5: Jealousy Mirror - Inverted Controls
                    if (!bossController.activeEffects.has('jealousy_mirror')) {
                        bossController.enableJealousyMirror();
                        addCatchEffect(gameW / 2, gameH / 2, '🪞 KONTROLLER TERSİNE DÖNDÜ!', true);
                    }
                    
                    // Spawn broken hearts
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 80,
                            y: renderBossY + 40,
                            vy: 2.5,
                            vx: (Math.random() - 0.5) * 1.5,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.5, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.1
                        });
                    }
                    
                } else if (ability === 'fog_forgetting') {
                    // Boss 6: Fog of Forgetting - Spotlight Vision
                    if (!bossController.activeEffects.has('fog_forgetting')) {
                        bossController.enableFogForgetting();
                        addCatchEffect(gameW / 2, gameH / 2, '🌫️ SİS GELDİ!', true);
                    }
                    
                    // Spawn broken hearts (harder to see)
                    attackChance *= 1.4;
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 120,
                            y: renderBossY + 40,
                            vy: 3.0,
                            vx: (Math.random() - 0.5) * 2,
                            type: { emoji: '💔', points: -1, size: 28, speed: 3.0, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.12
                        });
                    }
                    
                } else if (ability === 'ego_wall') {
                    // Boss 7: Ego Wall - Physical Block
                    if (!bossController.activeEffects.has('ego_wall')) {
                        bossController.enableEgoWall();
                        addCatchEffect(gameW / 2, gameH / 2, '🧱 DUVAR OLUŞTU!', true);
                    }
                    
                    // Spawn broken hearts (blocked by wall)
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 80,
                            y: renderBossY + 40,
                            vy: 2.3,
                            vx: (Math.random() - 0.5) * 1,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.3, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.1
                        });
                    }
                    
                } else if (ability === 'gossip_snake') {
                    // Boss 8: Gossip Snake - Poison DOT
                    if (!bossController.activeEffects.has('gossip_snake')) {
                        bossController.enableGossipSnake();
                    }
                    
                    // Update poison zones and check damage
                    const inPoison = bossController.updatePoisonZones(dt, burakX, burakTop, gameH);
                    if (inPoison && Math.random() < 0.02) { // 2% chance per frame when in poison
                        takeDamage();
                        addCatchEffect(burakX, burakTop, '☠️ ZEHİR!', false);
                    }
                    
                    // Spawn broken hearts more frequently
                    attackChance *= 1.5;
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 100,
                            y: renderBossY + 40,
                            vy: 2.8,
                            vx: (Math.random() - 0.5) * 2,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.8, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.12
                        });
                    }
                    
                } else if (ability === 'glitch') {
                    // Boss 9: Glitch - Input Lag
                    if (!bossController.activeEffects.has('glitch')) {
                        bossController.enableGlitch();
                        addCatchEffect(gameW / 2, gameH / 2, '⚠️ GLITCH!', true);
                    }
                    
                    // Spawn broken hearts
                    attackChance *= 1.5;
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 100,
                            y: renderBossY + 40,
                            vy: 3.2,
                            vx: (Math.random() - 0.5) * 2.5,
                            type: { emoji: '💔', points: -1, size: 28, speed: 3.2, isBroken: true },
                            rotation: Math.random() * Math.PI * 2,
                            rotSpeed: 0.15
                        });
                    }
                    
                } else if (ability === 'time_thief') {
                    // Boss 10: Time Thief - Bullet Time
                    if (!bossController.activeEffects.has('time_thief')) {
                        bossController.enableTimeThief();
                    }
                    bossController.updateTimeScale(gameTime);
                    
                    // Time scale is applied to NEW hearts only (not existing ones)
                    // Existing hearts maintain their speed to prevent exponential acceleration
                    
                    // Spawn broken hearts with time-scaled speed
                    const timeScale = bossController.getTimeScale();
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 80,
                            y: renderBossY + 40,
                            vy: 2.4 * timeScale,
                            vx: (Math.random() - 0.5) * 1.5,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.4, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.1
                        });
                    }
                    
                } else if (ability === 'routine') {
                    // Boss 11: Routine - Grayscale Mode
                    if (!bossController.activeEffects.has('routine')) {
                        bossController.enableRoutine();
                        addCatchEffect(gameW / 2, gameH / 2, '⬜ RENKLER KAYBOLDU!', true);
                    }
                    
                    // Spawn broken hearts (hard to distinguish)
                    attackChance *= 1.3;
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 90,
                            y: renderBossY + 40,
                            vy: 2.7,
                            vx: (Math.random() - 0.5) * 1.8,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.7, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.11
                        });
                    }
                    
                } else if (ability === 'dark_reflection') {
                    // Boss 12: Dark Reflection - Multi-phase Final Boss
                    if (!bossController.activeEffects.has('dark_reflection')) {
                        bossController.enableDarkReflection();
                        bossController.initFinalBossPlatforms(gameW, gameH);
                        addCatchEffect(gameW / 2, gameH / 2, '💀 FİNAL BOSS!', true);
                    }
                    
                    // Phase 1: Wind (like Boss 4)
                    if (bossPhase === 1) {
                        bossController.applyWindPhysics(fallingHearts, gameTime);
                    }
                    // Phase 2: Fog (like Boss 6)
                    else if (bossPhase === 2) {
                        if (!bossController.fogActive) {
                            bossController.enableFogForgetting();
                        }
                    }
                    // Phase 3: Ultimate - Berna trapped, platform climbing
                    else if (bossPhase === 3) {
                        bernaOpacity = 0.3; // Berna trapped in crystal
                        bossController.bernaTrapped = true;
                        
                        // Enable jump controls for phase 3
                        if (!window.finalBossJumpEnabled) {
                            window.finalBossJumpEnabled = true;
                            window.playerJumpVelocity = 0;
                            window.playerY = gameH - 100; // Start at bottom
                            window.playerOnGround = true;
                            addCatchEffect(gameW / 2, gameH / 2, '🎮 ZIPLAYA ZIPLAYA BOSS\'A ULAŞ!', true);
                            setTimeout(() => {
                                addCatchEffect(gameW / 2, gameH / 2 + 40, '📱 DOKUN / ⌨️ SPACE', true);
                            }, 1500);
                        }
                        
                        // No hearts spawn in phase 3
                    }
                    
                    // Spawn broken hearts (phases 1-2 only)
                    if (bossPhase < 3) {
                        attackChance *= 2.0; // Final boss is aggressive
                        if (Math.random() < attackChance) {
                            const windStrength = bossPhase === 1 ? Math.sin(gameTime * 2) * 3 : 0;
                            fallingHearts.push({
                                x: bossX + (Math.random() - 0.5) * 120,
                                y: renderBossY + 40,
                                vy: 3.5,
                                vx: windStrength + (Math.random() - 0.5) * 3,
                                type: { emoji: '💔', points: -1, size: 28, speed: 3.5, isBroken: true },
                                rotation: Math.random() * Math.PI * 2,
                                rotSpeed: 0.18
                            });
                        }
                    }
                    
                } else if (ability === 'dreamy') {
                    // Wave 3: Dreamy - Floating wave pattern
                    if (Math.random() < attackChance) {
                        const waveOffset = Math.sin(gameTime * 2) * 100;
                        fallingHearts.push({
                            x: bossX + waveOffset,
                            y: renderBossY + 40,
                            vy: 2.2,
                            vx: Math.cos(gameTime * 2) * 2,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.2, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.1
                        });
                    }
                    // Floating effect on all hearts
                    fallingHearts.forEach(h => {
                        h.vx += Math.sin(gameTime * 3 + h.y * 0.01) * 0.05;
                    });
                    
                } else if (ability === 'calm') {
                    // Wave 4: Calm - Wind and spiral patterns
                    if (Math.random() < attackChance) {
                        const angle = gameTime * 2;
                        fallingHearts.push({
                            x: bossX + Math.cos(angle) * 80,
                            y: renderBossY + 40,
                            vy: 2.5,
                            vx: Math.sin(angle) * 1.5,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.5, isBroken: true },
                            rotation: angle,
                            rotSpeed: 0.1
                        });
                    }
                    // Wind effect
                    const windPower = Math.sin(gameTime * 3) * 3;
                    fallingHearts.forEach(h => h.vx += windPower * 0.02);
                    
                } else if (ability === 'angry') {
                    // Wave 5: Angry - Rage mode with lightning bursts
                    attackChance *= 2.5;
                    const isRage = Math.random() < 0.015;
                    if (Math.random() < attackChance || isRage) {
                        const count = isRage ? 6 : 2;
                        for (let i = 0; i < count; i++) {
                            fallingHearts.push({
                                x: bossX + (Math.random() - 0.5) * 150,
                                y: renderBossY + 40,
                                vy: 4.0 + Math.random() * 2,
                                vx: (Math.random() - 0.5) * 3,
                                type: { emoji: '💔', points: -1, size: 28, speed: 4.0, isBroken: true },
                                rotation: Math.random() * Math.PI * 2,
                                rotSpeed: 0.2
                            });
                        }
                        // Lightning effect
                        if (isRage) {
                            for (let i = 0; i < 10; i++) {
                                catchEffects.push({
                                    x: bossX + (Math.random() - 0.5) * 100,
                                    y: renderBossY,
                                    vx: (Math.random() - 0.5) * 5,
                                    vy: Math.random() * 3,
                                    life: 0.5,
                                    color: '#ffeb3b',
                                    size: 3
                                });
                            }
                        }
                    }
                    // Screen shake
                    if (bossPhase === 3 && Math.random() < 0.02) {
                        damageFlash = 0.1;
                    }
                    
                } else if (ability === 'healing') {
                    // Wave 6: Healing - Defensive, spawns shields
                    if (Math.random() < attackChance * 0.8) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 60,
                            y: renderBossY + 40,
                            vy: 2.0,
                            vx: (Math.random() - 0.5) * 0.5,
                            type: { emoji: '💔', points: -1, size: 28, speed: 2.0, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.1
                        });
                    }
                    // Healing aura - boss glows
                    gameCtx.save();
                    gameCtx.globalAlpha = 0.3;
                    const healGlow = 50 + Math.sin(gameTime * 5) * 20;
                    gameCtx.shadowBlur = healGlow;
                    gameCtx.shadowColor = '#fbbf24';
                    gameCtx.restore();
                    
                } else if (ability === 'jealous') {
                    // Wave 7: Jealous - Creates clones and mirages
                    if (Math.random() < attackChance) {
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 80,
                            y: renderBossY + 40,
                            vy: 3.0,
                            vx: (Math.random() - 0.5) * 2,
                            type: { emoji: '💔', points: -1, size: 28, speed: 3.0, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.15
                        });
                    }
                    // Mirage effect - boss moves erratically
                    bossX += Math.sin(gameTime * 8) * 10;
                    // Ghost trails
                    if (gameFrameCount % 3 === 0) {
                        gameCtx.save();
                        gameCtx.globalAlpha = 0.2;
                        gameCtx.font = '85px serif';
                        gameCtx.textAlign = 'center';
                        gameCtx.fillStyle = '#000000';
                        gameCtx.fillText(bossConfig.emoji, bossX - bossDir * 50, renderBossY);
                        gameCtx.fillText(bossConfig.emoji, bossX + bossDir * 50, renderBossY);
                        gameCtx.restore();
                    }
                    
                } else if (ability === 'demon') {
                    // Wave 8: Demon - Hellfire and chaos
                    attackChance *= 3.0;
                    const isHellfire = Math.random() < 0.02;
                    if (Math.random() < attackChance || isHellfire) {
                        const count = isHellfire ? 8 : 3;
                        for (let i = 0; i < count; i++) {
                            const angle = (Math.PI * 2 / count) * i;
                            fallingHearts.push({
                                x: bossX + Math.cos(angle) * (isHellfire ? 120 : 60),
                                y: renderBossY + 40,
                                vy: 4.5 + Math.random(),
                                vx: Math.sin(angle) * (isHellfire ? 3 : 1.5),
                                type: { emoji: '💔', points: -1, size: 28, speed: 4.5, isBroken: true },
                                rotation: angle,
                                rotSpeed: 0.2
                            });
                        }
                        // Fire particles
                        if (isHellfire) {
                            for (let i = 0; i < 20; i++) {
                                catchEffects.push({
                                    x: bossX,
                                    y: renderBossY,
                                    vx: (Math.random() - 0.5) * 8,
                                    vy: -Math.random() * 5,
                                    life: 1.0,
                                    color: ['#ff0000', '#ff4400', '#ff8800'][Math.floor(Math.random() * 3)],
                                    size: 4
                                });
                            }
                        }
                    }
                    // Teleport randomly
                    if (Math.random() < 0.005) {
                        bossX = gameW * 0.2 + Math.random() * gameW * 0.6;
                        addCatchEffect(bossX, renderBossY, '💨', false);
                    }
                    // Chaos movement
                    if (Math.random() < 0.02) bossDir *= -1;
                    bossX += bossDir * 8;
                    
                } else if (ability === 'rebirth') {
                    // Wave 9: Rebirth - Butterfly transformation
                    if (Math.random() < attackChance) {
                        // Butterflies that transform
                        fallingHearts.push({
                            x: bossX + (Math.random() - 0.5) * 100,
                            y: renderBossY + 40,
                            vy: 1.5,
                            vx: (Math.random() - 0.5) * 3,
                            type: { emoji: '💔', points: -1, size: 28, speed: 1.5, isBroken: true },
                            rotation: 0,
                            rotSpeed: 0.1
                        });
                    }
                    // Butterfly flutter effect
                    fallingHearts.forEach(h => {
                        h.vx += Math.sin(gameTime * 10 + h.y * 0.1) * 0.1;
                        h.vy += Math.cos(gameTime * 10 + h.x * 0.1) * 0.05;
                    });
                    // Sparkle trail
                    if (gameFrameCount % 5 === 0) {
                        catchEffects.push({
                            x: bossX + (Math.random() - 0.5) * 60,
                            y: renderBossY + (Math.random() - 0.5) * 60,
                            vx: 0,
                            vy: -1,
                            life: 1.0,
                            color: '#06b6d4',
                            size: 2,
                            sparkle: true
                        });
                    }
                    
                } else if (ability === 'diamond') {
                    // Wave 10: Diamond - Dazzling attacks
                    if (Math.random() < attackChance) {
                        // Diamond pattern
                        const positions = [
                            {x: 0, y: -60}, {x: 60, y: 0}, {x: 0, y: 60}, {x: -60, y: 0}
                        ];
                        positions.forEach(pos => {
                            fallingHearts.push({
                                x: bossX + pos.x,
                                y: renderBossY + 40 + pos.y,
                                vy: 3.0,
                                vx: pos.x * 0.02,
                                type: { emoji: '💔', points: -1, size: 28, speed: 3.0, isBroken: true },
                                rotation: 0,
                                rotSpeed: 0.1
                            });
                        });
                    }
                    // Dazzle effect
                    if (gameFrameCount % 3 === 0) {
                        catchEffects.push({
                            x: bossX + (Math.random() - 0.5) * 80,
                            y: renderBossY + (Math.random() - 0.5) * 80,
                            vx: 0,
                            vy: 0,
                            life: 0.3,
                            color: '#ffffff',
                            size: 3,
                            sparkle: true
                        });
                    }
                    
                } else if (ability === 'wedding') {
                    // Wave 11: Wedding - Celebration attacks
                    if (Math.random() < attackChance * 0.9) {
                        // Confetti pattern
                        for (let i = 0; i < 2; i++) {
                            fallingHearts.push({
                                x: bossX + (Math.random() - 0.5) * 120,
                                y: renderBossY + 40,
                                vy: 2.5 + Math.random(),
                                vx: (Math.random() - 0.5) * 2,
                                type: { emoji: '💔', points: -1, size: 28, speed: 2.5, isBroken: true },
                                rotation: Math.random() * Math.PI * 2,
                                rotSpeed: 0.15
                            });
                        }
                    }
                    // Confetti particles
                    if (gameFrameCount % 10 === 0) {
                        for (let i = 0; i < 5; i++) {
                            catchEffects.push({
                                x: bossX + (Math.random() - 0.5) * 100,
                                y: renderBossY,
                                vx: (Math.random() - 0.5) * 3,
                                vy: -Math.random() * 2,
                                life: 1.5,
                                color: ['#ff4444', '#44ff44', '#4444ff', '#ffff44'][Math.floor(Math.random() * 4)],
                                size: 3
                            });
                        }
                    }
                    
                } else if (ability === 'eternal') {
                    // Wave 12: Eternal - Cosmic chaos
                    attackChance *= 3.5;
                    const isCosmic = Math.random() < 0.025;
                    if (Math.random() < attackChance || isCosmic) {
                        const count = isCosmic ? 12 : 4;
                        for (let i = 0; i < count; i++) {
                            const angle = (Math.PI * 2 / count) * i + gameTime;
                            const radius = isCosmic ? 150 : 80;
                            fallingHearts.push({
                                x: bossX + Math.cos(angle) * radius,
                                y: renderBossY + 40 + Math.sin(angle) * (radius * 0.5),
                                vy: 5.0 + Math.random(),
                                vx: Math.sin(angle) * 2,
                                type: { emoji: '💔', points: -1, size: 28, speed: 5.0, isBroken: true },
                                rotation: angle,
                                rotSpeed: 0.25
                            });
                        }
                        // Cosmic particles
                        if (isCosmic) {
                            for (let i = 0; i < 30; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                catchEffects.push({
                                    x: bossX,
                                    y: renderBossY,
                                    vx: Math.cos(angle) * (3 + Math.random() * 5),
                                    vy: Math.sin(angle) * (3 + Math.random() * 5),
                                    life: 1.5,
                                    color: ['#a855f7', '#06b6d4', '#ffffff', '#fbbf24'][Math.floor(Math.random() * 4)],
                                    size: 4,
                                    sparkle: true
                                });
                            }
                        }
                    }
                    // Infinity movement
                    bossX = gameW / 2 + Math.sin(gameTime * 2) * 150;
                    // Time distortion effect
                    if (Math.random() < 0.01) {
                        damageFlash = 0.2;
                    }
                }
                
                gameCtx.restore();
            }
            
            // Draw Boss HP Bar (Always visible, at top of screen)
            if (bossIntroTimer <= 0 && bossDefeatedTimer <= 0) {
                drawBossHPBar();
            }
            
            // Update boss projectiles (reflected hearts)
            updateBossProjectiles();
        }
        
        // Helper function for smooth easing
        function easeOutBounce(t) {
            const n1 = 7.5625;
            const d1 = 2.75;
            if (t < 1 / d1) {
                return n1 * t * t;
            } else if (t < 2 / d1) {
                return n1 * (t -= 1.5 / d1) * t + 0.75;
            } else if (t < 2.5 / d1) {
                return n1 * (t -= 2.25 / d1) * t + 0.9375;
            } else {
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        }
        
        function drawBossHPBar() {
            const bossConfig = WAVES[currentWave - 1]?.boss || { emoji: '💔', color: '#ff4444' };
            const barWidth = gameW * 0.6;
            const barHeight = 20;
            const barX = (gameW - barWidth) / 2;
            const barY = 20;
            
            gameCtx.save();
            
            // Background
            gameCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            gameCtx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);
            
            // HP Bar background
            gameCtx.fillStyle = 'rgba(50, 50, 50, 0.8)';
            gameCtx.fillRect(barX, barY, barWidth, barHeight);
            
            // HP Bar fill (color based on phase)
            const hpPercent = bossHP / bossMaxHP;
            let barColor = bossConfig.color;
            if (bossPhase === 3) barColor = '#ff0000';
            else if (bossPhase === 2) barColor = '#ff8800';
            
            const gradient = gameCtx.createLinearGradient(barX, 0, barX + barWidth * hpPercent, 0);
            gradient.addColorStop(0, barColor);
            gradient.addColorStop(1, adjustBrightness(barColor, -30));
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
            
            // Pulsing effect for low HP
            if (bossPhase === 3) {
                const pulse = 0.5 + Math.sin(gameTime * 10) * 0.5;
                gameCtx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.3})`;
                gameCtx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
            }
            
            // Border
            gameCtx.strokeStyle = '#ffffff';
            gameCtx.lineWidth = 2;
            gameCtx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Boss name and HP text
            gameCtx.font = 'bold 14px Montserrat';
            gameCtx.fillStyle = '#ffffff';
            gameCtx.textAlign = 'center';
            gameCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            gameCtx.shadowBlur = 4;
            gameCtx.fillText(`${bossConfig.emoji} BOSS ${bossConfig.emoji}`, gameW / 2, barY - 10);
            gameCtx.fillText(`${bossHP} / ${bossMaxHP}`, gameW / 2, barY + barHeight / 2 + 5);
            
            // Kinetic Charge Bar (Boss 4 only)
            if (bossConfig.ability === 'windy_day' && bossController.kineticCharge > 0) {
                const chargeBarY = barY + barHeight + 15;
                const chargeBarHeight = 10;
                const chargePercent = bossController.kineticCharge / 100;
                
                // Background
                gameCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                gameCtx.fillRect(barX, chargeBarY, barWidth, chargeBarHeight);
                
                // Charge fill
                const chargeGradient = gameCtx.createLinearGradient(barX, 0, barX + barWidth * chargePercent, 0);
                chargeGradient.addColorStop(0, '#ffeb3b');
                chargeGradient.addColorStop(1, '#ff9800');
                gameCtx.fillStyle = chargeGradient;
                gameCtx.fillRect(barX, chargeBarY, barWidth * chargePercent, chargeBarHeight);
                
                // Border
                gameCtx.strokeStyle = '#ffffff';
                gameCtx.lineWidth = 1;
                gameCtx.strokeRect(barX, chargeBarY, barWidth, chargeBarHeight);
                
                // Text
                gameCtx.font = 'bold 10px Montserrat';
                gameCtx.fillStyle = '#ffeb3b';
                gameCtx.fillText('⚡ KİNETİK ŞARJ', gameW / 2, chargeBarY - 3);
            }
            
            gameCtx.restore();
        }
        
        function adjustBrightness(color, amount) {
            const hex = color.replace('#', '');
            const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
            const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
            const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }




        if (effect === 'pink_glow') {
            const gradient = gameCtx.createRadialGradient(centerX, centerY, gameW * 0.2, centerX, centerY, gameW * 0.8);
            gradient.addColorStop(0, 'rgba(255, 100, 150, 0.0)');
            gradient.addColorStop(1, 'rgba(255, 100, 150, 0.2)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);
        }
        if (effect === 'rain') {
            // Rainy Vignette (Blue/Gray) - Boss 1 Atmosphere
            const gradient = gameCtx.createRadialGradient(centerX, centerY, gameW * 0.2, centerX, centerY, gameW * 0.9);
            gradient.addColorStop(0, 'rgba(100, 120, 140, 0.0)');
            gradient.addColorStop(1, 'rgba(80, 100, 130, 0.25)'); // Darker edge
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);

            // Stronger rain
            gameCtx.strokeStyle = 'rgba(180, 190, 220, 0.5)';
            gameCtx.lineWidth = 1.5;
            gameCtx.beginPath();
            for (let i = 0; i < 15; i++) {
                const rx = Math.random() * gameW;
                const ry = Math.random() * gameH;
                gameCtx.moveTo(rx, ry);
                gameCtx.lineTo(rx - 8, ry + 25);
            }
            gameCtx.stroke();
        } else if (effect === 'fire') {
            // Fire Atmosphere - Boss 2: Bottom of screen glows red
            const gradient = gameCtx.createLinearGradient(0, gameH * 0.5, 0, gameH);
            gradient.addColorStop(0, 'rgba(255, 50, 0, 0.0)');
            gradient.addColorStop(0.5, 'rgba(255, 80, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0.4)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);
            
            // Heat distortion effect (subtle wave)
            if (gameFrameCount % 3 === 0) {
                gameCtx.fillStyle = 'rgba(255, 150, 0, 0.05)';
                const waveY = gameH * 0.7 + Math.sin(gameTime * 5) * 20;
                gameCtx.fillRect(0, waveY, gameW, 50);
            }
        } else if (effect === 'ice') {
            // Ice Atmosphere - Boss 3: Screen freezes, blue tint
            const gradient = gameCtx.createRadialGradient(centerX, centerY, gameW * 0.2, centerX, centerY, gameW * 0.9);
            gradient.addColorStop(0, 'rgba(100, 200, 255, 0.0)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0.3)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);
            
            // Ice crystals floating
            if (gameFrameCount % 5 === 0) {
                for (let i = 0; i < 3; i++) {
                    const x = Math.random() * gameW;
                    const y = Math.random() * gameH;
                    gameCtx.fillStyle = 'rgba(200, 230, 255, 0.4)';
                    gameCtx.beginPath();
                    gameCtx.arc(x, y, 2, 0, Math.PI * 2);
                    gameCtx.fill();
                }
            }
        } else if (effect === 'wind') {
            // Wind Atmosphere - Boss 4: Strong wind visual
            const gradient = gameCtx.createLinearGradient(0, 0, gameW, 0);
            gradient.addColorStop(0, 'rgba(200, 200, 200, 0.1)');
            gradient.addColorStop(0.5, 'rgba(220, 220, 220, 0.2)');
            gradient.addColorStop(1, 'rgba(200, 200, 200, 0.1)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);
            
            // Wind lines
            if (gameFrameCount % 2 === 0) {
                gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                gameCtx.lineWidth = 2;
                for (let i = 0; i < 5; i++) {
                    const y = Math.random() * gameH;
                    const offset = Math.sin(gameTime * 3 + i) * 50;
                    gameCtx.beginPath();
                    gameCtx.moveTo(offset, y);
                    gameCtx.lineTo(offset + 100, y);
                    gameCtx.stroke();
                }
            }
        } else if (effect === 'mirror') {
            // Mirror Atmosphere - Boss 5: Split screen effect
            gameCtx.save();
            gameCtx.strokeStyle = 'rgba(200, 200, 255, 0.4)';
            gameCtx.lineWidth = 3;
            gameCtx.beginPath();
            gameCtx.moveTo(centerX, 0);
            gameCtx.lineTo(centerX, gameH);
            gameCtx.stroke();
            
            // Mirror shimmer
            const gradient = gameCtx.createLinearGradient(centerX - 50, 0, centerX + 50, 0);
            gradient.addColorStop(0, 'rgba(200, 200, 255, 0.0)');
            gradient.addColorStop(0.5, 'rgba(220, 220, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(200, 200, 255, 0.0)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(centerX - 50, 0, 100, gameH);
            gameCtx.restore();
        } else if (effect === 'fog') {
            // Fog handled by bossController.drawFogEffect()
            // Just add ambient fog tint
            gameCtx.fillStyle = 'rgba(100, 100, 100, 0.2)';
            gameCtx.fillRect(0, 0, gameW, gameH);
        } else if (effect === 'wall') {
            // Wall atmosphere - darker, oppressive
            const gradient = gameCtx.createRadialGradient(centerX, centerY, gameW * 0.1, centerX, centerY, gameW * 0.9);
            gradient.addColorStop(0, 'rgba(50, 50, 50, 0.0)');
            gradient.addColorStop(1, 'rgba(30, 30, 30, 0.4)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);
        } else if (effect === 'poison') {
            // Poison Atmosphere - Boss 8: Purple toxic haze
            const gradient = gameCtx.createRadialGradient(centerX, gameH, gameW * 0.3, centerX, gameH, gameW * 1.2);
            gradient.addColorStop(0, 'rgba(150, 0, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(100, 0, 200, 0.1)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);
            
            // Poison bubbles
            if (gameFrameCount % 4 === 0) {
                for (let i = 0; i < 2; i++) {
                    const x = Math.random() * gameW;
                    const y = gameH - Math.random() * 100;
                    gameCtx.fillStyle = 'rgba(150, 0, 255, 0.3)';
                    gameCtx.beginPath();
                    gameCtx.arc(x, y, 3, 0, Math.PI * 2);
                    gameCtx.fill();
                }
            }
        } else if (effect === 'glitch') {
            // Glitch handled by bossController.drawGlitchEffect()
            // Just add base corruption
            if (Math.random() < 0.1) {
                gameCtx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.1)`;
                gameCtx.fillRect(Math.random() * gameW, Math.random() * gameH, 100, 100);
            }
        } else if (effect === 'time') {
            // Time Atmosphere - Boss 10: Black and white with clock overlay
            gameCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            gameCtx.fillRect(0, 0, gameW, gameH);
            
            // Clock face overlay
            gameCtx.save();
            gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            gameCtx.lineWidth = 2;
            gameCtx.beginPath();
            gameCtx.arc(centerX, centerY, 100, 0, Math.PI * 2);
            gameCtx.stroke();
            
            // Clock hands
            gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            gameCtx.lineWidth = 3;
            gameCtx.beginPath();
            gameCtx.moveTo(centerX, centerY);
            gameCtx.lineTo(centerX + Math.cos(gameTime * 2) * 60, centerY + Math.sin(gameTime * 2) * 60);
            gameCtx.stroke();
            gameCtx.restore();
        } else if (effect === 'grayscale') {
            // Grayscale handled by bossController.applyGrayscaleFilter()
            // Just add gray overlay
            gameCtx.fillStyle = 'rgba(128, 128, 128, 0.3)';
            gameCtx.fillRect(0, 0, gameW, gameH);
        } else if (effect === 'darkness') {
            // Darkness Atmosphere - Boss 12: Very dark, ominous
            const gradient = gameCtx.createRadialGradient(centerX, centerY, gameW * 0.1, centerX, centerY, gameW * 1.2);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);
            
            // Red lightning flashes
            if (Math.random() < 0.03) {
                gameCtx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                gameCtx.fillRect(0, 0, gameW, gameH);
            }
        } else if (effect === 'gold_rays') {
            // Golden Vignette
            const gradient = gameCtx.createRadialGradient(centerX, centerY, gameW * 0.1, centerX, centerY, gameW * 0.8);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.0)');
            gradient.addColorStop(1, 'rgba(255, 180, 0, 0.15)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);

            // Rays
            gameCtx.save();
            gameCtx.translate(centerX, centerY);
            gameCtx.rotate(gameTime * 0.2);
            gameCtx.fillStyle = 'rgba(255, 225, 100, 0.08)'; // Brighter rays
            for (let i = 0; i < 8; i++) {
                gameCtx.rotate(Math.PI / 4);
                gameCtx.fillRect(-gameW, -30, gameW * 2, 60);
            }
            gameCtx.restore();
        } else if (effect === 'storm') {
            // Stormy Vignette (Dark Purple/Blue)
            const gradient = gameCtx.createRadialGradient(centerX, centerY, gameW * 0.1, centerX, centerY, gameW * 1.0);
            gradient.addColorStop(0, 'rgba(30, 10, 50, 0.0)');
            gradient.addColorStop(1, 'rgba(20, 0, 40, 0.4)'); // Strong dark edge
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);

            if (Math.random() < 0.04) { // More frequent lightning
                gameCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                gameCtx.fillRect(0, 0, gameW, gameH);
            }
        } else if (effect === 'aurora') {
            // Aurora Vignette
            const gradient = gameCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gameW);
            gradient.addColorStop(0, `hsla(${200 + Math.sin(gameTime) * 20}, 70%, 50%, 0.05)`);
            gradient.addColorStop(1, `hsla(${280 + Math.cos(gameTime) * 20}, 70%, 30%, 0.25)`);
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);
        } else if (effect === 'cosmos') {
            // Deep Cosmic Vignette
            const gradient = gameCtx.createRadialGradient(centerX, centerY, gameW * 0.2, centerX, centerY, gameW);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
            gradient.addColorStop(1, 'rgba(50, 0, 80, 0.3)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);

            gameCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
            gameCtx.fillRect(0, 0, gameW, gameH);
        }

        // Move Berna
        const bernaSpeed = 1.0 + (currentWave - 1) * 0.3;
        bernaX += bernaDir * bernaSpeed;
        if (bernaX > gameW - BERNA_SPRITE_SIZE / 2) bernaDir = -1;
        if (bernaX < BERNA_SPRITE_SIZE / 2) bernaDir = 1;
        
        // Calculate Berna Y base position (used for both rendering and heart spawning)
        const bernaYBase = gameH < 500 ? Math.min(20, gameH * 0.05) : 20; // Lower in landscape

        // Apply DOM transforms for Berna (GIF support + Performance)
        if (bernaEl) {
            // Boss fight: Keep Berna visible but slightly faded
            if (bossActive) {
                // Keep Berna visible during boss fight (she throws special hearts!)
                let bernaOpacity = 0.7; // Slightly faded but visible
                if (bossIntroTimer > 0) {
                    // Fade to 0.7 during intro (2 seconds)
                    bernaOpacity = 1 - ((1 - 0.7) * (1 - bossIntroTimer / 2.0));
                } else if (bossDefeatedTimer > 0) {
                    // Fade back to full during death animation (3 seconds)
                    bernaOpacity = 0.7 + (0.3 * (1 - bossDefeatedTimer / 3.0));
                }
                bernaEl.style.opacity = bernaOpacity;
                bernaEl.style.transition = 'opacity 0.5s ease';
            } else {
                // Normal gameplay: Fully visible
                bernaEl.style.opacity = 1;
            }
            
            // 1. Floating bounce
            const floatOffset = Math.sin(gameTime * 2) * 8;
            const bernaY = bernaYBase + floatOffset;

            // 2. Perspective tilt
            const rotationAngle = bernaDir * 5; // degrees

            // 3. Perspective scaling
            const scaleVariation = 1.0 + Math.sin(gameTime * 1.5) * 0.05;
            const scaleX = (bernaDir === -1 ? -1 : 1) * scaleVariation;

            // 4. Angry shake offset
            let angryShakeX = 0;
            let angryShakeRot = 0;
            let bernaFilterMode = 'normal'; // 'angry', 'clearing', or 'normal'

            if (bernaAngryTimer > 0) {
                bernaAngryTimer -= dt;
                if (bernaAngryTimer <= 0) {
                    bernaAngryTimer = -1; // Signal: clearing frame needed
                    bernaFilterMode = 'clearing';
                } else {
                    bernaFilterMode = 'angry';
                    const intensity = Math.min(1, bernaAngryTimer / 0.5);
                    angryShakeX = Math.sin(gameTime * 60) * 6 * intensity;
                    angryShakeRot = Math.sin(gameTime * 45) * 4 * intensity;
                }
            } else if (bernaAngryTimer === -1) {
                // One frame has passed with 'none', now safe to restore normal
                bernaAngryTimer = 0;
                bernaFilterMode = 'normal';
            }

            // Apply transform
            bernaEl.style.transform = `translate3d(${bernaX - 50 + angryShakeX}px, ${bernaY}px, 0) rotate(${rotationAngle + angryShakeRot}deg) scale(${scaleX}, ${scaleVariation})`;

            // Single filter assignment point
            if (bernaFilterMode === 'angry') {
                bernaEl.style.filter = `brightness(0.6) sepia(1) saturate(5) hue-rotate(-10deg) drop-shadow(0 0 15px red)`;
            } else if (bernaFilterMode === 'clearing') {
                bernaEl.style.filter = 'none';
            } else {
                bernaEl.style.filter = `drop-shadow(${-bernaDir * 5}px 10px 10px rgba(0,0,0,0.4))`;
            }
        }

        /* 
           CANVAS DRAWING REMOVED FOR PERFORMANCE AND GIF SUPPORT
           (Previous code for drawImage(bernaImg) deleted)
        */

        // Spawn hearts from Berna
        if (!waveTransitioning) {
            let shouldSpawn = false;
            let spawnChance = config.spawnRate;
            
            // During boss fight: Much rarer special heart spawns
            if (bossActive && bossIntroTimer <= 0 && bossDefeatedTimer <= 0) {
                // Special hearts are rare - only 30% of normal spawn rate (increased from 20%)
                // AND have a 2 second cooldown to prevent multiple spawns
                const now = Date.now();
                if (now - bernaLastSpecialHeartTime >= 2000) { // 2 second cooldown
                    spawnChance = config.spawnRate * 0.3;
                    shouldSpawn = Math.random() < spawnChance;
                    if (shouldSpawn) {
                        bernaLastSpecialHeartTime = now;
                    }
                }
            } else {
                // Normal gameplay: Regular spawn rate
                shouldSpawn = Math.random() < spawnChance;
            }
            
            if (shouldSpawn) {
                let type;
                
                // During boss fight: Only spawn special hearts from Berna
                if (bossActive && bossIntroTimer <= 0 && bossDefeatedTimer <= 0) {
                    // Berna throws special hearts during boss fight (RARE!)
                    const bossConfig = WAVES[currentWave - 1]?.boss || {};
                    const specialHeart = bossConfig.specialHeart || { emoji: '⭐', name: 'Özel Kalp', damage: 1 };
                    
                    type = {
                        emoji: specialHeart.emoji,
                        points: 50,
                        size: 32,
                        speed: 2.5,
                        isBossWeakness: true,
                        bossDamage: specialHeart.damage
                    };
                } else {
                    // Normal gameplay: Regular hearts
                    const heartTypes = getHeartTypes(currentWave, gameLives);
                    const totalWeight = heartTypes.reduce((s, t) => s + t.weight, 0);
                    let r = Math.random() * totalWeight;
                    type = heartTypes[0];
                    for (const t of heartTypes) {
                        r -= t.weight;
                        if (r <= 0) { type = t; break; }
                    }

                    // Love Blast Transmutation: If active, new broken hearts become normal hearts
                    if (loveBlastActive && type.isBroken) {
                        type = { emoji: '❤️', points: 10, size: 28, speed: 2.5, weight: 50 };
                    }
                }

                fallingHearts.push({
                    x: bernaX + (Math.random() - 0.5) * 40,
                    y: bernaYBase + BERNA_SPRITE_SIZE,
                    vy: type.speed * speedMul * (0.8 + Math.random() * 0.4),
                    vx: (Math.random() - 0.5) * 0.8,
                    type: type,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.05
                });
            }
        }

        // Spawn power-ups (rare, suppressed during boss fight)
        if (!waveTransitioning && !bossActive && Math.random() < 0.003 && gamePowerUps.length < 1) {
            const pu = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            gamePowerUps.push({
                x: Math.random() * (gameW - 80) + 40,
                y: -30,
                vy: pu.speed,
                type: pu,
                rotation: 0,
                glow: 0
            });
        }

        // Update & draw falling hearts
        // burakTop already defined earlier for boss abilities
        for (let i = fallingHearts.length - 1; i >= 0; i--) {
            const h = fallingHearts[i];
            
            // Safety check - skip if heart is undefined or missing required properties
            if (!h || h.x === undefined || h.y === undefined || h.vx === undefined || h.vy === undefined) {
                fallingHearts.splice(i, 1);
                continue;
            }

            // Wind & Wobble effects
            if (config.wind) {
                h.x += config.wind;
            }
            if (config.wobble) {
                h.x += Math.sin(gameTime * 5 + i) * 1.0;
            }

            // Magnet effect (attract good hearts)
            if (magnetActive && h.type && !h.type.isBroken) {
                const dx = burakX - h.x;
                const dy = burakTop - h.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    h.vx += (dx / dist) * 0.8;
                    h.vy += (dy / dist) * 0.3;
                }
            }

            // Precision effect (auto-aim all good hearts)
            if (precisionActive && h.type && !h.type.isBroken) {
                const dx = burakX - h.x;
                const dy = burakTop - h.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 10) {
                    h.vx += (dx / dist) * 0.4;
                    h.vy += (dy / dist) * 0.2;
                }
            }

            h.y += h.vy;
            h.x += h.vx + Math.sin(gameTime * 2 + i) * 0.3;
            h.x = Math.max(15, Math.min(gameW - 15, h.x));
            h.rotation += h.rotSpeed;

            // Catch check - skip if no type defined
            if (!h.type) {
                fallingHearts.splice(i, 1);
                continue;
            }
            
            if (h.y > burakTop - 40 && h.y < burakTop + 60 && // Widened collision
                Math.abs(h.x - burakX) < BURAK_CATCH_W / 2 + h.type.size / 2) {

                // Rain drops (Boss 1) - Don't damage, just slow
                if (h.type.isRain) {
                    // Rain drop caught - no damage, just visual feedback
                    addCatchEffect(h.x, burakTop, '💧', false);
                    fallingHearts.splice(i, 1);
                    continue;
                }

                if (h.type.isBroken) {
                    if (invulnerableTimer > 0) {
                        // Invulnerable - no damage
                        addCatchEffect(h.x, burakTop, '🛡️', false);
                    } else {
                        // Take damage
                        takeDamage();
                        addCatchEffect(h.x, burakTop, '-💔', false);
                        // Achievement tracking
                        if (achievementSystem) {
                            achievementSystem.incrementStat('brokenHeartsCaught');
                            achievementSystem.stats.currentWaveDamage++;
                        }
                        gameConsecutiveCatches = 0;
                        gameCombo = 1;

                        // Berna gets angry!
                        bernaAngryTimer = 1.5; // 1.5 seconds of anger
                        // Angry emoji burst above Berna
                        addCatchEffect(bernaX, 20, '💢', true);
                    }
                } else {
                    totalHeartsCaught++;
                    gameConsecutiveCatches++;
                    const prevCombo = gameCombo;
                    if (gameConsecutiveCatches >= 8) gameCombo = 4;
                    else if (gameConsecutiveCatches >= 5) gameCombo = 3;
                    else if (gameConsecutiveCatches >= 3) gameCombo = 2;
                    else gameCombo = 1;

                    if (gameCombo > longestCombo) longestCombo = gameCombo;
                    
                    // Update achievement stats
                    if (achievementSystem) {
                        achievementSystem.incrementStat('totalHeartsCaught');
                        achievementSystem.updateStat('longestCombo', longestCombo);
                    }

                    // Combo change notification
                    if (gameCombo > prevCombo) {
                        addCatchEffect(gameW / 2, gameH / 2 - 40, 'x' + gameCombo + '! 🔥', true);
                        playSound('combo');
                        HapticFeedback.combo();
                    }

                    const earned = h.type.points * gameCombo * (doublePointsActive ? 2 : 1);
                    gameScore += earned;
                    waveScoreEarned += earned; // Track progress towards boss
                    if (gameScoreEl) gameScoreEl.textContent = gameScore;

                    // Special heart effects
                    if (h.type.isGold) {
                        addCatchEffect(h.x, burakTop, '+' + earned + ' 🥇', true);
                        playSound('diamond');
                        // Golden sparkle burst
                        for (let s = 0; s < 8; s++) {
                            const angle = (Math.PI * 2 / 8) * s;
                            catchEffects.push({
                                x: h.x, y: burakTop,
                                vx: Math.cos(angle) * 4,
                                vy: Math.sin(angle) * 4,
                                life: 1,
                                color: '#ffd700',
                                size: 4
                            });
                        }
                    } else if (h.type.isIce) {
                        // Freeze all hearts for 3 seconds
                        slowMoActive = true;
                        slowMoTimer = 3;
                        addCatchEffect(h.x, burakTop, '🧊 Dondur!', true);
                        playSound('freeze');
                    } else if (h.type.isDiamond) {
                        addCatchEffect(h.x, burakTop, '+' + earned + ' 💎', true);
                        playSound('diamond');
                        // Screen flash
                        damageFlash = 0.5; // Repurpose for white flash
                        // Achievement tracking
                        if (achievementSystem) {
                            achievementSystem.incrementStat('diamondHeartsCaught');
                        }
                    } else if (h.type.isLife) {
                        gameLives = Math.min(5, gameLives + 1);
                        updateLivesDisplay();
                        addCatchEffect(h.x, burakTop, '+1 ❤️', true);
                        playSound('diamond');
                    } else if (h.type.isBossWeakness) {
                        // Boss special heart caught - damage boss with UNIQUE EFFECTS per boss!
                        const damage = h.type.bossDamage || 1;
                        const bossConfig = WAVES[currentWave - 1]?.boss || {};
                        const ability = bossConfig.ability;
                        
                        addCatchEffect(h.x, burakTop, `${h.type.emoji || '⭐'} BOSS HASAR!`, true);
                        playSound('bosshit');
                        damageBoss(damage, 'weakness');
                        
                        // UNIQUE EFFECTS PER BOSS
                        if (ability === 'doubt_cloud') {
                            // Boss 1: Şemsiye (Umbrella) - Removes slow debuff, shoots light beam at boss
                            bossController.slowDebuff = 1.0; // Remove slow
                            addCatchEffect(burakX, burakTop - 30, '☂️ Hız Normale Döndü!', true);
                            
                            // Powerful light beam effect from player to boss (AUTOMATIC!)
                            // Create a thick beam with multiple particles
                            for (let i = 0; i < 30; i++) {
                                const t = i / 30;
                                const beamX = burakX + (bossX - burakX) * t;
                                const beamY = burakTop + (bossY - burakTop) * t;
                                
                                catchEffects.push({
                                    x: beamX,
                                    y: beamY,
                                    vx: (Math.random() - 0.5) * 1,
                                    vy: (Math.random() - 0.5) * 1,
                                    life: 1.5,
                                    color: ['#ffeb3b', '#fff', '#ffd700'][Math.floor(Math.random() * 3)],
                                    size: 5,
                                    sparkle: true
                                });
                            }
                            
                            // Explosion at boss position
                            for (let i = 0; i < 15; i++) {
                                const angle = (Math.PI * 2 / 15) * i;
                                catchEffects.push({
                                    x: bossX,
                                    y: bossY,
                                    vx: Math.cos(angle) * 6,
                                    vy: Math.sin(angle) * 6,
                                    life: 1.2,
                                    color: '#ffeb3b',
                                    size: 4,
                                    sparkle: true
                                });
                            }
                            
                            // Screen flash
                            damageFlash = 0.6;
                            
                        } else if (ability === 'rage_flame') {
                            // Boss 2: Su Balonu (Water Balloon) - Extinguishes boss, removes lava bombs
                            bossController.lavaBombs = []; // Clear all lava bombs
                            addCatchEffect(burakX, burakTop - 30, '💧 Ateş Söndürüldü!', true);
                            
                            // Water splash effect
                            for (let i = 0; i < 20; i++) {
                                const angle = (Math.PI * 2 / 20) * i;
                                catchEffects.push({
                                    x: bossX,
                                    y: bossY,
                                    vx: Math.cos(angle) * 5,
                                    vy: Math.sin(angle) * 5,
                                    life: 1.2,
                                    color: '#06b6d4',
                                    size: 4
                                });
                            }
                            
                            // Steam particles
                            for (let i = 0; i < 10; i++) {
                                catchEffects.push({
                                    x: bossX + (Math.random() - 0.5) * 80,
                                    y: bossY + (Math.random() - 0.5) * 80,
                                    vx: (Math.random() - 0.5) * 1,
                                    vy: -Math.random() * 3,
                                    life: 1.5,
                                    color: '#ffffff',
                                    size: 3
                                });
                            }
                            
                        } else if (ability === 'cold_distance') {
                            // Boss 3: Sıcak Çay (Hot Tea) - Breaks ice, unfreezes player
                            bossController.playerFrozen = false; // Unfreeze
                            bossController.freezeTimer = 0;
                            addCatchEffect(burakX, burakTop - 30, '☕ Buzlar Kırıldı!', true);
                            
                            // Ice breaking effect
                            for (let i = 0; i < 25; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                catchEffects.push({
                                    x: burakX + (Math.random() - 0.5) * 60,
                                    y: burakTop + (Math.random() - 0.5) * 60,
                                    vx: Math.cos(angle) * 4,
                                    vy: Math.sin(angle) * 4 - 2,
                                    life: 1.0,
                                    color: '#06b6d4',
                                    size: 3
                                });
                            }
                            
                            // Warm steam
                            for (let i = 0; i < 10; i++) {
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: (Math.random() - 0.5) * 2,
                                    vy: -Math.random() * 4,
                                    life: 1.5,
                                    color: '#ffffff',
                                    size: 2
                                });
                            }
                            
                            // Screen flash
                            damageFlash = 0.4;
                            
                        } else if (ability === 'windy_day') {
                            // Boss 4: Kinetik Enerji (Kinetic Energy) - Boss loses wind power
                            // Wind effect is already in bossController, just visual feedback
                            addCatchEffect(burakX, burakTop - 30, '⚡ Rüzgar Durdu!', true);
                            
                            // Lightning burst effect
                            for (let i = 0; i < 20; i++) {
                                const angle = (Math.PI * 2 / 20) * i;
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: Math.cos(angle) * 7,
                                    vy: Math.sin(angle) * 7,
                                    life: 1.0,
                                    color: '#ffeb3b',
                                    size: 4,
                                    sparkle: true
                                });
                            }
                            
                            // Energy waves to boss
                            for (let i = 0; i < 15; i++) {
                                const t = i / 15;
                                catchEffects.push({
                                    x: burakX + (bossX - burakX) * t,
                                    y: burakTop + (bossY - burakTop) * t,
                                    vx: (Math.random() - 0.5) * 2,
                                    vy: (Math.random() - 0.5) * 2,
                                    life: 1.2,
                                    color: ['#ffeb3b', '#fff'][Math.floor(Math.random() * 2)],
                                    size: 4,
                                    sparkle: true
                                });
                            }
                            
                            // Screen flash
                            damageFlash = 0.5;
                            
                        } else if (ability === 'jealousy_mirror') {
                            // Boss 5: Gerçeklik Gözlüğü (Reality Glasses) - Fixes inverted controls
                            bossController.disableJealousyMirror();
                            addCatchEffect(burakX, burakTop - 30, '👓 Kontroller Düzeldi!', true);
                            
                            // Mirror shatter effect
                            for (let i = 0; i < 25; i++) {
                                catchEffects.push({
                                    x: gameW / 2,
                                    y: gameH / 2,
                                    vx: (Math.random() - 0.5) * 15,
                                    vy: (Math.random() - 0.5) * 15,
                                    life: 1.5,
                                    color: ['#fff', '#ccc', '#aaa'][Math.floor(Math.random() * 3)],
                                    size: 6,
                                    sparkle: true
                                });
                            }
                            
                            // Screen flash
                            damageFlash = 0.6;
                            
                        } else if (ability === 'fog_forgetting') {
                            // Boss 6: Fener (Flashlight) - Clears fog
                            bossController.disableFogForgetting();
                            addCatchEffect(burakX, burakTop - 30, '🔦 Sis Dağıldı!', true);
                            
                            // Light rays spreading out
                            for (let i = 0; i < 30; i++) {
                                const angle = (Math.PI * 2 / 30) * i;
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: Math.cos(angle) * 10,
                                    vy: Math.sin(angle) * 10,
                                    life: 1.8,
                                    color: ['#ffeb3b', '#fff', '#ffd700'][Math.floor(Math.random() * 3)],
                                    size: 5,
                                    sparkle: true
                                });
                            }
                            
                            // Screen flash
                            damageFlash = 0.5;
                            
                        } else if (ability === 'ego_wall') {
                            // Boss 7: Çekiç (Hammer) - Breaks wall
                            bossController.disableEgoWall();
                            addCatchEffect(burakX, burakTop - 30, '🔨 Duvar Yıkıldı!', true);
                            
                            // Wall debris explosion
                            for (let i = 0; i < 35; i++) {
                                catchEffects.push({
                                    x: bossX,
                                    y: bossY,
                                    vx: (Math.random() - 0.5) * 12,
                                    vy: (Math.random() - 0.5) * 12,
                                    life: 1.5,
                                    color: ['#888', '#666', '#555'][Math.floor(Math.random() * 3)],
                                    size: 7,
                                    sparkle: false
                                });
                            }
                            
                            // Screen shake
                            bossHitFlash = 15;
                            damageFlash = 0.4;
                            
                        } else if (ability === 'gossip_snake') {
                            // Boss 8: Kulaklık (Headphones) - Blocks whispers, poison stops
                            addCatchEffect(burakX, burakTop - 30, '🎧 Fısıltılar Kesildi!', true);
                            
                            // Sound wave effect
                            for (let i = 0; i < 20; i++) {
                                const angle = (Math.PI * 2 / 20) * i;
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: Math.cos(angle) * 6,
                                    vy: Math.sin(angle) * 6,
                                    life: 1.3,
                                    color: ['#9c27b0', '#e91e63'][Math.floor(Math.random() * 2)],
                                    size: 5,
                                    sparkle: true
                                });
                            }
                            
                            // Clear all poison zones
                            bossController.poisonZones = [];
                            
                        } else if (ability === 'glitch') {
                            // Boss 9: Reset Tuşu (Reset Button) - Fixes glitch
                            bossController.disableGlitch();
                            addCatchEffect(burakX, burakTop - 30, '🔄 Sistem Düzeldi!', true);
                            
                            // Digital particles
                            for (let i = 0; i < 40; i++) {
                                catchEffects.push({
                                    x: Math.random() * gameW,
                                    y: Math.random() * gameH,
                                    vx: (Math.random() - 0.5) * 8,
                                    vy: (Math.random() - 0.5) * 8,
                                    life: 1.0,
                                    color: ['#00ff00', '#00ffff', '#ff00ff'][Math.floor(Math.random() * 3)],
                                    size: 4,
                                    sparkle: true
                                });
                            }
                            
                            // Screen flash
                            damageFlash = 0.7;
                            
                        } else if (ability === 'time_thief') {
                            // Boss 10: Saat Pili (Battery) - Restores time
                            bossController.timeScale = 1.0;
                            addCatchEffect(burakX, burakTop - 30, '🔋 Zaman Normale Döndü!', true);
                            
                            // Clock particles
                            for (let i = 0; i < 25; i++) {
                                const angle = (Math.PI * 2 / 25) * i;
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: Math.cos(angle) * 8,
                                    vy: Math.sin(angle) * 8,
                                    life: 1.5,
                                    color: ['#2196f3', '#03a9f4', '#00bcd4'][Math.floor(Math.random() * 3)],
                                    size: 5,
                                    sparkle: true
                                });
                            }
                            
                            // Screen flash
                            damageFlash = 0.5;
                            
                        } else if (ability === 'routine') {
                            // Boss 11: Gökkuşağı Boyası (Rainbow Paint) - Restores colors
                            bossController.disableRoutine();
                            addCatchEffect(burakX, burakTop - 30, '🌈 Renkler Geri Döndü!', true);
                            
                            // Rainbow explosion
                            const rainbowColors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
                            for (let i = 0; i < 50; i++) {
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: (Math.random() - 0.5) * 12,
                                    vy: (Math.random() - 0.5) * 12,
                                    life: 2.0,
                                    color: rainbowColors[Math.floor(Math.random() * rainbowColors.length)],
                                    size: 6,
                                    sparkle: true
                                });
                            }
                            
                            // Screen flash
                            damageFlash = 0.8;
                            
                        } else if (ability === 'dark_reflection') {
                            // Boss 12: Final Boss - Special heart damages boss directly
                            addCatchEffect(burakX, burakTop - 30, '💖 AŞK GÜCÜ!', true);
                            
                            // Massive love explosion
                            for (let i = 0; i < 60; i++) {
                                const angle = (Math.PI * 2 / 60) * i;
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: Math.cos(angle) * 15,
                                    vy: Math.sin(angle) * 15,
                                    life: 2.5,
                                    color: ['#ff1744', '#f50057', '#ff4081', '#ff80ab'][Math.floor(Math.random() * 4)],
                                    size: 8,
                                    sparkle: true
                                });
                            }
                            
                            // Love beam to boss
                            for (let i = 0; i < 40; i++) {
                                const t = i / 40;
                                catchEffects.push({
                                    x: burakX + (bossX - burakX) * t,
                                    y: burakTop + (bossY - burakTop) * t,
                                    vx: (Math.random() - 0.5) * 3,
                                    vy: (Math.random() - 0.5) * 3,
                                    life: 2.0,
                                    color: ['#ff1744', '#fff'][Math.floor(Math.random() * 2)],
                                    size: 7,
                                    sparkle: true
                                });
                            }
                            
                            // Screen flash
                            damageFlash = 1.0;
                            
                        } else if (ability === 'shy') {
                            // Boss 1: Hediye - Bonus puan
                            gameScore += 100;
                            if (gameScoreEl) gameScoreEl.textContent = gameScore;
                            addCatchEffect(burakX, burakTop - 30, '+100 Bonus!', true);
                            
                        } else if (ability === 'excited') {
                            // Boss 2: Aşk Oku - Hız artışı
                            for (let i = 0; i < 5; i++) {
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: (Math.random() - 0.5) * 8,
                                    vy: -Math.random() * 5,
                                    life: 1.0,
                                    color: '#ff4444',
                                    size: 4,
                                    sparkle: true
                                });
                            }
                            addCatchEffect(burakX, burakTop - 30, '💨 Hız!', true);
                            
                        } else if (ability === 'dreamy') {
                            // Boss 3: Pembe Bulut - Yavaşlatma efekti
                            slowMoActive = true;
                            slowMoTimer = 3;
                            addCatchEffect(burakX, burakTop - 30, '⏳ Yavaşla!', true);
                            
                        } else if (ability === 'calm') {
                            // Boss 4: Beyaz Güvercin - Kalkan
                            shieldActive = true;
                            shieldTimer = 5;
                            addCatchEffect(burakX, burakTop - 30, '🛡️ Kalkan!', true);
                            
                        } else if (ability === 'angry') {
                            // Boss 5: Patlama - Ekrandaki tüm kırık kalpleri temizle
                            let cleared = 0;
                            for (let i = fallingHearts.length - 1; i >= 0; i--) {
                                if (fallingHearts[i].type.isBroken) {
                                    fallingHearts.splice(i, 1);
                                    cleared++;
                                }
                            }
                            if (cleared > 0) {
                                addCatchEffect(burakX, burakTop - 30, `💥 ${cleared} Temizlendi!`, true);
                            }
                            // Explosion effect
                            for (let i = 0; i < 15; i++) {
                                const angle = (Math.PI * 2 / 15) * i;
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: Math.cos(angle) * 6,
                                    vy: Math.sin(angle) * 6,
                                    life: 0.8,
                                    color: '#ff0000',
                                    size: 4
                                });
                            }
                            
                        } else if (ability === 'healing') {
                            // Boss 6: Işık - Can yenileme
                            gameLives = Math.min(5, gameLives + 1);
                            updateLivesDisplay();
                            addCatchEffect(burakX, burakTop - 30, '❤️ +1 Can!', true);
                            // Light burst
                            for (let i = 0; i < 12; i++) {
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: (Math.random() - 0.5) * 5,
                                    vy: -Math.random() * 4,
                                    life: 1.2,
                                    color: '#fbbf24',
                                    size: 3,
                                    sparkle: true
                                });
                            }
                            
                        } else if (ability === 'jealous') {
                            // Boss 7: Karanlık Kalp - Tüm kalpleri çek
                            magnetActive = true;
                            magnetTimer = 5;
                            addCatchEffect(burakX, burakTop - 30, '🧲 Mıknatıs!', true);
                            // Dark particles
                            for (let i = 0; i < 10; i++) {
                                catchEffects.push({
                                    x: burakX + (Math.random() - 0.5) * 100,
                                    y: burakTop + (Math.random() - 0.5) * 100,
                                    vx: 0,
                                    vy: -2,
                                    life: 1.0,
                                    color: '#7c3aed',
                                    size: 3
                                });
                            }
                            
                        } else if (ability === 'demon') {
                            // Boss 8: Cehennem Ateşi - Çift puan + Kombo koruma
                            doublePointsActive = true;
                            doublePointsTimer = 8;
                            streakProtectActive = true;
                            streakProtectTimer = 8;
                            addCatchEffect(burakX, burakTop - 30, '💫🔥 SÜPER GÜÇ!', true);
                            // Fire explosion
                            for (let i = 0; i < 20; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: Math.cos(angle) * (3 + Math.random() * 5),
                                    vy: Math.sin(angle) * (3 + Math.random() * 5),
                                    life: 1.5,
                                    color: ['#ff0000', '#ff4400', '#ff8800'][Math.floor(Math.random() * 3)],
                                    size: 5
                                });
                            }
                            
                        } else if (ability === 'rebirth') {
                            // Boss 9: Yıldız Tozu - Tüm güç-up'ları aktifleştir
                            shieldActive = true;
                            shieldTimer = 4;
                            magnetActive = true;
                            magnetTimer = 4;
                            addCatchEffect(burakX, burakTop - 30, '🌟 Yeniden Doğuş!', true);
                            // Butterfly particles
                            for (let i = 0; i < 15; i++) {
                                catchEffects.push({
                                    x: burakX + (Math.random() - 0.5) * 80,
                                    y: burakTop + (Math.random() - 0.5) * 80,
                                    vx: (Math.random() - 0.5) * 4,
                                    vy: -Math.random() * 3,
                                    life: 1.5,
                                    color: '#06b6d4',
                                    size: 3,
                                    sparkle: true
                                });
                            }
                            
                        } else if (ability === 'diamond') {
                            // Boss 10: Yüzük - Şimşek efekti (tüm kalpleri topla)
                            let collected = 0;
                            for (let i = fallingHearts.length - 1; i >= 0; i--) {
                                const heart = fallingHearts[i];
                                if (!heart.type.isBroken) {
                                    const earnedPoints = heart.type.points * gameCombo;
                                    gameScore += earnedPoints;
                                    waveScoreEarned += earnedPoints;
                                    totalHeartsCaught++;
                                    collected++;
                                    fallingHearts.splice(i, 1);
                                }
                            }
                            if (collected > 0) {
                                addCatchEffect(burakX, burakTop - 30, `💍 ${collected} Kalp!`, true);
                                if (gameScoreEl) gameScoreEl.textContent = gameScore;
                            }
                            // Diamond sparkles
                            for (let i = 0; i < 25; i++) {
                                catchEffects.push({
                                    x: burakX + (Math.random() - 0.5) * 120,
                                    y: burakTop + (Math.random() - 0.5) * 120,
                                    vx: 0,
                                    vy: -Math.random() * 2,
                                    life: 1.0,
                                    color: '#ffffff',
                                    size: 2,
                                    sparkle: true
                                });
                            }
                            
                        } else if (ability === 'wedding') {
                            // Boss 11: Kutlama - Kombo artışı
                            gameCombo = Math.min(gameCombo + 2, 10);
                            if (gameComboEl) gameComboEl.textContent = 'x' + gameCombo;
                            addCatchEffect(burakX, burakTop - 30, '🎊 Kombo +2!', true);
                            // Confetti explosion
                            for (let i = 0; i < 30; i++) {
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: (Math.random() - 0.5) * 8,
                                    vy: -Math.random() * 6,
                                    life: 2.0,
                                    color: ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'][Math.floor(Math.random() * 5)],
                                    size: 3
                                });
                            }
                            
                        } else if (ability === 'eternal') {
                            // Boss 12: Sonsuzluk - TÜM GÜÇ-UP'LAR + Bonus
                            shieldActive = true;
                            shieldTimer = 10;
                            magnetActive = true;
                            magnetTimer = 10;
                            doublePointsActive = true;
                            doublePointsTimer = 10;
                            streakProtectActive = true;
                            streakProtectTimer = 10;
                            precisionActive = true;
                            precisionTimer = 10;
                            gameScore += 500;
                            if (gameScoreEl) gameScoreEl.textContent = gameScore;
                            addCatchEffect(burakX, burakTop - 30, '♾️ SONSUZ GÜÇ!', true);
                            // Cosmic explosion
                            for (let i = 0; i < 50; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                catchEffects.push({
                                    x: burakX,
                                    y: burakTop,
                                    vx: Math.cos(angle) * (5 + Math.random() * 8),
                                    vy: Math.sin(angle) * (5 + Math.random() * 8),
                                    life: 2.0,
                                    color: ['#a855f7', '#06b6d4', '#ffffff', '#fbbf24', '#ff4444'][Math.floor(Math.random() * 5)],
                                    size: 5,
                                    sparkle: true
                                });
                            }
                        }
                        
                        // Extra visual feedback
                        damageFlash = 0.3;
                    } else {
                        addCatchEffect(h.x, burakTop, earned, true);
                        playSound('catch');
                    }

                    // Haptic feedback on catch
                    if (h.type.isDiamond || h.type.isGold) {
                        HapticFeedback.diamondCatch();
                    } else if (h.type.isBroken) {
                        HapticFeedback.error();
                    } else {
                        HapticFeedback.heartCatch();
                    }

                    // Happy character bounce + Sparkle burst
                    if (burakEl) {
                        burakEl.style.transform = `translate3d(${burakX - 50}px, -15px, 0) scale(1.1) rotate(${Math.sin(gameTime * 15) * 5}deg)`;
                        setTimeout(() => {
                            if (gameActive && !gamePaused) {
                                // Reset to base animation in next frame
                            }
                        }, 150);

                        // Sparkle burst around Burak 
                        if (!h.type.isBroken) {
                            for (let s = 0; s < 5; s++) {
                                catchEffects.push({
                                    x: burakX + (Math.random() - 0.5) * 60,
                                    y: burakTop + (Math.random() - 0.5) * 40,
                                    vx: (Math.random() - 0.5) * 3,
                                    vy: -Math.random() * 2 - 1,
                                    life: 0.8,
                                    color: ['#ffeb3b', '#ff9800', '#fff', '#ff6b88'][Math.floor(Math.random() * 4)],
                                    size: Math.random() * 3 + 1,
                                    sparkle: true
                                });
                            }
                        }
                    }
                    if (bernaEl) {
                        bernaEl.style.transform = `translate3d(${bernaX - 50}px, 0, 0) scale(1.1)`;
                        setTimeout(() => { bernaEl.style.transform = ''; }, 200);
                    }

                    checkWaveProgress();
                }

                if (gameComboEl) gameComboEl.textContent = 'x' + gameCombo;
                fallingHearts.splice(i, 1);
                continue;
            }

            // Missed hearts
            if (h.y > gameH + 20) {
                if (!h.type.isBroken) {
                    // Streak Protector prevents combo loss
                    if (!streakProtectActive) {
                        gameConsecutiveCatches = 0;
                        gameCombo = 1;
                        if (gameComboEl) gameComboEl.textContent = 'x1';
                    } else {
                        // Show protection effect
                        addCatchEffect(gameW / 2, gameH - 50, '🔥 Korundu!', true);
                    }
                }
                fallingHearts.splice(i, 1);
                continue;
            }

            // Draw heart (Optimized & Enhanced Visual Distinction)
            // Skip if no type defined
            if (!h.type) {
                continue;
            }
            
            gameCtx.save();
            let drawX = h.x;
            let drawY = h.y;

            if (h.type.isBroken) {
                // Jitter effect for broken hearts
                drawX += (Math.random() - 0.5) * 3;
                drawY += (Math.random() - 0.5) * 3;

                // Dark pulsing aura
                const auraSize = h.type.size * (1.2 + Math.sin(gameTime * 10) * 0.1);
                const gradient = gameCtx.createRadialGradient(drawX, drawY, 0, drawX, drawY, auraSize);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                gameCtx.fillStyle = gradient;
                gameCtx.beginPath();
                gameCtx.arc(drawX, drawY, auraSize, 0, Math.PI * 2);
                gameCtx.fill();
            } else {
                // Soft glow for good/special hearts
                const glowSize = h.type.size * (1.3 + Math.sin(gameTime * 5) * 0.1);
                const gradient = gameCtx.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowSize);
                const glowColor = h.type.isGold ? 'rgba(255, 215, 0, 0.3)' :
                    h.type.isIce ? 'rgba(0, 255, 255, 0.3)' :
                        'rgba(255, 182, 193, 0.3)';
                gradient.addColorStop(0, glowColor);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                gameCtx.fillStyle = gradient;
                gameCtx.beginPath();
                gameCtx.arc(drawX, drawY, glowSize, 0, Math.PI * 2);
                gameCtx.fill();
            }

            gameCtx.translate(drawX, drawY);
            gameCtx.rotate(h.rotation);
            gameCtx.font = `${h.type.size}px serif`;
            gameCtx.textAlign = 'center';
            gameCtx.textBaseline = 'middle';
            // iOS Fix: Reset fillStyle
            gameCtx.fillStyle = '#000000';
            gameCtx.fillText(h.type.emoji, 0, 0);
            gameCtx.restore();
        }

        // Update & draw power-ups (Enhanced with glow aura)
        for (let i = gamePowerUps.length - 1; i >= 0; i--) {
            const pu = gamePowerUps[i];
            pu.y += pu.vy;
            pu.glow = Math.sin(gameTime * 5) * 0.3 + 0.7;

            // Power-up collision (Widened range and debugged)
            // Debug collision: Check if Burak is close enough horizontally and vertically
            const xDist = Math.abs(pu.x - burakX);
            const yDist = Math.abs(pu.y - (burakTop + 30)); // Center of Burak

            if (yDist < 60 && xDist < 60) {
                console.log('Power-up caught:', pu.type.type);
                playSound('powerup'); // Power-up sound
                HapticFeedback.powerup();
                activatePowerUp(pu.type.type);
                gamePowerUps.splice(i, 1);
                continue;
            }

            if (pu.y > gameH + 30) {
                gamePowerUps.splice(i, 1);
                continue;
            }

            gameCtx.save();

            // Glow aura behind power-up
            const glowRadius = 30 + Math.sin(gameTime * 6) * 8;
            const auraGradient = gameCtx.createRadialGradient(pu.x, pu.y, 0, pu.x, pu.y, glowRadius);
            auraGradient.addColorStop(0, `rgba(255, 255, 100, ${0.25 * pu.glow})`);
            auraGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
            gameCtx.fillStyle = auraGradient;
            gameCtx.beginPath();
            gameCtx.arc(pu.x, pu.y, glowRadius, 0, Math.PI * 2);
            gameCtx.fill();
            gameCtx.translate(pu.x, pu.y);
            gameCtx.globalAlpha = pu.glow;
            gameCtx.font = `${pu.type.size}px serif`;
            gameCtx.textAlign = 'center';
            gameCtx.textBaseline = 'middle';
            // iOS Fix: Reset fillStyle
            gameCtx.fillStyle = '#000000';
            gameCtx.fillText(pu.type.emoji, 0, 0);
            gameCtx.globalAlpha = 1;
            gameCtx.restore();
        }

        // Update timers
        if (invulnerableTimer > 0) {
            invulnerableTimer -= dt;
        }
        
        // Update boss controller effects
        if (bossActive && bossController) {
            bossController.updateFreezeEffect(dt);
            
            // Check lava bomb collision
            if (bossController.isInLavaBomb(burakX, burakTop)) {
                // Player is standing in lava - take damage
                if (invulnerableTimer <= 0) {
                    takeDamage();
                    addCatchEffect(burakX, burakTop - 30, '🔥 LAV!', false);
                }
            }
            
            // Check poison zone collision
            if (bossController.isInPoison(burakX, burakTop)) {
                // Player is in poison - take damage over time
                if (invulnerableTimer <= 0 && gameFrameCount % 60 === 0) { // Damage every second
                    takeDamage();
                    addCatchEffect(burakX, burakTop - 30, '☠️ ZEHİR!', false);
                }
            }
        }
        
        if (shieldActive) {
            shieldTimer -= dt;
            if (shieldTimer <= 0) { shieldActive = false; }
        }
        if (magnetActive) {
            magnetTimer -= dt;
            if (magnetTimer <= 0) { magnetActive = false; }
        }
        if (slowMoActive) {
            slowMoTimer -= dt * 2;
            if (slowMoTimer <= 0) { slowMoActive = false; }
        }
        if (loveBlastActive) {
            loveBlastTimer -= dt;
            if (loveBlastTimer <= 0) { loveBlastActive = false; }
        }
        if (doublePointsActive) {
            doublePointsTimer -= dt;
            if (doublePointsTimer <= 0) { doublePointsActive = false; }
        }
        if (precisionActive) {
            precisionTimer -= dt;
            if (precisionTimer <= 0) { precisionActive = false; }
        }
        if (streakProtectActive) {
            streakProtectTimer -= dt;
            if (streakProtectTimer <= 0) { streakProtectActive = false; }
        }

        // Draw Burak (DOM Transform + Canvas Effects)

        // 1. Draw effects on Canvas (behind/around the DOM element)
        gameCtx.save();

        // Catch area indicator for new players (first 3 seconds)
        if (gameTime < 3) {
            const areaAlpha = Math.max(0, 1 - gameTime / 3) * 0.3;
            gameCtx.strokeStyle = `rgba(255, 107, 136, ${areaAlpha})`;
            gameCtx.lineWidth = 2;
            gameCtx.setLineDash([5, 5]);
            gameCtx.beginPath();
            gameCtx.arc(burakX, burakTop, BURAK_CATCH_W / 2 + 10, 0, Math.PI * 2);
            gameCtx.stroke();
            gameCtx.setLineDash([]);

            // Label
            gameCtx.font = '10px Montserrat, sans-serif';
            gameCtx.fillStyle = `rgba(255, 204, 213, ${areaAlpha})`;
            gameCtx.textAlign = 'center';
            gameCtx.fillText('Yakalama Alanı', burakX, burakTop + BURAK_SPRITE_SIZE / 2 + 20);
        }

        // Flashing effect when invulnerable (Canvas only affects what we draw here, not DOM)
        // For DOM transparency, we need to set opacity on the element
        if (invulnerableTimer > 0 && Math.floor(gameTime * 10) % 2 === 0) {
            if (burakEl) burakEl.style.opacity = 0.5;
        } else {
            if (burakEl) burakEl.style.opacity = 1.0;
        }

        // Shield effect (Canvas)
        if (shieldActive) {
            gameCtx.strokeStyle = `rgba(100, 200, 255, ${0.4 + Math.sin(gameTime * 6) * 0.2})`;
            gameCtx.lineWidth = 3;
            gameCtx.beginPath();
            gameCtx.arc(burakX, burakTop, BURAK_SPRITE_SIZE / 2 + 10, 0, Math.PI * 2);
            gameCtx.stroke();
        }

        // Magnet aura (Canvas)
        if (magnetActive) {
            gameCtx.strokeStyle = `rgba(255, 180, 50, ${0.3 + Math.sin(gameTime * 8) * 0.2})`;
            gameCtx.lineWidth = 2;
            gameCtx.setLineDash([5, 5]);
            gameCtx.beginPath();
            gameCtx.arc(burakX, burakTop, BURAK_SPRITE_SIZE / 2 + 20, 0, Math.PI * 2);
            gameCtx.stroke();
            gameCtx.setLineDash([]);
        }

        // Double Points aura (Canvas)
        if (doublePointsActive) {
            gameCtx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(gameTime * 10) * 0.3})`;
            gameCtx.lineWidth = 4;
            gameCtx.beginPath();
            gameCtx.arc(burakX, burakTop, BURAK_SPRITE_SIZE / 2 + 15, 0, Math.PI * 2);
            gameCtx.stroke();
            
            // Sparkles around character
            if (gameFrameCount % 3 === 0) {
                const angle = Math.random() * Math.PI * 2;
                const dist = BURAK_SPRITE_SIZE / 2 + 15;
                catchEffects.push({
                    x: burakX + Math.cos(angle) * dist,
                    y: burakTop + Math.sin(angle) * dist,
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2,
                    life: 0.5,
                    color: '#ffd700',
                    size: 3,
                    sparkle: true
                });
            }
        }

        // Precision targeting lines (Canvas)
        if (precisionActive) {
            gameCtx.save();
            gameCtx.strokeStyle = `rgba(255, 100, 100, ${0.2 + Math.sin(gameTime * 8) * 0.1})`;
            gameCtx.lineWidth = 1;
            gameCtx.setLineDash([3, 3]);
            
            // Draw lines to nearby hearts
            fallingHearts.forEach(h => {
                if (!h.type.isBroken && Math.abs(h.x - burakX) < 200) {
                    gameCtx.beginPath();
                    gameCtx.moveTo(burakX, burakTop);
                    gameCtx.lineTo(h.x, h.y);
                    gameCtx.stroke();
                }
            });
            
            gameCtx.setLineDash([]);
            gameCtx.restore();
        }

        // Streak Protect indicator (Canvas)
        if (streakProtectActive) {
            gameCtx.save();
            gameCtx.font = 'bold 24px Montserrat';
            gameCtx.fillStyle = `rgba(255, 100, 50, ${0.6 + Math.sin(gameTime * 8) * 0.3})`;
            gameCtx.textAlign = 'center';
            gameCtx.shadowColor = 'rgba(255, 100, 50, 0.8)';
            gameCtx.shadowBlur = 10;
            gameCtx.fillText('🔥', burakX, burakTop - BURAK_SPRITE_SIZE / 2 - 20);
            gameCtx.restore();
        }

        gameCtx.restore();

        // Pulsing Combo Counter on Canvas (Enhanced with color cycling and screen edge effects)
        if (gameCombo >= 2) {
            gameCtx.save();
            const comboPulse = 1 + Math.sin(gameTime * 10) * 0.15;
            const comboHue = gameCombo >= 4 ? (340 + gameTime * 60) % 360 : 345;
            gameCtx.translate(gameW - 80, 100);
            gameCtx.scale(comboPulse, comboPulse);
            gameCtx.font = `bold ${36 + gameCombo * 2}px Montserrat`;
            gameCtx.fillStyle = `hsl(${comboHue}, 100%, 65%)`;
            gameCtx.shadowColor = `hsla(${comboHue}, 100%, 50%, 0.6)`;
            gameCtx.shadowBlur = 20;
            gameCtx.textAlign = 'center';
            gameCtx.fillText('x' + gameCombo, 0, 0);
            gameCtx.font = 'bold 14px Montserrat';
            gameCtx.fillStyle = '#ffccd5';
            gameCtx.shadowBlur = 0;
            gameCtx.fillText('COMBO!', 0, 22);
            gameCtx.restore();
            
            // Screen edge glow effects for high combos
            if (gameCombo >= 3) {
                gameCtx.save();
                const glowIntensity = (gameCombo - 2) * 0.15;
                const glowPulse = 0.5 + Math.sin(gameTime * 8) * 0.3;
                
                // Top edge glow
                const topGradient = gameCtx.createLinearGradient(0, 0, 0, 80);
                topGradient.addColorStop(0, `hsla(${comboHue}, 100%, 60%, ${glowIntensity * glowPulse})`);
                topGradient.addColorStop(1, 'transparent');
                gameCtx.fillStyle = topGradient;
                gameCtx.fillRect(0, 0, gameW, 80);
                
                // Bottom edge glow
                const bottomGradient = gameCtx.createLinearGradient(0, gameH - 80, 0, gameH);
                bottomGradient.addColorStop(0, 'transparent');
                bottomGradient.addColorStop(1, `hsla(${comboHue}, 100%, 60%, ${glowIntensity * glowPulse})`);
                gameCtx.fillStyle = bottomGradient;
                gameCtx.fillRect(0, gameH - 80, gameW, 80);
                
                // Side glows for combo 4+
                if (gameCombo >= 4) {
                    const leftGradient = gameCtx.createLinearGradient(0, 0, 60, 0);
                    leftGradient.addColorStop(0, `hsla(${comboHue}, 100%, 60%, ${glowIntensity * glowPulse * 0.7})`);
                    leftGradient.addColorStop(1, 'transparent');
                    gameCtx.fillStyle = leftGradient;
                    gameCtx.fillRect(0, 0, 60, gameH);
                    
                    const rightGradient = gameCtx.createLinearGradient(gameW - 60, 0, gameW, 0);
                    rightGradient.addColorStop(0, 'transparent');
                    rightGradient.addColorStop(1, `hsla(${comboHue}, 100%, 60%, ${glowIntensity * glowPulse * 0.7})`);
                    gameCtx.fillStyle = rightGradient;
                    gameCtx.fillRect(gameW - 60, 0, 60, gameH);
                }
                
                gameCtx.restore();
            }
        }

        // Update and draw boss projectiles
        if (bossActive) {
            updateBossProjectiles(dt);
            
            // Draw BossController visual effects
            bossController.drawLavaBombs(gameCtx);
            bossController.drawFreezeEffect(gameCtx, gameW, gameH);
            bossController.drawPoisonZones(gameCtx);
            bossController.drawGlitchEffect(gameCtx, gameW, gameH, gameTime);
            
            // Draw fog effect (needs player position)
            bossController.drawFogEffect(gameCtx, gameW, gameH, burakX, burakTop);
            
            // Draw ego wall (needs boss position)
            const bossConfig = WAVES[currentWave - 1]?.boss || {};
            bossController.drawEgoWall(gameCtx, gameW, gameH, bossX, bossY);
            
            // Draw Final Boss platforms (Phase 3)
            if (bossPhase === 3 && bossConfig.ability === 'dark_reflection') {
                bossController.drawFinalBossPlatforms(gameCtx);
            }
            
            // Draw Final Boss beam attack
            if (bossController.finalBeamActive) {
                const beamComplete = bossController.updateFinalBeam(dt);
                bossController.drawFinalBeam(gameCtx, gameW, gameH, burakX, burakTop, bernaX, bernaY, bossX, bossY);
                
                // Defeat boss when beam completes
                if (beamComplete) {
                    defeatBoss();
                }
            }
            
            // Apply grayscale filter (Boss 11: Routine)
            if (bossController.grayscaleActive) {
                bossController.applyGrayscaleFilter(gameCtx, gameW, gameH);
            }
        }

        // Draw HUD Stats (Canvas)
        gameCtx.save();
        gameCtx.font = '14px Montserrat';
        gameCtx.fillStyle = 'rgba(255,255,255,0.7)';
        gameCtx.textAlign = 'left';
        gameCtx.fillText(`❤️ ${totalHeartsCaught}`, 20, gameH - 20);
        gameCtx.textAlign = 'right';
        gameCtx.fillText(`💀 ${bossesDefeated}`, gameW - 20, gameH - 20);
        gameCtx.restore();

        // 2. Update DOM Position for GIF
        if (burakEl) {
            // Calculate movement tilt
            const burakVel = burakX - (window.lastBurakX || burakX);
            window.lastBurakX = burakX;
            const tiltAngle = Math.max(-10, Math.min(10, burakVel * 0.5)); // degrees

            // Breathing
            const breatheScale = 1.0 + Math.sin(gameTime * 3) * 0.02;

            // Catch reaction
            const excitement = Math.min(0.2, gameCombo * 0.02);
            let jumpOffset = Math.abs(Math.sin(gameTime * 10)) * (excitement * 20);
            
            // Final Boss Phase 3: Use platform Y position
            let yPosition = -jumpOffset;
            if (bossActive && bossPhase === 3 && window.finalBossJumpEnabled) {
                yPosition = -(gameH - window.playerY - 20); // Convert to bottom-relative
            }

            // Apply transform
            // Note: Burak is positioned bottom:20px. We translate X. And Y for jump.
            // We need to subtract half width (50px) to center it on burakX
            burakEl.style.transform = `translate3d(${burakX - 50}px, ${yPosition}px, 0) rotate(${tiltAngle}deg) scale(${breatheScale}, ${breatheScale + excitement})`;

            // Dynamic drop shadow via CSS filter
            burakEl.style.filter = `drop-shadow(0 15px 10px rgba(0,0,0,0.5))`;
        }

        /* 
           CANVAS DRAWING OF BURAK REMOVED
           (Previous drawImage(burakImg) code deleted)
        */

        // Draw catch effects (Optimized)
        let lastFont = '';
        let lastAlign = '';
        let lastAlpha = -1;

        for (let i = catchEffects.length - 1; i >= 0; i--) {
            const e = catchEffects[i];
            e.x += e.vx;
            e.y += e.vy;
            e.life -= 0.025;

            if (e.life <= 0) { catchEffects.splice(i, 1); continue; }

            if (e.life !== lastAlpha) {
                gameCtx.globalAlpha = e.life;
                lastAlpha = e.life;
            }

            if (e.isText) {
                const font = `bold ${e.size}px Montserrat, sans-serif`;
                if (font !== lastFont) {
                    gameCtx.font = font;
                    lastFont = font;
                }
                if (lastAlign !== 'center') {
                    gameCtx.textAlign = 'center';
                    lastAlign = 'center';
                }
                gameCtx.fillStyle = e.color;
                gameCtx.fillText(e.text, e.x, e.y);
            } else if (e.isRing) {
                gameCtx.strokeStyle = e.color;
                gameCtx.lineWidth = 2;
                gameCtx.beginPath();
                gameCtx.arc(e.x, e.y, e.size * (1 + (1 - e.life) * 2), 0, Math.PI * 2);
                gameCtx.stroke();
            } else {
                gameCtx.fillStyle = e.color;
                if (e.sparkle && Math.random() > 0.5) gameCtx.fillStyle = '#fff';
                gameCtx.beginPath();
                gameCtx.arc(e.x, e.y, e.size * e.life, 0, Math.PI * 2);
                gameCtx.fill();
            }
        }
        gameCtx.globalAlpha = 1.0;

        // Wave Progress Bar (above ground line)
        if (!bossActive) {
            const config = getCurrentWaveConfig();
            const target = config.scoreTarget;
            if (target !== Infinity) {
                const progress = Math.min(1, waveScoreEarned / target);
                const barW = gameW - 40;
                const barH = 6;
                const barY = gameH - 18;
                const barX = 20;

                // Track background
                gameCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                gameCtx.beginPath();
                gameCtx.roundRect(barX, barY, barW, barH, 3);
                gameCtx.fill();

                // Progress fill
                if (progress > 0) {
                    const grad = gameCtx.createLinearGradient(barX, 0, barX + barW * progress, 0);
                    grad.addColorStop(0, '#ff6b88');
                    grad.addColorStop(1, '#a855f7');
                    gameCtx.fillStyle = grad;
                    gameCtx.beginPath();
                    gameCtx.roundRect(barX, barY, barW * progress, barH, 3);
                    gameCtx.fill();
                }

                // Label
                gameCtx.font = '10px Montserrat, sans-serif';
                gameCtx.fillStyle = 'rgba(255, 204, 213, 0.6)';
                gameCtx.textAlign = 'center';
                gameCtx.fillText(`${Math.floor(progress * 100)}% → BOSS`, gameW / 2, barY - 4);
            }
        }

        // Ground line
        gameCtx.fillStyle = 'rgba(255, 77, 109, 0.15)';
        gameCtx.fillRect(0, gameH - 5, gameW, 5);

        // Active power-up indicators
        if (shieldActive || magnetActive || slowMoActive || loveBlastActive) {
            let indicators = [];
            if (shieldActive) indicators.push('🛡️ ' + Math.ceil(shieldTimer) + 's');
            if (magnetActive) indicators.push('🧲 ' + Math.ceil(magnetTimer) + 's');
            if (slowMoActive) indicators.push('⏳ ' + Math.ceil(slowMoTimer) + 's');
            if (loveBlastActive) indicators.push('🌈 ' + Math.ceil(loveBlastTimer) + 's');
            gameCtx.font = '14px Montserrat, sans-serif';
            gameCtx.fillStyle = '#ffe5ec';
            gameCtx.textAlign = 'center';
            gameCtx.globalAlpha = 0.8;
            gameCtx.fillText(indicators.join('  '), gameW / 2, gameH - 12);
            gameCtx.globalAlpha = 1;
        }


        gameAnimFrame = requestAnimationFrame(gameLoop);
    }

    // ----------------------------
    // Game Controls
    // ----------------------------
    function handleGamePointerMove(e) {
        if (!gameActive) return;
        
        // Check if player is frozen by boss
        if (bossController && bossController.isPlayerFrozen()) {
            return; // Can't move when frozen
        }
        
        e.preventDefault();
        const rect = gameCanvas.getBoundingClientRect();
        let clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }
        
        // Check if player is frozen (Boss 3)
        if (bossController && bossController.isPlayerFrozen()) {
            return; // No movement when frozen
        }
        
        // Calculate target position
        let targetX = clientX - rect.left;
        
        // Apply inverted controls (Boss 5)
        if (bossController && bossController.invertedControls) {
            const centerX = gameW / 2;
            const offset = targetX - centerX;
            targetX = centerX - offset; // Invert around center
        }
        
        // Apply slow debuff from boss
        const slowMultiplier = bossController ? bossController.getSlowMultiplier() : 1.0;
        
        // Smooth movement with slow effect
        // Use a smaller interpolation factor when slowed
        const baseSpeed = 0.3; // Base interpolation speed
        const moveSpeed = baseSpeed * slowMultiplier;
        const oldBurakX = burakX;
        const dx = (targetX - burakX) * moveSpeed;
        burakX = Math.max(BURAK_SPRITE_SIZE / 2, Math.min(gameW - BURAK_SPRITE_SIZE / 2, burakX + dx));
        
        // Track kinetic charge for Boss 4
        if (bossActive && bossController) {
            const playerVelocityX = burakX - oldBurakX;
            const kineticCharge = bossController.updateKineticCharge(playerVelocityX, dt);
            
            // Auto-damage boss when fully charged
            if (bossController.isKineticCharged()) {
                damageBoss(1, 'kinetic');
                bossController.kineticCharge = 0; // Reset charge
                addCatchEffect(burakX, burakTop - 30, '⚡ KİNETİK ŞARJ!', true);
            }
        }
    }

    if (gameCanvas) {
        gameCanvas.addEventListener('mousemove', handleGamePointerMove);
        gameCanvas.addEventListener('touchmove', handleGamePointerMove, { passive: false });
        gameCanvas.addEventListener('touchstart', (e) => {
            if (!gameActive) return;
            e.preventDefault();
            
            // Jump control for Final Boss Phase 3
            if (bossActive && bossPhase === 3 && window.finalBossJumpEnabled) {
                window.tapJump = true;
            }
            
            handleGamePointerMove(e);
        }, { passive: false });
        
        // Keyboard jump control for desktop
        document.addEventListener('keydown', (e) => {
            if (!gameActive) return;
            if (e.code === 'Space' && bossActive && bossPhase === 3 && window.finalBossJumpEnabled) {
                window.jumpPressed = true;
                e.preventDefault();
            }
        });
    }

    // ----------------------------
    // Mobile Loading Screen (Only for Game)
    // ----------------------------
    function showGameLoadingScreen() {
        // Create loading screen dynamically
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'game-loading';
        loadingDiv.className = 'mobile-loading';
        loadingDiv.innerHTML = `
            <div class="loading-heart">❤️</div>
            <div class="loading-text">Oyun Hazırlanıyor...</div>
        `;
        document.body.appendChild(loadingDiv);
        
        // Hide after a short delay (game initialization time)
        setTimeout(() => {
            loadingDiv.classList.add('hidden');
            setTimeout(() => loadingDiv.remove(), 500);
        }, 800);
    }

    // ----------------------------
    // Start / End / Close Game
    // ----------------------------
    function startGame() {
        if (gameActive) {
            console.log("startGame ignored: game already active");
            return;
        }
        
        // Stop main menu music (dilerimki.mp3) and start game music
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0; // Reset to beginning
        }
        startGameMusic();
        
        // Show loading screen only on mobile and only when starting game
        if (isMobile) {
            showGameLoadingScreen();
        }
        
        // Hide main menu and show game elements
        if (mainMenu) mainMenu.classList.add('hidden');
        
        const gameCanvas = document.getElementById('game-canvas');
        const gameHud = document.querySelector('.game-hud');
        const gameChars = document.getElementById('game-characters');
        const gameCloseBtn = document.getElementById('game-close');
        const gamePauseBtn = document.getElementById('game-pause');
        
        if (gameCanvas) gameCanvas.style.display = 'block';
        if (gameHud) gameHud.style.display = 'flex';
        if (gameChars) gameChars.style.display = 'block';
        if (gameCloseBtn) gameCloseBtn.style.display = 'block';
        if (gamePauseBtn) gamePauseBtn.style.display = 'block';
        
        gameSessionId++;
        const currentSession = gameSessionId;
        console.log("Starting game session:", currentSession);

        // Tutorial check
        if (!localStorage.getItem('bernaGameTutorialSeen')) {
            if (gameTutorial) {
                gameTutorial.classList.add('active');
                setTimeout(() => {
                    gameTutorial.addEventListener('click', () => {
                        gameTutorial.classList.remove('active');
                        localStorage.setItem('bernaGameTutorialSeen', 'true');
                    }, { once: true });
                }, 100);
            }
        }
        gameActive = true;
        gameScore = 0;
        waveScoreEarned = 0;
        gameLives = 5;
        gameCombo = 1;
        gameConsecutiveCatches = 0;
        currentWave = 1;
        fallingHearts = [];
        catchEffects = [];
        gamePowerUps = [];
        gameTime = 0;
        gameFrameCount = 0;
        damageFlash = 0;
        invulnerableTimer = 0;
        shieldActive = false;
        magnetActive = false;
        slowMoActive = false;
        bernaX = 0;
        bernaDir = 1;

        // Reset Stats
        totalHeartsCaught = 0;
        longestCombo = 0;
        bossesDefeated = 0;
        bossActive = false;
        bossWarningShown = false;
        bossIntroTimer = 0;
        bossDefeatedTimer = 0;
        bossPhase = 1;
        bossLastDamageTime = 0;
        gamePaused = false;
        
        // Initialize Achievement System for new game
        if (achievementSystem) {
            achievementSystem.incrementStat('totalGamesPlayed');
            achievementSystem.stats.currentWaveDamage = 0;
            achievementSystem.stats.gameStartTime = Date.now();
        }
        
        // Reset Boss Controller
        if (bossController) {
            bossController.reset();
            bossController.ctx.gameW = gameW;
            bossController.ctx.gameH = gameH;
        }

        // Reset HUD
        if (statHeartsEl) statHeartsEl.textContent = '0';
        if (statComboEl) statComboEl.textContent = '0';
        if (statBossesEl) statBossesEl.textContent = '0';

        if (gameScoreEl) gameScoreEl.textContent = '0';
        if (gameWaveEl) gameWaveEl.textContent = '1';
        if (gameWaveNameEl) gameWaveNameEl.textContent = WAVES[0].name;
        if (gameComboEl) gameComboEl.textContent = 'x1';
        updateLivesDisplay();
        if (gameOverScreen) gameOverScreen.classList.remove('active');

        if (gameOverlay) gameOverlay.classList.add('active');

        // Initialize dimensions after overlay is active to get real measurements
        resizeGameCanvas();
        console.log("Game dimensions initialized:", gameW, gameH);

        burakX = gameW / 2;
        bernaX = gameW / 2;
        initGameStars();

        // Final sync after active class is fully applied
        requestAnimationFrame(() => {
            resizeGameCanvas();
            console.log("Game dimensions sync:", gameW, gameH);
        });

        console.log("startGame complete, gameActive:", gameActive);

        setTimeout(() => {
            showWaveBanner(WAVES[0].name, WAVES[0].desc);
        }, 300);

        cancelAnimationFrame(gameAnimFrame);
        gameLoop(currentSession);
    }

    function endGame() {
        console.log("endGame called, score:", gameScore);
        gameActive = false;
        cancelAnimationFrame(gameAnimFrame);
        
        // Achievement tracking - Update final stats
        if (achievementSystem) {
            achievementSystem.updateStat('highScore', gameScore);
            achievementSystem.updateStat('highestWave', currentWave);
            
            // Check if game completed (reached wave 12)
            if (currentWave >= 12) {
                achievementSystem.updateStat('gameCompleted', true);
            }
        }
        
        // Stop game music and resume main menu music (dilerimki.mp3)
        // Only resume if we haven't played the easter egg yet
        stopGameMusic();
        if (bgMusic && settings.music && state !== 'MAIN') {
            bgMusic.currentTime = 0; // Start from beginning
            bgMusic.play().catch(e => console.log("Audio prevented"));
            isMusicPlaying = true;
        }

        // High Score Logic
        const currentHigh = parseInt(localStorage.getItem('bernaGameHighScore') || '0');
        if (gameScore > currentHigh) {
            localStorage.setItem('bernaGameHighScore', gameScore);
            if (gameHighscoreText) gameHighscoreText.textContent = "🏆 YENİ REKOR!";
            playSound('levelup'); // Celebration sound
        } else {
            if (gameHighscoreText) gameHighscoreText.textContent = `En Yüksek: ${currentHigh}`;
        }

        // Stats Display
        if (statHeartsEl) statHeartsEl.textContent = totalHeartsCaught;
        if (statComboEl) statComboEl.textContent = longestCombo;
        if (statTimeEl) statTimeEl.textContent = Math.floor(gameTime) + 's';
        if (statBossesEl) statBossesEl.textContent = bossesDefeated;

        // Animated Score Counter (slot machine effect)
        if (finalScoreEl) {
            finalScoreEl.textContent = '0';
            const targetScore = gameScore;
            const duration = 1500; // 1.5 seconds
            const startTime = performance.now();

            function animateScore(now) {
                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / duration);
                // Ease-out curve for satisfying deceleration
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(targetScore * eased);
                finalScoreEl.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(animateScore);
                } else {
                    finalScoreEl.textContent = targetScore;
                }
            }
            requestAnimationFrame(animateScore);
        }

        if (finalWaveEl) finalWaveEl.textContent = currentWave;
        if (gameOverMsgEl) gameOverMsgEl.textContent = GAME_OVER_MESSAGES[Math.floor(Math.random() * GAME_OVER_MESSAGES.length)];

        if (gameOverTitle) {
            if (currentWave >= 7) {
                gameOverTitle.textContent = '♾️ Sonsuza Dek!';
            } else if (currentWave >= 5) {
                gameOverTitle.textContent = '💪 Harika Mücadele!';
            } else if (currentWave >= 3) {
                gameOverTitle.textContent = '💫 İyi Deneme!';
            } else {
                gameOverTitle.textContent = '💔 Oyun Bitti!';
            }
        }

        if (gameOverScreen) gameOverScreen.classList.add('active');
    }

    function closeGame() {
        gameActive = false;
        cancelAnimationFrame(gameAnimFrame);
        if (gameOverScreen) gameOverScreen.classList.remove('active');
        if (gamePausedScreen) gamePausedScreen.classList.remove('active');
        
        // Keep game overlay open but show main menu
        // (Main menu is inside game overlay)
        if (mainMenu) mainMenu.classList.remove('hidden');
        
        // Hide game canvas and HUD
        const gameCanvas = document.getElementById('game-canvas');
        const gameHud = document.querySelector('.game-hud');
        const gameChars = document.getElementById('game-characters');
        const gameCloseBtn = document.getElementById('game-close');
        const gamePauseBtn = document.getElementById('game-pause');
        
        if (gameCanvas) gameCanvas.style.display = 'none';
        if (gameHud) gameHud.style.display = 'none';
        if (gameChars) gameChars.style.display = 'none';
        if (gameCloseBtn) gameCloseBtn.style.display = 'none';
        if (gamePauseBtn) gamePauseBtn.style.display = 'none';
        
        // Stop game music and resume main menu music (dilerimki.mp3)
        // Only resume if we haven't played the easter egg yet
        stopGameMusic();
        if (bgMusic && settings.music && state !== 'MAIN') {
            bgMusic.currentTime = 0; // Start from beginning
            bgMusic.play().catch(e => console.log("Audio prevented"));
            isMusicPlaying = true;
        }
    }

    // ----------------------------
    // Event Listeners
    // ----------------------------
    // Event Listeners (Already defined above or consolidated)
    if (gameCloseBtn) {
        gameCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeGame();
        });
    }

    if (gameRestartBtn) {
        gameRestartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startGame();
        });
    }

    if (gameQuitBtn) {
        gameQuitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeGame();
        });
    }
    
    // Stats Modal
    if (gameStatsBtn) {
        gameStatsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openStatsModal();
        });
    }
    
    if (statsClose) {
        statsClose.addEventListener('click', () => {
            closeStatsModal();
        });
    }
    
    if (statsModal) {
        statsModal.addEventListener('click', (e) => {
            if (e.target === statsModal) {
                closeStatsModal();
            }
        });
    }
    
    // Stats tabs
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.stats-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
    
    function openStatsModal() {
        if (!statsModal) {
            console.error('Stats modal element not found');
            return;
        }
        
        if (!achievementSystem) {
            console.error('Achievement system not initialized');
            // Show modal anyway with default values
            statsModal.classList.add('active');
            return;
        }
        
        // Update stats
        const stats = achievementSystem.stats;
        const highScoreEl = document.getElementById('total-high-score');
        const heartsEl = document.getElementById('total-hearts');
        const bossesEl = document.getElementById('total-bosses');
        const comboEl = document.getElementById('total-combo');
        const gamesEl = document.getElementById('total-games');
        const waveEl = document.getElementById('highest-wave');
        
        if (highScoreEl) highScoreEl.textContent = stats.highScore;
        if (heartsEl) heartsEl.textContent = stats.totalHeartsCaught;
        if (bossesEl) bossesEl.textContent = stats.totalBossesDefeated;
        if (comboEl) comboEl.textContent = stats.longestCombo;
        if (gamesEl) gamesEl.textContent = stats.totalGamesPlayed;
        if (waveEl) waveEl.textContent = stats.highestWave;
        
        // Update achievement progress
        const progress = achievementSystem.getProgress();
        const countEl = document.getElementById('achievement-count');
        const percentEl = document.getElementById('achievement-percent');
        const progressEl = document.getElementById('achievement-progress');
        
        if (countEl) countEl.textContent = `${progress.unlocked}/${progress.total}`;
        if (percentEl) percentEl.textContent = `${progress.percentage}%`;
        if (progressEl) progressEl.style.width = `${progress.percentage}%`;
        
        // Populate achievements list
        const achievementsList = document.getElementById('achievements-list');
        if (achievementsList) {
            achievementsList.innerHTML = '';
            
            const achievements = achievementSystem.getAllAchievements();
            achievements.forEach(achievement => {
                const item = document.createElement('div');
                item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
                item.innerHTML = `
                    <div class="achievement-item-icon">${achievement.icon}</div>
                    <div class="achievement-item-content">
                        <div class="achievement-item-name">${achievement.name}</div>
                        <div class="achievement-item-desc">${achievement.desc}</div>
                    </div>
                    <div class="achievement-item-status">${achievement.unlocked ? '✓' : '🔒'}</div>
                `;
                achievementsList.appendChild(item);
            });
        }
        
        statsModal.classList.add('active');
    }
    
    function closeStatsModal() {
        if (statsModal) {
            statsModal.classList.remove('active');
        }
    }

    window.addEventListener('resize', () => {
        if (gameOverlay && gameOverlay.classList.contains('active')) {
            resizeGameCanvas();
            initGameStars();
        }
    });
});


// ===================================================================
// PWA - Service Worker Registration
// ===================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful:', registration.scope);
            })
            .catch((error) => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// ===================================================================
// PWA - Install Prompt
// ===================================================================
let deferredPrompt;

// Check if mobile (define here since it's outside DOMContentLoaded scope)
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// Get install button from HTML (in main menu)
const installButton = document.getElementById('install-button');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button on mobile
    if (isMobileDevice && installButton) {
        installButton.style.display = 'block';
    }
});

if (installButton) {
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        installButton.style.display = 'none';
    });
}

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (installButton) {
        installButton.style.display = 'none';
    }
});
