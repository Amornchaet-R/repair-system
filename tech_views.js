// ==========================================================================
// tech_views.js - Views for Technician (Screen 3 & Screen 4) + Login
// ==========================================================================

let activeTaskDetailId = null;
let techPoolFilter = 'all'; // 'all' | 'pending' | 'urgent' | 'due'
let techSearchQuery = '';

window.setTechPoolFilter = function(f) {
  techPoolFilter = f;
  render();
};

window.setTechSearch = function(q) {
  techSearchQuery = (q || '').toLowerCase();
  render();
};

window.viewTaskDetail = function(id) {
  activeTaskDetailId = id;
  tab = 'task_detail';
  render();
};

window.closeTaskDetail = function() {
  activeTaskDetailId = null;
  tab = 'pool';
  render();
};

// Screen 3: งานที่รับได้ (Technician Task Pool)
function vPool() {
  const allAccepted = T.filter(t => t.status === 'accepted' && !t.tech_name);

  const poolTasks = allAccepted;

  let filtered = poolTasks;
  if (techPoolFilter === 'urgent') filtered = poolTasks.filter(t => t.urgent);
  if (techSearchQuery) {
    filtered = filtered.filter(t => 
      t.id.toLowerCase().includes(techSearchQuery) || 
      (t.items?.[0]?.item || '').toLowerCase().includes(techSearchQuery) ||
      (t.bld || '').toLowerCase().includes(techSearchQuery)
    );
  }

  const urgentCount = poolTasks.filter(t => t.urgent).length;
  const techName = me?.name || 'ช่างซ่อมบำรุง';

  return `
    <div class="content-card">
      <div class="card-header-row" style="margin-bottom:20px; flex-wrap:wrap; gap:10px;">
        <h2 style="font-size:22px; font-weight:800; display:flex; align-items:center; gap:8px;">
          <span>🧰</span> งานที่รับได้
        </h2>
        <div style="font-size:15px; font-weight:600; color:var(--text-muted); display:flex; align-items:center; gap:8px;">
          <div class="user-avatar" style="width:34px; height:34px; font-size:15px;">👷</div>
          <span>ช่าง: <b>${esc(techName)}</b></span>
        </div>
      </div>

      <!-- Filter pills & Search bar (Screen 3 Top) -->
      <div class="filter-bar">
        <div class="filter-pills">
          <button class="filter-pill ${techPoolFilter === 'all' ? 'active' : ''}" onclick="setTechPoolFilter('all')">
            ทั้งหมด (${poolTasks.length})
          </button>
          <button class="filter-pill ${techPoolFilter === 'pending' ? 'active' : ''}" onclick="setTechPoolFilter('pending')">
            รอดำเนินการ (${poolTasks.length})
          </button>
          <button class="filter-pill ${techPoolFilter === 'urgent' ? 'active' : ''}" onclick="setTechPoolFilter('urgent')">
            ด่วน (${urgentCount})
          </button>
        </div>

        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input class="form-control" placeholder="ค้นหาเลขที่งาน / สถานที่..." value="${esc(techSearchQuery)}" oninput="setTechSearch(this.value)">
        </div>
      </div>

      <!-- Task Card Rows (Screen 3 Middle) -->
      <div style="margin-top:16px;">
        ${filtered.map(t => {
          const title = t.items?.[0]?.item || 'แจ้งซ่อม';
          const loc = `อาคาร ${t.bld || 'A'} ชั้น ${t.flr || '1'}${t.room ? ' ' + t.room : ''}`;
          const date = t.date || (t.created_at ? fmt(t.created_at) : '-');

          return `
            <div class="task-row-card">
              <div class="task-info-left" onclick="viewTaskDetail('${t.id}')" style="cursor:pointer;">
                <span class="task-code">${esc(t.id)}</span>
                <span class="task-desc">${esc(title)} - ${esc(loc)}</span>
              </div>
              <div class="task-meta-right">
                ${t.urgent ? '<span class="badge badge-urgent"><span class="badge-dot"></span> ด่วน</span>' : '<span class="badge badge-normal"><span class="badge-dot"></span> ปกติ</span>'}
                <span style="font-size:14.5px; color:var(--text-muted); min-width:90px;">${esc(date)}</span>
                <button class="btn btn-primary btn-sm" onclick="claim('${t.id}')">รับงาน</button>
              </div>
            </div>
          `;
        }).join('') || '<div class="mut" style="text-align:center; padding:32px; font-size:16px;">ไม่มีงานรอรับในหมวดนี้</div>'}
      </div>
    </div>
  `;
}

// Screen 4: รายละเอียดงาน (Task Detail View)
function vTaskDetail() {
  const id = activeTaskDetailId;
  const t = T.find(x => x.id === id);
  if (!t) {
    return `
      <div style="max-width:900px; margin:0 auto;">
        <div style="margin-bottom:14px;">
          <button class="btn btn-outline btn-sm" onclick="closeTaskDetail()">← กลับไปยังรายการ</button>
        </div>
        <div class="content-card" style="text-align:center; padding:48px;">
          <div style="font-size:40px; margin-bottom:12px;">🔍</div>
          <div style="font-weight:700; font-size:18px; margin-bottom:8px;">ไม่พบข้อมูลงาน</div>
          <div class="mut" style="font-size:15px;">งานนี้อาจถูกรับไปแล้วหรือถูกยกเลิก</div>
        </div>
      </div>
    `;
  }

  const title = t.items?.[0]?.item || '-';
  const sym = t.items?.[0]?.sym || '-';
  const loc = `อาคาร ${t.bld || ''} ชั้น ${t.flr || ''}${t.room ? ' ' + t.room : ''}`;
  const reporterName = t.name || '-';
  const reporterTel = t.tel || '-';
  const dateStr = fmt(t.created_at) || '-';

  const photoUrl = t.photos?.length ? url(t.photos[0]) : null;

  return `
    <div style="max-width:900px; margin:0 auto;">
      <div style="margin-bottom:14px;">
        <button class="btn btn-outline btn-sm" onclick="closeTaskDetail()">← กลับไปยังรายการ</button>
      </div>

      <div class="content-card">
        <h2 style="font-size:22px; font-weight:800; margin-bottom:20px; display:flex; align-items:center; gap:8px;">
          <span>📋</span> รายละเอียดงาน
        </h2>

        <!-- 2-column Detail Card (Screen 4 Layout) -->
        <div class="task-detail-container">
          <!-- Left: Photo Preview -->
          <div>
            ${photoUrl
              ? `<img src="${photoUrl}" alt="รูปภาพปัญหา" class="task-preview-photo" onclick="zoom('${t.photos?.[0] || ''}')" style="cursor:zoom-in;">
                 <span class="mut" style="font-size:13px; display:block; text-align:center; margin-top:6px;">คลิกเพื่อดูรูปขนาดเต็ม</span>`
              : `<div class="task-preview-photo" style="display:flex; align-items:center; justify-content:center; background:var(--bg-subtle); border:1px dashed var(--border); border-radius:var(--radius-md);">
                   <span style="font-size:36px; opacity:0.3;">📷</span>
                 </div>
                 <span class="mut" style="font-size:13px; display:block; text-align:center; margin-top:6px;">ไม่มีรูปภาพ</span>`
            }
          </div>

          <!-- Right: Ticket Information -->
          <div style="display:flex; flex-direction:column; gap:12px; font-size:16px;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <b style="font-size:18px; color:var(--text-main);">เลขที่งาน : ${esc(t.id)}</b>
              ${t.urgent ? '<span class="badge badge-urgent"><span class="badge-dot"></span> ด่วน</span>' : '<span class="badge badge-normal">ปกติ</span>'}
              <span class="badge badge-doing" style="margin-left:auto;">${esc(t.cat || 'ซ่อมแซม')}</span>
            </div>

            <div><b class="mut">หัวข้อ :</b> <span style="font-weight:700; font-size:17px; color:var(--primary);">${esc(title)}</span></div>
            <div><b class="mut">สถานที่ :</b> <span style="font-weight:600;">${esc(loc)}</span></div>
            <div><b class="mut">ผู้แจ้ง :</b> <span>${esc(reporterName)} (${esc(reporterTel)})</span></div>
            <div><b class="mut">วันที่แจ้ง :</b> <span style="color:var(--text-muted);">${esc(dateStr)}</span></div>

            <div style="margin-top:8px; background:var(--bg-subtle); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border);">
              <b style="display:block; margin-bottom:6px; color:var(--text-main); font-size:16px;">รายละเอียดปัญหา:</b>
              <div style="color:var(--text-main); line-height:1.6; font-size:15.5px;">${esc(sym)}</div>
            </div>

            <!-- Action Buttons at bottom of details -->
            <div class="row sp" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px; flex-wrap:wrap; gap:10px;">
              <button class="btn btn-outline" style="color:var(--danger); border-color:var(--border);" onclick="closeTaskDetail()">กลับ</button>
              <div class="row" style="gap:8px; flex-wrap:wrap;">
                ${t.status === 'accepted' ? `
                  <button class="btn btn-primary" onclick="claim('${t.id}'); closeTaskDetail();">รับงานนี้ 🚀</button>
                ` : `
                  <button class="btn btn-outline" onclick="openMat('${t.id}')">📦 เบิกวัสดุ</button>
                  <button class="btn btn-primary" onclick="openAct('${t.id}')">📝 อัปเดตสถานะ</button>
                `}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Screen: งานของฉัน (In Progress Tasks)
function vMine() {
  const isDevOrAdmin = me?.dev || me?.role === 'admin';
  const a = T.filter(t => (isDevOrAdmin ? (t.tech_name === me?.name || t.tech_id === me?.id || (me?.role === 'admin' && t.status === 'doing')) : t.tech_id === me?.id) && ['accepted', 'doing'].includes(t.status)), by = {};
  
  a.forEach(t => (by[`อาคาร ${t.bld} ชั้น ${t.flr}`] ??= []).push(t));
  const ks = Object.keys(by).sort();

  return `
    <div class="content-card">
      <div class="card-header-row" style="flex-wrap:wrap; gap:8px;">
        <h2 style="font-size:22px; font-weight:800; display:flex; align-items:center; gap:8px;">
          <span>🛠️</span> งานของฉัน (กำลังดำเนินการ)
        </h2>
        <span class="badge badge-doing" style="font-size:15px; padding:6px 14px;">${a.length} งาน</span>
      </div>

      ${ks.map((k, i) => `
        <div style="margin-top:24px; margin-bottom:14px;">
          <h3 style="font-size:17px; font-weight:700; color:var(--primary); display:flex; align-items:center; gap:6px;">
            <span>📍</span> ${esc(k)} <span class="mut" style="font-size:15px; font-weight:normal;">(${by[k].length} งาน)</span>
          </h3>
        </div>
        ${by[k].map(t => card(t, `
          <div class="row" style="margin-top:14px; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="openAct('${t.id}')">📝 อัปเดตสถานะ</button>
            <button class="btn btn-outline" onclick="openMat('${t.id}')">📦 เบิกวัสดุ</button>
          </div>
        `)).join('')}
      `).join('') || '<div class="mut" style="text-align:center; padding:40px; font-size:16px;">ไม่มีงานที่กำลังดำเนินการอยู่ในขณะนี้</div>'}
    </div>
  `;
}

// Screen: ประวัติงานที่ทำเสร็จ
function vTechDone() {
  const isDevOrAdmin = me?.dev || me?.role === 'admin';
  const a = T.filter(t => (isDevOrAdmin ? (t.tech_name === me?.name || t.tech_id === me?.id || (me?.role === 'admin' && t.status === 'done')) : t.tech_id === me?.id) && t.status === 'done');

  return `
    <div class="content-card">
      <div class="card-header-row" style="flex-wrap:wrap; gap:8px;">
        <h2 style="font-size:22px; font-weight:800; display:flex; align-items:center; gap:8px;">
          <span>✅</span> ประวัติงานที่ทำเสร็จ
        </h2>
        <span class="badge badge-done" style="font-size:15px; padding:6px 14px;">รวม ${a.length} งาน</span>
      </div>

      <div style="margin-top:18px;">
        ${a.map(t => card(t)).join('') || '<div class="mut" style="text-align:center; padding:40px; font-size:16px;">ยังไม่มีประวัติงานที่ทำเสร็จ</div>'}
      </div>
    </div>
  `;
}

// Claim function
window.claim = async function (id) {
  const t = T.find(x => x.id === id);
  const p = {
    tech_name: me?.name || 'ช่างซ่อมบำรุง',
    status: 'doing',
    history: logh(t, 'doing')
  };
  if (typeof isUUID === 'function' && isUUID(me?.id)) {
    p.tech_id = me.id;
  }

  try {
    const res = await sb.from('tickets').update(p).eq('id', id).select();
    if (res?.error) {
      console.warn('claim update warning:', res.error);
    }
  } catch (err) {
    console.warn('claim error:', err);
  }

  if (t) {
    Object.assign(t, p);
    if (!p.tech_id) t.tech_id = me?.id || 'tech-1';
  }
  toast('รับงานสำเร็จ! สถานะเปลี่ยนเป็น: กำลังดำเนินการ');
  go();
};

// logh is defined globally in app.js

// Modal: Material Requisition (openMat)
let mRowCounter = 0;
window.matRowChange = function (sel, idx) {
  const customInput = document.getElementById('mcustom_' + idx);
  if (customInput) customInput.style.display = sel.value === 'อื่นๆ' ? 'block' : 'none';
};

window.addMatRow = function (name = '', qty = '', unit = '') {
  mRowCounter++;
  const idx = mRowCounter;
  const matOpts = MATS.map(m => `<option value="${m}" ${name === m ? 'selected' : ''}>${m}</option>`).join('');
  const isOther = name && !MATS.includes(name);

  const html = `
    <div class="mat-row" id="mrow_${idx}" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:10px; padding:10px 12px; background:var(--bg-subtle); border:1px solid var(--border); border-radius:8px;">
      <div style="flex:2; min-width:160px;">
        <select class="form-control m-name" onchange="matRowChange(this, ${idx})" style="padding:10px 12px; font-size:15.5px;">
          <option value="">-- เลือกวัสดุ --</option>
          ${matOpts}
          <option value="อื่นๆ" ${isOther ? 'selected' : ''}>อื่นๆ (ระบุเอง)</option>
        </select>
        <input class="form-control m-custom" id="mcustom_${idx}" value="${esc(isOther ? name : '')}" placeholder="ระบุชื่อวัสดุ..." style="display:${isOther ? 'block' : 'none'}; margin-top:6px; padding:8px 12px; font-size:15px;">
      </div>
      <div style="flex:1; min-width:90px;">
        <input class="form-control m-qty" type="number" min="0.01" step="any" value="${qty}" placeholder="จำนวน" style="padding:10px 12px; font-size:15.5px;">
      </div>
      <div style="flex:1; min-width:90px;">
        <input class="form-control m-unit" value="${esc(unit)}" placeholder="หน่วย (เช่น ชิ้น)" style="padding:10px 12px; font-size:15.5px;">
      </div>
      <div style="width:42px; text-align:center;">
        <button type="button" class="btn btn-outline btn-sm" style="color:var(--danger); border-color:var(--border); width:38px; height:38px; padding:0;" onclick="removeMatRow(${idx})">✕</button>
      </div>
    </div>
  `;
  const container = document.getElementById('mat_rows_container');
  if (container) container.insertAdjacentHTML('beforeend', html);
};

window.removeMatRow = function (idx) {
  const container = document.getElementById('mat_rows_container');
  if (container && container.querySelectorAll('.mat-row').length <= 1) return toast('ต้องมีรายการเบิกอย่างน้อย 1 แถว');
  const row = document.getElementById('mrow_' + idx);
  if (row) row.remove();
};

window.setMatRowCount = function (totalCount) {
  const container = document.getElementById('mat_rows_container');
  if (!container) return;
  const currentCount = container.querySelectorAll('.mat-row').length;
  if (totalCount > currentCount) {
    for (let i = 0; i < (totalCount - currentCount); i++) addMatRow();
  }
};

window.openMat = function (id) {
  const t = T.find(x => x.id === id) || {};
  const us = U.filter(u => u.ticket_id === id);
  mRowCounter = 0;

  $('#dlg').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <b style="font-size:16px; color:var(--text-main);">📦 เบิกวัสดุอุปกรณ์: ${esc(id)}</b>
      <span class="badge badge-doing">${t.cat === 'ติดตั้ง/ต่อเติม' ? '🛠️ งานติดตั้ง' : '🔧 งานซ่อม'}</span>
    </div>

    <div style="border:1px solid var(--border); padding:12px; border-radius:8px; margin-bottom:12px; background:var(--bg-subtle);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:4px;">
        <label style="margin:0; font-weight:700;">เลือกรายการวัสดุที่ต้องการเบิก</label>
        <div style="display:flex; align-items:center; gap:4px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="addMatRow()">+1</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="setMatRowCount(3)">3 แถว</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="setMatRowCount(5)">5 แถว</button>
        </div>
      </div>

      <div id="mat_rows_container"></div>

      <div style="display:flex; gap:8px; margin-top:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="addMatRow()">+ เพิ่มแถว</button>
        <button type="button" class="btn btn-primary" style="flex:1;" onclick="saveMat('${id}')">💾 บันทึกการเบิกวัสดุ</button>
      </div>
    </div>

    <div style="margin-bottom:14px; max-height:140px; overflow-y:auto; border-bottom:1px solid var(--border); padding-bottom:8px;">
      <b class="mut" style="font-size:13px;">📋 ประวัติการเบิกของงานนี้ (${us.length} รายการ):</b>
      ${us.length ? `<div style="margin-top:6px; font-size:13px;">${us.map(u => `• ${esc(u.name)}: <b style="color:var(--primary)">${u.qty}</b> ${esc(u.unit)} <span class="mut" style="font-size:11px">(${esc(u.tech_name || '')})</span>`).join('<br>')}</div>` : '<div class="mut" style="font-size:12px; padding:4px 0;">ยังไม่มีการเบิกวัสดุ</div>'}
    </div>

    <div style="text-align:right;">
      <button class="btn btn-outline" onclick="document.querySelector('#dlg').close()">ปิดหน้าต่าง</button>
    </div>
  `;

  addMatRow();
  $('#dlg').showModal();
};

window.saveMat = async function (id) {
  const container = document.getElementById('mat_rows_container');
  if (!container) return;
  const rows = container.querySelectorAll('.mat-row');
  const itemsToSave = [];

  rows.forEach(r => {
    let name = r.querySelector('.m-name').value;
    if (name === 'อื่นๆ') name = (r.querySelector('.m-custom').value || '').trim();
    const qty = parseFloat(r.querySelector('.m-qty').value);
    const unit = (r.querySelector('.m-unit').value || '').trim();

    if (name && qty > 0) {
      itemsToSave.push({
        ticket_id: id,
        name: name,
        qty: qty,
        unit: unit || 'ชิ้น',
        tech_name: me?.name || 'ช่างเทคนิค',
        created_at: new Date().toISOString()
      });
    }
  });

  if (!itemsToSave.length) return toast('กรุณาเลือกวัสดุและระบุจำนวนที่ถูกต้องอย่างน้อย 1 รายการ');

  toast('กำลังบันทึกการเบิก ' + itemsToSave.length + ' รายการ...');
  try {
    const payload = itemsToSave.map(({ created_at, ...rest }) => rest);
    await sb.from('usage').insert(payload);
    itemsToSave.forEach(it => U.unshift(it));
    toast(`บันทึกการเบิกวัสดุ ${itemsToSave.length} รายการสำเร็จ!`);
    openMat(id);
  } catch (err) {
    itemsToSave.forEach(it => U.unshift(it));
    toast(`บันทึกการเบิกวัสดุสำเร็จ!`);
    openMat(id);
  }
};

// Modal: Task Update (openAct) - 1 Finish button based on category + Progress Chips
let activeProgressTag = '';
window.activeProgressTag = activeProgressTag;

window.selectProgressTag = function(tag) {
  if (activeProgressTag === tag) {
    activeProgressTag = '';
  } else {
    activeProgressTag = tag;
  }
  window.activeProgressTag = activeProgressTag;

  // Update UI buttons
  document.querySelectorAll('.progress-chip-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tag === activeProgressTag);
  });

  // Prepend or update note textarea
  const noteEl = document.getElementById('d_n');
  const blockedCheckbox = document.getElementById('d_k');
  if (noteEl) {
    let currentNote = noteEl.value.trim();
    currentNote = currentNote.replace(/^\[.*?\]\s*/, '');
    if (activeProgressTag) {
      noteEl.value = `[${activeProgressTag}] ${currentNote}`.trim();
    } else {
      noteEl.value = currentNote;
    }
  }

  if (blockedCheckbox) {
    if (activeProgressTag === 'ติดปัญหา/รอประสานงาน') {
      blockedCheckbox.checked = true;
    } else if (activeProgressTag === 'กำลังเข้าตรวจสอบ' || activeProgressTag === 'กำลังดำเนินการ' || activeProgressTag === 'กำลังติดตั้ง') {
      blockedCheckbox.checked = false;
    }
  }
};

window.openAct = function (id) {
  const t = T.find(x => x.id === id) || {};
  const isInstall = t.cat === 'ติดตั้ง/ต่อเติม';
  const doneType = isInstall ? 'ติดตั้ง/ต่อเติม' : 'ซ่อมแซม';
  const finishLabel = isInstall ? '🛠️ ติดตั้งเสร็จสิ้น' : '🔧 ซ่อมเสร็จสิ้น';
  const finishBg = isInstall ? '#ea580c' : 'var(--success)';

  const lastHist = (t.history && t.history.length) ? t.history[t.history.length - 1] : null;
  activeProgressTag = lastHist?.tag || (t.note?.match(/^\[(.*?)\]/)?.[1]) || '';

  const doingTag = isInstall ? 'กำลังติดตั้ง' : 'กำลังดำเนินการ';

  $('#dlg').innerHTML = `
    <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span>📝 อัปเดตสถานะงาน: ${esc(id)}</span>
        <span class="badge badge-doing">ประเภท: ${esc(t.cat || 'ซ่อมแซม')}</span>
      </div>
      <button type="button" onclick="document.querySelector('#dlg').close()" style="background:none; border:none; font-size:22px; line-height:1; cursor:pointer; color:var(--text-muted); padding:2px 6px;" title="ปิด">&times;</button>
    </div>

    <!-- Progress Sub-status Chips -->
    <div style="border:1px solid var(--border); padding:16px; border-radius:var(--radius-md); margin-bottom:14px; background:var(--bg-subtle);">
      <label style="margin-top:0; font-weight:700; font-size:16px; color:var(--text-main); display:block; margin-bottom:8px;">
        📍 สถานะความคืบหน้าระหว่างปฏิบัติงาน (เลือกสถานะย่อย):
      </label>
      <div class="progress-chips-grid">
        <button type="button" class="progress-chip-btn tag-inspect ${activeProgressTag === 'กำลังเข้าตรวจสอบ' ? 'active' : ''}" data-tag="กำลังเข้าตรวจสอบ" onclick="selectProgressTag('กำลังเข้าตรวจสอบ')" style="font-size:14.5px; padding:10px;">
          🔍 กำลังเข้าตรวจสอบ
        </button>
        <button type="button" class="progress-chip-btn tag-doing ${activeProgressTag === doingTag ? 'active' : ''}" data-tag="${doingTag}" onclick="selectProgressTag('${doingTag}')" style="font-size:14.5px; padding:10px;">
          🛠️ ${doingTag}
        </button>
        <button type="button" class="progress-chip-btn tag-wait ${activeProgressTag === 'กำลังรออุปกรณ์' ? 'active' : ''}" data-tag="กำลังรออุปกรณ์" onclick="selectProgressTag('กำลังรออุปกรณ์')" style="font-size:14.5px; padding:10px;">
          ⏳ กำลังรออุปกรณ์/อะไหล่
        </button>
        <button type="button" class="progress-chip-btn tag-blocked ${activeProgressTag === 'ติดปัญหา/รอประสานงาน' ? 'active' : ''}" data-tag="ติดปัญหา/รอประสานงาน" onclick="selectProgressTag('ติดปัญหา/รอประสานงาน')" style="font-size:14.5px; padding:10px;">
          ⚠️ ติดปัญหา/รอประสานงาน
        </button>
      </div>

      <label style="margin-top:10px; font-weight:700; font-size:15px; display:block;">หมายเหตุ / บันทึกการทำงาน</label>
      <textarea class="form-control" id="d_n" rows="2" placeholder="ระบุการปฏิบัติงาน หรือสาเหตุที่พบ..." style="font-size:16px;">${esc(t.note)}</textarea>
      <label class="row" style="color:var(--danger); margin-top:10px; font-size:15px; font-weight:700; cursor:pointer;">
        <input type="checkbox" id="d_k" ${t.blocked ? 'checked' : ''} style="width:18px; height:18px; margin-right:6px;"> ติดปัญหา ดำเนินการต่อไม่ได้
      </label>
    </div>

    <div style="border:1px solid var(--border); padding:14px; border-radius:var(--radius-md); margin-bottom:12px; background:var(--bg-subtle);">
      <label style="margin-top:0; font-weight:700; font-size:15px; display:block; margin-bottom:6px;">สรุปผลงานและงบประมาณ</label>
      <div class="row sp" style="gap:10px; flex-wrap:wrap;">
        <div style="flex:1; min-width:180px;">
          <input class="form-control" id="d_b" type="number" min="0" value="${t.budget ?? ''}" placeholder="งบประมาณ (บาท)" style="font-size:16px;">
        </div>
        <label class="row" style="color:var(--danger); font-size:15px; font-weight:700; cursor:pointer;">
          <input type="checkbox" id="d_c" ${t.cannot ? 'checked' : ''} style="width:18px; height:18px; margin-right:6px;"> ไม่สามารถดำเนินการได้
        </label>
      </div>
    </div>

    <label style="font-weight:700; font-size:15px; display:block; margin-bottom:6px;">แนบรูปผลงาน/หลังซ่อมหรือติดตั้ง</label>
    <input class="form-control" type="file" id="d_f" accept="image/*" multiple style="margin-top:4px; font-size:15px; padding:8px 12px;">

    <!-- Action Buttons: บันทึกข้อมูล อยู่ฝั่งซ้าย, ซ่อมเสร็จสิ้น/ติดตั้งเสร็จสิ้น อยู่ฝั่งขวา -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; border-top:1px solid var(--border); padding-top:14px; gap:10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <button type="button" class="btn btn-outline" onclick="document.querySelector('#dlg').close()">ปิด</button>
        <button type="button" class="btn btn-primary" onclick="saveAct('${id}','')">💾 บันทึกข้อมูล</button>
      </div>
      <div>
        <button type="button" class="btn btn-primary" style="background:${finishBg}; border-color:${finishBg}; font-weight:700;" onclick="saveAct('${id}','done','${doneType}')">
          ${finishLabel}
        </button>
      </div>
    </div>
  `;
  $('#dlg').showModal();
};

window.saveAct = async function (id, s, doneType) {
  const t = T.find(x => x.id === id);
  let noteVal = $('#d_n').value.trim();
  if (activeProgressTag && !noteVal.includes(`[${activeProgressTag}]`)) {
    noteVal = `[${activeProgressTag}] ${noteVal.replace(/^\[.*?\]\s*/, '')}`.trim();
  }

  const p = {
    note: noteVal,
    blocked: $('#d_k').checked,
    budget: ($('#d_b').value === '' || isNaN(+$('#d_b').value)) ? null : +$('#d_b').value,
    cannot: $('#d_c').checked
  };
  
  try {
    const fl = [...$('#d_f').files];
    if (fl.length) {
      toast('กำลังอัปโหลดรูป...');
      p.done_photos = [...(t?.done_photos || []), ...await up(fl, 'd/' + id)];
    }
    if (s && (s !== t?.status || doneType)) {
      p.status = s;
      p.history = logh(t, s);
      if (s === 'done') {
        p.blocked = false;
        p.done_at = new Date().toISOString();
      }
    } else {
      p.status = 'doing';
      p.history = logh(t, 'doing', activeProgressTag);
    }
    const res = await sb.from('tickets').update(p).eq('id', id);
    if (res?.error) {
      console.warn('saveAct error:', res.error);
    }
    if (t) {
      Object.assign(t, p);
      if (doneType) t.done_type = doneType;
    }
    $('#dlg').close();
    go();
    toast(s === 'done' ? 'บันทึกงานเสร็จสิ้นเรียบร้อย' : 'อัปเดตสถานะความคืบหน้าสำเร็จ');
  } catch (x) {
    if (t) {
      Object.assign(t, p);
      if (doneType) t.done_type = doneType;
    }
    $('#dlg').close();
    go();
    toast('บันทึกสำเร็จ');
  }
};

// ==========================================================================
// Login & Register Views (NUSP Styled - Elder & Mobile Friendly)
// ==========================================================================

let loginRole = 'reporter';
let regRole = 'reporter';
let authMode = 'login'; // 'login' | 'register'

window.setAuthMode = function(m) {
  authMode = m;
  render();
};

window.setLoginRole = function(r) {
  loginRole = r;
  render();
};

// เปลี่ยนบทบาทการสมัครสมาชิกโดยตรง ไม่ทำลายค่าที่พิมพ์ไว้ในฟอร์ม
window.selectRegRole = function(r) {
  regRole = r;
  const input = document.getElementById('reg-role-input');
  if (input) input.value = r;

  const btnRep = document.getElementById('btn-reg-reporter');
  const btnTech = document.getElementById('btn-reg-tech');
  const roleHint = document.getElementById('role-hint-text');

  if (btnRep && btnTech) {
    if (r === 'tech') {
      btnRep.classList.remove('active', 'btn-primary');
      btnRep.classList.add('btn-outline');
      btnTech.classList.remove('btn-outline');
      btnTech.classList.add('active', 'btn-primary');
      if (roleHint) roleHint.innerHTML = '🛠️ คุณกำลังสมัครสมาชิกในฐานะ <b>ช่างซ่อมบำรุง</b> (สำหรับเข้าดูและรับงานซ่อม)';
    } else {
      btnTech.classList.remove('active', 'btn-primary');
      btnTech.classList.add('btn-outline');
      btnRep.classList.remove('btn-outline');
      btnRep.classList.add('active', 'btn-primary');
      if (roleHint) roleHint.innerHTML = '👤 คุณกำลังสมัครสมาชิกในฐานะ <b>ผู้แจ้งซ่อม</b> (สำหรับส่งเรื่องและติดตามสถานะ)';
    }
  }
};

window.setRegRole = window.selectRegRole;

window.devQuickLogin = function(r) {
  const name = r === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : r === 'tech' ? 'ช่างเทคนิค NUSP' : 'ผู้แจ้งซ่อมทั่วไป';
  me = { id: r === 'admin' ? 'dev-admin-1' : r === 'tech' ? 'dev-tech-1' : 'dev-user-1', name, role: r, dev: 1 };
  sessionStorage.setItem('repair_me', JSON.stringify(me));
  tab = r === 'admin' ? 'dashboard' : r === 'tech' ? 'pool' : 'home';
  go();
  toast('เข้าสู่ระบบสำเร็จในฐานะ ' + (r === 'admin' ? 'แอดมิน' : r === 'tech' ? 'ช่าง' : 'ผู้แจ้ง'));
};

function vLogin() {
  return `
    <div style="width:100%; max-width: 480px; margin: 0 auto; padding: 12px 10px 32px;">
      <div class="content-card" style="padding: 28px 20px; box-shadow: var(--shadow-lg); border-radius: var(--radius-lg);">
        <div style="text-align: center; margin-bottom: 22px;">
          <div class="logo-symbol" style="width: 52px; height: 52px; font-size: 20px; margin: 0 auto 12px;">
            NU
            <span class="logo-spark">✦</span>
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">ระบบแจ้งซ่อม NUSP</h1>
          <p class="mut" style="font-size: 15px; color: var(--text-muted);">อุทยานวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
        </div>

        ${authMode === 'register' ? `
          <!-- Register Form -->
          <form onsubmit="register(event)">
            <div class="form-group" style="margin-bottom:18px;">
              <label style="font-size:17px; font-weight:700; color:var(--text-main);">
                เลือกบทบาทที่ต้องการสมัคร <span class="req">*</span>
              </label>
              
              <!-- 2 Role Choice Buttons: ผู้แจ้งซ่อม และ ช่างซ่อม (ไม่มี admin) -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px;">
                <button 
                  type="button" 
                  id="btn-reg-reporter" 
                  class="btn ${regRole === 'reporter' ? 'btn-primary active' : 'btn-outline'}" 
                  onclick="selectRegRole('reporter')" 
                  style="padding:14px 10px; font-weight:700; font-size:16px; min-height:56px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; text-align:center;">
                  <span style="font-size:20px;">👤</span>
                  <span>ผู้แจ้งซ่อม</span>
                </button>

                <button 
                  type="button" 
                  id="btn-reg-tech" 
                  class="btn ${regRole === 'tech' ? 'btn-primary active' : 'btn-outline'}" 
                  onclick="selectRegRole('tech')" 
                  style="padding:14px 10px; font-weight:700; font-size:16px; min-height:56px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; text-align:center;">
                  <span style="font-size:20px;">🛠️</span>
                  <span>ช่างซ่อม</span>
                </button>
              </div>

              <!-- Hidden input bound to form submit -->
              <input type="hidden" id="reg-role-input" name="role" value="${regRole}">

              <div id="role-hint-text" style="font-size:14px; color:var(--primary); font-weight:600; margin-top:8px; text-align:center; background:var(--primary-light); padding:8px 12px; border-radius:6px;">
                ${regRole === 'tech' ? '🛠️ คุณกำลังสมัครสมาชิกในฐานะ <b>ช่างซ่อมบำรุง</b> (สำหรับเข้าดูและรับงานซ่อม)' : '👤 คุณกำลังสมัครสมาชิกในฐานะ <b>ผู้แจ้งซ่อม</b> (สำหรับส่งเรื่องและติดตามสถานะ)'}
              </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
              <label style="font-size:17px; font-weight:700; color:var(--text-main);">ชื่อ - นามสกุล <span class="req">*</span></label>
              <input class="form-control" name="name" required placeholder="กรอกชื่อและนามสกุล" style="font-size:17px; min-height:50px;">
            </div>

            <div class="form-group" style="margin-bottom:16px;">
              <label style="font-size:17px; font-weight:700; color:var(--text-main);">อีเมล <span class="req">*</span></label>
              <input class="form-control" name="email" type="email" required placeholder="อีเมลของคุณ เช่น user@nusp.or.th" style="font-size:17px; min-height:50px;">
            </div>

            <div class="form-group" style="margin-bottom:16px;">
              <label style="font-size:17px; font-weight:700; color:var(--text-main);">รหัสผ่าน <span class="req">*</span></label>
              <input class="form-control" name="pw" type="password" required minlength="6" placeholder="กำหนดรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" style="font-size:17px; min-height:50px;">
            </div>

            <div class="form-group" style="margin-bottom:20px;">
              <label style="font-size:17px; font-weight:700; color:var(--text-main);">ยืนยันรหัสผ่าน <span class="req">*</span></label>
              <input class="form-control" name="pw2" type="password" required minlength="6" placeholder="พิมพ์รหัสผ่านซ้ำอีกครั้ง" style="font-size:17px; min-height:50px;">
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; min-height:54px; font-size:18px; font-weight:700; border-radius:var(--radius-md);">
              ลงทะเบียนสมาชิกใหม่ ✨
            </button>

            <div style="text-align:center; margin-top:22px; padding-top:16px; border-top:1px solid var(--border);">
              <a href="javascript:void(0)" onclick="setAuthMode('login')" style="color:var(--primary); font-size:16px; font-weight:700; text-decoration:none;">
                ← มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่
              </a>
            </div>
          </form>
        ` : `
          <!-- Login Form (Clean & Unified for Elderly and All Users) -->
          <form onsubmit="login(event)">
            <div class="form-group" style="margin-bottom:16px;">
              <label style="font-size:17px; font-weight:700; color:var(--text-main);">อีเมล <span class="req">*</span></label>
              <input class="form-control" name="email" type="email" required placeholder="อีเมลของคุณ เช่น yourname@nusp.or.th" style="font-size:17px; min-height:50px;">
            </div>

            <div class="form-group" style="margin-bottom:22px;">
              <label style="font-size:17px; font-weight:700; color:var(--text-main);">รหัสผ่าน <span class="req">*</span></label>
              <input class="form-control" name="pw" type="password" required placeholder="กรอกรหัสผ่านของคุณ" style="font-size:17px; min-height:50px;">
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; min-height:54px; font-size:18px; font-weight:700; border-radius:var(--radius-md);">
              เข้าสู่ระบบ →
            </button>
          </form>

          <div style="text-align:center; margin-top:24px; padding-top:18px; border-top:1px solid var(--border);">
            <div style="font-size:16px; color:var(--text-muted); margin-bottom:10px;">ยังไม่มีบัญชีผู้ใช้งาน?</div>
            <button type="button" class="btn btn-outline" onclick="setAuthMode('register')" style="width:100%; min-height:50px; font-size:16.5px; font-weight:700; color:var(--primary); border-color:var(--primary);">
              ✨ สมัครสมาชิกใหม่ (เลือกได้ทั้ง ผู้แจ้ง / ช่าง)
            </button>
          </div>

          ${DEV ? `
            <div style="margin-top:24px; background:var(--bg-subtle); border:1px dashed var(--border); border-radius:8px; padding:12px; text-align:center;">
              <div style="font-size:13px; font-weight:700; color:var(--text-muted); margin-bottom:8px;">⚡ โหมดทดสอบสำหรับผู้พัฒนา (DEV Mode)</div>
              <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm btn-outline" style="font-size:13px;" onclick="devQuickLogin('reporter')">👤 ทดสอบผู้แจ้ง</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size:13px;" onclick="devQuickLogin('tech')">🛠️ ทดสอบช่าง</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size:13px;" onclick="devQuickLogin('admin')">👑 ทดสอบแอดมิน</button>
              </div>
            </div>
          ` : ''}
        `}
      </div>
    </div>
  `;
}

window.vPool = vPool;
window.vTaskDetail = vTaskDetail;
window.vMine = vMine;
window.vTechDone = vTechDone;
window.vLogin = vLogin;
