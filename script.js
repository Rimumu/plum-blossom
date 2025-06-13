// --- Canvas and context setup ---
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// --- DOM Elements ---
const messagePrompt = document.getElementById('message-prompt');
const heartButton = document.getElementById('heart-button');
const finalMessage = document.getElementById('final-message');

// --- Animation State ---
let branchDrawn = false;
let blossoms = [];
let plums = [];
const NUM_BLOSSOMS = 40; // Increased blossom count for a fuller tree

// --- Event Listeners ---
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    // Reset and redraw on resize for responsiveness
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
 * Now with more varied movement to reduce overlapping.
 */
class Plum {
    constructor(x, y) {
        // Start with a bit of random offset from the blossom position
        this.x = x + random(-10, 10);
        this.y = y + random(-10, 10);
        this.size = random(3, 7);
        this.color = `hsl(${random(300, 340)}, 85%, 65%)`; // Slightly brighter
        this.vx = random(-0.8, 0.8); // Increased horizontal velocity range
        this.vy = random(0.5, 1.5);
        this.gravity = 0.02;
        this.wind = random(-0.2, 0.2); // More noticeable wind
        this.drag = 0.99; // Air resistance
    }

    update() {
        this.vy += this.gravity;
        this.vx += this.wind;
        
        this.vx *= this.drag; // Apply air resistance

        // Randomly change wind direction for more chaotic movement
        if (Math.random() < 0.02) {
            this.wind = random(-0.2, 0.2);
        }

        this.x += this.vx;
        this.y += this.vy;

        // Reset particle if it goes far off-screen
        if (this.y > height + 20 || this.x < -20 || this.x > width + 20) {
            this.x = random(0, width);
            this.y = -this.size; // Start from the top
            this.vx = random(-0.8, 0.8);
            this.vy = random(0.5, 1.5);
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
 * Represents a single blooming blossom.
 */
class Blossom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxSize = random(12, 22); // Slightly smaller max size for a delicate look
        this.size = 0;
        this.growthRate = random(0.1, 0.25);
        this.isGrown = false;
        this.color = `rgba(255, 192, 203, ${random(0.6, 1)})`; // Pink
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
        
        // Draw 5 petals
        for (let i = 0; i < 5; i++) {
            ctx.rotate(Math.PI * 2 / 5);
            ctx.beginPath();
            ctx.ellipse(this.size * 0.7, 0, this.size * 0.6, this.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
        // Draw center
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = this.centerColor;
        ctx.fill();

        ctx.restore();
    }
}

/**
 * Draws a more realistic tree with organic branches.
 */
function drawBranch(startX, startY, length, angle, width, color) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Calculate the end of the branch
    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);
    
    ctx.lineTo(endX, endY);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Place blossoms along the branch, not just at the end
    if (Math.random() > 0.6 && blossoms.length < NUM_BLOSSOMS) {
        const blossomX = startX + random(0.3, 0.7) * length * Math.cos(angle);
        const blossomY = startY + random(0.3, 0.7) * length * Math.sin(angle);
        blossoms.push(new Blossom(blossomX, blossomY));
    }

    // Stop branching when branches get too small
    if (length < 10) {
        // Add a blossom at the very tip of the smallest branches
        if (blossoms.length < NUM_BLOSSOMS) {
            blossoms.push(new Blossom(endX, endY));
        }
        return;
    }

    // Recursively draw more branches
    const newLength = length * random(0.75, 0.9);
    const newWidth = width * 0.75;

    // Create 1 to 3 new branches
    const branches = Math.floor(random(1, 4));
    for (let i = 0; i < branches; i++) {
        const newAngle = angle + random(-0.5, 0.5); // More varied angle
        drawBranch(endX, endY, newLength, newAngle, newWidth, color);
    }
}


/**
 * Main animation loop.
 */
function animate() {
    // Clear canvas with a semi-transparent fill for a trailing effect
    ctx.fillStyle = 'rgba(255, 240, 245, 0.25)';
    ctx.fillRect(0, 0, width, height);
    
    // --- DRAWING AND UPDATING ---

    // Step 1: Draw the branch and let blossoms grow
    if (!branchDrawn) {
        // Start tree from bottom left for a more natural look
        drawBranch(50, height, height * 0.25, -Math.PI / 2.2, 20, '#5C4033');
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
    
    // Step 2: Once blossoms are grown, show the prompt and create plums
    if (allGrown && !messagePrompt.classList.contains('visible') && plums.length === 0) {
        messagePrompt.classList.add('visible');
        // Initialize plums from blossom locations
        blossoms.forEach(b => {
            plums.push(new Plum(b.x, b.y));
        });
    }
    
    // Step 3: Animate plums indefinitely
    if(plums.length > 0) {
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
