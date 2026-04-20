document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const zone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const gallery = document.getElementById('gallery');
    const platformSelector = document.getElementById('platform-selector');

    // Staging (Upload) Panel Elements
    const uploadPanel = document.getElementById('upload-panel');
    const stagingPreview = document.getElementById('staging-preview');
    const btnCancelUpload = document.getElementById('btn-cancel');
    const btnConfirmUpload = document.getElementById('btn-confirm-upload');
    const inputGameTitle = document.getElementById('input-game-title');
    const inputPlatform = document.getElementById('input-platform');

    // Detail (Viewer) Panel Elements
    const detailPanel = document.getElementById('detail-panel');
    const detailPreview = document.getElementById('detail-preview');
    const detailTitle = document.getElementById('detail-title');
    const detailPlatformLabel = document.getElementById('detail-platform-label');
    const detailDate = document.getElementById('detail-date');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    const btnDelete = document.getElementById('btn-delete-screenshot');

    // --- State ---
    let pendingFile = null;
    let currentScreenshots = []; // Cache for current gallery items
    let currentViewId = null;

    // --- 1. Initial Load ---
    loadGallery();

    // --- 2. Event Listeners ---

    // Header Filter
    platformSelector.onchange = () => loadGallery(platformSelector.value);

    // Upload Interactions
    zone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) prepareStaging(e.target.files[0]);
    };

    zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('hover'); };
    zone.ondragleave = () => zone.classList.remove('hover');
    zone.ondrop = (e) => {
        e.preventDefault();
        zone.classList.remove('hover');
        if (e.dataTransfer.files.length > 0) prepareStaging(e.dataTransfer.files[0]);
    };

    // --- 3. Staging (Upload) Logic ---
    function prepareStaging(file) {
        pendingFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            stagingPreview.src = e.target.result;
            uploadPanel.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }

    function closeStaging() {
        uploadPanel.style.display = 'none';
        pendingFile = null;
        fileInput.value = '';
        inputGameTitle.value = '';
    }

    btnCancelUpload.onclick = closeStaging;

    btnConfirmUpload.onclick = async () => {
        if (!pendingFile) return;

        const formData = new FormData();
        formData.append('file', pendingFile);
        formData.append('gameTitle', inputGameTitle.value || "Untitled");
        formData.append('platform', inputPlatform.value);

        try {
            const response = await fetch('/api/screenshots/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                closeStaging();
                await loadGallery(platformSelector.value);
            }
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    // --- 4. Detail View & Delete Logic ---
    function openDetail(id) {
        const screenshot = currentScreenshots.find(s => s.id === id);
        if (!screenshot) return;

        currentViewId = id;
        detailPreview.src = `/${screenshot.filePath}`;
        detailTitle.innerText = screenshot.gameTitle || 'Untitled';

        const platforms = ["Uncategorized", "Desktop", "Mobile", "VR"];
        detailPlatformLabel.innerText = platforms[screenshot.platform] || "Uncategorized";
        detailDate.innerText = new Date(screenshot.uploadedAt).toLocaleDateString();

        detailPanel.style.display = 'flex';
    }

    function closeDetail() {
        detailPanel.style.display = 'none';
        currentViewId = null;
    }

    btnCloseDetail.onclick = closeDetail;

    btnDelete.onclick = async () => {
        if (!currentViewId) return;

        if (!confirm("Are you sure you want to delete this screenshot? This cannot be undone.")) return;

        try {
            const response = await fetch(`/api/screenshots/${currentViewId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                closeDetail();
                await loadGallery(platformSelector.value);
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    // --- 5. Gallery Rendering ---
    async function loadGallery(platformId = 0) {
        try {
            const url = platformId == 0
                ? '/api/screenshots'
                : `/api/screenshots?platform=${platformId}`;

            const response = await fetch(url);
            currentScreenshots = await response.json(); // Save to state

            if (currentScreenshots.length === 0) {
                gallery.innerHTML = '<div style="color: #666; padding: 20px;">No screenshots found.</div>';
                return;
            }

            gallery.innerHTML = currentScreenshots.map(s => {
                const platforms = ["Uncategorized", "Desktop", "Mobile", "VR"];
                const platformLabel = platforms[s.platform] || "Uncategorized";

                return `
                <div class="screenshot-card" data-id="${s.id}">
                    <img src="/${s.filePath}" alt="${s.gameTitle}" class="card-preview">
                    <div class="card-meta">
                        <strong>${s.gameTitle || 'Untitled'}</strong><br>
                        <span style="color: #666">${platformLabel}</span><br>
                        <small style="color: #444">${new Date(s.uploadedAt).toLocaleDateString()}</small>
                    </div>
                </div>
            `;
            }).join('');

            // Event Delegation: Attach click listener to cards
            document.querySelectorAll('.screenshot-card').forEach(card => {
                card.onclick = () => openDetail(card.getAttribute('data-id'));
            });

        } catch (err) {
            console.error("Failed to load gallery:", err);
        }
    }
});