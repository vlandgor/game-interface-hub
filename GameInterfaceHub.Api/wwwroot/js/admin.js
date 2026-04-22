const ResourceService = {
    async fetchAll(endpoint) {
        const res = await fetch(`/api/${endpoint}`);
        return res.ok ? await res.json() : [];
    },
    async create(endpoint, data) {
        return await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },
    async delete(endpoint, id) {
        return await fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' });
    },
    async upload(formData) {
        return await fetch('/api/screenshots/upload', {
            method: 'POST',
            body: formData
        });
    }
};

const UI = {
    renderList(elementId, items, deleteCallback) {
        const list = document.getElementById(elementId);
        if (!list) return;
        list.innerHTML = items.map(item => `
            <li class="list-item">
                <span>${item.Name || item.name}</span>
                <button class="btn-delete" data-id="${item.Id || item.id}">Delete</button>
            </li>
        `).join('');
        list.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => deleteCallback(btn.dataset.id);
        });
    },
    populateSelect(elementId, items) {
        const select = document.getElementById(elementId);
        if (!select) return;
        select.innerHTML = items.map(item =>
            `<option value="${item.Id || item.id}">${item.Name || item.name}</option>`
        ).join('');
    }
};

let pendingFile = null;

async function refreshAll() {
    const platforms = await ResourceService.fetchAll('platforms');
    const categories = await ResourceService.fetchAll('categories');

    UI.renderList('platforms-list', platforms, (id) => handleDelete('platforms', id));
    UI.renderList('categories-list', categories, (id) => handleDelete('categories', id));

    UI.populateSelect('input-platform', platforms);
    UI.populateSelect('input-category', categories);
}

async function handleAdd(type) {
    const input = document.getElementById(`new-${type}-name`);
    if (!input || !input.value) return;
    const res = await ResourceService.create(type, { Name: input.value });
    if (res.ok) {
        input.value = '';
        refreshAll();
    }
}

async function handleDelete(type, id) {
    if (!confirm(`Delete this ${type.slice(0, -1)}?`)) return;
    const res = await ResourceService.delete(type, id);
    if (res.ok) refreshAll();
}

// Upload Logic
function handleFileSelect(file) {
    if (!file) return;
    pendingFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('staging-preview').src = e.target.result;
        document.getElementById('upload-form-container').style.display = 'block';
        document.getElementById('drop-zone').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
    refreshAll();

    // Platforms & Categories
    document.getElementById('add-platform-btn').onclick = () => handleAdd('platforms');
    document.getElementById('add-category-btn').onclick = () => handleAdd('categories');

    // Drag & Drop
    const zone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    zone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFileSelect(e.target.files[0]);

    zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('hover'); };
    zone.ondragleave = () => zone.classList.remove('hover');
    zone.ondrop = (e) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files[0]);
    };

    // Upload Actions
    document.getElementById('btn-cancel').onclick = () => {
        document.getElementById('upload-form-container').style.display = 'none';
        document.getElementById('drop-zone').style.display = 'flex';
        pendingFile = null;
    };

    document.getElementById('btn-confirm-upload').onclick = async () => {
        if (!pendingFile) return;
        const formData = new FormData();
        formData.append('file', pendingFile);
        formData.append('gameTitle', document.getElementById('input-game-title').value || "Untitled");
        formData.append('platformId', document.getElementById('input-platform').value);
        formData.append('categoryId', document.getElementById('input-category').value);

        const res = await ResourceService.upload(formData);
        if (res.ok) {
            alert("Uploaded successfully!");
            location.reload();
        }
    };
});