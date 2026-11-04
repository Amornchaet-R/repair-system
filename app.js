const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = t => t ? new Date(t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '';
const toast = m => { const t = $('#toast'); if (!t) return; t.textContent = m; t.style.display = 'block'; clearTimeout(window._t); window._t = setTimeout(() => t.style.display = 'none', 4000) };

window.sb = sb;
window.$ = $;
window.esc = esc;
window.fmt = fmt;
window.toast = toast;

window.logh = (t, s, tag) => {
  const item = { s, at: Date.now() };
  if (tag) item.tag = tag;
  return [...(t?.history || []), item];
};
var logh = window.logh;

window.isUUID = s => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
var isUUID = window.isUUID;

const ST = { 
  accepted: ['รับเรื่อง', 'var(--primary)'], 
  doing: ['กำลังดำเนินการ', 'var(--warning)'], 
  done: ['เสร็จสิ้น', 'var(--success)'], 
  deleted: ['ยกเลิก/ลบ', 'var(--danger)'] 
};
window.ST = ST;

const REP = ['ระบบปรับอากาศ', 'เครื่องจักร', 'ระบบไฟฟ้ากำลัง', 'ระบบแสงสว่าง', 'ระบบประปา', 'ระบบ Internet', 'ระบบน้ำบริสุทธิ์ (DI)', 'ฝ้าเพดาน', 'ประตู', 'หน้าต่าง', 'ห้องน้ำ', 'พื้น', 'อื่น ๆ'];
const INS = ['ติดตั้งเครื่องจักร', 'ติดตั้งระบบไฟฟ้ากำลัง', 'ติดตั้งระบบแสงสว่าง', 'ติดตั้งระบบประปา', 'ติดตั้งระบบ Internet', 'ต่อเติมอาคาร', 'อื่น ๆ'];
const MATS = ['หลอดไฟ LED', 'บัลลาสต์/สตาร์ทเตอร์', 'สายไฟ', 'เบรกเกอร์', 'ก๊อกน้ำ', 'ท่อ PVC', 'น้ำยาแอร์', 'เทปพันสายไฟ', 'อื่นๆ'];
window.REP = REP;
window.INS = INS;
window.MATS = MATS;

var me = null, uid = null, tab = 'login', T = [], U = [], techs = [], fil = 'accepted', fT = '', found = undefined, lastNo = '', armed = '', lastTrackEmail = '';
var statM = new Date().toISOString().slice(0, 7); 
var hFil = 'all';
var adminView = 'admin'; // 'admin' | 'tech' | 'reporter'

window.me = me;
window.tab = tab;
window.T = T;
window.U = U;
window.techs = techs;
window.adminView = adminView;

const DEV = !!CONFIG.DEV;

window.toggleSidebar = function(force) {
  const sbEl = $('#sidebar');
  const bdEl = $('#sidebar-backdrop');
  if (typeof force === 'boolean') {
    if (sbEl) sbEl.classList.toggle('open', force);
    if (bdEl) bdEl.classList.toggle('open', force);
  } else {
    if (sbEl) sbEl.classList.toggle('open');
    if (bdEl) bdEl.classList.toggle('open');
  }
};

window.setAdminView = function(view) {
  adminView = view;
  if (view === 'admin') tab = 'dashboard';
  else if (view === 'tech') tab = 'pool';
  else if (view === 'reporter') tab = 'home';
  found = undefined;
  if (tab === 'history') loadHistoryData();
  render();
};

window.setHFil = function(f) { hFil = f; render(); };
window.setStatM = function(m) { statM = m; render(); };
window.setFil = function(f) { fil = f; render(); };
window.setFT = function(f) { fT = f; render(); };

window.copyNo = function(no, e) {
  if (e) e.stopPropagation();
  navigator.clipboard.writeText(no);
  toast('คัดลอก ' + no + ' แล้ว!');
};

window.loadHistoryData = async function() {
  const myT = JSON.parse(localStorage.getItem('myT') || '[]');
  if (!myT.length) return;
  const promises = myT.map(t => sb.rpc('track_ticket', { p_id: t.no, p_email: t.email }).then(r => r?.data || null, () => null));
  const results = await Promise.all(promises);
  let updated = false;
  results.forEach((data, i) => {
    if (data && myT[i].status !== data.status) {
      myT[i].status = data.status; 
      updated = true;
    }
  });
  if (updated) {
    localStorage.setItem('myT', JSON.stringify(myT));
    if (tab === 'history') render();
  }
};

async function load(s) {
  if (!s?.user) {
    const saved = sessionStorage.getItem('repair_me');
    if (saved) {
      try {
        me = JSON.parse(saved);
        tab = me.role === 'admin' ? 'dashboard' : me.role === 'tech' ? 'pool' : 'home';
        await go();
        return;
      } catch(e) {}
    }
    me = null; uid = null; tab = 'login'; render();
    return;
  }
  uid = s.user.id;
  const metaRole = s.user.user_metadata?.role;
  const metaName = s.user.user_metadata?.name;

  const { data } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();

  if (data) {
    me = data;
    // ถ้า role ใน DB เป็น null/none ให้ดึงจาก user_metadata มาเติมและอัปเดตกลับเข้า DB
    const finalRole = me.role || metaRole || 'reporter';
    const finalName = me.name || metaName || (s.user.email || 'ผู้ใช้งาน').split('@')[0];
    me.role = finalRole;
    me.name = finalName;
    try {
      await sb.from('profiles').upsert({ id: uid, name: finalName, role: finalRole }, { onConflict: 'id' });
    } catch(err) {}
  } else {
    const role = metaRole || (typeof loginRole !== 'undefined' && loginRole ? loginRole : 'reporter');
    me = {
      id: uid,
      name: metaName || (s.user.email || 'ผู้ใช้งาน').split('@')[0],
      role: role
    };
    try {
      await sb.from('profiles').upsert({ id: uid, name: me.name, role: me.role }, { onConflict: 'id' });
    } catch(err) {}
  }
  sessionStorage.setItem('repair_me', JSON.stringify(me));
  tab = me.role === 'admin' ? 'dashboard' : me.role === 'tech' ? 'pool' : 'home';
  await go();
}

function initApp() {
  const saved = sessionStorage.getItem('repair_me');
  if (saved) {
    try {
      me = JSON.parse(saved);
      if (me && me.role) {
        tab = me.role === 'admin' ? 'dashboard' : me.role === 'tech' ? 'pool' : 'home';
        go();
        return;
      }
    } catch (e) {
      sessionStorage.removeItem('repair_me');
    }
  }

  me = null;
  tab = 'login';
  render();

  if (!DEV) {
    sb.auth.getSession().then(({ data }) => { if (data?.session) load(data.session); });
    sb.auth.onAuthStateChange((_, s) => { if (s) load(s); });
  }
}

// ป้องกัน Login ไม่แสดง: ให้ render ทันทีหาก DOM พร้อมแล้ว
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initApp, 0));
} else {
  setTimeout(initApp, 0);
}

setInterval(() => {
  if (me && (me.role === 'admin' || me.role === 'tech') && !$('#dlg')?.open && !document.activeElement?.closest('form')) {
    go();
  }
}, 30000);

async function go() {
  try {
    if (me && (me.role === 'admin' || me.role === 'tech')) {
      const ticketsRes = await sb.from('tickets').select('*').order('created_at', { ascending: false }).limit(200);
      if (ticketsRes.error) {
        console.warn('tickets fetch warning:', ticketsRes.error);
      }
      T = ticketsRes.data || [];
      const usageRes = await sb.from('usage').select('*').order('created_at', { ascending: false }).limit(200);
      U = usageRes.data || [];
      if (me.role === 'admin') {
        const techsRes = await sb.from('profiles').select('id,name').eq('role', 'tech');
        techs = techsRes.data || [];
      }
    }
  } catch (err) {
    console.error('go() error:', err);
  }
  render();
}

window.login = async function (e) {
  e.preventDefault();
  const f = new FormData(e.target);
  toast('กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...');
  const { data, error } = await sb.auth.signInWithPassword({ email: f.get('email'), password: f.get('pw') });
  if (error) return toast('เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
  load(data.session);
};

window.register = async function (e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = (f.get('name') || '').trim();
  const email = (f.get('email') || '').trim();
  // อ่านบทบาทจากฟอร์ม หรือตัวแปร regRole โดยตรง
  let role = (f.get('role') || regRole || 'reporter').trim();
  if (role !== 'tech') role = 'reporter';

  const pw = f.get('pw');
  const pw2 = f.get('pw2');

  if (pw !== pw2) {
    return toast('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
  }

  toast(`กำลังลงทะเบียนในบทบาท: ${role === 'tech' ? 'ช่างซ่อมบำรุง' : 'ผู้แจ้งซ่อม'}...`);
  const { data, error } = await sb.auth.signUp({
    email,
    password: pw,
    options: {
      data: { name, role }
    }
  });

  if (error) {
    if (DEV) {
      toast(`ลงทะเบียนสำเร็จ (โหมด DEV: ${role === 'tech' ? 'ช่าง' : 'ผู้แจ้ง'})!`);
      if (typeof setAuthMode === 'function') setAuthMode('login');
      return;
    }
    return toast('ลงทะเบียนไม่สำเร็จ: ' + error.message);
  }

  // บันทึก/อัปเดตลงตาราง public.profiles ทันที
  if (data?.user?.id) {
    try {
      const { error: upsertErr } = await sb.from('profiles').upsert({
        id: data.user.id,
        name: name,
        role: role
      }, { onConflict: 'id' });
      if (upsertErr) {
        console.warn('Upsert profile error:', upsertErr);
      }
    } catch (err) {
      console.warn('Profiles table insert failed:', err);
    }
  }

  toast(`ลงทะเบียนสำเร็จเป็น "${role === 'tech' ? 'ช่างซ่อมบำรุง' : 'ผู้แจ้งซ่อม'}" เรียบร้อยแล้ว! กรุณาเข้าสู่ระบบ`);
  if (typeof setAuthMode === 'function') setAuthMode('login');
};

// ล็อคการทำงานและการเข้าถึงแท็บตาม Role
window.setTab = function (k) {
  if (!me) {
    tab = 'login';
    render();
    return;
  }

  const roleTabs = {
    reporter: ['home', 'report', 'track', 'history', 'profile'],
    tech: ['pool', 'task_detail', 'mine', 'tech_done', 'profile'],
    admin: ['dashboard', 'all', 'techs_manage', 'stock', 'home', 'report', 'track', 'history', 'pool', 'task_detail', 'mine', 'tech_done', 'profile']
  };

  const allowed = roleTabs[me.role] || ['home'];
  if (!allowed.includes(k)) {
    tab = allowed[0];
  } else {
    tab = k;
    if (me.role === 'admin') {
      if (['pool', 'task_detail', 'mine', 'tech_done'].includes(k)) adminView = 'tech';
      else if (['home', 'report', 'track', 'history'].includes(k)) adminView = 'reporter';
      else if (['dashboard', 'all', 'techs_manage', 'stock'].includes(k)) adminView = 'admin';
    }
  }

  const sbEl = $('#sidebar');
  if (sbEl) sbEl.classList.remove('open');
  const bdEl = $('#sidebar-backdrop');
  if (bdEl) bdEl.classList.remove('open');

  found = undefined;
  if (tab === 'history') loadHistoryData();
  render();
};

window.signOut = function () {
  if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
    sessionStorage.removeItem('repair_me');
    if (!DEV) sb.auth.signOut();
    me = null;
    uid = null;
    tab = 'login';
    adminView = 'admin';
    if (typeof setAuthMode === 'function') setAuthMode('login');
    else render();
    toast('ออกจากระบบเรียบร้อยแล้ว');
  }
};

function render() {
  const layout = $('#app-layout');
  const sidebarMenu = $('#sidebar-menu');
  const topbarTitle = $('#page-title');
  const topbarRight = $('#topbar-right');
  const appContainer = $('#app');
  const bottomNav = $('#mobile-bottom-nav');

  const titles = {
    login: 'เข้าสู่ระบบ NUSP',
    home: 'หน้าหลัก',
    report: 'แจ้งซ่อมใหม่',
    track: 'ติดตามสถานะงานแจ้งซ่อม',
    history: 'ประวัติการแจ้งซ่อม',
    profile: 'ข้อมูลส่วนตัว',
    pool: 'งานที่รับได้',
    task_detail: 'รายละเอียดงาน',
    mine: 'งานของฉัน',
    tech_done: 'ประวัติการซ่อม',
    dashboard: 'Dashboard ภาพรวม',
    all: 'จัดการงานซ่อมทั้งหมด',
    techs_manage: 'จัดการช่างและมอบหมายงาน',
    stock: 'วัสดุและอุปกรณ์ที่เบิก'
  };

  if (!me || tab === 'login') {
    if (layout) layout.classList.add('login-mode');
    if (topbarTitle) topbarTitle.textContent = 'ระบบแจ้งซ่อม NUSP';
    if (topbarRight) {
      topbarRight.innerHTML = `
        <span style="font-size:13px; color:var(--text-muted); font-weight:600;">อุทยานวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</span>
        ${DEV ? '<span class="badge" style="background:var(--primary-light); color:var(--primary); font-weight:bold; margin-left:6px;">🛠️ DEV Mode</span>' : ''}
      `;
    }
    if (sidebarMenu) sidebarMenu.innerHTML = '';
    if (bottomNav) bottomNav.style.display = 'none';
    if (appContainer) appContainer.innerHTML = vLogin();
    return;
  }

  // Logged-in Mode
  if (layout) layout.classList.remove('login-mode');
  if (topbarTitle) topbarTitle.textContent = titles[tab] || 'ระบบแจ้งซ่อม NUSP';

  // ปิด sidebar และ backdrop ทุกครั้งที่ render เพื่อป้องกันการค้างบังหน้าจอ
  const sbEl = $('#sidebar');
  if (sbEl) sbEl.classList.remove('open');
  const bdEl = $('#sidebar-backdrop');
  if (bdEl) bdEl.classList.remove('open');

  let currentRoleView = me.role;
  if (me.role === 'admin') {
    currentRoleView = adminView;
  }

  const menuGroups = {
    reporter: [
      ['home', '🏠', 'หน้าหลัก'],
      ['report', '📝', 'แจ้งซ่อมใหม่'],
      ['track', '🔍', 'ติดตามสถานะ'],
      ['history', '🕒', 'ประวัติการแจ้งซ่อม'],
      ['profile', '👤', 'ข้อมูลส่วนตัว']
    ],
    tech: [
      ['pool', '🧰', 'งานที่รับได้'],
      ['mine', '🛠️', 'งานของฉัน'],
      ['tech_done', '✅', 'งานที่ทำเสร็จ'],
      ['profile', '👤', 'ข้อมูลส่วนตัว']
    ],
    admin: [
      ['dashboard', '📊', 'Dashboard'],
      ['all', '📋', 'จัดการงานซ่อม'],
      ['techs_manage', '👥', 'จัดการช่าง'],
      ['stock', '📦', 'วัสดุที่เบิก'],
      ['profile', '👤', 'ข้อมูลส่วนตัว']
    ]
  };

  const navItems = menuGroups[currentRoleView] || menuGroups.reporter;

  if (sidebarMenu) {
    sidebarMenu.innerHTML = navItems.map(([k, icon, name]) => `
      <button class="menu-link ${tab === k ? 'active' : ''}" onclick="setTab('${k}')">
        <span class="menu-icon">${icon}</span>
        <span>${name}</span>
      </button>
    `).join('');
  }

  // Render Mobile Bottom Navigation Bar (Very convenient for elderly & mobile screens)
  if (bottomNav) {
    bottomNav.innerHTML = navItems.map(([k, icon, name]) => `
      <button class="bottom-nav-item ${tab === k ? 'active' : ''}" onclick="setTab('${k}')">
        <span class="bottom-nav-icon">${icon}</span>
        <span class="bottom-nav-label">${name}</span>
      </button>
    `).join('');
    // แสดง bottom nav เฉพาะบนมือถือ (ให้ CSS media query จัดการ ไม่ force inline style)
    bottomNav.style.display = '';
  }

  const roleBadges = {
    reporter: { icon: '👤', label: 'ผู้แจ้งซ่อม', avatar: '👨‍💼', color: 'var(--primary)' },
    tech: { icon: '🛠️', label: 'ช่างซ่อมบำรุง', avatar: '👷', color: '#e67e22' },
    admin: { icon: '👑', label: 'ผู้ดูแลระบบ', avatar: '👑', color: 'var(--danger)' }
  };
  const b = roleBadges[me.role] || { icon: '👤', label: 'ผู้ใช้', avatar: '👤', color: 'var(--primary)' };

  let topbarHtml = '';

  if (me.role === 'admin') {
    topbarHtml += `
      <div class="admin-view-switcher" style="display:flex; align-items:center; gap:4px; background:var(--bg-subtle); padding:4px 8px; border-radius:var(--radius-md); border:1px solid var(--border);">
        <span style="font-size:12.5px; font-weight:700; color:var(--text-muted); margin-right:2px;">🧪 สลับมุมมอง:</span>
        <button type="button" class="btn btn-sm ${adminView === 'admin' ? 'btn-primary' : 'btn-outline'}" style="padding:4px 10px; font-size:12px;" onclick="setAdminView('admin')">👑 แอดมิน</button>
        <button type="button" class="btn btn-sm ${adminView === 'tech' ? 'btn-primary' : 'btn-outline'}" style="padding:4px 10px; font-size:12px;" onclick="setAdminView('tech')">🛠️ ช่าง</button>
        <button type="button" class="btn btn-sm ${adminView === 'reporter' ? 'btn-primary' : 'btn-outline'}" style="padding:4px 10px; font-size:12px;" onclick="setAdminView('reporter')">👤 ผู้แจ้ง</button>
      </div>
    `;
  }

  topbarHtml += `
    <div class="user-profile-badge" onclick="setTab('profile')" title="ดูข้อมูลส่วนตัว">
      <div class="user-avatar" style="background:var(--primary); font-size:16px;">${b.avatar}</div>
      <div style="display:flex; flex-direction:column; line-height:1.2;">
        <span class="user-name-text" style="font-size:14.5px; font-weight:700;">${esc(me.name || 'ผู้ใช้งาน')}</span>
        <span style="font-size:12px; color:${b.color}; font-weight:700;">${b.label}</span>
      </div>
    </div>
  `;

  if (topbarRight) {
    topbarRight.innerHTML = topbarHtml;
  }

  const views = {
    login: vLogin,
    home: vHome,
    report: vReport,
    track: vTrack,
    history: vHistory,
    profile: vProfile,
    pool: vPool,
    task_detail: vTaskDetail,
    mine: vMine,
    tech_done: vTechDone,
    dashboard: vDashboard,
    all: vAll,
    techs_manage: vTechsManage,
    stock: vStock
  };

  const viewFn = views[tab] || views.home;
  if (appContainer) {
    appContainer.innerHTML = viewFn();
  }
}

const url = p => sb.storage.from('photos').getPublicUrl(p).data.publicUrl;
const ph = (a, l) => a?.length ? `
  <div class="mut" style="margin-top:8px; font-size:12px; font-weight:600;">${l}</div>
  <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px;">
    ${a.map(p => `<img src="${url(p)}" loading="lazy" onclick="zoom('${p}')" style="width:70px; height:70px; object-fit:cover; border-radius:6px; cursor:zoom-in; border:1px solid var(--border);">`).join('')}
  </div>
` : '';

window.zoom = function (p) {
  const dlg = $('#dlg');
  if (!dlg) return;
  dlg.innerHTML = `
    <div style="text-align:center;">
      <img src="${url(p)}" style="max-width:100%; max-height:75vh; border-radius:8px; object-fit:contain;">
      <div style="margin-top:14px;">
        <button class="btn btn-outline" onclick="document.querySelector('#dlg').close()">ปิดหน้าต่าง</button>
      </div>
    </div>
  `;
  dlg.showModal();
};

const card = (t, x = '') => {
  let badgeClass = 'badge-pending';
  let stName = ST[t.status] ? ST[t.status][0] : 'ไม่ระบุ';
  let stColor = ST[t.status] ? ST[t.status][1] : 'var(--text-muted)';
  
  if (t.status === 'accepted') {
    badgeClass = 'badge-pending';
  } else if (t.status === 'doing') {
    const lastHist = (t.history && t.history.length) ? t.history[t.history.length - 1] : null;
    const progTag = lastHist?.tag || (t.note?.match(/^\[(.*?)\]/)?.[1]) || '';

    if (progTag.includes('ตรวจสอบ')) {
      badgeClass = 'badge-inspecting';
      stName = '🔍 ' + progTag;
    } else if (progTag.includes('รออุปกรณ์') || progTag.includes('อะไหล่')) {
      badgeClass = 'badge-waiting-parts';
      stName = '⏳ ' + progTag;
    } else if (progTag.includes('ติดปัญหา') || progTag.includes('ประสานงาน')) {
      badgeClass = 'badge-issue';
      stName = '⚠️ ' + progTag;
    } else if (progTag.includes('ติดตั้ง')) {
      badgeClass = 'badge-install';
      stName = '🛠️ ' + progTag;
    } else {
      badgeClass = 'badge-doing';
      stName = 'กำลังดำเนินการ';
    }
  } else if (t.status === 'done') {
    const isInstall = t.done_type === 'ติดตั้ง/ต่อเติม' || (!t.done_type && t.cat === 'ติดตั้ง/ต่อเติม');
    stName = isInstall ? '🛠️ ติดตั้งเสร็จสิ้น' : '🔧 ซ่อมเสร็จสิ้น';
    badgeClass = 'badge-done';
  } else if (t.status === 'deleted') {
    badgeClass = 'badge-urgent';
  }

  return `
    <div class="content-card" style="margin-bottom:18px;">
      <div class="card-header-row" style="margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <b style="font-size:18px; color:var(--text-main); font-weight:800;">${esc(t.id)}</b>
          <button type="button" class="btn btn-outline btn-sm" onclick="copyNo('${t.id}', event)" title="คัดลอกเลขใบงาน" style="padding:6px 12px; font-size:14px; font-weight:700;">📋 คัดลอก</button>
        </div>
        <span class="badge ${badgeClass}" style="font-size:14.5px; padding:6px 14px;"><span class="badge-dot"></span> ${stName}</span>
      </div>

      <div style="font-size:16.5px; margin-bottom:8px; font-weight:700; color:var(--text-main);">
        อาคาร ${esc(t.bld || '-')} ชั้น ${esc(t.flr || '-')} ห้อง/บริเวณ ${esc(t.room || '-')}
        ${t.urgent ? ' <span class="badge badge-urgent" style="font-size:13px;">ด่วน</span>' : ''}
      </div>

      <div class="mut" style="font-size:15px; margin-bottom:6px; font-weight:600; color:var(--primary);">
        หมวดหมู่: ${esc((t.types || []).join(', ') || t.cat || '')}
      </div>

      <div style="font-size:15.5px; color:var(--text-main); margin-bottom:8px; line-height:1.5;">
        ${(t.items || []).map(i => `<b>${esc(i.item)}</b>${i.sym ? ' – ' + esc(i.sym) : ''}${i.asset ? ' [รหัสครุภัณฑ์: ' + esc(i.asset) + ']' : ''}`).join(' | ')}
      </div>

      <div class="mut" style="font-size:14.5px; margin-bottom:6px;">
        ${t.name ? `แจ้งโดย: <b>${esc(t.name)}</b> ${esc(t.tel || '')} ${t.ext ? 'ภายใน ' + esc(t.ext) : ''} · ` : ''}
        วันที่แจ้ง: ${fmt(t.created_at)}
      </div>

      <div class="mut" style="font-size:14.5px; margin-bottom:6px;">
        ช่างผู้รับผิดชอบ: <b style="color:var(--text-main);">${t.tech_name ? esc(t.tech_name) : 'ช่างส่วนกลาง (รอรับงาน)'}</b>
      </div>

      ${t.note ? `
        <div style="font-size:15px; padding:10px 14px; border-radius:8px; margin:10px 0; background:${t.blocked ? 'var(--danger-bg)' : 'var(--bg-subtle)'}; color:${t.blocked ? 'var(--danger)' : 'var(--text-main)'}; font-weight:${t.blocked ? '700' : '500'}; line-height:1.5;">
          ${t.blocked ? '⚠️ ติดปัญหา: ' : '📝 หมายเหตุ: '}${esc(t.note)}
        </div>
      ` : ''}

      ${ph(t.photos, 'รูปประกอบการแจ้ง')}
      ${ph(t.done_photos, 'รูปหลังดำเนินการ')}

      ${t.status === 'deleted' ? `
        <div style="font-size:14px; color:var(--danger); margin-top:8px;">
          ยกเลิก/ลบโดย ${t.deleted_by ? ' (' + esc(t.deleted_by) + ')' : ''} · ${fmt(t.deleted_at)}
        </div>
      ` : ''}

      ${t.status === 'done' ? `
        <div class="mut" style="font-size:14px; margin-top:10px; border-top:1px dashed var(--border); padding-top:8px;">
          ${t.cannot ? '<b style="color:var(--danger)">ไม่สามารถดำเนินการได้</b> · ' : ''}
          ${t.budget ? 'งบประมาณ ' + t.budget + ' บาท · ' : ''}
          ${t.done_type ? `[${t.done_type === 'ติดตั้ง/ต่อเติม' ? 'ติดตั้งเสร็จ' : 'ซ่อมเสร็จ'}] ` : ''}
          เสร็จสิ้นเมื่อ ${fmt(t.done_at)}
        </div>
      ` : ''}

      ${x}
    </div>
  `;
};

function steps(t) {
  if (t.status === 'deleted') return '';
  const o = ['accepted', 'doing', 'done'], i = o.indexOf(t.status), h = {};
  (t.history || []).forEach(x => h[x.s] = x.at);
  const doneLabel = (t.done_type === 'ติดตั้ง/ต่อเติม' || (!t.done_type && t.cat === 'ติดตั้ง/ต่อเติม')) ? 'ติดตั้งเสร็จสิ้น' : 'ซ่อมเสร็จสิ้น';
  
  const lastHist = (t.history && t.history.length) ? t.history[t.history.length - 1] : null;
  const progTag = lastHist?.tag || (t.note?.match(/^\[(.*?)\]/)?.[1]) || '';

  return `
    <div class="steps-wizard" style="margin: 20px 0 10px;">
      ${o.map((s, j) => {
        let label = s === 'done' ? doneLabel : (ST[s] ? ST[s][0] : s);
        if (s === 'doing' && t.status === 'doing' && progTag) {
          label += `<br><span style="font-size:13px; font-weight:700; color:var(--primary);">(${esc(progTag)})</span>`;
        }
        return `
          <div class="step-item ${j <= i ? 'active' : ''}">
            <div class="step-circle" style="width:34px; height:34px; font-size:15px;">${j <= i ? '✓' : j + 1}</div>
            <div class="step-label" style="font-size:14px;">
              ${label}
              ${h[s] ? `<br><small style="font-size:12px; color:var(--text-light); font-weight:normal;">${fmt(h[s])}</small>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

const shrink = f => new Promise((res, rej) => {
  const im = new Image(), u = URL.createObjectURL(f);
  im.onload = () => {
    const s = Math.min(1, 1400 / Math.max(im.width, im.height));
    const c = document.createElement('canvas');
    c.width = im.width * s;
    c.height = im.height * s;
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    URL.revokeObjectURL(u);
    c.toBlob(b => b ? res(b) : rej(new Error('แปลงรูปไม่สำเร็จ')), 'image/jpeg', 0.8);
  };
  im.onerror = () => {
    URL.revokeObjectURL(u);
    rej(new Error('เปิดรูปไม่ได้'));
  };
  im.src = u;
});

const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9));

async function up(files, dir) {
  const out = [];
  for (const f of [...files].slice(0, 4)) {
    const p = `${dir}/${uuid()}.jpg`;
    const { error } = await sb.storage.from('photos').upload(p, await shrink(f), { contentType: 'image/jpeg' });
    if (error) throw error;
    out.push(p);
  }
  return out;
}

window.card = card;
window.steps = steps;
window.url = url;
window.ph = ph;
window.shrink = shrink;
window.up = up;
window.render = render;
window.go = go;
