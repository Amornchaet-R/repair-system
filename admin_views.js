// ==========================================================================
// admin_views.js - Views for Admin (Screen 5: Dashboard & Screen 6: Manage Techs)
// ==========================================================================

let adminTechSearch = '';
let adminTechStatusFilter = 'all'; // 'all' | 'available' | 'busy'
let adminDashboardPeriod = 'month';

window.setAdminTechFilter = function(s) {
  adminTechStatusFilter = s;
  render();
};

window.setAdminTechSearch = function(q) {
  adminTechSearch = (q || '').toLowerCase();
  render();
};

window.setDashboardPeriod = function(p) {
  adminDashboardPeriod = p;
  render();
};

// Screen 5: Dashboard ภาพรวม
function vDashboard() {
  const total = T.length;
  const done = T.filter(t => t.status === 'done').length;
  const doing = T.filter(t => t.status === 'doing').length;
  const pending = T.filter(t => t.status === 'accepted' || !t.status).length;

  const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
  const doingPct = total > 0 ? Math.round((doing / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;

  // Real Top Issues from T
  const issueCounts = {};
  T.forEach(t => {
    const item = t.items?.[0]?.item || t.cat || 'งานทั่วไป';
    issueCounts[item] = (issueCounts[item] || 0) + 1;
  });
  const topIssues = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Real Category breakdown from T
  const catCounts = {};
  T.forEach(t => {
    const c = t.cat || (t.types?.[0]) || 'งานซ่อม';
    catCounts[c] = (catCounts[c] || 0) + 1;
  });
  const catEntries = Object.entries(catCounts);

  return `
    <!-- Screen 5 Header -->
    <div class="card-header-row" style="margin-bottom:20px; flex-wrap:wrap; gap:10px;">
      <h2 style="font-size:22px; font-weight:800; display:flex; align-items:center; gap:8px;">
        <span>📊</span> Dashboard ภาพรวม
      </h2>
      <div style="display:flex; align-items:center; gap:8px;">
        <select class="form-control" style="width:auto; font-weight:700; font-size:15px;" onchange="setDashboardPeriod(this.value)">
          <option value="month" ${adminDashboardPeriod === 'month' ? 'selected' : ''}>ช่วงเวลา: เดือนนี้ ∨</option>
          <option value="quarter" ${adminDashboardPeriod === 'quarter' ? 'selected' : ''}>ช่วงเวลา: ไตรมาสนี้ ∨</option>
          <option value="year" ${adminDashboardPeriod === 'year' ? 'selected' : ''}>ช่วงเวลา: ปีนี้ ∨</option>
        </select>
      </div>
    </div>

    <!-- 4 KPI Summary Cards (Screen 5) -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon-box kpi-icon-blue">🔧</div>
        <div class="kpi-info-box">
          <div class="kpi-label">งานทั้งหมด</div>
          <div class="kpi-value-row">
            <span class="kpi-value">${total}</span>
            <span class="kpi-unit">รายการ</span>
          </div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-box kpi-icon-green">✅</div>
        <div class="kpi-info-box">
          <div class="kpi-label">เสร็จสิ้น</div>
          <div class="kpi-value-row">
            <span class="kpi-value">${done}</span>
            <span class="kpi-unit">รายการ</span>
          </div>
          <div class="kpi-subtext" style="color:var(--success); font-size:14px;">${donePct}%</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-box kpi-icon-orange">🕒</div>
        <div class="kpi-info-box">
          <div class="kpi-label">กำลังดำเนินการ</div>
          <div class="kpi-value-row">
            <span class="kpi-value">${doing}</span>
            <span class="kpi-unit">รายการ</span>
          </div>
          <div class="kpi-subtext" style="color:var(--warning); font-size:14px;">${doingPct}%</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-box kpi-icon-red">❗</div>
        <div class="kpi-info-box">
          <div class="kpi-label">รอดำเนินการ</div>
          <div class="kpi-value-row">
            <span class="kpi-value">${pending}</span>
            <span class="kpi-unit">รายการ</span>
          </div>
          <div class="kpi-subtext" style="color:var(--danger); font-size:14px;">${pendingPct}%</div>
        </div>
      </div>
    </div>

    <!-- 3 Chart Columns: Monthly Line Chart | Donut Chart | Top Issues -->
    <div class="admin-grid-charts">
      <!-- 1. Monthly Summary Card -->
      <div class="chart-card">
        <div class="card-header-row" style="margin-bottom:8px;">
          <div class="chart-header" style="margin:0; font-size:17px;">สถิติการดำเนินการ</div>
        </div>

        <div style="padding:16px 8px; text-align:center;">
          ${total > 0 ? `
            <div style="display:flex; flex-direction:column; gap:14px; text-align:left;">
              <div>
                <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom:4px;">
                  <span>งานเสร็จสิ้น (${done} รายการ)</span>
                  <span style="color:var(--success);">${donePct}%</span>
                </div>
                <div style="background:#e2e8f0; border-radius:999px; height:12px; overflow:hidden;">
                  <div style="background:var(--success); width:${donePct}%; height:100%;"></div>
                </div>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom:4px;">
                  <span>กำลังดำเนินการ (${doing} รายการ)</span>
                  <span style="color:var(--warning);">${doingPct}%</span>
                </div>
                <div style="background:#e2e8f0; border-radius:999px; height:12px; overflow:hidden;">
                  <div style="background:var(--warning); width:${doingPct}%; height:100%;"></div>
                </div>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom:4px;">
                  <span>รอดำเนินการ (${pending} รายการ)</span>
                  <span style="color:var(--danger);">${pendingPct}%</span>
                </div>
                <div style="background:#e2e8f0; border-radius:999px; height:12px; overflow:hidden;">
                  <div style="background:var(--danger); width:${pendingPct}%; height:100%;"></div>
                </div>
              </div>
            </div>
          ` : `
            <div class="mut" style="padding:32px; font-size:15px;">ยังไม่มีข้อมูลใบแจ้งซ่อมในระบบ</div>
          `}
        </div>
      </div>

      <!-- 2. Donut / Breakdown Chart: หมวดหมู่งาน -->
      <div class="chart-card">
        <div class="chart-header" style="font-size:17px;">สัดส่วนหมวดหมู่งาน</div>
        <div style="display:flex; flex-direction:column; gap:10px; padding:12px 6px;">
          ${catEntries.length ? catEntries.map(([c, count]) => {
            const pct = Math.round((count / total) * 100);
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-weight:600; font-size:15px; margin-bottom:3px;">
                  <span>● ${esc(c)}</span>
                  <span><b>${count}</b> รายการ (${pct}%)</span>
                </div>
                <div style="background:#e2e8f0; border-radius:999px; height:8px; overflow:hidden;">
                  <div style="background:var(--primary); width:${pct}%; height:100%;"></div>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="mut" style="text-align:center; padding:32px; font-size:15px;">ยังไม่มีข้อมูลหมวดหมู่งาน</div>
          `}
        </div>
      </div>

      <!-- 3. Top Issues (Ranked List) -->
      <div class="chart-card">
        <div class="chart-header" style="font-size:17px;">งานยอดนิยม</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${topIssues.length ? topIssues.map(([item, count], idx) => `
            <div class="ranked-item" style="font-size:15px;">
              <span class="ranked-num">${idx + 1}</span>
              <span style="flex:1; font-weight:600;">${esc(item)}</span>
              <span class="badge badge-normal" style="font-size:13.5px;">${count} ครั้ง</span>
            </div>
          `).join('') : `
            <div class="mut" style="text-align:center; padding:32px; font-size:15px;">ยังไม่มีข้อมูลสถิติงาน</div>
          `}
        </div>
      </div>
    </div>
  `;
}

// Screen 6: จัดการช่างและมอบหมายงาน
function vTechsManage() {
  const allTechs = techs || [];

  let filtered = allTechs;
  if (adminTechStatusFilter === 'available') filtered = allTechs.filter(t => t.status === 'available');
  if (adminTechStatusFilter === 'busy') filtered = allTechs.filter(t => t.status === 'busy');
  if (adminTechSearch) {
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(adminTechSearch) ||
      (t.role_desc || '').toLowerCase().includes(adminTechSearch) ||
      (t.skill || '').toLowerCase().includes(adminTechSearch)
    );
  }

  const totalJobs = T.length;
  const completedJobs = T.filter(t => t.status === 'done').length;
  const fixRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) + '%' : '0%';

  return `
    <!-- Screen 6 Header -->
    <div class="card-header-row" style="margin-bottom:20px; flex-wrap:wrap; gap:10px;">
      <h2 style="font-size:22px; font-weight:800; display:flex; align-items:center; gap:8px;">
        <span>👥</span> จัดการช่างและมอบหมายงาน
      </h2>
    </div>

    <div class="admin-techs-grid">
      <!-- Left (2/3): Search, Filter & Technicians Table / Cards -->
      <div class="content-card">
        <div class="filter-bar" style="flex-wrap:wrap; gap:10px;">
          <div class="search-input-wrap" style="flex:1; min-width:200px;">
            <span class="search-icon">🔍</span>
            <input class="form-control" placeholder="ค้นหาช่าง..." value="${esc(adminTechSearch)}" oninput="setAdminTechSearch(this.value)" style="font-size:16px;">
          </div>

          <div style="display:flex; gap:8px; width:100%; max-width:100%;">
            <select class="form-control" style="flex:1; font-weight:700; font-size:15px;" onchange="setAdminTechFilter(this.value)">
              <option value="all" ${adminTechStatusFilter === 'all' ? 'selected' : ''}>สถานะ: ทั้งหมด ∨</option>
              <option value="available" ${adminTechStatusFilter === 'available' ? 'selected' : ''}>สถานะ: ว่าง</option>
              <option value="busy" ${adminTechStatusFilter === 'busy' ? 'selected' : ''}>สถานะ: ไม่ว่าง</option>
            </select>

            <button class="btn btn-primary" style="white-space:nowrap; padding:10px 16px;" onclick="openAddTechModal()">+ เพิ่มช่าง</button>
          </div>
        </div>

        <!-- Desktop View Table -->
        <div class="nusp-table-wrapper desktop-only-table" style="margin-top:16px;">
          <table class="nusp-table">
            <thead>
              <tr>
                <th>ชื่อ-สกุล</th>
                <th>ตำแหน่ง</th>
                <th>ความเชี่ยวชาญ</th>
                <th>สถานะ</th>
                <th>จำนวนงานที่รับ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length ? filtered.map(t => `
                <tr>
                  <td style="font-weight:700; font-size:16px;">${esc(t.name)}</td>
                  <td style="font-size:15px;">${esc(t.role_desc || 'ช่างเทคนิค')}</td>
                  <td style="color:var(--text-muted); font-size:15px;">${esc(t.skill || 'ทั่วไป')}</td>
                  <td>
                    ${t.status === 'busy' 
                      ? '<span class="badge badge-busy">ไม่ว่าง</span>' 
                      : '<span class="badge badge-avail">ว่าง</span>'}
                  </td>
                  <td style="font-weight:700; text-align:center; font-size:16px;">${t.jobs || 0} งาน</td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="openAssignModal('${t.id}')">มอบหมาย</button>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" class="mut" style="text-align:center; padding:36px; font-size:16px;">
                    ยังไม่มีข้อมูลช่างในระบบ สามารถกดปุ่ม <b>"+ เพิ่มช่างใหม่"</b> ด้านบนเพื่อลงทะเบียนช่างได้ทันที
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Mobile View Cards -->
        <div class="mobile-only-cards" style="display:none; flex-direction:column; gap:12px; margin-top:14px;">
          ${filtered.length ? filtered.map(t => `
            <div style="background:var(--bg-subtle); border:1.5px solid var(--border); border-radius:var(--radius-md); padding:14px; display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <b style="font-size:16.5px; color:var(--text-main);">${esc(t.name)}</b>
                ${t.status === 'busy' 
                  ? '<span class="badge badge-busy">ไม่ว่าง</span>' 
                  : '<span class="badge badge-avail">ว่าง</span>'}
              </div>

              <div style="display:flex; flex-direction:column; gap:3px; font-size:14.5px; color:var(--text-muted);">
                <div>💼 ตำแหน่ง: <b style="color:var(--text-main);">${esc(t.role_desc || 'ช่างเทคนิค')}</b></div>
                <div>🛠️ ความเชี่ยวชาญ: <span>${esc(t.skill || 'ทั่วไป')}</span></div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border); padding-top:10px; margin-top:4px;">
                <span style="font-size:14.5px; font-weight:700; color:var(--text-main);">
                  📋 รับแล้ว: <span style="color:var(--primary); font-size:16px;">${t.jobs || 0}</span> งาน
                </span>
                <button class="btn btn-primary btn-sm" style="min-height:38px; padding:6px 16px;" onclick="openAssignModal('${t.id}')">
                  มอบหมายงาน
                </button>
              </div>
            </div>
          `).join('') : `
            <div style="text-align:center; padding:28px 16px; color:var(--text-muted); font-size:15px; background:var(--bg-subtle); border-radius:var(--radius-md);">
              ยังไม่มีข้อมูลช่างในระบบ สามารถกดปุ่ม <b>"+ เพิ่มช่าง"</b> ด้านบนเพื่อลงทะเบียนช่างได้ทันที
            </div>
          `}
        </div>
      </div>

      <!-- Right (1/3): Summary & Performance -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="chart-card">
          <div class="chart-header" style="font-size:17px;">สรุปทีมช่าง</div>
          <div style="padding:16px 8px; font-size:16px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between;">
              <span class="mut">จำนวนช่างทั้งหมด:</span>
              <b style="color:var(--primary); font-size:18px;">${allTechs.length} ท่าน</b>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span class="mut">ช่างที่พร้อมรับงาน:</span>
              <b style="color:var(--success); font-size:18px;">${allTechs.filter(t => t.status !== 'busy').length} ท่าน</b>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span class="mut">งานที่มอบหมายแล้ว:</span>
              <b style="font-size:18px;">${T.filter(t => t.tech_name).length} งาน</b>
            </div>
          </div>
        </div>

        <div style="background:var(--success-bg); border:1px solid #a7f3d0; border-radius:var(--radius-lg); padding:20px; display:flex; align-items:center; gap:16px;">
          <div style="font-size:32px;">✅</div>
          <div>
            <div style="font-size:14px; color:#065f46; font-weight:700;">อัตราการแก้ไขสำเร็จรวม</div>
            <div style="font-size:26px; font-weight:800; color:#047857;">${fixRate}</div>
            <div style="font-size:13px; color:#065f46;">(เสร็จ ${completedJobs} จาก ${totalJobs} งาน)</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.openAddTechModal = function() {
  $('#dlg').innerHTML = `
    <h3 style="font-size:17px; margin-bottom:14px;">+ เพิ่มข้อมูลช่างเทคนิคใหม่</h3>
    <form onsubmit="saveNewTech(event)">
      <div class="form-group" style="margin-bottom:10px;">
        <label>ชื่อ - สกุล</label>
        <input class="form-control" name="name" required placeholder="เช่น นายสมเกียรติ มั่นคง">
      </div>
      <div class="form-group" style="margin-bottom:10px;">
        <label>ตำแหน่ง</label>
        <input class="form-control" name="role_desc" required placeholder="เช่น ช่างไฟฟ้า, ช่างประปา">
      </div>
      <div class="form-group" style="margin-bottom:14px;">
        <label>ความเชี่ยวชาญ</label>
        <input class="form-control" name="skill" required placeholder="เช่น ไฟฟ้า, แสงสว่าง, เครื่องปรับอากาศ">
      </div>
      <div class="row sp" style="border-top:1px solid var(--border); padding-top:12px;">
        <button type="button" class="btn btn-outline" onclick="$('#dlg').close()">ยกเลิก</button>
        <button type="submit" class="btn btn-primary">บันทึกข้อมูลช่าง</button>
      </div>
    </form>
  `;
  $('#dlg').showModal();
};

window.saveNewTech = async function(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = f.get('name').trim();
  const role_desc = f.get('role_desc').trim();
  const skill = f.get('skill').trim();

  techs.unshift({ id: 't_' + Date.now(), name, role_desc, skill, status: 'available', jobs: 0 });
  $('#dlg').close();
  render();
  toast('เพิ่มข้อมูลช่างเรียบร้อยแล้ว');
};

window.openAssignModal = function(techId) {
  const pendingTickets = T.filter(t => t.status === 'accepted' || !t.tech_name);
  if (!pendingTickets.length) return toast('ไม่มีใบงานที่รอการมอบหมายในขณะนี้');

  $('#dlg').innerHTML = `
    <h3 style="font-size:17px; margin-bottom:14px;">📋 เลือกงานเพื่อมอบหมายให้ช่าง</h3>
    <div style="max-height:240px; overflow-y:auto; margin-bottom:14px;">
      ${pendingTickets.map(t => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid var(--border);">
          <div>
            <b>${esc(t.id)}</b> - ${esc(t.items?.[0]?.item || 'แจ้งซ่อม')}
            <div class="mut" style="font-size:14.5px;">อาคาร ${esc(t.bld || '-')} ชั้น ${esc(t.flr || '-')}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="confirmAssignDirect('${t.id}', '${techId}')">มอบหมายงานนี้</button>
        </div>
      `).join('')}
    </div>
    <div style="text-align:right;">
      <button class="btn btn-outline" onclick="$('#dlg').close()">ปิด</button>
    </div>
  `;
  $('#dlg').showModal();
};

window.confirmAssignDirect = async function(ticketId, techId) {
  const p = techs.find(x => x.id === techId);
  const t = T.find(x => x.id === ticketId);
  const updateData = { tech_name: p ? p.name : 'ช่างเทคนิค', status: 'doing', history: logh(t, 'doing') };
  if (typeof isUUID === 'function' && isUUID(techId)) {
    updateData.tech_id = techId;
  }
  
  try {
    await sb.from('tickets').update(updateData).eq('id', ticketId);
  } catch (err) {}
  if (t) {
    Object.assign(t, updateData);
    if (!updateData.tech_id) t.tech_id = techId;
  }
  if (p) p.jobs = (p.jobs || 0) + 1;
  $('#dlg').close();
  go();
  toast(`มอบหมายงาน ${ticketId} ให้ ${p ? p.name : 'ช่าง'} เรียบร้อยแล้ว!`);
};

// Screen: จัดการงานซ่อม (All Tickets Management)
function vAll() {
  const L = T.filter(t => t.status === fil);
  return `
    <div class="content-card">
      <div class="card-header-row">
        <h2 style="font-size:20px; font-weight:800; display:flex; align-items:center; gap:8px;">
          <span>📋</span> จัดการงานซ่อมทั้งหมด
        </h2>
      </div>

      <div class="filter-pills" style="margin-bottom:18px;">
        ${Object.keys(ST).map(s => `
          <button class="filter-pill ${fil === s ? 'active' : ''}" onclick="setFil('${s}')">
            ${ST[s][0]} (${T.filter(t => t.status === s).length})
          </button>
        `).join('')}
      </div>

      <div style="margin-top:12px;">
        ${L.map(t => card(t, fil === 'deleted' ? '' : `
          <div class="row" style="margin-top:12px; gap:8px;">
            ${fil !== 'done' ? `
              <select id="a_${t.id}" class="form-control" style="flex:1; max-width:240px; font-size:15px;">
                <option value="">-- เลือกมอบหมายช่าง --</option>
                ${techs.map(p => `<option value="${p.id}" ${p.id === t.tech_id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
              </select>
              <button class="btn btn-primary btn-sm" onclick="assign('${t.id}')">มอบหมาย</button>
            ` : ''}
            <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:var(--border);" onclick="del('${t.id}')">ลบงาน</button>
          </div>
        `)).join('') || '<div class="mut" style="text-align:center; padding:32px;">ไม่มีรายการในสถานะนี้</div>'}
      </div>
    </div>
  `;
}

window.assign = async function (id) { 
  const sel = document.getElementById('a_' + id);
  const v = sel ? sel.value : '', p = techs.find(x => x.id === v); 
  const t = T.find(x => x.id === id);
  const updateData = { tech_name: p ? p.name : null };
  if (typeof isUUID === 'function' && isUUID(v)) {
    updateData.tech_id = v;
  } else if (!v) {
    updateData.tech_id = null;
  }
  if (v && t && t.status === 'accepted') {
    updateData.status = 'doing';
    updateData.history = logh(t, 'doing');
  }
  try {
    await sb.from('tickets').update(updateData).eq('id', id);
  } catch (err) {}
  if (t) {
    Object.assign(t, updateData);
    if (v && !updateData.tech_id) t.tech_id = v;
  }
  toast(v ? `มอบหมายงานให้ ${p ? p.name : 'ช่าง'} แล้ว (สถานะ: กำลังดำเนินการ)` : 'ยกเลิกการมอบหมายแล้ว');
  go(); 
};

window.del = async function (id) {
  if (armed !== id) { 
    armed = id; 
    toast('กด “ลบงาน” อีกครั้งเพื่อยืนยัน'); 
    setTimeout(() => { if (armed === id) armed = '' }, 4000); 
    return; 
  }
  armed = ''; 
  const t = T.find(x => x.id === id);
  const updateData = { status: 'deleted', deleted_at: new Date().toISOString(), deleted_by: me?.name || 'แอดมิน', history: logh(t, 'deleted') };
  try {
    await sb.from('tickets').update(updateData).eq('id', id);
  } catch (err) {}
  if (t) Object.assign(t, updateData);
  toast('ลบงานเรียบร้อยแล้ว');
  go();
};

// Screen: วัสดุที่เบิก (Stock Usage & CSV export)
function vStock() {
  const r = fT ? U.filter(u => u.tech_name === fT) : U, tn = [...new Set(U.map(u => u.tech_name).filter(Boolean))], tot = {}, byT = {};
  r.forEach(u => { 
    const k = u.name + ' (' + (u.unit || 'ชิ้น') + ')'; 
    const q = Number(u.qty) || 0; 
    tot[k] = (tot[k] || 0) + q; 
    if (u.tech_name) (byT[u.tech_name] ??= {})[k] = (byT[u.tech_name][k] || 0) + q;
  });

  return `
    <div class="content-card">
      <div class="card-header-row" style="flex-wrap:wrap; gap:10px; margin-bottom:16px;">
        <h2 style="font-size:20px; font-weight:800; display:flex; align-items:center; gap:8px;">
          <span>📦</span> รายการวัสดุที่เบิกใช้
        </h2>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <select class="form-control" style="width:auto; font-size:15px; font-weight:700; min-height:44px;" onchange="setFT(this.value)">
            <option value="">ช่างทั้งหมด</option>
            ${tn.map(x => `<option ${x === fT ? 'selected' : ''}>${esc(x)}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="csv()" style="white-space:nowrap;">📥 ดาวน์โหลด CSV</button>
        </div>
      </div>

      <!-- สรุปยอด: stack เป็น 1 คอลัมน์บนมือถือ -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; margin-bottom:20px;">
        <div class="chart-card">
          <div class="chart-header" style="font-size:16px;">สรุปยอดตามชนิดวัสดุ</div>
          <div class="nusp-table-wrapper">
            <table class="nusp-table">
              <thead><tr><th>วัสดุ (หน่วย)</th><th>จำนวนรวม</th></tr></thead>
              <tbody>
                ${Object.entries(tot).map(([k, v]) => `<tr><td>${esc(k)}</td><td style="font-weight:700; color:var(--primary);">${v}</td></tr>`).join('') || '<tr><td colspan="2" class="mut" style="text-align:center;padding:16px;">ยังไม่มีรายการ</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header" style="font-size:16px;">สรุปตามช่างผู้เบิก</div>
          <div class="nusp-table-wrapper">
            <table class="nusp-table">
              <thead><tr><th>ช่าง</th><th>รายการ</th></tr></thead>
              <tbody>
                ${Object.entries(byT).map(([t, m]) => `<tr><td style="font-weight:600;">${esc(t)}</td><td>${Object.entries(m).map(([n, v]) => esc(n) + ' × ' + v).join('<br>')}</td></tr>`).join('') || '<tr><td colspan="2" class="mut" style="text-align:center;padding:16px;">ยังไม่มีรายการ</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ตารางรายละเอียดทั้งหมด -->
      <div style="font-weight:700; font-size:16px; margin-bottom:10px; color:var(--text-main);">📋 รายการเบิกทั้งหมด (${r.length} รายการ)</div>
      <div class="nusp-table-wrapper">
        <table class="nusp-table">
          <thead>
            <tr><th>วันที่</th><th>ช่าง</th><th>เลขที่ใบงาน</th><th>วัสดุ</th><th>จำนวน</th></tr>
          </thead>
          <tbody>
            ${r.map(u => `
              <tr>
                <td style="color:var(--text-muted); font-size:14px; white-space:nowrap;">${fmt(u.created_at)}</td>
                <td style="font-weight:600; white-space:nowrap;">${esc(u.tech_name)}</td>
                <td style="font-weight:700; color:var(--primary); white-space:nowrap;">${esc(u.ticket_id)}</td>
                <td>${esc(u.name)}</td>
                <td style="font-weight:700; white-space:nowrap;">${u.qty} ${esc(u.unit || 'ชิ้น')}</td>
              </tr>
            `).join('') || '<tr><td colspan="5" class="mut" style="text-align:center; padding:24px;">ยังไม่มีการเบิกวัสดุ</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.csv = function () {
  const c = s => '"' + String(s ?? '').replace(/"/g, '""') + '"', r = fT ? U.filter(u => u.tech_name === fT) : U;
  const txt = '\uFEFFวันที่,ช่าง,ใบงาน,วัสดุ,จำนวน,หน่วย\n' + r.map(u => [fmt(u.created_at), u.tech_name, u.ticket_id, u.name, u.qty, u.unit || 'ชิ้น'].map(c).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv' })); a.download = 'material-usage.csv'; a.click();
};

window.vDashboard = vDashboard;
window.vTechsManage = vTechsManage;
window.vAll = vAll;
window.vStock = vStock;
