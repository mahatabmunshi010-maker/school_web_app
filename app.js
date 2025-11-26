async function sha256(text){
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Initialize admin if not set (call once)
async function ensureAdmin(){
  const cfg = JSON.parse(localStorage.getItem('app_auth')||'{}');
  if(!cfg.adminHash){
    const defaultPass = 'admin1234'; // change recommended!
    const h = await sha256(defaultPass);
    cfg.adminHash = h;
    cfg.adminUser = 'admin';
    localStorage.setItem('app_auth', JSON.stringify(cfg));
    console.log('Default admin created: user=admin pass=admin1234 — change in settings');
  }
}
ensureAdmin();

// Login handler
document.getElementById('doLoginBtn')?.addEventListener('click', async ()=>{
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const cfg = JSON.parse(localStorage.getItem('app_auth')||'{}');
  const h = await sha256(p);
  if(u === cfg.adminUser && h === cfg.adminHash){
    localStorage.setItem('logged_in_user', JSON.stringify({user:u,ts:Date.now()}));
    alert('Login successful');
    document.getElementById('loginModal').style.display='none';
    // show admin controls...
  } else {
    alert('Invalid credentials');
  }
});

// Change admin password in settings (add inputs)
async function changeAdminPass(newPass){
  const cfg = JSON.parse(localStorage.getItem('app_auth')||'{}');
  cfg.adminHash = await sha256(newPass);
  localStorage.setItem('app_auth', JSON.stringify(cfg));
  alert('Admin password changed');
}
