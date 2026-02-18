// ============================================
// Useful Tool Hub — Main Script
// ============================================

(function () {
    'use strict';

    const searchInput = document.getElementById('searchInput');
    const toolsGrid = document.getElementById('toolsGrid');
    const visibleCount = document.getElementById('visibleCount');

    // --- Search ---
    function filterTools(query) {
        const cards = toolsGrid.querySelectorAll('.tool-card');
        let visible = 0;

        cards.forEach(card => {
            const title = card.querySelector('.tool-card-title')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('.tool-card-desc')?.textContent.toLowerCase() || '';
            const keywords = (card.dataset.keywords || '').toLowerCase();
            const match = !query || title.includes(query) || desc.includes(query) || keywords.includes(query);

            card.style.display = match ? '' : 'none';
            if (match) visible++;
        });

        if (visibleCount) {
            visibleCount.textContent = `${visible} tool${visible !== 1 ? 's' : ''}`;
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterTools(searchInput.value.trim().toLowerCase());
        });

        // Ctrl+K shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
            // Escape to clear
            if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.value = '';
                filterTools('');
                searchInput.blur();
            }
        });
    }

    console.log('Useful Tool Hub initialized');
})();
