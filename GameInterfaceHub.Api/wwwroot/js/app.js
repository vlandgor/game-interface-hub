document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        gallery: document.getElementById('gallery'),
        platformSelector: document.getElementById('platform-selector'),
        searchInput: document.getElementById('search-input'),
        uploadPanel: document.getElementById('upload-panel'),
        stagingPreview: document.getElementById('staging-preview'),
        btnCancelUpload: document.getElementById('btn-cancel'),
        btnConfirmUpload: document.getElementById('btn-confirm-upload'),
        inputGameTitle: document.getElementById('input-game-title'),
        inputPlatform: document.getElementById('input-platform'),
        inputCategory: document.getElementById('input-category'),
        detailPanel: document.getElementById('detail-panel'),
        detailPreview: document.getElementById('detail-preview'),
        detailTitle: document.getElementById('detail-title'),
        detailPlatformLabel: document.getElementById('detail-platform-label'),
        detailDate: document.getElementById('detail-date'),
        btnCloseDetail: document.getElementById('btn-close-detail'),
        btnDelete: document.getElementById('btn-delete-screenshot')
    };

    let currentScreenshots = [];
    let currentViewId = null;

    init();

    async function init() {
        await loadPlatforms();
        await loadCategories();
        await loadGallery();
    }

    async function loadPlatforms() {
        try {
            const response = await fetch('/api/platforms');
            if (!response.ok) return;
            const platforms = await response.json();
            elements.platformSelector.innerHTML = '<option value="0">All Platforms</option>';
            elements.inputPlatform.innerHTML = '';
            platforms.forEach(p => {
                const id = p.id ?? p.Id;
                const name = p.name ?? p.Name;
                elements.platformSelector.add(new Option(name, id));
                elements.inputPlatform.add(new Option(name, id));
            });
        } catch (err) { console.error(err); }
    }

    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) return;
            const categories = await response.json();
            elements.inputCategory.innerHTML = '';
            categories.forEach(c => {
                elements.inputCategory.add(new Option(c.name ?? c.Name, c.id ?? c.Id));
            });
        } catch (err) { console.error(err); }
    }

    async function loadGallery(platformId = 0) {
        try {
            const response = await fetch(`/api/screenshots?platformId=${platformId}`);
            currentScreenshots = await response.json();
            renderGallery(currentScreenshots);
        } catch (err) { console.error(err); }
    }

    function renderGallery(data) {
        if (!elements.gallery) return;
        if (data.length === 0) {
            elements.gallery.innerHTML = '<div style="color: #666; padding: 20px; text-align: center; width: 100%;">No screenshots found.</div>';
            return;
        }
        elements.gallery.innerHTML = data.map(s => `
            <div class="screenshot-card" data-id="${s.id}">
                <img src="/${s.filePath}" alt="${s.gameTitle}" class="card-preview">
                <div class="card-meta">
                    <strong>${s.gameTitle || 'Untitled'}</strong><br>
                    <span style="color: #666">${s.platform?.name || 'Unknown'}</span> | 
                    <span style="color: #666">${s.category?.name || 'Uncategorized'}</span>
                </div>
            </div>
        `).join('');
        document.querySelectorAll('.screenshot-card').forEach(card => {
            card.onclick = () => openDetail(card.getAttribute('data-id'));
        });
    }

    if (elements.searchInput) {
        elements.searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = currentScreenshots.filter(s =>
                (s.gameTitle || '').toLowerCase().includes(term)
            );
            renderGallery(filtered);
        };
    }

    if (elements.platformSelector) {
        elements.platformSelector.onchange = () => loadGallery(elements.platformSelector.value);
    }

    function openDetail(id) {
        const s = currentScreenshots.find(item => item.id == id);
        if (!s) return;
        currentViewId = id;
        elements.detailPreview.src = `/${s.filePath}`;
        elements.detailTitle.innerText = s.gameTitle || 'Untitled';
        elements.detailPlatformLabel.innerText = s.platform?.name || "Unknown";
        elements.detailDate.innerText = new Date(s.uploadedAt).toLocaleDateString();
        elements.detailPanel.style.display = 'flex';
    }

    if (elements.btnCloseDetail) elements.btnCloseDetail.onclick = () => elements.detailPanel.style.display = 'none';
    if (elements.btnCancelUpload) elements.btnCancelUpload.onclick = () => elements.uploadPanel.style.display = 'none';
});

let activeTags = [];

elements.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = e.target.value.trim().replace('#', '');
        if (val && !activeTags.includes(val)) {
            activeTags.push(val);
            renderTags();
            filterAndRender();
        }
        e.target.value = '';
    }
});

function renderTags() {
    const container = document.getElementById('active-tags-list');
    container.innerHTML = activeTags.map(tag => `
        <div class="tag-chip">
            #${tag}
            <span class="remove-tag" onclick="removeTag('${tag}')">&times;</span>
        </div>
    `).join('');
}

window.removeTag = (tag) => {
    activeTags = activeTags.filter(t => t !== tag);
    renderTags();
    filterAndRender();
};

function filterAndRender() {
    const term = elements.searchInput.value.toLowerCase();
    const filtered = currentScreenshots.filter(s => {
        const matchesTitle = s.gameTitle.toLowerCase().includes(term);
        // Backend stores Tags as a comma-separated string or array
        const screenshotTags = (s.tags || '').toLowerCase().split(',');
        const matchesTags = activeTags.length === 0 ||
            activeTags.every(t => screenshotTags.some(st => st.trim() === t.toLowerCase()));

        return matchesTitle && matchesTags;
    });
    renderGallery(filtered);
}