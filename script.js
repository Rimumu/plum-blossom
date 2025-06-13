// --- Canvas and context setup ---
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
let width, height;

// --- DOM Elements ---
const landingPage = document.getElementById('landing-page');
const landingTitle = document.getElementById('landing-title');
const startButton = document.getElementById('start-button');
const mainContent = document.getElementById('main-content');
const messagePrompt = document.getElementById('message-prompt');


// --- Animation State & Tuning ---
let treeInitialized = false;
let blossoms = [];
let plums = [];
let treeBranches = [];
const NUM_BLOSSOMS = 260;
let trailPlums = [];
// NEW: State for spacing out the trail particles
let lastTrailX = -1;
let lastTrailY = -1;
const MIN_TRAIL_SPACING = 30; // Min pixels the mouse must move to create a new flower


// --- Landing Page Text Animation ---
const titleText = "Happy 15 monthiversary sayang!!!";
const titleSpans = [];
titleText.split('').forEach((char, index) => {
    const span = document.createElement('span');
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.animationDelay = `${index * 0.05}s`;
    landingTitle.appendChild(span);
    titleSpans.push(span);
});

const initialAnimationDuration = (titleSpans.length * 0.05) + 0.6;
setTimeout(() => {
    titleSpans.forEach((span, index) => {
        span.style.opacity = '1';
        span.style.animation = `wave 2s infinite ease-in-out`;
        span.style.animationDelay = `${index * 0.07}s`;
    });
}, initialAnimationDuration * 1000);


// --- Event Listeners ---
startButton.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    setTimeout(() => {
        mainContent.classList.add('visible');
        startTreeAnimation();
    }, 800);
});

// UPDATED: This listener is now "throttled" to space out the trail
window.addEventListener('mousemove', (e) => {
    const currentX = e.clientX;
    const currentY = e.clientY;

    const dx = currentX - lastTrailX;
    const dy = currentY - lastTrailY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only add a new flower if the mouse has moved enough distance
    if (distance > MIN_TRAIL_SPACING || lastTrailX === -1) {
        trailPlums.push(new TrailPlum(currentX, currentY));
        lastTrailX = currentX;
        lastTrailY = currentY;
    }
});


// --- Helper Functions ---
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// --- Classes for Animation Objects ---

// UPDATED: Trail particles are now smaller
class TrailPlum {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(5, 10); // Reduced size range for smaller flowers
        this.opacity = 1;
        this.color = `hsl(${random(310, 350)}, 85%, 72%)`;
        this.centerColor = '#FFFDD0';
        this.rotation = random(0, Math.PI * 2);
        this.fadeRate = 0.03;
        this.shrinkRate = 0.15; // Adjusted shrink rate for smaller size
    }

    update() {
        this.size -= this.shrinkRate;
        this.opacity -= this.fadeRate;
        if (this.size < 0) this.size = 0;
        if (this.opacity < 0) this.opacity = 0;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        for (let i = 0; i < 5; i++) {
            ctx.rotate(Math.PI * 2 / 5);
            ctx.beginPath();
            ctx.ellipse(this.size * 0.7, 0, this.size * 0.6, this.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = this.centerColor;
        ctx.fill();
        ctx.restore();
    }
}


class Plum {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(4, 8);
        this.color = `hsl(${random(310, 350)}, 85%, 68%)`;
        this.vx = random(-0.15, 0.15);
        this.vy = random(0.1, 0.4);
        this.gravity = 0.008;
        this.wind = 0;
        this.drag = 0.99;
        this.life = 0;
        this.driftLife = random(80, 150);
        this.rotation = random(0, Math.PI * 2);
        this.rotationSpeed = random(-0.02, 0.02);
        this.windStrength = random(0.02, 0.07);
        this.phaseOffset = random(0, Math.PI * 2);
    }
    update() {
        this.life++;
        if (this.life > this.driftLife) { this.wind = Math.sin(this.life / 60 + this.phaseOffset) * this.windStrength; }
        this.vy += this.gravity;
        this.vx += this.wind;
        this.vx *= this.drag;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        if (this.y > height + this.size) {
            if (blossoms.length > 0) {
                const randomBlossom = blossoms[Math.floor(Math.random() * blossoms.length)];
                this.x = randomBlossom.x;
                this.y = randomBlossom.y;
            } else {
                this.x = random(0, width);
                this.y = -this.size;
            }
            this.life = 0;
            this.vx = random(-0.15, 0.15);
            this.vy = random(0.1, 0.4);
            this.wind = 0;
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class Blossom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxSize = random(10, 20);
        this.size = 0;
        this.growthRate = random(0.15, 0.3);
        this.isGrown = false;
        this.color = `hsl(${random(310, 350)}, 85%, 70%)`;
        this.centerColor = '#FFFDD0';
    }
    update() { if (this.size < this.maxSize) { this.size += this.growthRate; } else { this.isGrown = true; } }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        for (let i = 0; i < 5; i++) {
            ctx.rotate(Math.PI * 2 / 5);
            ctx.beginPath();
            ctx.ellipse(this.size * 0.7, 0, this.size * 0.6, this.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = this.centerColor;
        ctx.fill();
        ctx.restore();
    }
}

// --- CORE ANIMATION LOGIC ---

function generateTree(startX, startY, length, angle, width, branchesArray) {
    if (width < 1) return;
    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);
    branchesArray.push({ sx: startX, sy: startY, ex: endX, ey: endY, w: width });
    const newLength = length * 0.85;
    const newWidth = width * 0.75;
    generateTree(endX, endY, newLength, angle + random(-0.2, 0.2), newWidth, branchesArray);
    if (width > 10 && Math.random() < 0.8) { generateTree(endX, endY, newLength * 0.7, angle + random(0.3, 0.8), newWidth, branchesArray); }
    if (width > 10 && Math.random() < 0.8) { generateTree(endX, endY, newLength * 0.7, angle - random(0.3, 0.8), newWidth, branchesArray); }
}

function populateBlossoms(branchesArray, blossomsArray) {
    const thinBranches = branchesArray.filter(b => b.w < 4);
    if (thinBranches.length === 0) return;
    for (let i = 0; i < NUM_BLOSSOMS; i++) {
        const randomBranch = thinBranches[Math.floor(Math.random() * thinBranches.length)];
        blossomsArray.push(new Blossom(randomBranch.ex, randomBranch.ey));
    }
}

function drawTree(branchesArray, color) {
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    branchesArray.forEach(branch => {
        ctx.lineWidth = branch.w;
        ctx.beginPath();
        ctx.moveTo(branch.sx, branch.sy);
        ctx.lineTo(branch.ex, branch.ey);
        ctx.stroke();
    });
}

function animate() {
    ctx.fillStyle = 'rgba(255, 240, 245, 0.4)';
    ctx.fillRect(0, 0, width, height);
    
    if (treeInitialized) {
        drawTree(treeBranches, '#5C4033');
        let allGrown = true;
        blossoms.forEach(blossom => {
            blossom.update();
            blossom.draw();
            if (!blossom.isGrown) allGrown = false;
        });
        
        if (allGrown && plums.length === 0 && blossoms.length > 0) {
            messagePrompt.classList.add('visible');
            blossoms.forEach((b, index) => {
                if (index % 3 === 0) plums.push(new Plum(b.x, b.y));
            });
        }
        
        if (plums.length > 0) {
            plums.forEach(plum => {
                plum.update();
                plum.draw();
            });
        }
    }

    for (let i = trailPlums.length - 1; i >= 0; i--) {
        const p = trailPlums[i];
        p.update();
        p.draw();
        if (p.opacity <= 0) {
            trailPlums.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

function startTreeAnimation() {
    if (treeInitialized) return;
    generateTree(width / 2, height, height * 0.35, -Math.PI / 2, 30, treeBranches);
    populateBlossoms(treeBranches, blossoms);
    treeInitialized = true;
}

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        treeInitialized = false;
        blossoms = [];
        plums = [];
        treeBranches = [];
        ctx.clearRect(0, 0, width, height); 
    });

    animate();
}

init();
