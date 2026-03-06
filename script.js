// Canvas Constellation Animation
const canvas = document.getElementById('cosmos-bg');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
const numParticles = 300; // More particles for better structure
const connectionDistance = 120; // Shorter connections for localized filaments

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

class Particle {
    constructor(isClustered = true) {
        this.reset(isClustered);
    }

    reset(isClustered = true) {
        if (isClustered && window.massCenters) {
            // Pick a random mass center
            const center = window.massCenters[Math.floor(Math.random() * window.massCenters.length)];
            // Add Gaussian-ish noise to cluster around center
            const dist = Math.pow(Math.random(), 2) * 200;
            const angle = Math.random() * Math.PI * 2;
            this.x = center.x + Math.cos(angle) * dist;
            this.y = center.y + Math.sin(angle) * dist;
        } else {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        }

        this.vx = (Math.random() - 0.5) * 0.2; // Even slower movement
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 1 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around instead of bouncing for a more continuous flow
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }

    draw() {
        ctx.beginPath();
        // Slightly varying size for depth
        const depthOpacity = 0.05 + (this.size / 2) * 0.1;
        ctx.fillStyle = `rgba(44, 62, 80, ${depthOpacity})`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    // Create mass centers for "Cosmic Web" effect
    window.massCenters = [];
    const numCenters = 12;
    for (let i = 0; i < numCenters; i++) {
        window.massCenters.push({
            x: Math.random() * width,
            y: Math.random() * height
        });
    }

    particles = [];
    for (let i = 0; i < numParticles; i++) {
        // 85% clustered, 15% uniform background to better define voids
        particles.push(new Particle(Math.random() > 0.15));
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p, index) => {
        p.update();
        p.draw();

        // Draw connections (Cosmic Filaments)
        // Optimization: only check a limited number of connections per particle
        for (let j = index + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < connectionDistance * connectionDistance) {
                const distance = Math.sqrt(distSq);
                ctx.beginPath();
                // Even more subtle lines, fading with distance
                const strength = Math.pow(1 - (distance / connectionDistance), 2);
                ctx.strokeStyle = `rgba(44, 62, 80, ${strength * 0.07})`;
                ctx.lineWidth = 0.3;
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

    pubItems.forEach((item) => {
        const itemYear = item.dataset.year;

        // Check if item matches filters
        const yearMatch = currentYearFilter === 'all' || itemYear === currentYearFilter;

        if (yearMatch) {
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
        const yearMatch = currentYearFilter === 'all' || itemYear === currentYearFilter;
        return yearMatch;
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

// Handle clicks inside pub-impact to prevent opening the arxiv link
document.querySelectorAll('.pub-impact').forEach(impact => {
    impact.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// News PDF Modal functions
function openNewsModal(url) {
    const modal = document.getElementById('news-modal');
    const iframe = document.getElementById('modal-iframe');
    if (modal && iframe) {
        iframe.src = url;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
}

function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    const iframe = document.getElementById('modal-iframe');
    if (modal && iframe) {
        modal.classList.remove('active');
        iframe.src = '';
        document.body.style.overflow = ''; // Restore background scroll
    }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeNewsModal();
    }
});

// Toggle Impact Section Visibility
function toggleImpact(event, btn) {
    event.stopPropagation();
    const impactSection = btn.closest('.pub-content').querySelector('.collapsible-impact');
    impactSection.classList.toggle('show');
    btn.classList.toggle('active');

    // Smooth text update
    const text = btn.querySelector('span');
    if (impactSection.classList.contains('show')) {
        text.textContent = 'Hide Media & Impact';
    } else {
        text.textContent = 'View Media & Impact';
    }
}

// Contact Form AJAX Submission
const contactForm = document.querySelector('.contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const submitBtn = contactForm.querySelector('.submit-btn');

        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Success
                formStatus.textContent = '✓ Message sent successfully! I\'ll get back to you soon.';
                formStatus.classList.add('success');
                contactForm.reset();
            } else {
                // Error
                formStatus.textContent = '✗ Oops! There was a problem sending your message. Please try again.';
                formStatus.classList.add('error');
            }
        } catch (error) {
            // Network error
            formStatus.textContent = '✗ Network error. Please check your connection and try again.';
            formStatus.classList.add('error');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
}

