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

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const linkItems = document.querySelectorAll('.link-item');
        
        linkItems.forEach(item => {
            const title = item.querySelector('.link-title').textContent.toLowerCase();
            const description = item.querySelector('.link-description').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Tool link click handlers (placeholders for future functionality)
document.querySelectorAll('.link-item a').forEach(link => {
    link.addEventListener('click', function(e) {
        // Only prevent default for internal links (not external resources)
        if (this.getAttribute('href') === '#') {
            e.preventDefault();
            const toolName = this.textContent;
            console.log(`Opening tool: ${toolName}`);
            alert(`${toolName} - Coming Soon! This tool will be implemented shortly.`);
        }
    });
});

console.log('Useful Tool Hub initialized! 🛠️');
