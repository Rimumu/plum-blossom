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
const NUM_BLOSSOMS = 30;

// --- Event Listeners ---
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
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
 */
class Plum {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(4, 8);
        this.color = `hsl(${random(300, 340)}, 80%, 60%)`; // Shades of pink/magenta
        this.vx = random(-0.5, 0.5);
        this.vy = random(0.5, 1.5); // Initial downward velocity
        this.gravity = 0.01;
        this.wind = random(-0.1, 0.1);
    }

    update() {
        this.vy += this.gravity;
        this.vx += this.wind;

        // Simple wind change
        if (Math.random() < 0.05) {
            this.wind = random(-0.1, 0.1);
        }

        this.x += this.vx;
        this.y += this.vy;

        // Reset particle if it goes off-screen
        if (this.y > height + this.size || this.x < -this.size || this.x > width + this.size) {
            this.x = random(0, width);
            this.y = -this.size;
            this.vx = random(-0.5, 0.5);
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
        this.maxSize = random(15, 25);
        this.size = 0;
        this.growthRate = random(0.1, 0.3);
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
 * Draws the main branch of the plum tree.
 */
function drawBranch(startX, startY, length, angle, width, color) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);
    
    ctx.lineTo(endX, endY);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Add blossoms to the branch points
    if (blossoms.length < NUM_BLOSSOMS) {
         blossoms.push(new Blossom(endX, endY));
    }

    // Recursive branching
    if (length > 20) {
        // Main branch continues
        drawBranch(endX, endY, length * random(0.8, 0.9), angle + random(-0.2, 0.2), width * 0.7, color);
        
        // Occasional side branch
        if (Math.random() < 0.4) {
            drawBranch(endX, endY, length * random(0.5, 0.7), angle + random(0.5, 1), width * 0.6, color);
        }
         if (Math.random() < 0.4) {
            drawBranch(endX, endY, length * random(0.5, 0.7), angle - random(0.5, 1), width * 0.6, color);
        }
    }
}

/**
 * Main animation loop.
 */
function animate() {
    // Clear canvas with a semi-transparent fill for a trailing effect
    ctx.fillStyle = 'rgba(255, 240, 245, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // --- DRAWING AND UPDATING ---

    // Step 1: Draw the branch and let blossoms grow
    if (!branchDrawn) {
        drawBranch(width / 2 - 100, height, 120, -Math.PI / 2.5, 15, '#4A2311');
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
    if (allGrown && messagePrompt.style.opacity !== '1' && !messagePrompt.classList.contains('visible')) {
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
