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
    }
};

const UI = {
    renderList(elementId, items, deleteCallback) {
        const list = document.getElementById(elementId);

        if (!list) {
            console.error(`DOM Element not found: ${elementId}`);
            return;
        }

        list.innerHTML = items.map(item => `
            <li class="list-item">
                <span>${item.Name || item.name}</span>
                <button class="btn-delete" data-id="${item.Id || item.id}">Delete</button>
            </li>
        `).join('');

        list.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => deleteCallback(btn.dataset.id);
        });
    }
};

async function refreshSection(type) {
    const data = await ResourceService.fetchAll(type);
    UI.renderList(`${type}-list`, data, (id) => handleDelete(type, id));
}

async function handleAdd(type) {
    const input = document.getElementById(`new-${type}-name`);
    if (!input || !input.value) return;

    const res = await ResourceService.create(type, { Name: input.value });
    if (res.ok) {
        input.value = '';
        refreshSection(type);
    }
}

async function handleDelete(type, id) {
    if (!confirm(`Delete this ${type.slice(0, -1)}?`)) return;
    const res = await ResourceService.delete(type, id);
    if (res.ok) refreshSection(type);
}

document.addEventListener('DOMContentLoaded', () => {
    refreshSection('platforms');
    refreshSection('categories');

    const platformBtn = document.getElementById('add-platform-btn');
    const categoryBtn = document.getElementById('add-category-btn');

    if (platformBtn) platformBtn.onclick = () => handleAdd('platforms');
    if (categoryBtn) categoryBtn.onclick = () => handleAdd('categories');
});