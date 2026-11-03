const chk = (n, a) => a.map(x => {
  if (x.includes('อื่น')) return `<label class="i"><input type="checkbox" name="${n}" value="${x}" onchange="document.getElementById('${n}_other').style.display = this.checked ? 'inline-block' : 'none'">${x}</label><input type="text" id="${n}_other" name="${n}_other_val" placeholder="โปรดระบุ..." style="display:none; width:auto; padding:4px 8px; font-size:13px; margin-left:8px;">`;
  return `<label class="i"><input type="checkbox" name="${n}" value="${x}">${x}</label>`;
}).join('');
const rowH = () => `<div class="rw"><input name="it" placeholder="รายการซ่อมแซม/ติดตั้ง"><input name="sy" placeholder="อาการที่ชำรุด"><input name="as" placeholder="หมายเลขครุภัณฑ์"></div>`;
window.catSw = function (v) { $('#c1').style.display = v === 'ซ่อมแซม' ? '' : 'none'; $('#c2').style.display = v === 'ซ่อมแซม' ? 'none' : '' }
window.addRow = function () { $('#rows').insertAdjacentHTML('beforeend', rowH()) }

function vReport() {
  return `${lastNo ? `
    <div class="card" style="border: 2px solid var(--nu-orange); background: var(--nu-orange-soft); padding: 18px 20px;">
      <div class="row sp">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:24px;">🎉</span>
          <div>
            <b style="font-size:16px; color:var(--nu-navy);">ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว!</b>
            <div style="font-size:13px; color:var(--tx-soft); margin-top:2px;">เลขใบงานของคุณคือ: <b style="font-family:monospace; font-size:15px; color:var(--nu-orange); background:var(--card); padding:2px 8px; border-radius:6px; border:1px solid var(--bd);">${esc(lastNo)}</b></div>
          </div>
        </div>
        <button type="button" class="p" style="padding:6px 14px; font-size:13px;" onclick="copyNo('${lastNo}', event)">📋 คัดลอกเลขใบงาน</button>
      </div>
      <div style="margin-top:12px; font-size:13px; color:var(--mut);">💡 ท่านสามารถติดตามความคืบหน้าของงานได้ที่แท็บ <b>"ประวัติของฉัน"</b> หรือค้นหาด้วยเลขใบงาน</div>
    </div>` : ''}

<form class="card" onsubmit="submitT(event)">
  <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--bd); padding-bottom:12px; margin-bottom:16px;">
    <div>
      <b style="font-size:18px; color:var(--tx);">📝 ใบแจ้งซ่อมบำรุง / ติดตั้ง / ต่อเติมอาคาร</b>
      <div class="mut" style="font-size:13px; margin-top:2px;">อุทยานวิทยาศาสตร์ มหาวิทยาลัยนเรศวร (อาคารมหาธรรมราชา)</div>
    </div>
    <span class="location-badge">Sci.Park@NU</span>
  </div>

  <div style="margin: 16px 0 10px; font-weight:600; color:var(--nu-orange); font-size:14px; display:flex; align-items:center; gap:6px;">
    <span>👤 1. ข้อมูลผู้แจ้งซ่อม</span>
  </div>
  <div class="g">
    <div><label>ชื่อ - นามสกุล ผู้แจ้ง <span style="color:var(--bad)">*</span></label><input name="name" value="${esc(me?.role === 'reporter' && me.name !== me.email ? me.name : '')}" required placeholder="เช่น นายสมชาย ใจดี"></div>
    <div><label>อีเมลผู้แจ้ง <span style="color:var(--bad)">*</span></label><input name="email" type="email" value="${esc(me?.role === 'reporter' ? (me.email || '') : (localStorage.getItem('last_reporter_email') || ''))}" required placeholder="name@company.com" ${me?.role === 'reporter' && me.email ? 'readonly style="background:var(--chip);"' : ''}></div>
    <div><label>หน่วยงาน / บริษัท / ฝ่าย</label><input name="org" value="${esc(me?.org || '')}" placeholder="เช่น บ.นวัตกรรมไทย, ฝ่ายบริหาร, บุคลากรทั่วไป"></div>
    <div><label>เบอร์โทรศัพท์มือถือ <span style="color:var(--bad)">*</span></label><input name="tel" type="tel" value="${esc(me?.tel || '')}" required placeholder="เช่น 081-234-5678"></div>
    <div><label>เบอร์โทรภายใน (ถ้ามี)</label><input name="ext" value="${esc(me?.ext || '')}" placeholder="เช่น 1234"></div>
  </div>

  <div style="margin: 22px 0 10px; font-weight:600; color:var(--nu-orange); font-size:14px; display:flex; align-items:center; gap:6px; border-top:1px solid var(--bd); padding-top:16px;">
    <span>📍 2. สถานที่และบริเวณที่ชำรุด</span>
  </div>
  <div class="g">
    <div><label>อาคาร / โซน <span style="color:var(--bad)">*</span></label><input name="bld" required placeholder="เช่น อาคารมหาธรรมราชา โซน B หรือ โซน C"></div>
    <div><label>ชั้น <span style="color:var(--bad)">*</span></label><input name="flr" required placeholder="เช่น ชั้น 1, ชั้น 2"></div>
    <div><label>ห้อง / บริเวณที่พบปัญหา <span style="color:var(--bad)">*</span></label><input name="room" required placeholder="เช่น ห้อง TC113.2, ลานจอดรถ, โถง Co-Working"></div>
  </div>

  <div style="margin: 22px 0 10px; font-weight:600; color:var(--nu-orange); font-size:14px; display:flex; align-items:center; gap:6px; border-top:1px solid var(--bd); padding-top:16px;">
    <span>🛠️ 3. รายละเอียดงานแจ้งซ่อม</span>
  </div>
  
  <label style="font-weight:600;">ประเภทการแจ้ง</label>
  <div style="display:flex; gap:12px; margin-bottom:12px;">
    <label class="box" style="flex:1; padding:10px; cursor:pointer; text-align:left; display:flex; align-items:center; gap:8px;">
      <input type="radio" name="cat" value="ซ่อมแซม" checked onchange="catSw(this.value)" style="width:auto;">
      <div><b>🔧 งานซ่อมแซม</b><div class="mut" style="font-size:11px;">แก้ไขอุปกรณ์ชำรุด เสียหาย</div></div>
    </label>
    <label class="box" style="flex:1; padding:10px; cursor:pointer; text-align:left; display:flex; align-items:center; gap:8px;">
      <input type="radio" name="cat" value="ติดตั้ง/ต่อเติม" onchange="catSw(this.value)" style="width:auto;">
      <div><b>🛠️ งานติดตั้ง / ต่อเติม</b><div class="mut" style="font-size:11px;">ติดตั้งอุปกรณ์ใหม่ ต่อเติมพื้นที่</div></div>
    </label>
  </div>

  <div id="c1" style="background:var(--bg); border:1px solid var(--bd); border-radius:10px; padding:12px 14px; margin-bottom:14px;">
    <label style="margin-top:0; font-weight:600;">หมวดหมู่งานซ่อมแซม (เลือกได้มากกว่า 1 ข้อ):</label>
    ${chk('t1', REP)}
  </div>
  
  <div id="c2" style="display:none; background:var(--bg); border:1px solid var(--bd); border-radius:10px; padding:12px 14px; margin-bottom:14px;">
    <label style="margin-top:0; font-weight:600;">หมวดหมู่งานติดตั้ง/ต่อเติม (เลือกได้มากกว่า 1 ข้อ):</label>
    ${chk('t2', INS)}
  </div>

  <label style="font-weight:600;">รายการ / อาการที่ชำรุด / รหัสครุภัณฑ์ (ถ้ามี)</label>
  <div style="font-size:12px; color:var(--mut); margin-bottom:6px;">ระบุสิ่งของที่เสีย อาการ และรหัสครุภัณฑ์เพื่อความสะดวกรวดเร็วในการตรวจสอบ</div>
  <div id="rows">${rowH() + rowH() + rowH()}</div>
  <button type="button" style="margin-top:4px;" onclick="addRow()">➕ เพิ่มรายการอีกแถว</button>

  <div style="margin-top:16px;">
    <label style="font-weight:600;">แนบรูปภาพประกอบ (ไม่เกิน 4 รูป)</label>
    <input type="file" name="pics" accept="image/*" multiple style="background:var(--bg);">
    <span class="mut" style="font-size:12px;">* ระบบจะย่อขนาดรูปภาพให้อัตโนมัติ รองรับไฟล์ภาพจากมือถือทุกรุ่น</span>
  </div>

  <div style="background:var(--bad-soft); border:1px solid rgba(239,68,68,0.25); border-radius:10px; padding:10px 14px; margin-top:16px;">
    <label class="i" style="color:var(--bad); margin:0; font-weight:600;">
      <input type="checkbox" name="urgent">
      🚨 เป็นงานเร่งด่วนมาก (ส่งผลกระทบต่อความปลอดภัยหรือระบบหลัก)
    </label>
  </div>

  <div style="margin-top:20px; border-top:1px solid var(--bd); padding-top:16px;">
    <button type="submit" class="p" style="width:100%; padding:12px; font-size:16px; font-weight:bold;">🚀 ส่งเรื่องแจ้งซ่อม</button>
  </div>
</form>`
}

window.submitT = async function (e) {
  e.preventDefault(); const f = new FormData(e.target), v = k => (f.get(k) || '').trim(), cat = f.get('cat');
  const typeKey = cat === 'ซ่อมแซม' ? 't1' : 't2';
  const rawTypes = f.getAll(typeKey);
  const types = rawTypes.map(t => t.includes('อื่น') ? `อื่นๆ (${f.get(typeKey + '_other_val') || 'ไม่ระบุ'})` : t);
  const it = f.getAll('it'), sy = f.getAll('sy'), as = f.getAll('as');
  const items = it.map((x, i) => ({ item: x.trim(), sym: sy[i].trim(), asset: as[i].trim() })).filter(x => x.item || x.sym);
  if (!types.length || !items.length) return toast('เลือกประเภทงานและกรอกรายการอย่างน้อย 1 แถว');
  const no = 'RP-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
  const b = e.target.querySelector('.p'); b.disabled = true; toast('กำลังส่งเรื่อง...');
  try {
    const fl = f.getAll('pics').filter(x => x.size), photos = fl.length ? await up(fl, 'r/' + no) : [];
    const emailVal = v('email').toLowerCase();
    const nameVal = v('name');
    const { error } = await sb.from('tickets').insert({ id: no, name: nameVal, email: emailVal, org: v('org'), ext: v('ext'), tel: v('tel'), cat, bld: v('bld'), flr: v('flr'), room: v('room'), types, items, urgent: !!f.get('urgent'), photos, history: [{ s: 'accepted', at: Date.now() }] });
    if (error) throw error; 
    
    // บันทึกโปรไฟล์ไว้เพื่อเติมข้อมูลอัตโนมัติในครั้งต่อไป
    localStorage.setItem('profile_' + emailVal, JSON.stringify({ name: nameVal, org: v('org'), ext: v('ext'), tel: v('tel') }));
    localStorage.setItem('last_reporter_email', emailVal);

    if (me && me.role === 'reporter') {
      me.name = nameVal;
      me.org = v('org');
      me.ext = v('ext');
      me.tel = v('tel');
      sessionStorage.setItem('repair_me', JSON.stringify(me));
      localStorage.setItem('repair_reporter_me', JSON.stringify(me));
    }

    const myT = JSON.parse(localStorage.getItem('myT') || '[]');
    myT.unshift({ no, email: emailVal, status: 'accepted' });
    localStorage.setItem('myT', JSON.stringify(myT));

    lastNo = no; render(); scrollTo(0, 0)
  } catch (x) { toast('ส่งเรื่องไม่สำเร็จ: ' + (x.message || x)); b.disabled = false }
}

function vHistory() {
  const myT = JSON.parse(localStorage.getItem('myT') || '[]');
  
  let filtered = myT;
  if (hFil === 'pending') filtered = myT.filter(t => t.status === 'accepted' || t.status === 'doing' || !t.status);
  if (hFil === 'done') filtered = myT.filter(t => t.status === 'done');
  
  const cancelBtn = found?.status === 'accepted' ? `<div style="margin-top:12px; border-top:1px solid var(--bd); padding-top:12px"><button class="d" onclick="cancelMyTicket('${found.id}')">❌ ยกเลิกการแจ้งซ่อมนี้</button></div>` : '';
  
  const filterHtml = myT.length ? `
    <div class="row" style="margin-bottom: 12px; gap: 8px;">
        <button class="${hFil === 'all' ? 'on' : ''}" style="padding: 4px 10px; font-size: 13px;" onclick="setHFil('all')">ทั้งหมด</button>
        <button class="${hFil === 'pending' ? 'on' : ''}" style="padding: 4px 10px; font-size: 13px;" onclick="setHFil('pending')">รอดำเนินการ</button>
        <button class="${hFil === 'done' ? 'on' : ''}" style="padding: 4px 10px; font-size: 13px;" onclick="setHFil('done')">เสร็จสิ้น</button>
    </div>
  ` : '';

  const reporterEmail = (me && me.role === 'reporter' ? me.email : '') || localStorage.getItem('last_reporter_email') || '';

  const historyHtml = myT.length ? `
    <div class="card">
      <div class="row sp">
        <b>📋 ประวัติการแจ้งซ่อมของคุณ (พบ ${myT.length} งาน)</b>
        ${reporterEmail ? `<span class="mut" style="font-size:13px;">อีเมล: <b>${esc(reporterEmail)}</b></span>` : ''}
      </div>
      <p class="mut" style="margin-top:4px; margin-bottom:8px;">กดที่เลขใบงานเพื่อดูรายละเอียดสถานะ</p>
      ${filterHtml}
      <div class="row" style="gap:8px">
        ${filtered.map(t => {
            const st = t.status ? ST[t.status] : null;
            const badge = st ? `<span style="font-size:11px; padding:2px 6px; border-radius:4px; background:${st[1]}; color:#fff; white-space:nowrap">${st[0]}</span>` : `<span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--mut); color:#fff;">กำลังเช็ค..</span>`;
            return `<div class="box ${found?.id === t.no ? 'sel' : ''}" onclick="quickTrack('${t.no}', '${t.email}')" style="flex:1; min-width:200px; padding:10px; text-align:left; border-color:var(--bd)">
                <div class="row sp" style="margin-bottom:6px;">
                    <b>${esc(t.no)}</b> 
                    <span onclick="copyNo('${t.no}', event)" style="cursor:pointer; font-size:16px;" title="คัดลอกเลขใบงาน">📋</span>
                </div>
                <div class="row sp">
                    <div class="mut" style="font-size:12px; word-break:break-all; padding-right:8px;">${esc(t.email)}</div>
                    ${badge}
                </div>
            </div>`
        }).join('') || '<div class="mut" style="padding: 10px; text-align:center; width:100%">ไม่พบรายการในสถานะนี้</div>'}
      </div>
      <div style="text-align:right; margin-top:14px">
        <button class="mut" style="padding:4px 8px; font-size:12px; border:none; background:transparent" onclick="clearHistory()">ลบประวัติในเครื่อง</button>
      </div>
    </div>
  ` : `<div class="card mut" style="text-align:center; padding:24px 10px;">
        ${reporterEmail ? `ยังไม่พบประวัติการแจ้งซ่อมสำหรับอีเมล <b>${esc(reporterEmail)}</b>` : 'คุณยังไม่มีประวัติการแจ้งซ่อมบนอุปกรณ์นี้'}
        <div style="margin-top:12px;">
          <button class="p" onclick="setTab('report')">➕ แจ้งซ่อมรายการใหม่</button>
        </div>
      </div>`;

  return historyHtml + (found ? card(found, steps(found) + cancelBtn) : '');
}

function vTrack() {
  return `
<form class="card" onsubmit="trackT(event)">
  <b>ค้นหาใบงาน</b>
  <p class="mut" style="margin-top:4px">กรอกเลขใบงานเพื่อดูว่างานดำเนินการถึงไหนแล้ว</p>
  <div style="margin-top:12px">
    <label>เลขใบงาน</label><input name="no" required placeholder="RP-...">
  </div>
  <div style="margin-top:12px"><button class="p">ค้นหา</button></div>
</form>
${found === null ? '<div class="card mut">ไม่พบใบงาน ตรวจเลขใบงานอีกครั้ง</div>' : found ? card(found, steps(found)) : ''}`
}

window.quickTrack = async function (no, email) {
  toast('กำลังโหลดข้อมูล...');
  lastTrackEmail = email;
  const { data, error } = await sb.rpc('track_ticket', { p_id: no, p_email: email });
  if (error) return toast(error.message); 
  found = Array.isArray(data) ? (data[0] || null) : (data || null);
  render();
}

window.clearHistory = function() {
  if(confirm('ต้องการลบปุ่มประวัติการแจ้งซ่อมในเครื่องนี้หรือไม่? (ใบงานในระบบจะไม่ถูกลบ)')) {
    localStorage.removeItem('myT'); found = undefined; render();
  }
}

window.trackT = async function (e) {
  e.preventDefault(); const f = new FormData(e.target);
  lastTrackEmail = '';
  const { data, error } = await sb.rpc('track_ticket', { p_id: f.get('no') });
  if (error) return toast(error.message); 
  found = Array.isArray(data) ? (data[0] || null) : (data || null);
  render();
}

window.cancelMyTicket = async function (id) {
  if (!confirm('คุณต้องการ "ยกเลิก" ใบงานนี้ใช่หรือไม่?')) return;
  const { error } = await sb.rpc('cancel_my_ticket', { p_id: id, p_email: lastTrackEmail });
  if (error) return toast('เกิดข้อผิดพลาด: ' + error.message);
  toast('ยกเลิกใบงานเรียบร้อยแล้ว'); found = null; render();
}