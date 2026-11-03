let loginRole = 'reporter';
let authMode = 'login'; // 'login' | 'register'

window.setAuthMode = function(m) {
  authMode = m;
  render();
};

window.setLoginRole = function(r) {
  loginRole = r;
  render();
};

window.loginReporter = function(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const email = (f.get('email') || '').trim().toLowerCase();
  if (!email) return toast('กรุณากรอกอีเมลของคุณ');

  localStorage.setItem('last_reporter_email', email);

  // ดึงข้อมูลโปรไฟล์เดิมที่เคยบันทึกไว้สำหรับอีเมลนี้ (ถ้ามี)
  const savedProfile = JSON.parse(localStorage.getItem('profile_' + email) || '{}');
  const name = savedProfile.name || email.split('@')[0];

  me = { 
    id: null, 
    name, 
    email, 
    role: 'reporter',
    tel: savedProfile.tel || '',
    org: savedProfile.org || '',
    ext: savedProfile.ext || ''
  };

  sessionStorage.setItem('repair_me', JSON.stringify(me));
  localStorage.setItem('repair_reporter_me', JSON.stringify(me));
  tab = 'report';
  render();
  toast('ยินดีต้อนรับ ' + (savedProfile.name || email));
  if (typeof loadHistoryData === 'function') loadHistoryData();
};

window.devQuickLogin = function(r) {
  const name = r === 'admin' ? 'แอดมินทดสอบ (ผู้ดูแลระบบ)' : 'ช่างทดสอบ (ฝ่ายช่าง)';
  me = { id: r === 'admin' ? 'dev-admin-1' : 'dev-tech-1', name, role: r, dev: 1 };
  sessionStorage.setItem('repair_me', JSON.stringify(me));
  tab = r === 'admin' ? 'all' : 'pool';
  go();
  toast('เข้าสู่ระบบสำเร็จในฐานะ ' + (r === 'admin' ? 'แอดมิน' : 'ช่าง'));
};

window.register = async function (e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = (f.get('name') || '').trim();
  const email = (f.get('email') || '').trim();
  const pw = f.get('pw');
  const pw2 = f.get('pw2');
  const role = f.get('role') || 'reporter';
  const tel = (f.get('tel') || '').trim();
  const org = (f.get('org') || '').trim();

  if (!name || !email || !pw) {
    return toast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
  }
  if (pw.length < 6) {
    return toast('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
  }
  if (pw !== pw2) {
    return toast('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
  }

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;
  toast('กำลังดำเนินการลงทะเบียน...');

  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password: pw,
      options: {
        data: { name, role, tel, org }
      }
    });

    if (error) throw error;

    if (data?.user) {
      try {
        await sb.from('profiles').upsert({
          id: data.user.id,
          name,
          role,
          tel,
          org
        });
      } catch (errProfile) {
        console.warn('Profiles upsert warning:', errProfile);
      }
    }

    if (!data?.session) {
      toast('ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลหรือเข้าสู่ระบบ');
      authMode = 'login';
      loginRole = role;
      render();
    } else {
      toast('ลงทะเบียนและเข้าสู่ระบบสำเร็จ!');
      load(data.session);
    }
  } catch (err) {
    if (CONFIG.DEV) {
      toast('โหมดทดสอบ: จำลองการลงทะเบียนสำเร็จ');
      me = {
        id: 'dev-' + role + '-' + Date.now().toString(36),
        name,
        email,
        role,
        tel,
        org,
        dev: 1
      };
      sessionStorage.setItem('repair_me', JSON.stringify(me));
      authMode = 'login';
      tab = role === 'admin' ? 'all' : role === 'tech' ? 'pool' : 'report';
      go();
      return;
    }
    toast('ลงทะเบียนไม่สำเร็จ: ' + (err.message || err));
  } finally {
    if (btn) btn.disabled = false;
  }
};

const vLogin = () => {
  const isDev = !!CONFIG.DEV;

  // View สำหรับการลงทะเบียนผู้ใช้ใหม่ (Register View)
  if (authMode === 'register') {
    return `
    <div style="max-width: 600px; margin: 20px auto 40px;">
      <div class="card" style="padding: 24px 22px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0 0 6px; font-size: 22px; color: var(--pri);">📝 ลงทะเบียนผู้ใช้ใหม่</h2>
          <p class="mut" style="margin: 0; font-size: 14px;">สร้างบัญชีผู้ใช้งานสำหรับระบบแจ้งซ่อม</p>
        </div>

        <form onsubmit="register(event)">
          <div style="margin-bottom: 14px;">
            <label style="margin-top:0; font-weight:bold;">บทบาทเจ้าหน้าที่ <span style="color:var(--bad)">*</span></label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 6px;">
              <label class="box" style="padding: 10px 4px; font-size: 13px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <input type="radio" name="role" value="tech" checked style="width: auto;">
                <span>🛠️ ช่างซ่อม</span>
              </label>
              <label class="box" style="padding: 10px 4px; font-size: 13px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <input type="radio" name="role" value="admin" style="width: auto;">
                <span>👑 แอดมิน</span>
              </label>
            </div>
            <p class="mut" style="font-size:12px; margin: 8px 0 0; text-align:center;">💡 <i>สำหรับผู้แจ้งซ่อม ไม่ต้องสมัครสมาชิก สามารถใช้อีเมลเข้าสู่ระบบได้ทันที</i></p>
          </div>

          <label>ชื่อ - นามสกุล <span style="color:var(--bad)">*</span></label>
          <input name="name" required placeholder="เช่น นายสมชาย ใจดี">

          <label>อีเมล (สำหรับใช้เข้าสู่ระบบ) <span style="color:var(--bad)">*</span></label>
          <input name="email" type="email" required placeholder="user@company.com">

          <div class="g">
            <div>
              <label>รหัสผ่าน <span style="color:var(--bad)">*</span></label>
              <input name="pw" type="password" required minlength="6" placeholder="อย่างน้อย 6 ตัวอักษร">
            </div>
            <div>
              <label>ยืนยันรหัสผ่าน <span style="color:var(--bad)">*</span></label>
              <input name="pw2" type="password" required minlength="6" placeholder="พิมพ์รหัสผ่านอีกครั้ง">
            </div>
          </div>

          <div class="g">
            <div>
              <label>เบอร์โทรศัพท์</label>
              <input name="tel" type="tel" placeholder="08x-xxx-xxxx">
            </div>
            <div>
              <label>หน่วยงาน / บริษัท</label>
              <input name="org" placeholder="เช่น ฝ่ายบริหาร, บ.คู่สัญญา">
            </div>
          </div>

          <div style="margin-top: 22px;">
            <button type="submit" class="p" style="width: 100%; padding: 10px; font-size: 15px; font-weight: bold;">ลงทะเบียนผู้ใช้ใหม่ ✨</button>
          </div>
        </form>

        <div style="text-align: center; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--bd);">
          <span class="mut" style="font-size: 13px;">มีบัญชีผู้ใช้งานอยู่แล้ว? </span>
          <a href="javascript:void(0)" onclick="setAuthMode('login')" style="color: var(--pri); font-weight: bold; text-decoration: underline; font-size: 13px; cursor: pointer;">เข้าสู่ระบบที่นี่</a>
        </div>
      </div>
    </div>`;
  }

  // View สำหรับการเข้าสู่ระบบตามบทบาท (Login View)
  return `
  <div style="max-width: 600px; margin: 10px auto 40px;">
    <div class="card" style="padding: 26px 24px;">
      <div style="text-align: center; margin-bottom: 22px;">
        <div style="display:inline-flex; align-items:center; gap:8px; background:var(--nu-orange-soft); padding:4px 12px; border-radius:var(--radius-full); margin-bottom:10px; border:1px solid rgba(243,112,33,0.3);">
          <span style="font-size:14px;">🏛️</span>
          <span style="font-size:12px; font-weight:600; color:var(--nu-orange);">อุทยานวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</span>
        </div>
        <h2 style="margin: 0 0 6px; font-size: 22px; color: var(--tx);">เข้าสู่ระบบแจ้งซ่อมและบริการอาคาร</h2>
        <p class="mut" style="margin: 0; font-size: 13px;">อาคารมหาธรรมราชา • โปรดเลือกบทบาทการเข้าใช้งาน</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 22px;">
        <button type="button" class="${loginRole === 'reporter' ? 'on' : ''}" onclick="setLoginRole('reporter')" style="padding: 14px 6px; font-size: 13px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 6px; border-radius:12px;">
          <span style="font-size: 26px;">👤</span>
          <span>ผู้แจ้งซ่อม</span>
          <span style="font-size:11px; font-weight:normal; opacity:0.85;">(ใช้อีเมล)</span>
        </button>
        <button type="button" class="${loginRole === 'tech' ? 'on' : ''}" onclick="setLoginRole('tech')" style="padding: 14px 6px; font-size: 13px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 6px; border-radius:12px;">
          <span style="font-size: 26px;">🛠️</span>
          <span>ช่างซ่อมบำรุง</span>
          <span style="font-size:11px; font-weight:normal; opacity:0.85;">(งานช่าง)</span>
        </button>
        <button type="button" class="${loginRole === 'admin' ? 'on' : ''}" onclick="setLoginRole('admin')" style="padding: 14px 6px; font-size: 13px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 6px; border-radius:12px;">
          <span style="font-size: 26px;">👑</span>
          <span>ผู้ดูแลระบบ</span>
          <span style="font-size:11px; font-weight:normal; opacity:0.85;">(Admin)</span>
        </button>
      </div>

      ${loginRole === 'reporter' ? `
        <div style="text-align: left; background: var(--bg); border: 1px solid var(--bd); border-radius: 10px; padding: 20px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: var(--pri); font-size: 16px;">👤 เข้าใช้งาน: ผู้แจ้งซ่อม (ใช้อีเมล)</div>
          <p class="mut" style="margin-bottom: 16px; font-size: 13px;">กรอกเพียง <b>อีเมล</b> เพื่อเข้าสู่ระบบ (ไม่ต้องใช้รหัสผ่าน) เพื่อแจ้งซ่อมและดูประวัติใบงานทั้งหมดของคุณ</p>
          <form onsubmit="loginReporter(event)">
            <label style="font-weight:600; margin-top:0;">อีเมลของคุณ <span style="color:var(--bad)">*</span></label>
            <input name="email" type="email" required placeholder="เช่น somchai@company.com หรือ your-name@gmail.com" value="${esc(localStorage.getItem('last_reporter_email') || '')}" style="font-size:15px; padding:10px;">
            <div style="margin-top: 18px;">
              <button type="submit" class="p" style="width: 100%; padding: 11px; font-size: 15px; font-weight: bold;">เข้าสู่ระบบด้วยอีเมล →</button>
            </div>
          </form>
        </div>` : loginRole === 'tech' ? `
        <div style="text-align: left; background: var(--bg); border: 1px solid var(--bd); border-radius: 10px; padding: 18px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: var(--pri); font-size: 15px;">🛠️ เข้าสู่ระบบ: ฝ่ายช่างซ่อมบำรุง</div>
          <p class="mut" style="margin-bottom: 14px; font-size: 13px;">สำหรับช่างรับงานกลาง อัปเดตความคืบหน้า และเบิกใช้วัสดุอุปกรณ์</p>
          
          ${isDev ? `
            <div style="background: var(--card); border: 1px dashed var(--pri); border-radius: 8px; padding: 12px; margin-bottom: 16px; text-align: center;">
              <span class="mut" style="font-size: 12px; display: block; margin-bottom: 6px;">⚙️ โหมดทดสอบ (DEV Mode)</span>
              <button type="button" class="p" style="width: 100%;" onclick="devQuickLogin('tech')">⚡ เข้าใช้งานทันที (ช่างทดสอบ)</button>
            </div>
            <div style="text-align: center; margin: 10px 0; color: var(--mut); font-size: 12px;">— หรือเข้าสู่ระบบด้วยบัญชีจริง —</div>
          ` : ''}

          <form onsubmit="login(event)">
            <label>อีเมลช่าง</label>
            <input name="email" type="email" required placeholder="tech@company.com">
            <label>รหัสผ่าน</label>
            <input name="pw" type="password" required placeholder="••••••••">
            <div style="margin-top: 18px;">
              <button type="submit" class="p" style="width: 100%; padding: 10px; font-size: 15px; font-weight: bold;">เข้าสู่ระบบ (ช่าง) →</button>
            </div>
          </form>
        </div>
      ` : `
        <div style="text-align: left; background: var(--bg); border: 1px solid var(--bd); border-radius: 10px; padding: 18px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: var(--pri); font-size: 15px;">👑 เข้าสู่ระบบ: ผู้ดูแลระบบ (Admin)</div>
          <p class="mut" style="margin-bottom: 14px; font-size: 13px;">สำหรับแอดมิน จัดการใบงานทั้งหมด มอบหมายงานช่าง ดูสต็อกและสถิติ</p>
          
          ${isDev ? `
            <div style="background: var(--card); border: 1px dashed var(--pri); border-radius: 8px; padding: 12px; margin-bottom: 16px; text-align: center;">
              <span class="mut" style="font-size: 12px; display: block; margin-bottom: 6px;">⚙️ โหมดทดสอบ (DEV Mode)</span>
              <button type="button" class="p" style="width: 100%;" onclick="devQuickLogin('admin')">⚡ เข้าใช้งานทันที (แอดมินทดสอบ)</button>
            </div>
            <div style="text-align: center; margin: 10px 0; color: var(--mut); font-size: 12px;">— หรือเข้าสู่ระบบด้วยบัญชีจริง —</div>
          ` : ''}

          <form onsubmit="login(event)">
            <label>อีเมลผู้ดูแลระบบ</label>
            <input name="email" type="email" required placeholder="admin@company.com">
            <label>รหัสผ่าน</label>
            <input name="pw" type="password" required placeholder="••••••••">
            <div style="margin-top: 18px;">
              <button type="submit" class="p" style="width: 100%; padding: 10px; font-size: 15px; font-weight: bold;">เข้าสู่ระบบ (แอดมิน) →</button>
            </div>
          </form>
        </div>
      `}

      <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--bd);">
        <span class="mut" style="font-size: 13px;">ยังไม่มีบัญชีผู้ใช้งาน? </span>
        <a href="javascript:void(0)" onclick="setAuthMode('register')" style="color: var(--pri); font-weight: bold; text-decoration: underline; font-size: 13px; cursor: pointer;">ลงทะเบียนสมาชิกใหม่ ✨</a>
      </div>
    </div>
  </div>`;
};
window.logh = (t, s) => [...(t?.history || []), { s, at: Date.now() }];
const vPool = () => {
  const a = T.filter(t => t.status === 'accepted' && !t.tech_name).sort((x, y) => (y.urgent - x.urgent));
  return `<div class="card"><b>งานกลางที่รอช่างรับ</b> <span class="mut">${a.length} งาน</span></div>${a.map(t => card(t, `<div style="margin-top:8px"><button class="p" onclick="claim('${t.id}')">รับงานนี้</button> <button onclick="openNote('${t.id}')">หมายเหตุ</button></div>`)).join('') || '<div class="card mut">ไม่มีงานรอรับ</div>'}`
};

window.claim = async function (id) {
  const t = T.find(x => x.id === id);
  const p = {
    tech_id: me.id,
    tech_name: me.name,
    status: 'doing',
    history: logh(t, 'doing')
  };
  const { data, error } = await sb.from('tickets').update(p).eq('id', id).is('tech_name', null).select();
  if (error) return toast(error.message);
  if (!data || !data.length) {
    if (CONFIG.DEV) {
      if (t) Object.assign(t, p);
      toast('รับงานแล้ว (สถานะเปลี่ยนเป็น: กำลังดำเนินการ) ดูได้ที่ “งานของฉัน”');
      go();
      return;
    }
    toast('มีช่างคนอื่นรับงานนี้ไปแล้ว');
  } else {
    if (t) Object.assign(t, p);
    toast('รับงานแล้ว (สถานะเปลี่ยนเป็น: กำลังดำเนินการ) ดูได้ที่ “งานของฉัน”');
    go();
  }
}
window.openNote = function (id) { const t = T.find(x => x.id === id); $('#dlg').innerHTML = `<b>${esc(id)}</b><label>หมายเหตุแจ้งช่าง</label><textarea id="n" rows="4">${esc(t.note)}</textarea><div class="row" style="margin-top:14px"><button class="p" onclick="saveNote('${id}')">บันทึก</button><button onclick="document.querySelector('#dlg').close()">ปิด</button></div>`; $('#dlg').showModal() }
window.saveNote = async function (id) { const { error } = await sb.from('tickets').update({ note: $('#n').value.trim() }).eq('id', id); if (error) return toast(error.message); $('#dlg').close(); go() }

function vMine() {
  const isDevOrAdmin = me?.dev || me?.role === 'admin';
  const a = T.filter(t => (isDevOrAdmin ? (t.tech_name === me.name || t.tech_id === me.id) : t.tech_id === me.id) && ['accepted', 'doing'].includes(t.status)), by = {};
  a.forEach(t => (by[`อาคาร ${t.bld} ชั้น ${t.flr}`] ??= []).push(t)); const ks = Object.keys(by).sort();
  return `<div class="card"><b>งานค้างแยกตามตำแหน่ง</b> <span class="mut">รวม ${a.length} งาน</span><div class="sum" style="margin-top:8px">${ks.map((k, i) => `<div class="box" onclick="document.getElementById('L${i}').scrollIntoView()"><b>${by[k].length}</b><span class="mut">${esc(k)}</span></div>`).join('') || '<span class="mut">ไม่มีงานค้าง</span>'}</div></div>
${ks.map((k, i) => `<h3 id="L${i}" style="border-left: 4px solid var(--pri); padding-left: 8px; margin-top: 24px; color: var(--pri);">📍 ${esc(k)} <span class="mut" style="font-size:14px; font-weight:normal">(${by[k].length} งาน)</span></h3>${by[k].map(t => card(t, `<div class="row" style="margin-top:8px; gap:8px;"><button class="p" onclick="openAct('${t.id}')">📝 อัปเดตสถานะ</button> <button onclick="openMat('${t.id}')" style="border-color:var(--pri); color:var(--pri); background:transparent;">📦 เบิกวัสดุ</button></div>`)).join('')}`).join('')}`
}

function vTechDone() {
  const isDevOrAdmin = me?.dev || me?.role === 'admin';
  const a = T.filter(t => (isDevOrAdmin ? (t.tech_name === me.name || t.tech_id === me.id) : t.tech_id === me.id) && t.status === 'done');
  return `<div class="card"><b>ประวัติงานที่ทำเสร็จ (ของฉัน)</b> <span class="mut">รวม ${a.length} งาน</span></div>
  ${a.map(t => card(t)).join('') || '<div class="card mut">ยังไม่มีงานที่ทำเสร็จ</div>'}`
}

let mRowCounter = 0;

window.matRowChange = function (sel, idx) {
  const customInput = document.getElementById('mcustom_' + idx);
  if (customInput) {
    customInput.style.display = sel.value === 'อื่นๆ' ? 'block' : 'none';
  }
};

window.addMatRow = function (name = '', qty = '', unit = '') {
  mRowCounter++;
  const idx = mRowCounter;
  const matOpts = MATS.map(m => `<option value="${m}" ${name === m ? 'selected' : ''}>${m}</option>`).join('');
  const isOther = name && !MATS.includes(name);

  const html = `
    <div class="mat-row" id="mrow_${idx}" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:8px; padding:8px 10px; background:var(--card); border:1px solid var(--bd); border-radius:8px;">
      <div style="flex:2; min-width:140px;">
        <select class="m-name" onchange="matRowChange(this, ${idx})" style="padding:6px 8px; font-size:13px;">
          <option value="">-- เลือกวัสดุ --</option>
          ${matOpts}
          <option value="อื่นๆ" ${isOther ? 'selected' : ''}>อื่นๆ (ระบุเอง)</option>
        </select>
        <input class="m-custom" id="mcustom_${idx}" value="${esc(isOther ? name : '')}" placeholder="ระบุชื่อวัสดุ..." style="display:${isOther ? 'block' : 'none'}; margin-top:4px; padding:4px 8px; font-size:13px;">
      </div>
      <div style="flex:1; min-width:70px;">
        <input class="m-qty" type="number" min="0.01" step="any" value="${qty}" placeholder="จำนวน" style="padding:6px 8px; font-size:13px;">
      </div>
      <div style="flex:1; min-width:70px;">
        <input class="m-unit" value="${esc(unit)}" placeholder="หน่วย (เช่น ชิ้น, ม้วน)" style="padding:6px 8px; font-size:13px;">
      </div>
      <div style="width:36px; text-align:center;">
        <button type="button" class="d" style="padding:5px 8px; font-size:13px; border-radius:6px;" onclick="removeMatRow(${idx})" title="ลบแถวนี้">✕</button>
      </div>
    </div>
  `;
  const container = document.getElementById('mat_rows_container');
  if (container) {
    container.insertAdjacentHTML('beforeend', html);
  }
};

window.removeMatRow = function (idx) {
  const container = document.getElementById('mat_rows_container');
  if (container && container.querySelectorAll('.mat-row').length <= 1) {
    return toast('ต้องมีรายการเบิกอย่างน้อย 1 แถว');
  }
  const row = document.getElementById('mrow_' + idx);
  if (row) row.remove();
};

window.setMatRowCount = function (totalCount) {
  const container = document.getElementById('mat_rows_container');
  if (!container) return;
  const currentCount = container.querySelectorAll('.mat-row').length;
  if (totalCount > currentCount) {
    for (let i = 0; i < (totalCount - currentCount); i++) {
      addMatRow();
    }
  }
};

window.openMat = function (id) {
  const t = T.find(x => x.id === id) || {};
  const us = U.filter(u => u.ticket_id === id);
  mRowCounter = 0;

  $('#dlg').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <b style="font-size:16px; color:var(--pri);">📦 เบิกวัสดุอุปกรณ์: ${esc(id)}</b>
      <span style="font-size:12px; background:var(--chip); padding:2px 8px; border-radius:4px; font-weight:bold;">
        ${t.cat === 'ติดตั้ง/ต่อเติม' ? '🛠️ งานติดตั้ง' : '🔧 งานซ่อม'}
      </span>
    </div>
    
    <div class="mut" style="font-size:13px; margin-bottom:12px;">
      📍 อาคาร ${esc(t.bld || '-')} ชั้น ${esc(t.flr || '-')} ห้อง ${esc(t.room || '-')}
      ${t.items?.length ? `· รายการ: ${esc(t.items.map(i => i.item).join(', '))}` : ''}
    </div>

    <!-- ฟอร์มเบิกวัสดุ (เพิ่มได้หลายรายการ) -->
    <div style="border:1px solid var(--bd); padding:12px; border-radius:8px; margin-bottom:12px; background:var(--bg);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:4px;">
        <label style="margin:0; font-weight:bold; color:var(--tx);">เลือกรายการวัสดุที่ต้องการเบิก</label>
        <div style="display:flex; align-items:center; gap:4px;">
          <span class="mut" style="font-size:12px;">กำหนดแถว:</span>
          <button type="button" style="padding:2px 6px; font-size:11px;" onclick="addMatRow()">+1</button>
          <button type="button" style="padding:2px 6px; font-size:11px;" onclick="setMatRowCount(3)">3 แถว</button>
          <button type="button" style="padding:2px 6px; font-size:11px;" onclick="setMatRowCount(5)">5 แถว</button>
        </div>
      </div>

      <div id="mat_rows_container"></div>

      <div style="display:flex; gap:8px; margin-top:8px;">
        <button type="button" style="font-size:12px; padding:6px 12px;" onclick="addMatRow()">+ เพิ่มรายการวัสดุ</button>
        <button type="button" class="p" style="flex:1; padding:6px 14px; font-weight:bold;" onclick="saveMat('${id}')">💾 บันทึกการเบิกวัสดุ</button>
      </div>
    </div>

    <!-- ประวัติการเบิก -->
    <div style="margin-bottom:14px; max-height:160px; overflow-y:auto; border-bottom:1px solid var(--bd); padding-bottom:8px;">
      <b class="mut" style="font-size:13px;">📋 ประวัติการเบิกของงานนี้ (${us.length} รายการ):</b>
      ${us.length ? `<div style="margin-top:4px; font-size:13px;">${us.map(u => `• ${esc(u.name)}: <b style="color:var(--pri)">${u.qty}</b> ${esc(u.unit)} <span class="mut" style="font-size:11px">(${esc(u.tech_name || '')})</span>`).join('<br>')}</div>` : '<div class="mut" style="font-size:12px; padding:4px 0;">ยังไม่มีการเบิกวัสดุในงานนี้</div>'}
    </div>

    <div style="text-align:right;">
      <button onclick="document.querySelector('#dlg').close()" style="background:transparent; border-color:var(--mut); color:var(--mut); padding:6px 14px;">ปิดหน้าต่าง</button>
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
    if (name === 'อื่นๆ') {
      name = (r.querySelector('.m-custom').value || '').trim();
    }
    const qty = parseFloat(r.querySelector('.m-qty').value);
    const unit = (r.querySelector('.m-unit').value || '').trim();

    if (name && qty > 0) {
      itemsToSave.push({
        ticket_id: id,
        name: name,
        qty: qty,
        unit: unit || 'ชิ้น',
        tech_name: me.name,
        created_at: new Date().toISOString()
      });
    }
  });

  if (!itemsToSave.length) {
    return toast('กรุณาเลือกวัสดุและระบุจำนวนที่ถูกต้องอย่างน้อย 1 รายการ');
  }

  toast('กำลังบันทึกการเบิก ' + itemsToSave.length + ' รายการ...');
  try {
    const payload = itemsToSave.map(({ created_at, ...rest }) => rest);
    const { error } = await sb.from('usage').insert(payload);
    if (error) throw error;

    itemsToSave.forEach(it => U.unshift(it));
    toast(`บันทึกการเบิกวัสดุ ${itemsToSave.length} รายการสำเร็จ!`);
    openMat(id);
  } catch (err) {
    if (CONFIG.DEV) {
      itemsToSave.forEach(it => U.unshift(it));
      toast(`(โหมดทดสอบ) บันทึกการเบิกวัสดุ ${itemsToSave.length} รายการสำเร็จ!`);
      openMat(id);
      return;
    }
    toast('บันทึกไม่สำเร็จ: ' + (err.message || err));
  }
};

window.openAct = function (id) {
  const t = T.find(x => x.id === id) || {};
  const isInstall = t.cat === 'ติดตั้ง/ต่อเติม';
  const doneType = isInstall ? 'ติดตั้ง/ต่อเติม' : 'ซ่อมแซม';
  const finishLabel = isInstall ? '🛠️ ติดตั้งเสร็จสิ้น' : '🔧 ซ่อมเสร็จสิ้น';
  const finishBg = isInstall ? '#2980b9' : 'var(--ok)';

  $('#dlg').innerHTML = `<div style="font-size:16px; font-weight:bold; color:var(--pri); margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
    <span>📝 อัปเดตสถานะงาน: ${esc(id)}</span>
    <span style="font-size:12px; background:var(--chip); padding:2px 8px; border-radius:4px; font-weight:normal; color:var(--tx);">ประเภท: ${esc(t.cat || 'ซ่อมแซม')}</span>
  </div>
<div style="border:1px solid var(--bd); padding:12px; border-radius:8px; margin-bottom:10px; background:var(--bg);">
  <label style="margin-top:0">หมายเหตุ / ปัญหาที่พบ</label>
  <textarea id="d_n" rows="2" placeholder="ระบุสาเหตุที่ทำต่อไม่ได้ หรือรายละเอียดงาน...">${esc(t.note)}</textarea>
  <label class="i" style="color:var(--bad); margin-top:8px;"><input type="checkbox" id="d_k" ${t.blocked ? 'checked' : ''}>ติดปัญหา ดำเนินการต่อไม่ได้</label>
</div>
<div style="border:1px solid var(--bd); padding:12px; border-radius:8px; margin-bottom:10px; background:var(--bg);">
  <label style="margin-top:0">สรุปผลงานและงบประมาณ</label>
  <div class="row sp" style="gap:10px;">
    <div style="flex:1"><input id="d_b" type="number" min="0" value="${t.budget ?? ''}" placeholder="งบประมาณ (บาท)"></div>
    <div><label class="i" style="color:var(--bad)"><input type="checkbox" id="d_c" ${t.cannot ? 'checked' : ''}>ไม่สามารถดำเนินการได้</label></div>
  </div>
</div>
<label>แนบรูปผลงาน/หลังซ่อมหรือติดตั้ง (ไม่เกิน 4 รูป)</label><input type="file" id="d_f" accept="image/*" multiple>
<div class="row sp" style="margin-top:16px; border-top:1px solid var(--bd); padding-top:12px; gap:6px;">
  <button onclick="document.querySelector('#dlg').close()" style="background:transparent; border-color:var(--mut); color:var(--mut)">ปิด</button>
  <div class="row" style="gap:6px">
    <button onclick="saveAct('${id}','')" style="border-color:var(--pri); color:var(--pri); background:transparent;">บันทึกข้อมูล</button>
    <button onclick="saveAct('${id}','done','${doneType}')" class="p" style="background:${finishBg}; border-color:${finishBg}; font-weight:bold;">${finishLabel}</button>
  </div>
</div>`;
  $('#dlg').showModal();
}

window.saveAct = async function (id, s, doneType) {
  const t = T.find(x => x.id === id);
  const p = {
    note: $('#d_n').value.trim(),
    blocked: $('#d_k').checked,
    budget: $('#d_b').value === '' ? null : +$('#d_b').value,
    cannot: $('#d_c').checked
  };
  if (doneType) p.done_type = doneType;
  try {
    const fl = [...$('#d_f').files];
    if (fl.length) {
      toast('กำลังอัปโหลดรูป...');
      p.done_photos = [...(t.done_photos || []), ...await up(fl, 'd/' + id)];
    }
    if (s && (s !== t.status || doneType)) {
      p.status = s;
      p.history = logh(t, s);
      if (s === 'done') {
        p.blocked = false;
        p.done_at = new Date().toISOString();
      }
    }
    let r = await sb.from('tickets').update(p).eq('id', id);
    if (r.error) throw r.error;
    if (t) Object.assign(t, p);
    $('#dlg').close();
    go();
    toast('บันทึกสำเร็จ');
  } catch (x) {
    if (CONFIG.DEV) {
      if (t) Object.assign(t, p);
      $('#dlg').close();
      go();
      toast('(โหมดทดสอบ) บันทึกสำเร็จ');
      return;
    }
    toast('บันทึกไม่สำเร็จ: ' + (x.message || x));
  }
};