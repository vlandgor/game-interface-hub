document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const zone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const gallery = document.getElementById('gallery');

    // Staging Panel Elements
    const uploadPanel = document.getElementById('upload-panel');
    const stagingPreview = document.getElementById('staging-preview');
    const btnCancel = document.getElementById('btn-cancel');
    const btnConfirm = document.getElementById('btn-confirm-upload');

    // Form Inputs
    const inputGameTitle = document.getElementById('input-game-title');
    const inputPlatform = document.getElementById('input-platform');

    const platformSelector = document.getElementById('platform-selector');

    let pendingFile = null;

    // --- 1. Initial Load ---
    loadGallery();

    // --- 2. File Selection (Click & Drag/Drop) ---
    zone.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            prepareStaging(e.target.files[0]);
        }
    };

    zone.ondragover = (e) => {
        e.preventDefault();
        zone.classList.add('hover');
    };

    zone.ondragleave = () => zone.classList.remove('hover');

    zone.ondrop = (e) => {
        e.preventDefault();
        zone.classList.remove('hover');
        if (e.dataTransfer.files.length > 0) {
            prepareStaging(e.dataTransfer.files[0]);
        }
    };

    // Listen for changes on the header dropdown
    platformSelector.onchange = () => {
        loadGallery(platformSelector.value);
    };

    // --- 3. Staging Logic ---
    function prepareStaging(file) {
        pendingFile = file;

        // Create local preview
        const reader = new FileReader();
        reader.onload = (e) => {
            stagingPreview.src = e.target.result;
            uploadPanel.style.display = 'flex'; // Show modal
        };
        reader.readAsDataURL(file);
    }

    function closeStaging() {
        uploadPanel.style.display = 'none';
        pendingFile = null;
        fileInput.value = ''; // Clear input
        inputGameTitle.value = ''; // Reset form
    }

    btnCancel.onclick = closeStaging;

    // --- 4. Final Upload to API ---
    btnConfirm.onclick = async () => {
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
                await loadGallery();
            } else {
                alert("Upload failed. Check server logs.");
            }
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    async function loadGallery(platformId = 0) {
        try {
            // Pass the platformId as a query parameter
            // If 0 (All Platforms), we fetch everything
            const url = platformId == 0
                ? '/api/screenshots'
                : `/api/screenshots?platform=${platformId}`;

            const response = await fetch(url);
            const screenshots = await response.json();

            const gallery = document.getElementById('gallery');

            if (screenshots.length === 0) {
                gallery.innerHTML = '<div style="color: #666; padding: 20px;">No screenshots found for this platform.</div>';
                return;
            }

            gallery.innerHTML = screenshots.map(s => {
                const platforms = ["Uncategorized", "Desktop", "Mobile", "VR"];
                const platformLabel = platforms[s.platform] || "Uncategorized";

                return `
                <div class="screenshot-card">
                    <img src="/${s.filePath}" alt="${s.gameTitle}" class="card-preview">
                    <div class="card-meta">
                        <strong>${s.gameTitle || 'Untitled'}</strong><br>
                        <span style="color: #666">${platformLabel}</span><br>
                        <small style="color: #444">${new Date(s.uploadedAt).toLocaleDateString()}</small>
                    </div>
                </div>
            `;
            }).join('');
        } catch (err) {
            console.error("Failed to load gallery:", err);
        }
    }
});