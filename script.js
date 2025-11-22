// Canvas Constellation Animation
const canvas = document.getElementById('cosmos-bg');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
const numParticles = 80; // Fewer particles for minimalist look
const connectionDistance = 150;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5; // Slow movement
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = '#2c3e50'; // Dark grey/blue dots
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p, index) => {
        p.update();
        p.draw();

        // Draw connections
        for (let j = index + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
                ctx.beginPath();
                const opacity = 1 - (distance / connectionDistance);
                ctx.strokeStyle = `rgba(44, 62, 80, ${opacity * 0.15})`; // Very subtle lines
                ctx.lineWidth = 1;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    });

    requestAnimationFrame(animate);
}

// Initialize
window.addEventListener('resize', () => {
    resize();
    initParticles();
});

resize();
initParticles();
animate();

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Intersection Observer for Fade-up animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

// Observer for general fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

// Observer specifically for publication items
const pubObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            // Optionally unobserve after animation
            pubObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15,
    rootMargin: "0px 0px -100px 0px"
});

// Apply observers to different elements
document.querySelectorAll('.section, .timeline-item, .skill-card').forEach((el) => {
    el.classList.add('fade-in-section');
    observer.observe(el);
});

// Observe publication items separately
document.querySelectorAll('.pub-item').forEach((el) => {
    pubObserver.observe(el);
});

// Menu Active State Observer
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.id;

            // Remove active class from all links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            // Add active class to current section link
            const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    });
}, {
    rootMargin: '-40% 0px -40% 0px', // Trigger when section is in the middle 20% of viewport
    threshold: 0
});

document.querySelectorAll('section').forEach(section => {
    sectionObserver.observe(section);
});

// Publication Filtering and Show More Logic
const INITIAL_VISIBLE_COUNT = 4; // Show first 4 publications initially
let currentYearFilter = 'all';
let currentTopicFilter = 'all';
let showingAll = false;

const pubItems = document.querySelectorAll('.pub-item');
const showMoreBtn = document.getElementById('showMoreBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initialize - hide publications beyond initial count
function initializePublications() {
    pubItems.forEach((item, index) => {
        if (index >= INITIAL_VISIBLE_COUNT) {
            item.classList.add('hidden');
        }
    });
    updateShowMoreButton();
}

// Filter publications based on current filters
function filterPublications() {
    let visibleCount = 0;

    pubItems.forEach((item, index) => {
        const itemYear = item.dataset.year;
        const itemTopics = item.dataset.topics || '';

        // Check if item matches filters
        const yearMatch = currentYearFilter === 'all' || itemYear === currentYearFilter;
        const topicMatch = currentTopicFilter === 'all' || itemTopics.includes(currentTopicFilter);

        if (yearMatch && topicMatch) {
            // Show if within visible count or showing all
            if (showingAll || visibleCount < INITIAL_VISIBLE_COUNT) {
                item.classList.remove('hidden');
                visibleCount++;
            } else {
                item.classList.add('hidden');
            }
        } else {
            item.classList.add('hidden');
        }
    });

    updateShowMoreButton();
}

// Update show more button visibility
function updateShowMoreButton() {
    const visibleItems = Array.from(pubItems).filter(item => !item.classList.contains('hidden'));
    const matchingItems = Array.from(pubItems).filter(item => {
        const itemYear = item.dataset.year;
        const itemTopics = item.dataset.topics || '';
        const yearMatch = currentYearFilter === 'all' || itemYear === currentYearFilter;
        const topicMatch = currentTopicFilter === 'all' || itemTopics.includes(currentTopicFilter);
        return yearMatch && topicMatch;
    });

    // Hide button if all matching items are visible
    if (visibleItems.length >= matchingItems.length || showingAll) {
        showMoreBtn.classList.add('hidden');
    } else {
        showMoreBtn.classList.remove('hidden');
    }
}

// Handle filter button clicks
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const filterType = btn.dataset.filterType;
        const filterValue = btn.dataset.filterValue;

        // Remove active class from siblings
        document.querySelectorAll(`[data-filter-type="${filterType}"]`).forEach(b => {
            b.classList.remove('active');
        });

        // Add active class to clicked button
        btn.classList.add('active');

        // Update current filter
        if (filterType === 'year') {
            currentYearFilter = filterValue;
        } else if (filterType === 'topic') {
            currentTopicFilter = filterValue;
        }

        // Reset show all state when filter changes
        showingAll = false;

        // Apply filters
        filterPublications();
    });
});

// Handle show more button click
showMoreBtn.addEventListener('click', () => {
    showingAll = true;
    filterPublications();

    // Smooth scroll to show newly revealed items
    setTimeout(() => {
        const firstHiddenIndex = Array.from(pubItems).findIndex((item, index) =>
            index >= INITIAL_VISIBLE_COUNT && !item.classList.contains('hidden')
        );
        if (firstHiddenIndex !== -1) {
            pubItems[INITIAL_VISIBLE_COUNT].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, 100);
});

// Initialize on page load
initializePublications();
