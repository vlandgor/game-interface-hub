const zone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

// --- Click to Upload Logic ---
zone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    if (e.target.files.length > 0) {
        handleUpload(e.target.files[0]);
    }
};

// --- Drag and Drop Logic ---
zone.ondragover = (e) => {
    e.preventDefault();
    zone.classList.add('hover');
};

zone.ondragleave = (e) => {
    zone.classList.remove('hover');
};

zone.ondrop = async (e) => {
    e.preventDefault();
    zone.classList.remove('hover');

    if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files[0]);
    }
};

// --- Unified Upload Function ---
async function handleUpload(file) {
    const platformSelector = document.getElementById('platform-selector');
    const platformValue = platformSelector ? platformSelector.value : 0;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('platform', platformValue);

    const response = await fetch('/api/screenshots/upload', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        await loadGallery();
        fileInput.value = ''; // Reset input so same file can be uploaded twice if needed
    } else {
        console.error("Upload failed");
    }
}

async function loadGallery() {
    try {
        const response = await fetch('/api/screenshots');
        const screenshots = await response.json();
        const gallery = document.getElementById('gallery');

        gallery.innerHTML = screenshots.map(s => {
            const platforms = ["Uncategorized", "Desktop", "Mobile", "VR"];
            const platformLabel = platforms[s.platform] || "Uncategorized";

            return `
                <div class="screenshot-card">
                    <img src="${s.filePath}" alt="${s.gameTitle}" class="card-preview">
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

loadGallery();