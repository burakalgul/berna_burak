document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const introText = document.getElementById('intro-text');
    const mainContent = document.getElementById('main-content');
    const bgMusic = document.getElementById('bg-music');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const musicControl = document.getElementById('music-control');
    const counterEl = document.getElementById('counter');

    // State Variables
    let width, height;
    let particles = [];
    let state = 'INTRO'; // INTRO, EXPLODING, MAIN_TRANSITIONING, MAIN
    let introClickable = false;
    let isMusicPlaying = false;
    let lastFireworkTime = 0;

    // Mobile Check (Robust)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

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
        const startDate = new Date('October 2, 2025 22:00:00');
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

        const coords = getCanvasCoords(e);
        const clickX = coords.x;
        const clickY = coords.y;

        // DEBUG: Visual marker at touch position
        if (isMobile) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(clickX, clickY, 15, 0, Math.PI * 2);
            ctx.fill();
            console.log(`Touch: x=${clickX.toFixed(0)}, y=${clickY.toFixed(0)}`);
        }


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

});
