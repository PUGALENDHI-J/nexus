/* ============================================================
   ADMIN DASHBOARD — Saran Tours & Travels
   All data operations via Supabase — no localStorage
   ============================================================ */

const cabTableBody   = document.getElementById('cabTableBody');
const cabModal       = document.getElementById('cabModal');
const cabForm        = document.getElementById('cabForm');
const addCabBtn      = document.getElementById('addCabBtn');
const realtimeStatus = document.getElementById('realtimeStatus');
const closeModalBtns = document.querySelectorAll('.close, .close-modal');

// ─── RENDER TABLE ───────────────────────────────────────────────────────────

function renderCabs(cabs) {
  if (!cabTableBody) return;

  if (!cabs || cabs.length === 0) {
    cabTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:20px;color:#555;">
          No cabs found. Click <strong>+ Add New Cab</strong> to get started.
        </td>
      </tr>`;
    return;
  }

  cabTableBody.innerHTML = cabs.map(cab => `
    <tr>
      <td><img src="../${cab.image || 'images/sedan.png'}" class="table-img" alt="${cab.name}" onerror="this.src='../images/sedan.png'"></td>
      <td><strong>${cab.name}</strong></td>
      <td>${cab.type}</td>
      <td>₹${cab.price}/km</td>
      <td><span class="status-badge status-${(cab.availability || 'available').toLowerCase()}">${cab.availability || 'Available'}</span></td>
      <td>
        <button type="button" onclick="editCab('${cab.id}')" class="btn btn-sm btn-outline">Edit</button>
        <button type="button" onclick="deleteCabById('${cab.id}')" class="btn btn-sm btn-outline" style="color:red;border-color:red;">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ─── LOAD CABS FROM SUPABASE ────────────────────────────────────────────────

async function loadCabs() {
  try {
    if (cabTableBody) {
      cabTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Loading…</td></tr>`;
    }
    const cabs = await dataAPI.fetchCabs();
    renderCabs(cabs);
    return cabs;
  } catch (err) {
    console.error('[Admin] loadCabs failed:', err);
    if (cabTableBody) {
      cabTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:red;">Error loading cabs. Check console.</td></tr>`;
    }
  }
}

// ─── MODAL OPEN/CLOSE ───────────────────────────────────────────────────────

function openModal() { if (cabModal) cabModal.style.display = 'block'; }
function closeModal() { if (cabModal) cabModal.style.display = 'none'; }

if (addCabBtn) {
  addCabBtn.onclick = () => {
    if (!cabForm) return;
    cabForm.reset();
    document.getElementById('cabId').value = '';
    document.getElementById('modalTitle').innerText = 'Add New Cab';
    openModal();
  };
}

closeModalBtns.forEach(btn => { btn.onclick = closeModal; });
window.onclick = (e) => { if (e.target === cabModal) closeModal(); };

// ─── FORM SUBMIT — INSERT or UPDATE ─────────────────────────────────────────

if (cabForm) {
  cabForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('cabId').value.trim();
    let imgPath = document.getElementById('cabImage').value.trim() || 'images/sedan.png';
    imgPath = imgPath.replace(/^\.\.\//g, '');

    const cabData = {
      name:         document.getElementById('cabName').value.trim(),
      type:         document.getElementById('cabType').value,
      price:        Number(document.getElementById('cabPrice').value) || 0,
      availability: document.getElementById('cabAvailability').value,
      image:        imgPath,
    };

    const submitBtn = cabForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (id) {
        await dataAPI.updateCab(id, cabData);
        console.log('[Admin] Cab updated:', id);
      } else {
        await dataAPI.insertCab(cabData);
        console.log('[Admin] Cab inserted');
      }
      closeModal();
      // Realtime will auto-refresh the table; also force a load as safety net
      await loadCabs();
    } catch (err) {
      console.error('[Admin] Save cab error:', err);
      alert('❌ Failed to save cab: ' + (err.message || 'Check console for details.'));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  };
}

// ─── EDIT CAB ────────────────────────────────────────────────────────────────

window.editCab = async (id) => {
  try {
    const cabs = await dataAPI.fetchCabs();
    const cab = cabs.find(c => String(c.id) === String(id));
    if (!cab) { alert('Cab not found.'); return; }

    document.getElementById('cabId').value           = cab.id;
    document.getElementById('cabName').value         = cab.name;
    document.getElementById('cabType').value         = cab.type;
    document.getElementById('cabPrice').value        = cab.price;
    document.getElementById('cabAvailability').value = cab.availability || 'Available';
    document.getElementById('cabImage').value        = cab.image || '';
    document.getElementById('modalTitle').innerText  = 'Edit Cab';
    openModal();
  } catch (err) {
    console.error('[Admin] editCab error:', err);
    alert('❌ Failed to load cab for editing: ' + err.message);
  }
};

// ─── DELETE CAB ──────────────────────────────────────────────────────────────

window.deleteCabById = async (id) => {
  if (!confirm('Are you sure you want to delete this cab?')) return;
  try {
    await dataAPI.deleteCab(id);
    console.log('[Admin] Cab deleted:', id);
    await loadCabs();
  } catch (err) {
    console.error('[Admin] deleteCab error:', err);
    alert('❌ Failed to delete cab: ' + err.message);
  }
};

// ─── REALTIME SUBSCRIPTION ───────────────────────────────────────────────────

async function startRealtime() {
  try {
    await dataAPI.subscribeToCabs(async (_eventType, freshCabs) => {
      console.log('[Admin Realtime] cab_services changed, refreshing table');
      renderCabs(freshCabs);
    });

    // Show live indicator
    if (realtimeStatus) realtimeStatus.style.display = 'inline';
    console.log('[Admin] Realtime subscription active');
  } catch (err) {
    console.warn('[Admin] Realtime subscription failed:', err.message);
  }
}

// ─── INIT ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for dataAPI to be ready before loading
  await dataAPI.initPromise;
  await loadCabs();
  await startRealtime();
});
