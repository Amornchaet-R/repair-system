// ==========================================================================
// user_views.js - Views for Reporter / User (Screen 1 & Screen 2)
// ==========================================================================

let reportStep = 1;

const REPAIR_SUBTYPES = [
  'ระบบปรับอากาศ',
  'เครื่องจักร',
  'ระบบไฟฟ้ากำลัง',
  'ระบบแสงสว่าง',
  'ระบบประปา',
  'ระบบ Internet',
  'ระบบน้ำบริสุทธิ์ (DI)',
  'ฝ้าเพดาน',
  'ประตู',
  'หน้าต่าง',
  'ห้องน้ำ',
  'พื้น',
  'อื่นๆ'
];

const INSTALL_SUBTYPES = [
  'ติดตั้งเครื่องจักร',
  'ติดตั้งระบบไฟฟ้ากำลัง',
  'ติดตั้งระบบแสงสว่าง',
  'ติดตั้งระบบประปา',
  'ติดตั้งระบบ Internet',
  'ต่อเติมอาคาร',
  'อื่นๆ'
];

let newReportDraft = {
  cat: 'ซ่อมแซม', // 'ซ่อมแซม' | 'ติดตั้ง/ต่อเติม'
  org: '',
  tel_internal: '',
  tel: '',
  bld: 'อาคาร A',
  bld_other: '',
  flr: '1',
  room: '',
  sub_type: 'ระบบปรับอากาศ',
  sub_type_other: '',
  title: '',
  details: '',
  asset_no: '',
  priority: 'normal',
  files: []
};

window.resetReportDraft = function() {
  newReportDraft = {
    cat: 'ซ่อมแซม',
    org: '',
    tel_internal: '',
    tel: me?.tel || '',
    bld: 'อาคาร A',
    bld_other: '',
    flr: '1',
    room: '',
    sub_type: 'ระบบปรับอากาศ',
    sub_type_other: '',
    title: '',
    details: '',
    asset_no: '',
    priority: 'normal',
    files: []
  };
};

window.setReportStep = function(step) {
  reportStep = step;
  render();
};

window.setReportCat = function(c) {
  newReportDraft.cat = c;
  newReportDraft.sub_type = c === 'ซ่อมแซม' ? 'ระบบปรับอากาศ' : 'ติดตั้งเครื่องจักร';
  newReportDraft.sub_type_other = '';
  render();
};

window.setReportBld = function(val) {
  newReportDraft.bld = val;
  if (val !== 'อื่นๆ') {
    newReportDraft.bld_other = '';
  }
  render();
};

window.setReportSubType = function(val) {
  newReportDraft.sub_type = val;
  if (val !== 'อื่นๆ') {
    newReportDraft.sub_type_other = '';
  }
  render();
};

window.updateDraft = function(key, val) {
  newReportDraft[key] = val;
};

// Screen 1: หน้าหลัก (User Dashboard)
function vHome() {
  const myT = JSON.parse(localStorage.getItem('myT') || '[]');
  
  // Real stats calculation from myT or T (No mock numbers)
  const sourceList = (me?.role === 'reporter') ? myT : ((typeof T !== 'undefined' && T && T.length) ? T : myT);
  const totalCount = sourceList.length;
  const doingCount = sourceList.filter(t => t.status === 'doing').length;
  const doneCount = sourceList.filter(t => t.status === 'done').length;
  const pendingCount = sourceList.filter(t => t.status === 'accepted' || !t.status).length;

  // Real recent tickets list (No fake mock tickets)
  const recentTickets = myT.slice(0, 5);

  return `
    <!-- Hero Banner (Screen 1 Top) -->
    <div class="nusp-hero-banner">
      <div class="hero-content">
        <h1>ระบบแจ้งซ่อม</h1>
        <h2>อุทยานวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</h2>
        <p>“พร้อมดูแล เพื่อการทำงานที่ต่อเนื่อง รวดเร็ว ปลอดภัย”</p>
      </div>
      <div class="hero-badge-nusp">
        <b>NUSP ✦</b>
        <span>Naresuan University<br>Science Park</span>
      </div>
    </div>

    <!-- 4 KPI Metric Cards (Screen 1 Middle) -->
    <div class="kpi-grid">
      <div class="kpi-card" onclick="setTab('history')" style="cursor:pointer;" title="กดเพื่อดูประวัติ">
        <div class="kpi-icon-box kpi-icon-blue">🔧</div>
        <div class="kpi-info-box">
          <div class="kpi-label">แจ้งซ่อมทั้งหมด</div>
          <div class="kpi-value-row">
            <span class="kpi-value">${totalCount}</span>
            <span class="kpi-unit">รายการ</span>
          </div>
        </div>
      </div>

      <div class="kpi-card" onclick="setTab('history')" style="cursor:pointer;" title="กดเพื่อดูงานกำลังดำเนินการ">
        <div class="kpi-icon-box kpi-icon-orange">🕒</div>
        <div class="kpi-info-box">
          <div class="kpi-label">กำลังดำเนินการ</div>
          <div class="kpi-value-row">
            <span class="kpi-value">${doingCount}</span>
            <span class="kpi-unit">รายการ</span>
          </div>
        </div>
      </div>

      <div class="kpi-card" onclick="setTab('history')" style="cursor:pointer;" title="กดเพื่อดูงานซ่อมเสร็จ">
        <div class="kpi-icon-box kpi-icon-green">✅</div>
        <div class="kpi-info-box">
          <div class="kpi-label">ซ่อมเสร็จแล้ว</div>
          <div class="kpi-value-row">
            <span class="kpi-value">${doneCount}</span>
            <span class="kpi-unit">รายการ</span>
          </div>
        </div>
      </div>

      <div class="kpi-card" onclick="setTab('history')" style="cursor:pointer;" title="กดเพื่อดูงานรอดำเนินการ">
        <div class="kpi-icon-box kpi-icon-red">❗</div>
        <div class="kpi-info-box">
          <div class="kpi-label">รอดำเนินการ</div>
          <div class="kpi-value-row">
            <span class="kpi-value">${pendingCount}</span>
            <span class="kpi-unit">รายการ</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2 Columns: Recent Tickets Table (Left) + Promo Card (Right) -->
    <div class="dashboard-columns">
      <!-- Recent Tickets (Table on Desktop / Card List on Mobile) -->
      <div class="content-card">
        <div class="card-header-row" style="flex-wrap:wrap; gap:8px;">
          <div class="card-header-title" style="font-size:18px; font-weight:800;">
            <span>📢</span> รายการแจ้งซ่อมล่าสุด
          </div>
          <a href="javascript:void(0)" class="card-header-link" onclick="setTab('history')" style="font-size:15px; font-weight:700;">ดูประวัติทั้งหมด →</a>
        </div>

        <!-- Desktop Table View -->
        <div class="nusp-table-wrapper desktop-only-table">
          <table class="nusp-table">
            <thead>
              <tr>
                <th>เลขที่ใบแจ้งซ่อม</th>
                <th>หัวข้อปัญหา</th>
                <th>ประเภท</th>
                <th>สถานะ</th>
                <th>วันที่แจ้ง</th>
              </tr>
            </thead>
            <tbody>
              ${recentTickets.length ? recentTickets.map(t => {
                let badge = '<span class="badge badge-pending"><span class="badge-dot"></span> รอดำเนินการ</span>';
                if (t.status === 'doing') {
                  const pTag = t.tag || t.note?.match(/^\[(.*?)\]/)?.[1] || '';
                  if (pTag.includes('รออุปกรณ์') || pTag.includes('อะไหล่')) badge = '<span class="badge badge-waiting-parts"><span class="badge-dot"></span> ⏳ รออุปกรณ์</span>';
                  else if (pTag.includes('ตรวจสอบ')) badge = '<span class="badge badge-inspecting"><span class="badge-dot"></span> 🔍 กำลังตรวจสอบ</span>';
                  else if (pTag.includes('ติดปัญหา') || pTag.includes('ประสานงาน')) badge = '<span class="badge badge-issue"><span class="badge-dot"></span> ⚠️ ติดปัญหา</span>';
                  else if (pTag.includes('ติดตั้ง')) badge = '<span class="badge badge-install"><span class="badge-dot"></span> 🛠️ กำลังติดตั้ง</span>';
                  else badge = '<span class="badge badge-doing"><span class="badge-dot"></span> กำลังดำเนินการ</span>';
                }
                if (t.status === 'done') badge = '<span class="badge badge-done"><span class="badge-dot"></span> ' + ((t.done_type === 'ติดตั้ง/ต่อเติม' || t.cat === 'ติดตั้ง/ต่อเติม') ? 'ติดตั้งเสร็จแล้ว' : 'ซ่อมเสร็จแล้ว') + '</span>';
                
                return `
                  <tr onclick="quickTrack('${t.no}', '${t.email || ''}')" style="cursor:pointer;" title="คลิกเพื่อดูรายละเอียด">
                    <td style="font-weight:800; color:var(--primary); font-size:15px; white-space:nowrap;">${esc(t.no)}</td>
                    <td style="font-weight:600; font-size:15px;">${esc(t.title || t.no)}</td>
                    <td style="font-size:14px;">${esc(t.type || 'ทั่วไป')}</td>
                    <td>${badge}</td>
                    <td style="color:var(--text-muted); font-size:14px; white-space:nowrap;">${esc(t.date || fmt(t.created_at) || '-')}</td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="5" style="text-align:center; padding:36px; color:var(--text-muted); font-size:16px;">
                    ยังไม่มีรายการแจ้งซ่อม สามารถกด <b>"+ แจ้งซ่อมด่วน"</b> เพื่อเริ่มต้นส่งเรื่องได้ทันที
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List View -->
        <div class="mobile-only-cards" style="display:none; flex-direction:column; gap:12px; margin-top:8px;">
          ${recentTickets.length ? recentTickets.map(t => {
            let badge = '<span class="badge badge-pending"><span class="badge-dot"></span> รอดำเนินการ</span>';
            if (t.status === 'doing') {
              const pTag = t.tag || t.note?.match(/^\[(.*?)\]/)?.[1] || '';
              if (pTag.includes('รออุปกรณ์') || pTag.includes('อะไหล่')) badge = '<span class="badge badge-waiting-parts"><span class="badge-dot"></span> ⏳ รออุปกรณ์</span>';
              else if (pTag.includes('ตรวจสอบ')) badge = '<span class="badge badge-inspecting"><span class="badge-dot"></span> 🔍 กำลังตรวจสอบ</span>';
              else if (pTag.includes('ติดปัญหา') || pTag.includes('ประสานงาน')) badge = '<span class="badge badge-issue"><span class="badge-dot"></span> ⚠️ ติดปัญหา</span>';
              else if (pTag.includes('ติดตั้ง')) badge = '<span class="badge badge-install"><span class="badge-dot"></span> 🛠️ กำลังติดตั้ง</span>';
              else badge = '<span class="badge badge-doing"><span class="badge-dot"></span> กำลังดำเนินการ</span>';
            }
            if (t.status === 'done') badge = '<span class="badge badge-done"><span class="badge-dot"></span> ' + ((t.done_type === 'ติดตั้ง/ต่อเติม' || t.cat === 'ติดตั้ง/ต่อเติม') ? 'ติดตั้งเสร็จแล้ว' : 'ซ่อมเสร็จแล้ว') + '</span>';

            return `
              <div onclick="quickTrack('${t.no}', '${t.email || ''}')" style="background:var(--bg-subtle); border:1.5px solid var(--border); border-radius:var(--radius-md); padding:14px; cursor:pointer; display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <b style="color:var(--primary); font-size:16px;">${esc(t.no)}</b>
                  ${badge}
                </div>
                <div style="font-weight:700; font-size:16px; color:var(--text-main); line-height:1.4;">
                  ${esc(t.title || t.no)}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:13.5px; color:var(--text-muted); border-top:1px dashed var(--border); padding-top:6px; margin-top:2px;">
                  <span>🏷️ ${esc(t.type || 'ทั่วไป')}</span>
                  <span>🕒 ${esc(t.date || fmt(t.created_at) || '-')}</span>
                </div>
              </div>
            `;
          }).join('') : `
            <div style="text-align:center; padding:28px 16px; color:var(--text-muted); font-size:15px; background:var(--bg-subtle); border-radius:var(--radius-md);">
              ยังไม่มีรายการแจ้งซ่อม สามารถกด <b>"+ แจ้งซ่อมด่วน"</b> เพื่อเริ่มต้นส่งเรื่องได้ทันที
            </div>
          `}
        </div>
      </div>

      <!-- NUSP Smart Campus Feature Card -->
      <div class="smart-campus-card">
        <div>
          <h3>NUSP<br>Smart Campus</h3>
          <p>พื้นที่แห่งนวัตกรรมและการบริการ<br>เพื่อความสะดวกและรวดเร็ว</p>
        </div>
        <div style="margin-top:16px;">
          <button class="btn btn-primary" style="width:100%; min-height:48px; font-size:16px; font-weight:700; background:#ffffff; color:var(--primary); border:none;" onclick="setTab('report')">
            + แจ้งซ่อมด่วนทันที
          </button>
        </div>
      </div>
    </div>
  `;
}

// Screen 2: แจ้งซ่อมใหม่ (Multi-Step Form Wizard)
function vReport() {
  if (reportStep === 3) {
    // Step 3: ยืนยันการแจ้งซ่อมสำเร็จ
    return `
      <div class="content-card" style="max-width: 680px; margin: 20px auto; text-align: center; padding: 40px 24px;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: #d1fae5; color: #059669; font-size: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          ✓
        </div>
        <h2 style="font-size: 22px; color: var(--text-main); margin-bottom: 6px;">ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว!</h2>
        <p class="mut" style="margin-bottom: 24px;">เจ้าหน้าที่และทีมช่าง NUSP ได้รับข้อมูลของท่านแล้ว</p>

        <div style="background: var(--bg-subtle); border: 1px dashed var(--border); border-radius: var(--radius-md); padding: 16px; max-width: 400px; margin: 0 auto 24px;">
          <div style="font-size: 15px; color: var(--text-muted); margin-bottom: 4px; font-weight:600;">เลขที่ใบแจ้งซ่อมของคุณ</div>
          <div style="font-size: 26px; font-weight: 800; color: var(--primary); letter-spacing: 0.5px;">${esc(lastNo || '-')}</div>
          ${lastNo ? `<button type="button" class="btn btn-outline btn-sm" style="margin-top: 10px; font-size:14px; font-weight:700;" onclick="copyNo('${lastNo}', event)">📋 คัดลอกเลขที่ใบแจ้งซ่อม</button>` : ''}
        </div>

        <div class="row" style="justify-content: center; gap: 10px;">
          <button class="btn btn-outline" onclick="setReportStep(1); setTab('history');">ดูประวัติการแจ้งซ่อม</button>
          <button class="btn btn-primary" onclick="setReportStep(1); setTab('home');">กลับหน้าหลัก</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="content-card" style="max-width: 820px; margin: 0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main); display:flex; align-items:center; gap:8px;">
          <span>🔧</span> แจ้งซ่อมใหม่
        </h2>
      </div>

      <!-- Stepper Wizard (3 Steps) -->
      <div class="step-wizard">
        <div class="step-item ${reportStep >= 1 ? 'active' : ''} ${reportStep > 1 ? 'completed' : ''}">
          <div class="step-circle">${reportStep > 1 ? '✓' : '1'}</div>
          <span>ข้อมูลปัญหา</span>
        </div>
        <div class="step-line ${reportStep > 1 ? 'completed' : ''}"></div>
        <div class="step-item ${reportStep >= 2 ? 'active' : ''} ${reportStep > 2 ? 'completed' : ''}">
          <div class="step-circle">${reportStep > 2 ? '✓' : '2'}</div>
          <span>ตรวจสอบข้อมูล</span>
        </div>
        <div class="step-line ${reportStep > 2 ? 'completed' : ''}"></div>
        <div class="step-item ${reportStep === 3 ? 'active' : ''}">
          <div class="step-circle">3</div>
          <span>ยืนยันการแจ้งซ่อม</span>
        </div>
      </div>

      ${reportStep === 1 ? `
        <!-- Step 1: ฟอร์มกรอกข้อมูลตามใบแจ้งซ่อมจริงของ NUSP -->
        <form id="reportFormStep1" onsubmit="handleNextStep(event)">
          <!-- ปุ่มสลับหมวดงานหลัก: งานซ่อมแซม หรือ งานติดตั้ง/ต่อเติม -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
            <button type="button" class="btn ${newReportDraft.cat === 'ซ่อมแซม' ? 'btn-primary' : 'btn-outline'}" style="padding:12px; font-size:14.5px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="setReportCat('ซ่อมแซม')">
              🔧 งานซ่อมแซม
            </button>
            <button type="button" class="btn ${newReportDraft.cat === 'ติดตั้ง/ต่อเติม' ? 'btn-primary' : 'btn-outline'}" style="padding:12px; font-size:14.5px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="setReportCat('ติดตั้ง/ต่อเติม')">
              🛠️ งานติดตั้ง / ต่อเติม
            </button>
          </div>

          <!-- Section 1: ข้อมูลผู้แจ้งและสถานที่ -->
          <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px 18px; margin-bottom:18px;">
            <div style="font-weight:700; font-size:16.5px; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
              <span>🏢</span> ข้อมูลผู้แจ้งและสถานที่
            </div>
            <div class="form-grid" style="margin-bottom:0;">
              <div class="form-group">
                <label>หน่วยงาน / บริษัท</label>
                <input class="form-control" name="org" value="${esc(newReportDraft.org || '')}" placeholder="เช่น บริษัท นวัตกรรม จำกัด หรือ ศูนย์ฯ..." oninput="updateDraft('org', this.value)">
              </div>

              <div class="form-group">
                <label>เบอร์โทรศัพท์ <span class="req">*</span></label>
                <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:8px;">
                  <input class="form-control" name="tel" value="${esc(newReportDraft.tel || (me?.tel || ''))}" placeholder="เบอร์มือถือ เช่น 081-234-5678" required oninput="updateDraft('tel', this.value)">
                  <input class="form-control" name="tel_internal" value="${esc(newReportDraft.tel_internal || '')}" placeholder="เบอร์ภายใน" oninput="updateDraft('tel_internal', this.value)">
                </div>
              </div>

              <div class="form-group ${newReportDraft.bld === 'อื่นๆ' ? '' : ''}">
                <label>อาคาร <span class="req">*</span></label>
                <select class="form-control" name="bld" required onchange="setReportBld(this.value)">
                  <option value="อาคาร A" ${newReportDraft.bld === 'อาคาร A' ? 'selected' : ''}>อาคาร A</option>
                  <option value="อาคาร B" ${newReportDraft.bld === 'อาคาร B' ? 'selected' : ''}>อาคาร B</option>
                  <option value="อาคาร C" ${newReportDraft.bld === 'อาคาร C' ? 'selected' : ''}>อาคาร C</option>
                  <option value="อื่นๆ" ${newReportDraft.bld === 'อื่นๆ' ? 'selected' : ''}>อื่นๆ (ระบุเอง)</option>
                </select>
                ${newReportDraft.bld === 'อื่นๆ' ? `
                  <input class="form-control" name="bld_other" value="${esc(newReportDraft.bld_other || '')}" placeholder="โปรดพิมพ์ระบุชื่ออาคาร..." required style="margin-top:6px; animation: fadeIn 0.2s;" oninput="updateDraft('bld_other', this.value)">
                ` : ''}
              </div>

              <div class="form-group">
                <label>ชั้น และ ห้อง <span class="req">*</span></label>
                <div style="display:grid; grid-template-columns:1fr 1.6fr; gap:8px;">
                  <select class="form-control" name="flr" required onchange="updateDraft('flr', this.value)">
                    <option value="1" ${newReportDraft.flr === '1' ? 'selected' : ''}>ชั้น 1</option>
                    <option value="2" ${newReportDraft.flr === '2' ? 'selected' : ''}>ชั้น 2</option>
                    <option value="3" ${newReportDraft.flr === '3' ? 'selected' : ''}>ชั้น 3</option>
                    <option value="4" ${newReportDraft.flr === '4' ? 'selected' : ''}>ชั้น 4</option>
                  </select>
                  <input class="form-control" name="room" value="${esc(newReportDraft.room || '')}" placeholder="เลขห้อง เช่น TC 320" required oninput="updateDraft('room', this.value)">
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: ประเภทงานและรายละเอียด -->
          <div class="form-grid">
            <div class="form-group ${newReportDraft.sub_type === 'อื่นๆ' ? '' : 'full-width'}">
              <label>ประเภทงาน${newReportDraft.cat === 'ซ่อมแซม' ? 'ซ่อมแซม' : ' ติดตั้ง/ต่อเติม'} <span class="req">*</span></label>
              <select class="form-control" name="sub_type" required onchange="setReportSubType(this.value)">
                ${(newReportDraft.cat === 'ซ่อมแซม' ? REPAIR_SUBTYPES : INSTALL_SUBTYPES).map(st => `
                  <option value="${esc(st)}" ${newReportDraft.sub_type === st ? 'selected' : ''}>${esc(st)}</option>
                `).join('')}
              </select>
            </div>

            ${newReportDraft.sub_type === 'อื่นๆ' ? `
              <div class="form-group" style="animation: fadeIn 0.2s;">
                <label style="color:var(--primary); font-weight:700;">ระบุประเภทงานอื่นๆ <span class="req">*</span></label>
                <input class="form-control" name="sub_type_other" value="${esc(newReportDraft.sub_type_other || '')}" placeholder="โปรดระบุประเภทงานที่ต้องการ..." required oninput="updateDraft('sub_type_other', this.value)">
              </div>
            ` : ''}

            <div class="form-group">
              <label>${newReportDraft.cat === 'ซ่อมแซม' ? 'รายการซ่อมแซม' : 'รายการติดตั้ง / ต่อเติม'} <span class="req">*</span></label>
              <input class="form-control" name="title" value="${esc(newReportDraft.title)}" placeholder="${newReportDraft.cat === 'ซ่อมแซม' ? 'เช่น ล้างแผ่นกรองอากาศ, อุดท่อน้ำทิ้ง' : 'เช่น ติดตั้งเต้ารับไฟฟ้าเพิ่ม, ติดตั้งเครื่องจักรใหม่'}" required oninput="updateDraft('title', this.value)">
            </div>

            <div class="form-group">
              <label>หมายเลขครุภัณฑ์ (ถ้ามี)</label>
              <input class="form-control" name="asset_no" value="${esc(newReportDraft.asset_no || '')}" placeholder="เช่น 7440-001-0001/67 (ถ้ามี)" oninput="updateDraft('asset_no', this.value)">
            </div>

            <div class="form-group full-width">
              <label>${newReportDraft.cat === 'ซ่อมแซม' ? 'อาการที่ชำรุด' : 'รายละเอียดการติดตั้ง / ต่อเติม'} <span class="req">*</span></label>
              <textarea class="form-control" name="details" rows="3" placeholder="อธิบายอาการชำรุด หรือรายละเอียดสิ่งที่ต้องการให้ดำเนินการ..." required oninput="updateDraft('details', this.value)">${esc(newReportDraft.details)}</textarea>
            </div>

            <div class="form-group full-width">
              <label>ความเร่งด่วน</label>
              <div class="priority-options">
                <label class="priority-pill ${newReportDraft.priority === 'normal' ? 'selected' : ''}" onclick="selectPriority('normal')">
                  <input type="radio" name="priority" value="normal" ${newReportDraft.priority === 'normal' ? 'checked' : ''}>
                  <span style="color:#ea580c;">●</span> ปกติ
                </label>
                <label class="priority-pill ${newReportDraft.priority === 'urgent' ? 'selected' : ''}" onclick="selectPriority('urgent')">
                  <input type="radio" name="priority" value="urgent" ${newReportDraft.priority === 'urgent' ? 'checked' : ''}>
                  <span style="color:#f59e0b;">●</span> เร่งด่วน
                </label>
                <label class="priority-pill ${newReportDraft.priority === 'emergency' ? 'selected' : ''}" onclick="selectPriority('emergency')">
                  <input type="radio" name="priority" value="emergency" ${newReportDraft.priority === 'emergency' ? 'checked' : ''}>
                  <span style="color:#ef4444;">●</span> ฉุกเฉิน
                </label>
              </div>
            </div>

            <div class="form-group full-width">
              <label>แนบรูปภาพ (ถ้ามี)</label>
              <div class="upload-dropzone" onclick="document.getElementById('report_files').click()">
                <span class="upload-icon">🖼️</span>
                <p>ลากไฟล์มาวางที่นี่ หรือ <span style="color:var(--primary);">คลิกเพื่อเลือกไฟล์</span></p>
                <span>รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5 MB</span>
                <input type="file" id="report_files" name="pics" accept="image/*" multiple style="display:none;" onchange="handleFileSelect(this)">
              </div>
              <div id="file-previews" style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;"></div>
            </div>
          </div>

          <div class="row sp" style="margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
            <button type="button" class="btn btn-outline" onclick="setTab('home')">ยกเลิก</button>
            <button type="submit" class="btn btn-primary">ถัดไป →</button>
          </div>
        </form>
      ` : `
        <!-- Step 2: ตรวจสอบข้อมูลก่อนส่งเรื่อง -->
        <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:var(--radius-lg); padding:24px 20px; margin-bottom:20px;">
          <h3 style="font-size:18px; font-weight:800; margin-bottom:16px; color:var(--text-main); display:flex; align-items:center; gap:8px;">
            <span>🔍</span> ตรวจสอบข้อมูลใบแจ้งซ่อม / ติดตั้ง
          </h3>
          <div style="display:flex; flex-direction:column; gap:12px; font-size:16px; line-height:1.5;">
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
              <span class="mut" style="font-weight:700;">หมวดงาน:</span>
              <span><span class="badge ${newReportDraft.cat === 'ติดตั้ง/ต่อเติม' ? 'badge-install' : 'badge-doing'}" style="font-size:14px;">${esc(newReportDraft.cat)}</span></span>
            </div>

            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
              <span class="mut" style="font-weight:700;">ประเภทงาน:</span>
              <span style="font-weight:700; color:var(--primary);">${esc(newReportDraft.sub_type === 'อื่นๆ' ? (newReportDraft.sub_type_other ? 'อื่นๆ: ' + newReportDraft.sub_type_other : 'อื่นๆ') : newReportDraft.sub_type)}</span>
            </div>

            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
              <span class="mut" style="font-weight:700;">${newReportDraft.cat === 'ซ่อมแซม' ? 'รายการซ่อมแซม' : 'รายการติดตั้ง'}:</span>
              <span style="font-weight:700;">${esc(newReportDraft.title)}</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:4px; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
              <span class="mut" style="font-weight:700;">${newReportDraft.cat === 'ซ่อมแซม' ? 'อาการที่ชำรุด' : 'รายละเอียดงาน'}:</span>
              <div style="background:#ffffff; border:1px solid var(--border); padding:10px 14px; border-radius:8px;">${esc(newReportDraft.details)}</div>
            </div>

            ${newReportDraft.asset_no ? `
              <div style="display:flex; flex-wrap:wrap; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
                <span class="mut" style="font-weight:700;">หมายเลขครุภัณฑ์:</span>
                <span>${esc(newReportDraft.asset_no)}</span>
              </div>
            ` : ''}

            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
              <span class="mut" style="font-weight:700;">สถานที่:</span>
              <span style="font-weight:600;">${esc(newReportDraft.bld === 'อื่นๆ' ? (newReportDraft.bld_other ? 'อาคาร: ' + newReportDraft.bld_other : 'อื่นๆ') : newReportDraft.bld)} ชั้น ${esc(newReportDraft.flr)} ห้อง ${esc(newReportDraft.room || '-')}</span>
            </div>

            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
              <span class="mut" style="font-weight:700;">หน่วยงาน / บริษัท:</span>
              <span>${esc(newReportDraft.org || '-')}</span>
            </div>

            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
              <span class="mut" style="font-weight:700;">ผู้แจ้ง:</span>
              <span>${esc(me?.name || 'ผู้แจ้ง')} (โทร: ${esc(newReportDraft.tel || '-')}${newReportDraft.tel_internal ? ' ภายใน: ' + esc(newReportDraft.tel_internal) : ''})</span>
            </div>

            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; padding-top:4px;">
              <span class="mut" style="font-weight:700;">ความเร่งด่วน:</span>
              <div>
                ${newReportDraft.priority === 'emergency' ? '<span class="badge badge-urgent"><span class="badge-dot"></span> ฉุกเฉิน</span>' : newReportDraft.priority === 'urgent' ? '<span class="badge badge-pending"><span class="badge-dot"></span> เร่งด่วน</span>' : '<span class="badge badge-doing"><span class="badge-dot"></span> ปกติ</span>'}
              </div>
            </div>
          </div>
        </div>

        <div class="row sp" style="margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
          <button type="button" class="btn btn-outline" onclick="setReportStep(1)">← ย้อนกลับไปแก้ไข</button>
          <button type="button" class="btn btn-primary" onclick="confirmSubmitReport(event)">ยืนยันการแจ้งซ่อม ✓</button>
        </div>
      `}
    </div>
  `;
}

window.selectPriority = function(pri) {
  newReportDraft.priority = pri;
  const pills = document.querySelectorAll('.priority-pill');
  pills.forEach(p => p.classList.remove('selected'));
  if (event?.currentTarget) event.currentTarget.classList.add('selected');
};

let selectedFilesList = [];
window.handleFileSelect = function(input) {
  selectedFilesList = [...input.files];
  const previewBox = document.getElementById('file-previews');
  if (!previewBox) return;
  previewBox.innerHTML = '';
  selectedFilesList.forEach(file => {
    const url = URL.createObjectURL(file);
    previewBox.insertAdjacentHTML('beforeend', `
      <img src="${url}" style="width:60px; height:60px; object-fit:cover; border-radius:6px; border:1px solid var(--border);">
    `);
  });
};

window.handleNextStep = function(e) {
  e.preventDefault();
  if (!newReportDraft.title || !newReportDraft.details) {
    return toast('กรุณากรอกรายการและรายละเอียดปัญหาให้ครบถ้วน');
  }
  if (!newReportDraft.room) {
    return toast('กรุณาระบุเลขห้องที่ต้องการให้เข้าดำเนินการ');
  }
  if (newReportDraft.bld === 'อื่นๆ' && !newReportDraft.bld_other.trim()) {
    return toast('กรุณาระบุชื่ออาคาร');
  }
  if (newReportDraft.sub_type === 'อื่นๆ' && !newReportDraft.sub_type_other.trim()) {
    return toast('กรุณาระบุประเภทงานอื่นๆ');
  }
  setReportStep(2);
};

window.confirmSubmitReport = async function(e) {
  const btn = e.target;
  btn.disabled = true;
  toast('กำลังส่งเรื่องแจ้งซ่อม...');

  const no = 'REP-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
  const cat = newReportDraft.cat || 'ซ่อมแซม';
  const chosenType = newReportDraft.sub_type === 'อื่นๆ'
    ? (newReportDraft.sub_type_other ? 'อื่นๆ: ' + newReportDraft.sub_type_other : 'อื่นๆ')
    : (newReportDraft.sub_type || 'ทั่วไป');

  try {
    let photos = [];
    if (selectedFilesList.length) {
      photos = await up(selectedFilesList, 'r/' + no);
    }

    const telCombined = newReportDraft.tel + (newReportDraft.tel_internal ? ' (ภายใน ' + newReportDraft.tel_internal + ')' : '');

    const chosenBld = newReportDraft.bld === 'อื่นๆ'
      ? (newReportDraft.bld_other ? 'อาคาร: ' + newReportDraft.bld_other : 'อื่นๆ')
      : (newReportDraft.bld || 'อาคาร A');

    const payload = {
      id: no,
      name: me?.name ? (newReportDraft.org ? `${me.name} (${newReportDraft.org})` : me.name) : 'ผู้แจ้งทั่วไป',
      email: (me?.email || 'user@nusp.or.th').toLowerCase(),
      tel: telCombined,
      cat: cat,
      bld: chosenBld,
      flr: newReportDraft.flr || '1',
      room: newReportDraft.room || '',
      types: [chosenType],
      items: [{
        item: newReportDraft.title,
        sym: newReportDraft.details,
        asset: newReportDraft.asset_no || ''
      }],
      urgent: newReportDraft.priority !== 'normal',
      photos: photos,
      history: [{ s: 'accepted', at: Date.now() }]
    };

    const { error } = await sb.from('tickets').insert(payload);
    if (error && !CONFIG.DEV) throw error;

    // Save to localStorage myT
    const myT = JSON.parse(localStorage.getItem('myT') || '[]');
    myT.unshift({
      no: no,
      title: newReportDraft.title,
      type: chosenType,
      location: `อาคาร ${newReportDraft.bld} ชั้น ${newReportDraft.flr}`,
      room: newReportDraft.room,
      email: payload.email,
      status: 'accepted',
      date: new Date().toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' })
    });
    localStorage.setItem('myT', JSON.stringify(myT));

    // Also update in memory T if technician or admin is logged in
    if (window.T) {
      T.unshift({
        ...payload,
        created_at: new Date().toISOString()
      });
    }

    lastNo = no;
    // Reset draft
    resetReportDraft();
    selectedFilesList = [];
    
    setReportStep(3);
    toast('ส่งเรื่องแจ้งซ่อมสำเร็จ!');
  } catch (err) {
    if (CONFIG.DEV) {
      lastNo = no;
      setReportStep(3);
      toast('(โหมดทดสอบ) ส่งเรื่องแจ้งซ่อมสำเร็จ!');
      return;
    }
    toast('ส่งเรื่องไม่สำเร็จ: ' + (err.message || err));
    btn.disabled = false;
  }
};

// Screen: ติดตามสถานะ (Track Ticket)
function vTrack() {
  return `
    <div class="content-card" style="max-width:700px; margin:0 auto 20px;">
      <h2 style="font-size:18px; margin-bottom:8px;">🔍 ติดตามสถานะใบแจ้งซ่อม</h2>
      <p class="mut" style="margin-bottom:16px;">กรอกเลขที่ใบแจ้งซ่อม เช่น REP-2026-001 หรือ RP-...</p>
      
      <form onsubmit="trackT(event)" style="display:flex; gap:8px;">
        <input class="form-control" name="no" placeholder="เช่น REP-2026-010" required style="font-size:15px; font-weight:600;">
        <button class="btn btn-primary" type="submit" style="white-space:nowrap;">ค้นหาใบงาน</button>
      </form>
    </div>

    ${found === null ? '<div class="content-card mut" style="max-width:700px; margin:auto; text-align:center;">ไม่พบใบงาน โปรดตรวจสอบเลขที่ใบแจ้งซ่อมอีกครั้ง</div>' : found ? `<div style="max-width:700px; margin:auto;">${card(found, steps(found))}</div>` : ''}
  `;
}

// Screen: ประวัติการแจ้งซ่อม (History)
function vHistory() {
  const myT = JSON.parse(localStorage.getItem('myT') || '[]');
  
  let filtered = myT;
  if (hFil === 'pending') filtered = myT.filter(t => t.status === 'accepted' || t.status === 'doing' || !t.status);
  if (hFil === 'done') filtered = myT.filter(t => t.status === 'done');

  return `
    <div class="content-card">
      <div class="card-header-row">
        <h2 style="font-size:18px; display:flex; align-items:center; gap:8px;">
          <span>📋</span> ประวัติการแจ้งซ่อมของฉัน (${myT.length} งาน)
        </h2>
        <button class="btn btn-primary btn-sm" onclick="setTab('report')">+ แจ้งซ่อมใหม่</button>
      </div>

      <div class="filter-bar">
        <div class="filter-pills">
          <button class="filter-pill ${hFil === 'all' ? 'active' : ''}" onclick="setHFil('all')">ทั้งหมด (${myT.length})</button>
          <button class="filter-pill ${hFil === 'pending' ? 'active' : ''}" onclick="setHFil('pending')">รอดำเนินการ (${myT.filter(t => t.status !== 'done').length})</button>
          <button class="filter-pill ${hFil === 'done' ? 'active' : ''}" onclick="setHFil('done')">เสร็จสิ้น (${myT.filter(t => t.status === 'done').length})</button>
        </div>
      </div>

      <div class="nusp-table-wrapper">
        <table class="nusp-table">
          <thead>
            <tr>
              <th>เลขที่ใบแจ้งซ่อม</th>
              <th>หัวข้อ</th>
              <th>ประเภท</th>
              <th>สถานะ</th>
              <th>วันที่</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(t => {
              let badge = '<span class="badge badge-pending"><span class="badge-dot"></span> รอดำเนินการ</span>';
              if (t.status === 'doing') {
                const pTag = t.tag || t.note?.match(/^\[(.*?)\]/)?.[1] || '';
                if (pTag.includes('รออุปกรณ์') || pTag.includes('อะไหล่')) badge = '<span class="badge badge-waiting-parts"><span class="badge-dot"></span> ⏳ รออุปกรณ์</span>';
                else if (pTag.includes('ตรวจสอบ')) badge = '<span class="badge badge-inspecting"><span class="badge-dot"></span> 🔍 กำลังตรวจสอบ</span>';
                else if (pTag.includes('ติดปัญหา') || pTag.includes('ประสานงาน')) badge = '<span class="badge badge-issue"><span class="badge-dot"></span> ⚠️ ติดปัญหา</span>';
                else if (pTag.includes('ติดตั้ง')) badge = '<span class="badge badge-install"><span class="badge-dot"></span> 🛠️ กำลังติดตั้ง</span>';
                else badge = '<span class="badge badge-doing"><span class="badge-dot"></span> กำลังดำเนินการ</span>';
              }
              if (t.status === 'done') badge = '<span class="badge badge-done"><span class="badge-dot"></span> ' + ((t.done_type === 'ติดตั้ง/ต่อเติม' || t.cat === 'ติดตั้ง/ต่อเติม') ? 'ติดตั้งเสร็จแล้ว' : 'ซ่อมเสร็จแล้ว') + '</span>';

              return `
                <tr>
                  <td style="font-weight:700; color:var(--primary);">${esc(t.no)}</td>
                  <td>${esc(t.title || t.no)}</td>
                  <td>${esc(t.type || 'เครื่องปรับอากาศ')}</td>
                  <td>${badge}</td>
                  <td style="color:var(--text-muted); font-size:14.5px;">${esc(t.date || fmt(t.created_at) || '-')}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="quickTrack('${t.no}', '${t.email || ''}')">ดูรายละเอียด</button>
                  </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="6" class="mut" style="text-align:center; padding:24px;">ไม่พบรายการในหมวดนี้</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    ${found ? `<div style="max-width:800px; margin:20px auto 0;">${card(found, steps(found))}</div>` : ''}
  `;
}

// Screen: ข้อมูลส่วนตัว (Profile)
function vProfile() {
  return `
    <div class="content-card" style="max-width: 600px; margin: 20px auto; border-radius: var(--radius-lg); padding: 32px 24px;">
      <div style="text-align:center; margin-bottom: 24px;">
        <div class="user-avatar" style="width:80px; height:80px; font-size:32px; margin:0 auto 14px; background:var(--primary);">
          ${(me?.name || 'N').charAt(0)}
        </div>
        <h2 style="font-size:22px; font-weight:800; color:var(--text-main); margin-bottom:6px;">${esc(me?.name || 'ผู้ใช้งาน')}</h2>
        <span class="badge badge-doing" style="font-size:14px; padding:6px 14px;">บทบาท: ${me?.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : me?.role === 'tech' ? 'ช่างซ่อมบำรุง (Technician)' : 'ผู้แจ้งซ่อม (บุคลากร/ทั่วไป)'}</span>
      </div>

      <div style="background:var(--bg-subtle); border-radius:var(--radius-md); padding:20px; border:1px solid var(--border); font-size:16px; display:flex; flex-direction:column; gap:16px;">
        <div class="row sp" style="flex-wrap:wrap; gap:8px;">
          <span class="mut" style="font-weight:700;">อีเมล:</span>
          <b>${esc(me?.email || '-')}</b>
        </div>
        <div class="row sp" style="flex-wrap:wrap; gap:8px;">
          <span class="mut" style="font-weight:700;">หน่วยงาน/สังกัด:</span>
          <b>อุทยานวิทยาศาสตร์ มหาวิทยาลัยนเรศวร (NUSP)</b>
        </div>
        <div class="row sp" style="flex-wrap:wrap; gap:8px;">
          <span class="mut" style="font-weight:700;">สถานะบัญชี:</span>
          <span style="color:var(--success); font-weight:700;">✓ ใช้งานได้ปกติ</span>
        </div>
      </div>

      <div style="margin-top:28px; text-align:center;">
        <button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger); min-height:48px; font-size:16px; font-weight:700; width:100%; max-width:240px;" onclick="signOut()">ออกจากระบบ</button>
      </div>
    </div>
  `;
}

window.quickTrack = async function (no, email) {
  toast('กำลังโหลดข้อมูลใบงาน ' + no + '...');
  lastTrackEmail = email;
  let data = null;
  try {
    const res = await sb.rpc('track_ticket', { p_id: no, p_email: email });
    data = res.data;
  } catch (err) {}
  if (data) {
    found = data;
  } else {
    // Search in local ticket list T (No fake mock ticket fallback)
    found = (typeof T !== 'undefined' ? T : []).find(x => x.id === no) || null;
    if (!found) {
      toast('ไม่พบข้อมูลใบแจ้งซ่อมเลขที่ ' + no);
    }
  }
  render();
};

window.trackT = async function (e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const no = (f.get('no') || '').trim();
  quickTrack(no, '');
};

window.cancelMyTicket = async function (id) {
  if (!confirm('คุณต้องการ "ยกเลิก" ใบงานนี้ใช่หรือไม่?')) return;
  try {
    await sb.rpc('cancel_my_ticket', { p_id: id, p_email: lastTrackEmail });
  } catch (err) {}
  toast('ยกเลิกใบงานเรียบร้อยแล้ว');
  found = null;
  render();
};

window.vHome = vHome;
window.vReport = vReport;
window.vTrack = vTrack;
window.vHistory = vHistory;
window.vProfile = vProfile;
