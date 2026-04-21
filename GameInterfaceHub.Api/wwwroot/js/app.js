document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        zone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-input'),
        gallery: document.getElementById('gallery'),
        platformSelector: document.getElementById('platform-selector'),
        uploadPanel: document.getElementById('upload-panel'),
        stagingPreview: document.getElementById('staging-preview'),
        btnCancelUpload: document.getElementById('btn-cancel'),
        btnConfirmUpload: document.getElementById('btn-confirm-upload'),
        inputGameTitle: document.getElementById('input-game-title'),
        inputPlatform: document.getElementById('input-platform'),

        // New Category Elements
        categoryFilterList: document.getElementById('category-filter-list'),
        inputCategory: document.getElementById('input-category'),

        detailPanel: document.getElementById('detail-panel'),
        detailPreview: document.getElementById('detail-preview'),
        detailTitle: document.getElementById('detail-title'),
        detailPlatformLabel: document.getElementById('detail-platform-label'),
        detailDate: document.getElementById('detail-date'),
        btnCloseDetail: document.getElementById('btn-close-detail'),
        btnDelete: document.getElementById('btn-delete-screenshot')
    };

    let pendingFile = null;
    let currentScreenshots = [];
    let currentViewId = null;

    init();

    async function init() {
        console.log("App Initializing...");
        await loadPlatforms();
        await loadCategories(); // Initialize categories
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
        } catch (err) { console.error("Platform Load Error:", err); }
    }

    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) return;
            const categories = await response.json();

            // 1. Fill the Upload Modal Dropdown
            elements.inputCategory.innerHTML = '';
            categories.forEach(c => {
                const id = c.id ?? c.Id;
                const name = c.name ?? c.Name;
                elements.inputCategory.add(new Option(name, id));
            });

            // 2. Fill the Sidebar Filter List
            elements.categoryFilterList.innerHTML = `
                <div class="filter-item active" data-id="0">All</div>
                ${categories.map(c => `
                    <div class="filter-item" data-id="${c.id ?? c.Id}">${c.name ?? c.Name}</div>
                `).join('')}
            `;

            // Add click events for filtering
            elements.categoryFilterList.querySelectorAll('.filter-item').forEach(item => {
                item.onclick = () => {
                    elements.categoryFilterList.querySelector('.active')?.classList.remove('active');
                    item.classList.add('active');
                    loadGallery(elements.platformSelector.value, item.dataset.id);
                };
            });
        } catch (err) { console.error("Category Load Error:", err); }
    }

    async function loadGallery(platformId = 0, categoryId = 0) {
        try {
            let url = `/api/screenshots?platformId=${platformId}`;
            if (categoryId != 0) url += `&categoryId=${categoryId}`;

            const response = await fetch(url);
            currentScreenshots = await response.json();

            if (!elements.gallery) return;
            if (currentScreenshots.length === 0) {
                elements.gallery.innerHTML = '<div style="color: #666; padding: 20px;">No screenshots found.</div>';
                return;
            }

            elements.gallery.innerHTML = currentScreenshots.map(s => `
                <div class="screenshot-card" data-id="${s.id}">
                    <img src="/${s.filePath}" alt="${s.gameTitle}" class="card-preview">
                    <div class="card-meta">
                        <strong>${s.gameTitle || 'Untitled'}</strong><br>
                        <span style="color: #666">${s.platform?.name || 'Unknown'}</span> | 
                        <span style="color: #666">${s.category?.name || 'Uncategorized'}</span><br>
                        <small style="color: #444">${new Date(s.uploadedAt).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.screenshot-card').forEach(card => {
                card.onclick = () => openDetail(card.getAttribute('data-id'));
            });
        } catch (err) { console.error("Gallery Load Error:", err); }
    }

    // --- Upload Logic ---
    if (elements.btnConfirmUpload) {
        elements.btnConfirmUpload.onclick = async () => {
            if (!pendingFile) return;
            const formData = new FormData();
            formData.append('file', pendingFile);
            formData.append('gameTitle', elements.inputGameTitle.value || "Untitled");
            formData.append('platformId', elements.inputPlatform.value);
            formData.append('categoryId', elements.inputCategory.value); // Sending Category ID

            const response = await fetch('/api/screenshots/upload', { method: 'POST', body: formData });
            if (response.ok) {
                closeStaging();
                loadGallery(elements.platformSelector.value);
            }
        };
    }

    // --- Remaining boilerplate (Drag/Drop, Staging, Detail) ---
    function prepareStaging(file) {
        pendingFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.stagingPreview.src = e.target.result;
            elements.uploadPanel.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }

    function closeStaging() {
        elements.uploadPanel.style.display = 'none';
        pendingFile = null;
        elements.fileInput.value = '';
        elements.inputGameTitle.value = '';
    }

    function openDetail(id) {
        const screenshot = currentScreenshots.find(s => s.id === id);
        if (!screenshot) return;
        currentViewId = id;
        elements.detailPreview.src = `/${screenshot.filePath}`;
        elements.detailTitle.innerText = screenshot.gameTitle || 'Untitled';
        elements.detailPlatformLabel.innerText = screenshot.platform?.name || "Unknown";
        elements.detailDate.innerText = new Date(screenshot.uploadedAt).toLocaleDateString();
        elements.detailPanel.style.display = 'flex';
    }

    if (elements.platformSelector) {
        elements.platformSelector.onchange = () => {
            const activeCat = elements.categoryFilterList.querySelector('.active')?.dataset.id || 0;
            loadGallery(elements.platformSelector.value, activeCat);
        };
    }

    if (elements.zone) {
        elements.zone.onclick = () => elements.fileInput.click();
        elements.zone.ondragover = (e) => { e.preventDefault(); elements.zone.classList.add('hover'); };
        elements.zone.ondragleave = () => elements.zone.classList.remove('hover');
        elements.zone.ondrop = (e) => {
            e.preventDefault();
            elements.zone.classList.remove('hover');
            if (e.dataTransfer.files.length > 0) prepareStaging(e.dataTransfer.files[0]);
        };
    }

    if (elements.fileInput) {
        elements.fileInput.onchange = (e) => { if (e.target.files.length > 0) prepareStaging(e.target.files[0]); };
    }

    if (elements.btnCancelUpload) elements.btnCancelUpload.onclick = closeStaging;
    if (elements.btnCloseDetail) elements.btnCloseDetail.onclick = () => elements.detailPanel.style.display = 'none';
    if (elements.btnDelete) {
        elements.btnDelete.onclick = async () => {
            if (!currentViewId || !confirm("Delete this?")) return;
            const response = await fetch(`/api/screenshots/${currentViewId}`, { method: 'DELETE' });
            if (response.ok) {
                elements.detailPanel.style.display = 'none';
                loadGallery();
            }
        };
    }
});