document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Element Selectors ---
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
        detailPanel: document.getElementById('detail-panel'),
        detailPreview: document.getElementById('detail-preview'),
        detailTitle: document.getElementById('detail-title'),
        detailPlatformLabel: document.getElementById('detail-platform-label'),
        detailDate: document.getElementById('detail-date'),
        btnCloseDetail: document.getElementById('btn-close-detail'),
        btnDelete: document.getElementById('btn-delete-screenshot')
    };

    // --- 2. State ---
    let pendingFile = null;
    let currentScreenshots = [];
    let currentViewId = null;

    // --- 3. Initial Logic ---
    init();

    async function init() {
        console.log("App Initializing...");
        await loadPlatforms();
        await loadGallery();
    }

    // --- 4. Functions ---

    async function loadPlatforms() {
        try {
            const response = await fetch('http://localhost:5069/api/platforms');
            if (!response.ok) return;

            const platforms = await response.json();
            console.log("API Platforms:", platforms);

            if (!elements.platformSelector || !elements.inputPlatform) return;

            elements.platformSelector.innerHTML = '<option value="0">All Platforms</option>';
            elements.inputPlatform.innerHTML = '';

            platforms.forEach(p => {
                const id = p.id ?? p.Id;
                const name = p.name ?? p.Name;

                const opt1 = new Option(name, id);
                elements.platformSelector.add(opt1);

                const opt2 = new Option(name, id);
                elements.inputPlatform.add(opt2);
            });
        } catch (err) {
            console.error("Platform Load Error:", err);
        }
    }

    async function loadGallery(platformId = 0) {
        try {
            const url = platformId == 0 ? '/api/screenshots' : `/api/screenshots?platformId=${platformId}`;
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
                        <span style="color: #666">${s.platform ? (s.platform.name || s.platform.Name) : 'Unknown'}</span><br>
                        <small style="color: #444">${new Date(s.uploadedAt).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.screenshot-card').forEach(card => {
                card.onclick = () => openDetail(card.getAttribute('data-id'));
            });
        } catch (err) {
            console.error("Gallery Load Error:", err);
        }
    }

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
        elements.detailPlatformLabel.innerText = screenshot.platform ? (screenshot.platform.name || screenshot.platform.Name) : "Unknown";
        elements.detailDate.innerText = new Date(screenshot.uploadedAt).toLocaleDateString();
        elements.detailPanel.style.display = 'flex';
    }

    // --- 5. Event Listeners ---
    if (elements.platformSelector) {
        elements.platformSelector.onchange = () => loadGallery(elements.platformSelector.value);
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
        elements.fileInput.onchange = (e) => {
            if (e.target.files.length > 0) prepareStaging(e.target.files[0]);
        };
    }

    if (elements.btnCancelUpload) elements.btnCancelUpload.onclick = closeStaging;

    if (elements.btnConfirmUpload) {
        elements.btnConfirmUpload.onclick = async () => {
            if (!pendingFile) return;
            const formData = new FormData();
            formData.append('file', pendingFile);
            formData.append('gameTitle', elements.inputGameTitle.value || "Untitled");
            formData.append('platformId', elements.inputPlatform.value);

            const response = await fetch('/api/screenshots/upload', { method: 'POST', body: formData });
            if (response.ok) {
                closeStaging();
                loadGallery(elements.platformSelector.value);
            }
        };
    }

    if (elements.btnCloseDetail) elements.btnCloseDetail.onclick = () => elements.detailPanel.style.display = 'none';

    if (elements.btnDelete) {
        elements.btnDelete.onclick = async () => {
            if (!currentViewId || !confirm("Delete this?")) return;
            const response = await fetch(`/api/screenshots/${currentViewId}`, { method: 'DELETE' });
            if (response.ok) {
                elements.detailPanel.style.display = 'none';
                loadGallery(elements.platformSelector.value);
            }
        };
    }
});