// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover effect animation
const toolCards = document.querySelectorAll('.tool-card');
toolCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.borderColor = '#667eea';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.borderColor = '#e2e8f0';
    });
});

// Button click handlers (placeholders for future functionality)
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        const toolName = this.parentElement.querySelector('h3').textContent;
        console.log(`Opening tool: ${toolName}`);
        // Add your tool-specific logic here
        alert(`${toolName} - Coming Soon! This tool will be implemented shortly.`);
    });
});

// Add a subtle parallax effect to the hero section
window.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero');
    const scrolled = window.pageYOffset;
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    hero.style.opacity = 1 - (scrolled / 500);
});

// Add fade-in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all tool cards and resource cards
document.querySelectorAll('.tool-card, .resource-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

console.log('Useful Tool Hub initialized! 🛠️');
