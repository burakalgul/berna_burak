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
    const gameComboEl = document.getElementById('game-combo');
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameOverTitle = document.getElementById('game-over-title');
    const finalScoreEl = document.getElementById('final-score');
    const finalWaveEl = document.getElementById('final-wave');
    const gameOverMsgEl = document.getElementById('game-over-msg');
    const gameCloseBtn = document.getElementById('game-close');
    const gameRestartBtn = document.getElementById('game-restart');
    const gameQuitBtn = document.getElementById('game-quit');
    const waveBanner = document.getElementById('game-wave-banner');
    const heartEasterEgg = document.getElementById('heart-easter-egg');

    // Load chibi character images
    const bernaImg = new Image();
    bernaImg.src = 'berna_chibi.png';
    const burakImg = new Image();
    burakImg.src = 'burak_chibi.png';

    let gameActive = false;
    let gameScore = 0;
    let gameLives = 3;
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
    let waveTransitioning = false;
    let shieldActive = false;
    let shieldTimer = 0;
    let magnetActive = false;
    let magnetTimer = 0;
    let slowMoActive = false;
    let slowMoTimer = 0;
    let damageFlash = 0;
    let invulnerableTimer = 0; // NEW: Invulnerability timer

    const BURAK_SPRITE_SIZE = 120;
    const BERNA_SPRITE_SIZE = 100;
    const BURAK_CATCH_W = 100;

    // ---- WAVE SYSTEM (Relationship stages) ----
    const WAVES = [
        { name: "Tanışma 💫", scoreTarget: 300, spawnRate: 0.025, speedMul: 1.0, brokenWeight: 0, wind: 0, wobble: false, bgEffect: 'none', desc: "İlk bakışta her şey güzel..." },
        { name: "İlk Buluşma 🌹", scoreTarget: 750, spawnRate: 0.03, speedMul: 1.15, brokenWeight: 5, wind: 0.2, wobble: false, bgEffect: 'pink_glow', desc: "Kelebekler uçuşuyor!" },
        { name: "Zorluklar 🌧️", scoreTarget: 1500, spawnRate: 0.04, speedMul: 1.3, brokenWeight: 15, wind: 0.5, wobble: true, bgEffect: 'rain', desc: "Her ilişkinin zorlukları var..." },
        { name: "Güçlü Aşk 💪", scoreTarget: 2500, spawnRate: 0.045, speedMul: 1.45, brokenWeight: 20, wind: -0.3, wobble: true, bgEffect: 'gold_rays', desc: "Zorluklar sizi güçlendirdi!" },
        { name: "Fırtınalar ⛈️", scoreTarget: 4000, spawnRate: 0.055, speedMul: 1.6, brokenWeight: 28, wind: 0.8, wobble: false, bgEffect: 'storm', desc: "En zor anlar... Pes etmeyin!" },
        { name: "Sadakat 🤝", scoreTarget: 6000, spawnRate: 0.05, speedMul: 1.5, brokenWeight: 18, wind: 0.3, wobble: true, bgEffect: 'aurora', desc: "Birbirinize güvenin." },
        { name: "Sonsuza Dek ♾️", scoreTarget: Infinity, spawnRate: 0.065, speedMul: 1.8, brokenWeight: 25, wind: 0, wobble: false, bgEffect: 'cosmos', desc: "Aşk sonsuza kadar!" },
    ];

    // Heart types
    function getHeartTypes(wave) {
        const brokenW = WAVES[Math.min(wave - 1, WAVES.length - 1)].brokenWeight;
        return [
            { emoji: '❤️', points: 10, size: 28, speed: 2.5, weight: 50 },
            { emoji: '💖', points: 25, size: 32, speed: 2.0, weight: 20 },
            { emoji: '💎', points: 50, size: 26, speed: 3.5, weight: 8 },
            { emoji: '💔', points: -1, size: 28, speed: 3.0, weight: brokenW, isBroken: true },
        ];
    }

    // Power-up types
    const POWERUP_TYPES = [
        { emoji: '🛡️', type: 'shield', size: 35, speed: 1.5, duration: 8 },
        { emoji: '🧲', type: 'magnet', size: 35, speed: 1.5, duration: 8 },
        { emoji: '⏳', type: 'slowmo', size: 35, speed: 1.5, duration: 6 },
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
    let easterEggClicks = 0;
    let easterEggTimer = null;

    if (heartEasterEgg) {
        heartEasterEgg.addEventListener('click', (e) => {
            if (state !== 'MAIN') return;
            e.stopPropagation();

            easterEggClicks++;

            if (easterEggClicks === 1) {
                easterEggTimer = setTimeout(() => { easterEggClicks = 0; }, 800);
            }

            if (easterEggClicks >= 3) {
                clearTimeout(easterEggTimer);
                easterEggClicks = 0;

                // Flash the heart before opening game
                heartEasterEgg.style.transition = 'transform 0.3s';
                heartEasterEgg.style.transform = 'scale(1.5) rotate(15deg)';
                setTimeout(() => {
                    heartEasterEgg.style.transform = '';
                    startGame();
                }, 400);
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
        const particleCount = isGood ? 10 : 6;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            catchEffects.push({
                x: x, y: y,
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3),
                life: 1,
                color: isGood ? `hsl(${340 + Math.random() * 30}, 100%, 65%)` : '#ff4444',
                size: Math.random() * 3 + 2
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
        setTimeout(() => {
            waveBanner.classList.remove('active');
            setTimeout(() => { waveTransitioning = false; }, 500);
        }, 2500);
    }

    function checkWaveProgress() {
        const config = getCurrentWaveConfig();
        if (gameScore >= config.scoreTarget && currentWave < WAVES.length) {
            currentWave++;
            if (gameWaveEl) gameWaveEl.textContent = currentWave;
            const newConfig = getCurrentWaveConfig();
            showWaveBanner(newConfig.name, newConfig.desc);
        }
    }

    // ----------------------------
    // Damage & Lives
    // ----------------------------
    function takeDamage() {
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

        // Screen shake
        if (gameOverlay) {
            gameOverlay.classList.add('shake');
            setTimeout(() => gameOverlay.classList.remove('shake'), 400);
        }

        if (gameLives <= 0) {
            endGame();
        }
    }

    function updateLivesDisplay() {
        if (!gameLivesEl) return;
        let hearts = '';
        for (let i = 0; i < 3; i++) {
            hearts += i < gameLives ? '❤️' : '🖤';
        }
        gameLivesEl.textContent = hearts;
    }

    // ----------------------------
    // Power-up activation
    // ----------------------------
    function activatePowerUp(type) {
        if (type === 'shield') {
            shieldActive = true;
            shieldTimer = 5;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '🛡️ Kalkan!', true);
        } else if (type === 'magnet') {
            magnetActive = true;
            magnetTimer = 4;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '🧲 Mıknatıs!', true);
        } else if (type === 'slowmo') {
            slowMoActive = true;
            slowMoTimer = 4;
            addCatchEffect(burakX, gameH - BURAK_SPRITE_SIZE / 2, '⏳ Yavaşla!', true);
        }
    }

    // ----------------------------
    // Game Loop
    // ----------------------------
    function gameLoop() {
        if (!gameActive || !gameCtx) return;
        const dt = slowMoActive ? 0.008 : 0.016;
        gameTime += dt;
        gameFrameCount++;

        const config = getCurrentWaveConfig();
        const speedMul = config.speedMul * (slowMoActive ? 0.4 : 1);

        gameCtx.clearRect(0, 0, gameW, gameH);

        // Damage flash overlay
        if (damageFlash > 0) {
            damageFlash -= 0.03;
            gameCtx.fillStyle = `rgba(255, 0, 0, ${damageFlash * 0.3})`;
            gameCtx.fillRect(0, 0, gameW, gameH);
        }

        drawGameStars();

        // Background Effects Render
        // Ensure alpha is reset first
        gameCtx.globalAlpha = 1;

        const effect = config.bgEffect;
        const centerX = gameW / 2;
        const centerY = gameH / 2;

        if (effect === 'pink_glow') {
            const gradient = gameCtx.createRadialGradient(centerX, centerY, gameW * 0.2, centerX, centerY, gameW * 0.8);
            gradient.addColorStop(0, 'rgba(255, 100, 150, 0.0)');
            gradient.addColorStop(1, 'rgba(255, 100, 150, 0.2)');
            gameCtx.fillStyle = gradient;
            gameCtx.fillRect(0, 0, gameW, gameH);
        } else if (effect === 'rain') {
            // Rainy Vignette (Blue/Gray)
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

        // Apply DOM transforms for Berna (GIF support + Performance)
        if (bernaEl) {
            // 1. Floating bounce
            const floatOffset = Math.sin(gameTime * 2) * 8;
            const bernaY = 20 + floatOffset;

            // 2. Perspective tilt
            const rotationAngle = bernaDir * 5; // degrees

            // 3. Perspective scaling
            const scaleVariation = 1.0 + Math.sin(gameTime * 1.5) * 0.05;
            const scaleX = (bernaDir === -1 ? -1 : 1) * scaleVariation;

            // Apply transform
            bernaEl.style.transform = `translate3d(${bernaX - 50}px, ${bernaY}px, 0) rotate(${rotationAngle}deg) scale(${scaleX}, ${scaleVariation})`;
            bernaEl.style.filter = `drop-shadow(${-bernaDir * 5}px 10px 10px rgba(0,0,0,0.4))`;
        }

        /* 
           CANVAS DRAWING REMOVED FOR PERFORMANCE AND GIF SUPPORT
           (Previous code for drawImage(bernaImg) deleted)
        */

        // Spawn hearts from Berna
        if (!waveTransitioning && Math.random() < config.spawnRate) {
            const heartTypes = getHeartTypes(currentWave);
            const totalWeight = heartTypes.reduce((s, t) => s + t.weight, 0);
            let r = Math.random() * totalWeight;
            let type = heartTypes[0];
            for (const t of heartTypes) {
                r -= t.weight;
                if (r <= 0) { type = t; break; }
            }

            fallingHearts.push({
                x: bernaX + (Math.random() - 0.5) * 40,
                y: 20 + BERNA_SPRITE_SIZE,
                vy: type.speed * speedMul * (0.8 + Math.random() * 0.4),
                vx: (Math.random() - 0.5) * 0.8,
                type: type,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.05
            });
        }

        // Spawn power-ups (rare)
        if (!waveTransitioning && Math.random() < 0.003 && gamePowerUps.length < 1) {
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
        const burakTop = gameH - BURAK_SPRITE_SIZE / 2;
        for (let i = fallingHearts.length - 1; i >= 0; i--) {
            const h = fallingHearts[i];

            // Wind & Wobble effects
            if (config.wind) {
                h.x += config.wind;
            }
            if (config.wobble) {
                h.x += Math.sin(gameTime * 5 + i) * 1.0;
            }

            // Magnet effect (attract good hearts)
            if (magnetActive && !h.type.isBroken) {
                const dx = burakX - h.x;
                const dy = burakTop - h.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    h.vx += (dx / dist) * 0.8;
                    h.vy += (dy / dist) * 0.3;
                }
            }

            h.y += h.vy;
            h.x += h.vx + Math.sin(gameTime * 2 + i) * 0.3;
            h.x = Math.max(15, Math.min(gameW - 15, h.x));
            h.rotation += h.rotSpeed;

            // Catch check
            if (h.y > burakTop - 40 && h.y < burakTop + 60 && // Widened collision
                Math.abs(h.x - burakX) < BURAK_CATCH_W / 2 + h.type.size / 2) {

                if (h.type.isBroken) {
                    if (invulnerableTimer > 0) {
                        // Invulnerable - no damage
                        addCatchEffect(h.x, burakTop, '🛡️', false);
                    } else {
                        // Take damage
                        takeDamage();
                        addCatchEffect(h.x, burakTop, '-💔', false);
                        gameConsecutiveCatches = 0;
                        gameCombo = 1;
                    }
                } else {
                    gameConsecutiveCatches++;
                    if (gameConsecutiveCatches >= 8) gameCombo = 4;
                    else if (gameConsecutiveCatches >= 5) gameCombo = 3;
                    else if (gameConsecutiveCatches >= 3) gameCombo = 2;
                    else gameCombo = 1;

                    const earned = h.type.points * gameCombo;
                    gameScore += earned;
                    if (gameScoreEl) gameScoreEl.textContent = gameScore;
                    addCatchEffect(h.x, burakTop, earned, true);
                    checkWaveProgress();
                }

                if (gameComboEl) gameComboEl.textContent = 'x' + gameCombo;
                fallingHearts.splice(i, 1);
                continue;
            }

            // Missed hearts - REMOVED LIFE PENALTY for better experience
            if (h.y > gameH + 20) {
                if (!h.type.isBroken) {
                    gameConsecutiveCatches = 0;
                    gameCombo = 1;
                    if (gameComboEl) gameComboEl.textContent = 'x1';
                    // User complained about difficulty, so removing random damage on miss
                }
                fallingHearts.splice(i, 1);
                continue;
            }

            // Draw heart (Optimized: Removed shadows for performance)
            gameCtx.save();
            gameCtx.translate(h.x, h.y);
            gameCtx.rotate(h.rotation);
            gameCtx.font = `${h.type.size}px serif`;
            gameCtx.textAlign = 'center';
            gameCtx.textBaseline = 'middle';

            /* 
               PERFORMANCE OPTIMIZATION: 
               Removed gameCtx.shadowBlur checks. 
               This fixes the FPS drop and transparency issues.
            */

            gameCtx.fillText(h.type.emoji, 0, 0);
            gameCtx.restore();
        }

        // Update & draw power-ups (Optimized: Removed shadows)
        for (let i = gamePowerUps.length - 1; i >= 0; i--) {
            const pu = gamePowerUps[i];
            pu.y += pu.vy;
            pu.glow = Math.sin(gameTime * 5) * 0.3 + 0.7;

            // Power-up collision (Widened range)
            if (pu.y > burakTop - 50 && pu.y < burakTop + 60 &&
                Math.abs(pu.x - burakX) < BURAK_CATCH_W / 2 + 30) {
                activatePowerUp(pu.type.type);
                gamePowerUps.splice(i, 1);
                continue;
            }

            if (pu.y > gameH + 30) {
                gamePowerUps.splice(i, 1);
                continue;
            }

            gameCtx.save();
            gameCtx.translate(pu.x, pu.y);
            // Removed expensive shadowBlur
            gameCtx.globalAlpha = pu.glow;
            gameCtx.font = `${pu.type.size}px serif`;
            gameCtx.textAlign = 'center';
            gameCtx.textBaseline = 'middle';
            gameCtx.fillText(pu.type.emoji, 0, 0);
            gameCtx.globalAlpha = 1;
            gameCtx.restore();
        }

        // Update timers
        if (invulnerableTimer > 0) {
            invulnerableTimer -= dt;
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

        // Draw Burak (DOM Transform + Canvas Effects)

        // 1. Draw effects on Canvas (behind/around the DOM element)
        gameCtx.save();

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
            const jumpOffset = Math.abs(Math.sin(gameTime * 10)) * (excitement * 20);

            // Apply transform
            // Note: Burak is positioned bottom:20px. We translate X. And Y for jump.
            // We need to subtract half width (50px) to center it on burakX
            burakEl.style.transform = `translate3d(${burakX - 50}px, ${-jumpOffset}px, 0) rotate(${tiltAngle}deg) scale(${breatheScale}, ${breatheScale + excitement})`;

            // Dynamic drop shadow via CSS filter
            burakEl.style.filter = `drop-shadow(0 15px 10px rgba(0,0,0,0.5))`;
        }

        /* 
           CANVAS DRAWING OF BURAK REMOVED
           (Previous drawImage(burakImg) code deleted)
        */

        // Draw catch effects
        for (let i = catchEffects.length - 1; i >= 0; i--) {
            const e = catchEffects[i];
            e.x += e.vx;
            e.y += e.vy;
            e.life -= 0.025;

            if (e.life <= 0) { catchEffects.splice(i, 1); continue; }

            gameCtx.globalAlpha = e.life;
            if (e.isText) {
                gameCtx.font = `bold ${e.size}px Montserrat, sans-serif`;
                gameCtx.fillStyle = e.color;
                gameCtx.textAlign = 'center';
                gameCtx.fillText(e.text, e.x, e.y);
            } else {
                gameCtx.fillStyle = e.color;
                gameCtx.beginPath();
                gameCtx.arc(e.x, e.y, e.size * e.life, 0, Math.PI * 2);
                gameCtx.fill();
            }
            gameCtx.globalAlpha = 1;
        }

        // Ground line
        gameCtx.fillStyle = 'rgba(255, 77, 109, 0.15)';
        gameCtx.fillRect(0, gameH - 5, gameW, 5);

        // Active power-up indicators
        if (shieldActive || magnetActive || slowMoActive) {
            let indicators = [];
            if (shieldActive) indicators.push('🛡️ ' + Math.ceil(shieldTimer) + 's');
            if (magnetActive) indicators.push('🧲 ' + Math.ceil(magnetTimer) + 's');
            if (slowMoActive) indicators.push('⏳ ' + Math.ceil(slowMoTimer) + 's');
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
        e.preventDefault();
        const rect = gameCanvas.getBoundingClientRect();
        let clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }
        burakX = Math.max(BURAK_SPRITE_SIZE / 2, Math.min(gameW - BURAK_SPRITE_SIZE / 2, clientX - rect.left));
    }

    if (gameCanvas) {
        gameCanvas.addEventListener('mousemove', handleGamePointerMove);
        gameCanvas.addEventListener('touchmove', handleGamePointerMove, { passive: false });
        gameCanvas.addEventListener('touchstart', (e) => {
            if (!gameActive) return;
            e.preventDefault();
            handleGamePointerMove(e);
        }, { passive: false });
    }

    // ----------------------------
    // Start / End / Close Game
    // ----------------------------
    function startGame() {
        gameActive = true;
        gameScore = 0;
        gameLives = 3;
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

        if (gameScoreEl) gameScoreEl.textContent = '0';
        if (gameWaveEl) gameWaveEl.textContent = '1';
        if (gameComboEl) gameComboEl.textContent = 'x1';
        updateLivesDisplay();
        if (gameOverScreen) gameOverScreen.classList.remove('active');

        if (gameOverlay) gameOverlay.classList.add('active');

        // Wait for display change to apply before calculating width
        requestAnimationFrame(() => {
            resizeGameCanvas();
            burakX = gameW / 2;
            bernaX = gameW / 2;
            initGameStars();
        });

        setTimeout(() => {
            showWaveBanner(WAVES[0].name, WAVES[0].desc);
        }, 300);

        cancelAnimationFrame(gameAnimFrame);
        gameLoop();
    }

    function endGame() {
        gameActive = false;
        cancelAnimationFrame(gameAnimFrame);

        if (finalScoreEl) finalScoreEl.textContent = gameScore;
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
        if (gameOverlay) gameOverlay.classList.remove('active');
        if (gameOverScreen) gameOverScreen.classList.remove('active');
    }

    // ----------------------------
    // Event Listeners
    // ----------------------------
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

    window.addEventListener('resize', () => {
        if (gameOverlay && gameOverlay.classList.contains('active')) {
            resizeGameCanvas();
            initGameStars();
        }
    });

});
