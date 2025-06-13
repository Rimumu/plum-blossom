// --- Canvas and context setup ---
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// --- DOM Elements ---
const messagePrompt = document.getElementById('message-prompt');
const heartButton = document.getElementById('heart-button');
const finalMessage = document.getElementById('final-message');

// --- Animation State & Performance Tuning ---
let branchDrawn = false;
let blossoms = [];
let plums = [];
// REDUCED for better performance
const NUM_BLOSSOMS = 35; 

// --- Event Listeners ---
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    // Reset and redraw everything on resize
    branchDrawn = false;
    blossoms = [];
    plums = [];
    ctx.clearRect(0, 0, width, height); 
});

heartButton.addEventListener('click', () => {
    messagePrompt.classList.remove('visible');
    setTimeout(() => {
        finalMessage.classList.add('visible');
    }, 500); // Delay to allow prompt to fade out
});

// --- Helper Functions ---
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// --- Classes for Animation Objects ---

/**
 * Represents a single plum particle floating on the screen.
 * Physics tweaked for a softer feel.
 */
class Plum {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(3, 7); // Made slightly smaller to reduce visual clutter
        this.color = `hsl(${random(310, 350)}, 85%, 68%)`;
        
        // Initial state: gentle detachment
        this.vx = random(-0.1, 0.1); // Even less initial horizontal speed
        this.vy = random(0.2, 0.6);  // Start by falling slowly
        
        this.gravity = 0.01; // Reduced gravity for a "floatier" effect
        this.wind = 0;
        this.drag = 0.99;
        
        this.life = 0;
        this.driftLife = random(80, 150);
    }

    update() {
        this.life++;

        if (this.life > this.driftLife) {
            // A gentler, more predictable sine-wave wind
            this.wind = Math.sin(this.life / 60) * 0.1;
        }

        this.vy += this.gravity;
        this.vx += this.wind;
        this.vx *= this.drag;

        this.x += this.vx;
        this.y += this.vy;

        // Reset particle if it goes off-screen
        if (this.y > height + this.size) {
            this.x = random(0, width);
            this.y = -this.size; // Restart from the top
            this.life = 0;
            this.vx = random(-0.1, 0.1);
            this.vy = random(0.2, 0.6);
            this.wind = 0;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

/**
 * Represents a single blooming blossom. (No changes here)
 */
class Blossom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxSize = random(12, 22);
        this.size = 0;
        this.growthRate = random(0.15, 0.3); // Slightly faster growth
        this.isGrown = false;
        this.color = `rgba(255, 192, 203, ${random(0.7, 1)})`; // Pink
        this.centerColor = '#FFFDD0'; // Cream
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
 * REWORKED: Draws a much more visible and performance-friendly tree.
 */
function drawBranch(startX, startY, length, angle, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Add a blossom at the end of each significant branch
    if (blossoms.length < NUM_BLOSSOMS) {
         blossoms.push(new Blossom(endX, endY));
    }
    
    if (length < 20) return; // Stop branching on small twigs

    // Simplified branching for clarity and performance
    const newLength = length * 0.8;
    const newWidth = width * 0.75;

    // First branch continues mostly straight
    drawBranch(endX, endY, newLength, angle + random(-0.1, 0.1), newWidth, color);
    
    // Add an occasional side branch
    if(Math.random() < 0.6) {
        drawBranch(endX, endY, newLength * 0.8, angle + random(0.3, 0.6), newWidth * 0.8, color);
    }
    if(Math.random() < 0.6) {
        drawBranch(endX, endY, newLength * 0.8, angle - random(0.3, 0.6), newWidth * 0.8, color);
    }
}


/**
 * Main animation loop.
 */
function animate() {
    // Optimized clearing: Only clear once.
    ctx.fillStyle = 'rgba(255, 240, 245, 0.4)'; // Slightly more opaque for shorter trails
    ctx.fillRect(0, 0, width, height);
    
    // Step 1: Draw the tree and let blossoms grow
    if (!branchDrawn) {
        // Thicker, taller, and more central tree trunk for visibility
        drawBranch(width / 2, height, height * 0.35, -Math.PI / 2, 35, '#5C4033'); // Darker brown
        branchDrawn = true;
    }

    let allGrown = true;
    blossoms.forEach(blossom => {
        blossom.update();
        blossom.draw();
        if (!blossom.isGrown) {
            allGrown = false;
        }
    });
    
    // Step 2: Show prompt and create plums once all blossoms are grown
    if (allGrown && !messagePrompt.classList.contains('visible') && plums.length === 0) {
        messagePrompt.classList.add('visible');
        blossoms.forEach(b => {
            plums.push(new Plum(b.x, b.y));
        });
    }
    
    // Step 3: Animate plums
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
