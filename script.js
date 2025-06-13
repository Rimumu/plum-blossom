// --- Canvas and context setup ---
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// --- DOM Elements ---
const messagePrompt = document.getElementById('message-prompt');
const heartButton = document.getElementById('heart-button');
const finalMessage = document.getElementById('final-message');

// --- Animation State & Tuning ---
let isInitialized = false;
let blossoms = [];
let plums = [];
let treeBranches = []; // Array to store the tree structure
const NUM_BLOSSOMS = 260; // Set to the desired amount for a very full tree

// --- Event Listeners ---
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    // Reset everything to re-initialize on resize
    isInitialized = false;
    blossoms = [];
    plums = [];
    treeBranches = [];
    ctx.clearRect(0, 0, width, height); 
});

heartButton.addEventListener('click', () => {
    messagePrompt.classList.remove('visible');
    setTimeout(() => {
        finalMessage.classList.add('visible');
    }, 500); // Delay for fade-out
});

// --- Helper Functions ---
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// --- Classes for Animation Objects ---

class Plum {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(4, 8); // This is now the major radius of the ellipse
        this.color = `hsl(${random(310, 350)}, 85%, 68%)`;
        this.vx = random(-0.15, 0.15); // Gentle side-to-side drift
        this.vy = random(0.1, 0.4);   // Slower initial downward speed with more variance
        this.gravity = 0.008;         // Reduced gravity for a floatier effect
        this.wind = 0;
        this.drag = 0.99;
        this.life = 0;
        this.driftLife = random(80, 150);
        this.rotation = random(0, Math.PI * 2);
        this.rotationSpeed = random(-0.02, 0.02);
        // FIXED: Properties for a gentler, more varied wind effect
        this.windStrength = random(0.02, 0.07); // Each petal has its own wind sensitivity
        this.phaseOffset = random(0, Math.PI * 2);  // Each petal sways on its own timing
    }

    update() {
        this.life++;
        if (this.life > this.driftLife) {
            // FIXED: Use the individual wind properties for a more natural, gentle sway
            this.wind = Math.sin(this.life / 60 + this.phaseOffset) * this.windStrength;
        }
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

            // Reset its physics properties for a new fall
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

    update() {
        if (this.size < this.maxSize) {
            this.size += this.growthRate;
        } else {
            this.isGrown = true;
        }
    }

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

/**
 * Step 1: Recursively generates the tree structure and stores it.
 */
function generateTree(startX, startY, length, angle, width, branchesArray) {
    if (width < 1) return;

    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);
    branchesArray.push({ sx: startX, sy: startY, ex: endX, ey: endY, w: width });

    const newLength = length * 0.85;
    const newWidth = width * 0.75;

    generateTree(endX, endY, newLength, angle + random(-0.2, 0.2), newWidth, branchesArray);
    
    if (width > 10 && Math.random() < 0.8) {
        generateTree(endX, endY, newLength * 0.7, angle + random(0.3, 0.8), newWidth, branchesArray);
    }
    if (width > 10 && Math.random() < 0.8) {
        generateTree(endX, endY, newLength * 0.7, angle - random(0.3, 0.8), newWidth, branchesArray);
    }
}

/**
 * Step 2: Intelligently places blossoms ONLY on the thin outer branches.
 */
function populateBlossoms(branchesArray, blossomsArray) {
    const thinBranches = branchesArray.filter(b => b.w < 4);
    if (thinBranches.length === 0) return;

    for (let i = 0; i < NUM_BLOSSOMS; i++) {
        const randomBranch = thinBranches[Math.floor(Math.random() * thinBranches.length)];
        blossomsArray.push(new Blossom(randomBranch.ex, randomBranch.ey));
    }
}


/**
 * Draws the stored tree structure.
 */
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

/**
 * Main animation loop
 */
function animate() {
    ctx.fillStyle = 'rgba(255, 240, 245, 0.4)';
    ctx.fillRect(0, 0, width, height);
    
    if (!isInitialized) {
        generateTree(width / 2, height, height * 0.35, -Math.PI / 2, 30, treeBranches);
        populateBlossoms(treeBranches, blossoms);
        isInitialized = true;
    }

    drawTree(treeBranches, '#5C4033');

    let allGrown = true;
    blossoms.forEach(blossom => {
        blossom.update();
        blossom.draw();
        if (!blossom.isGrown) {
            allGrown = false;
        }
    });
    
    if (allGrown && plums.length === 0 && blossoms.length > 0) {
        messagePrompt.classList.add('visible');
        blossoms.forEach((b, index) => {
            if (index % 3 === 0) {
                plums.push(new Plum(b.x, b.y));
            }
        });
    }
    
    if (plums.length > 0) {
        plums.forEach(plum => {
            plum.update();
            plum.draw();
        });
    }

    requestAnimationFrame(animate);
}

// --- Start the animation ---
window.onload = function() {
    animate();
};
