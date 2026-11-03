const chk = (n, a) => a.map(x => {
  if (x.includes('อื่น')) return `<label class="i"><input type="checkbox" name="${n}" value="${x}" onchange="document.getElementById('${n}_other').style.display = this.checked ? 'inline-block' : 'none'">${x}</label><input type="text" id="${n}_other" name="${n}_other_val" placeholder="โปรดระบุ..." style="display:none; width:auto; padding:4px 8px; font-size:13px; margin-left:8px;">`;
  return `<label class="i"><input type="checkbox" name="${n}" value="${x}">${x}</label>`;
}).join('');
const rowH = () => `<div class="rw"><input name="it" placeholder="รายการซ่อมแซม/ติดตั้ง"><input name="sy" placeholder="อาการที่ชำรุด"><input name="as" placeholder="หมายเลขครุภัณฑ์"></div>`;
window.catSw = function (v) { $('#c1').style.display = v === 'ซ่อมแซม' ? '' : 'none'; $('#c2').style.display = v === 'ซ่อมแซม' ? 'none' : '' }
window.addRow = function () { $('#rows').insertAdjacentHTML('beforeend', rowH()) }

function vReport() {
  return `${lastNo ? `<div class="card" style="border-color:var(--pri)">ส่งเรื่องแล้ว เลขใบงานของคุณคือ <b>${esc(lastNo)}</b> <button type="button" style="padding:2px 8px; font-size:12px; margin-left:8px;" onclick="copyNo('${lastNo}', event)">📋 คัดลอก</button><br><span class="mut">เข้าไปดูสถานะได้ที่แท็บ "ประวัติของฉัน"</span></div>` : ''}
<form class="card" onsubmit="submitT(event)"><b>ใบแจ้งซ่อม / ติดตั้ง / ต่อเติมอาคาร</b>

<div style="margin: 18px 0 10px; border-bottom: 1px solid var(--bd); padding-bottom: 4px; font-weight: bold; color: var(--pri);">👤 ข้อมูลผู้แจ้ง</div>
<div class="g">
<div><label>ชื่อผู้แจ้ง <span style="color:var(--bad)">*</span></label><input name="name" value="${esc(me?.role === 'reporter' && me.name !== me.email ? me.name : '')}" required placeholder="ชื่อ - นามสกุล"></div>
<div><label>อีเมล <span style="color:var(--bad)">*</span></label><input name="email" type="email" value="${esc(me?.role === 'reporter' ? (me.email || '') : (localStorage.getItem('last_reporter_email') || ''))}" required placeholder="name@company.com" ${me?.role === 'reporter' && me.email ? 'readonly style="background:var(--chip);"' : ''}></div>
<div><label>หน่วยงาน/บริษัท</label><input name="org" value="${esc(me?.org || '')}" placeholder="เช่น แผนกบัญชี, บ.คู่สัญญา"></div>
<div><label>เบอร์ภายใน</label><input name="ext" value="${esc(me?.ext || '')}" placeholder="เช่น 1234"></div>
<div><label>เบอร์มือถือ</label><input name="tel" type="tel" value="${esc(me?.tel || '')}" placeholder="เช่น 0812345678"></div></div>

<div style="margin: 18px 0 10px; border-bottom: 1px solid var(--bd); padding-bottom: 4px; font-weight: bold; color: var(--pri);">📍 สถานที่</div>
<div class="g"><div><label>อาคาร</label><input name="bld" required placeholder="เช่น B, C"></div>
<div><label>ชั้น</label><input name="flr" required></div><div><label>ห้อง / บริเวณ</label><input name="room" required placeholder="เช่น TC113.2, ลานจอดรถ, โถงทางเดิน"></div></div>

<div style="margin: 18px 0 10px; border-bottom: 1px solid var(--bd); padding-bottom: 4px; font-weight: bold; color: var(--pri);">🛠️ รายละเอียดงาน</div>
<label>ประเภทการแจ้ง</label><div><label class="i"><input type="radio" name="cat" value="ซ่อมแซม" checked onchange="catSw(this.value)">ซ่อมแซม</label><label class="i"><input type="radio" name="cat" value="ติดตั้ง/ต่อเติม" onchange="catSw(this.value)">ติดตั้ง/ต่อเติม</label></div>
<div id="c1"><label>ประเภทงานซ่อมแซม</label>${chk('t1', REP)}</div><div id="c2" style="display:none"><label>ประเภทงานติดตั้ง/ต่อเติม</label>${chk('t2', INS)}</div>
<label>รายการ / อาการที่ชำรุด / หมายเลขครุภัณฑ์</label><div id="rows">${rowH() + rowH() + rowH()}</div><button type="button" onclick="addRow()">+ เพิ่มแถว</button>
<label>แนบรูป (ไม่เกิน 4 รูป)</label><input type="file" name="pics" accept="image/*" multiple>
<label class="i" style="margin-top:10px"><input type="checkbox" name="urgent">เร่งด่วน</label>
<div style="margin-top:12px"><button class="p">ส่งเรื่อง</button></div></form>`}

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
  found = data; render();
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
  if (error) return toast(error.message); found = data; render()
}

window.cancelMyTicket = async function (id) {
  if (!confirm('คุณต้องการ "ยกเลิก" ใบงานนี้ใช่หรือไม่?')) return;
  const { error } = await sb.rpc('cancel_my_ticket', { p_id: id, p_email: lastTrackEmail });
  if (error) return toast('เกิดข้อผิดพลาด: ' + error.message);
  toast('ยกเลิกใบงานเรียบร้อยแล้ว'); found = null; render();
}