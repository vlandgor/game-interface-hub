const zone = document.getElementById('drop-zone');

zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('hover'); };
zone.ondragleave = () => zone.classList.remove('hover');

zone.ondrop = async (e) => {
    e.preventDefault();
    zone.classList.remove('hover');

    const file = e.dataTransfer.files[0];

    // 1. Grab the platform value from the header dropdown
    const platformSelector = document.getElementById('platform-selector');
    const platformValue = platformSelector ? platformSelector.value : 0;

    const formData = new FormData();
    formData.append('file', file);
    // 2. Add the platform to the request
    formData.append('platform', platformValue);

    const response = await fetch('/api/screenshots/upload', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        await loadGallery();
    } else {
        console.error("Upload failed");
    }
};

async function loadGallery() {
    try {
        const response = await fetch('/api/screenshots');
        const screenshots = await response.json();
        const gallery = document.getElementById('gallery');

        // 3. Map the data using your new schematic CSS classes
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