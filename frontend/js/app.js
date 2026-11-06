
async function api(url, options = {}) {
  const response = await fetch('/api' + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Request failed.');
  }

  return result;
}

function msg(id, text, error = false) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = text;
  el.classList.toggle('error', error);
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function formatDate(value) {
  if (!value) return '—';

  const dateText = String(value).slice(0, 10);
  const parts = dateText.split('-');

  if (parts.length !== 3) return safe(value);

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function statusPill(status) {
  return `<span class="pill ${status === 'Out of Stock' ? 'out' : ''}">${safe(status)}</span>`;
}

// DASHBOARD

async function loadDashboard() {
  try {
    const [e, u, i] = await Promise.all([
      api('/equipment'),
      api('/users'),
      api('/issues')
    ]);

    const equipment = e.data;
    const issues = i.data;

    document.getElementById('totalUnits').textContent =
      equipment.reduce((s, x) => s + Number(x.quantity), 0);

    document.getElementById('availableUnits').textContent =
      equipment.reduce((s, x) => s + Number(x.available_quantity), 0);

    document.getElementById('totalUsers').textContent = u.data.length;

    document.getElementById('activeIssues').textContent =
      issues.filter(x => x.status === 'Issued').length;

    document.getElementById('dashboardRows').innerHTML =
      equipment.map(x => `
        <tr>
          <td>${safe(x.name)}</td>
          <td>${safe(x.category)}</td>
          <td>${x.quantity}</td>
          <td>${x.available_quantity}</td>
          <td>${statusPill(x.status)}</td>
        </tr>
      `).join('') ||
      '<tr><td colspan="5">No equipment added yet.</td></tr>';

  } catch (e) {
    document.getElementById('dashboardRows').innerHTML =
      `<tr><td colspan="5">${safe(e.message)}</td></tr>`;
  }
}

// EQUIPMENT

let equipmentCache = [];

async function loadEquipment() {
  try {
    const r = await api('/equipment');
    equipmentCache = r.data;
    renderEquipment();
  } catch (e) {
    msg('equipmentMessage', e.message, true);
  }

  document.getElementById('equipmentSearch').addEventListener('input', renderEquipment);
  document.getElementById('equipmentForm').addEventListener('submit', saveEquipment);
}

function renderEquipment() {
  const q = document.getElementById('equipmentSearch').value.toLowerCase();

  const rows = equipmentCache.filter(x =>
    (x.name + ' ' + x.category).toLowerCase().includes(q)
  );

  document.getElementById('equipmentRows').innerHTML =
    rows.map(x => `
      <tr>
        <td>${safe(x.name)}</td>
        <td>${safe(x.category)}</td>
        <td>${x.quantity}</td>
        <td>${x.available_quantity}</td>
        <td>${statusPill(x.status)}</td>
        <td>
          <button class="action-btn" onclick="editEquipment(${x.equipment_id})">Edit</button>
          <button class="action-btn delete" onclick="deleteEquipment(${x.equipment_id})">Delete</button>
        </td>
      </tr>
    `).join('') ||
    '<tr><td colspan="6">No matching equipment.</td></tr>';
}

function resetEquipmentForm() {
  document.getElementById('equipmentForm').reset();
  document.getElementById('equipmentId').value = '';
  document.getElementById('equipmentFormTitle').textContent = 'Add equipment';
  document.getElementById('equipmentQuantity').value = 1;
}

function editEquipment(id) {
  const x = equipmentCache.find(v => v.equipment_id === id);
  if (!x) return;

  document.getElementById('equipmentId').value = id;
  document.getElementById('equipmentName').value = x.name;
  document.getElementById('equipmentCategory').value = x.category;
  document.getElementById('equipmentQuantity').value = x.quantity;
  document.getElementById('equipmentFormTitle').textContent = 'Edit equipment';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveEquipment(ev) {
  ev.preventDefault();

  const id = document.getElementById('equipmentId').value;

  const body = {
    name: document.getElementById('equipmentName').value,
    category: document.getElementById('equipmentCategory').value,
    quantity: Number(document.getElementById('equipmentQuantity').value)
  };

  try {
    const r = await api('/equipment' + (id ? '/' + id : ''), {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    });

    msg('equipmentMessage', r.message);
    resetEquipmentForm();
    await loadEquipment();

  } catch (e) {
    msg('equipmentMessage', e.message, true);
  }
}

async function deleteEquipment(id) {
  if (!confirm('Delete this equipment?')) return;

  try {
    const r = await api('/equipment/' + id, { method: 'DELETE' });
    msg('equipmentMessage', r.message);
    await loadEquipment();
  } catch (e) {
    msg('equipmentMessage', e.message, true);
  }
}

// USERS

async function loadUsers() {
  document.getElementById('userForm').addEventListener('submit', saveUser);

  try {
    const r = await api('/users');
    renderUsers(r.data);
  } catch (e) {
    msg('userMessage', e.message, true);
  }
}

async function refreshUsers() {
  const r = await api('/users');
  renderUsers(r.data);
}

function renderUsers(rows) {
  document.getElementById('userRows').innerHTML =
    rows.map(u => `
      <tr>
        <td>${safe(u.name)}</td>
        <td>${safe(u.email)}</td>
        <td>${safe(u.role)}</td>
        <td>
          <button class="action-btn delete" onclick="deleteUser(${u.user_id})">Delete</button>
        </td>
      </tr>
    `).join('') ||
    '<tr><td colspan="4">No users registered.</td></tr>';
}

async function saveUser(ev) {
  ev.preventDefault();

  const body = {
    name: document.getElementById('userName').value,
    email: document.getElementById('userEmail').value,
    role: document.getElementById('userRole').value
  };

  try {
    const r = await api('/users', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    msg('userMessage', r.message);
    ev.target.reset();
    await refreshUsers();

  } catch (e) {
    msg('userMessage', e.message, true);
  }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;

  try {
    const r = await api('/users/' + id, { method: 'DELETE' });
    msg('userMessage', r.message);
    await refreshUsers();
  } catch (e) {
    msg('userMessage', e.message, true);
  }
}

// ISSUE EQUIPMENT

async function loadIssuePage() {
  document.getElementById('issueForm').addEventListener('submit', saveIssue);

  // Set the minimum selectable due date to today.
  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  const dueDateInput = document.getElementById('issueDueDate');
  dueDateInput.min = localToday;

  try {
    const [e, u, i] = await Promise.all([
      api('/equipment'),
      api('/users'),
      api('/issues')
    ]);

    document.getElementById('issueEquipment').innerHTML =
      '<option value="">Choose equipment</option>' +
      e.data
        .filter(x => x.available_quantity > 0)
        .map(x => `
          <option value="${x.equipment_id}">
            ${safe(x.name)} (${x.available_quantity} available)
          </option>
        `).join('');

    document.getElementById('issueUser').innerHTML =
      '<option value="">Choose user</option>' +
      u.data.map(x => `
        <option value="${x.user_id}">
          ${safe(x.name)} — ${safe(x.role)}
        </option>
      `).join('');

    renderActiveIssues(i.data);

  } catch (e) {
    msg('issueMessage', e.message, true);
  }
}

function renderActiveIssues(rows) {
  const active = rows.filter(x => x.status === 'Issued');

  document.getElementById('activeIssueRows').innerHTML =
    active.map(x => `
      <tr>
        <td>${safe(x.equipment_name)}</td>
        <td>${safe(x.user_name)}</td>
        <td>${formatDate(x.issue_date)}</td>
        <td>${formatDate(x.due_date)}</td>
        <td>${x.quantity}</td>
        <td>${statusPill(x.status)}</td>
      </tr>
    `).join('') ||
    '<tr><td colspan="6">No active issues.</td></tr>';
}

async function saveIssue(ev) {
  ev.preventDefault();

  const body = {
    equipment_id: Number(document.getElementById('issueEquipment').value),
    user_id: Number(document.getElementById('issueUser').value),
    quantity: Number(document.getElementById('issueQuantity').value),
    due_date: document.getElementById('issueDueDate').value
  };

  try {
    const r = await api('/issues', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    msg('issueMessage', r.message);
    ev.target.reset();

    await loadIssuePage();

  } catch (e) {
    msg('issueMessage', e.message, true);
  }
}

// ISSUE HISTORY

async function loadHistory() {
  try {
    const r = await api('/issues');

    document.getElementById('historyRows').innerHTML =
      r.data.map(x => `
        <tr>
          <td>${safe(x.equipment_name)}</td>
          <td>${safe(x.user_name)}</td>
          <td>${formatDate(x.issue_date)}</td>
          <td>${formatDate(x.due_date)}</td>
          <td>${formatDate(x.return_date)}</td>
          <td>${x.quantity}</td>
          <td>${statusPill(x.status)}</td>
          <td>
            ${x.status === 'Issued'
              ? `<button class="action-btn" onclick="returnEquipment(${x.issue_id})">Return</button>`
              : '—'}
          </td>
        </tr>
      `).join('') ||
      '<tr><td colspan="8">No issue records yet.</td></tr>';

  } catch (e) {
    msg('historyMessage', e.message, true);
  }
}

async function returnEquipment(id) {
  if (!confirm('Confirm that this equipment has been returned?')) return;

  try {
    const r = await api('/issues/' + id + '/return', {
      method: 'POST'
    });

    msg('historyMessage', r.message);
    await loadHistory();

  } catch (e) {
    msg('historyMessage', e.message, true);
  }
}
