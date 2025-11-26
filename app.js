
// app.js - simple client-only storage and UI helpers
(function(){
  const STORAGE_KEY = 'ta_students_v1';
  const SETTINGS_KEY = 'ta_settings_v1';
  function readStudents(){ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  function saveStudents(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  function readSettings(){ return JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify({name:'Tarunnya Academy High School',location:'Saltha, Faridpur'})); }
  function saveSettings(st){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(st)); }

  // populate settings into pages
  const settings = readSettings();
  document.querySelectorAll('.brand h1').forEach(el=>el.textContent = settings.name);
  document.querySelectorAll('.muted').forEach(el=>el.textContent = settings.location);

  // common login button (simple)
  document.querySelectorAll('#loginBtn').forEach(b=>{
    b.addEventListener('click', ()=> {
      const user = prompt('Admin username','admin');
      const pass = prompt('Password','1234');
      if(user==='admin' && pass==='1234') alert('Logged in (demo). You can now use Settings to change school name.');
      else alert('Invalid (demo) credentials. Default admin/admin:1234');
    });
  });

  // Students page logic
  if(location.pathname.endsWith('students.html')){
    const list = document.getElementById('studentsList');
    function render(){
      const students = readStudents();
      if(!students.length) { list.innerHTML = '<div>No students yet</div>'; return; }
      let html = '<table class="table"><thead><tr><th>Roll</th><th>Name</th><th>Class</th><th>Father</th><th>Mobile</th><th>Actions</th></tr></thead><tbody>';
      students.forEach(s=>{
        html += `<tr><td>${s.roll||''}</td><td>${s.name||''}</td><td>${s.cls||''}</td><td>${s.father||''}</td><td>${s.mobile||''}</td><td><button class="btn" data-id="${s.id}" data-action="view">View</button> <button class="btn" data-id="${s.id}" data-action="edit">Edit</button> <button class="btn" data-id="${s.id}" data-action="del">Delete</button></td></tr>`;
      });
      html += '</tbody></table>';
      list.innerHTML = html;
      list.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
          const id = btn.dataset.id; const action = btn.dataset.action;
          if(action==='view'){ const s = readStudents().find(x=>x.id===id); alert(JSON.stringify(s,null,2)); }
          if(action==='edit'){ editStudent(id); }
          if(action==='del'){ if(confirm('Delete?')){ let arr = readStudents().filter(x=>x.id!==id); saveStudents(arr); render(); } }
        });
      });
    }
    document.getElementById('addNew').addEventListener('click', ()=>{
      const name = prompt('Student name'); if(!name) return;
      const roll = prompt('Roll'); const cls = prompt('Class');
      const father = prompt('Father name'); const mobile = prompt('Mobile');
      const s = {id:'st_'+Date.now(), name, roll, cls, father, mobile, marks:[]};
      const arr = readStudents(); arr.push(s); saveStudents(arr); render();
    });
    document.getElementById('exportCsv').addEventListener('click', ()=>{
      const arr = readStudents();
      if(!arr.length){ alert('No students'); return; }
      const keys = ['id','name','roll','cls','father','mobile'];
      let csv = keys.join(',') + '\n';
      arr.forEach(r=> csv += keys.map(k=> '"'+(r[k]||'')+'"').join(',') + '\n');
      const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='students.csv'; a.click();
    });
    function editStudent(id){
      const arr = readStudents(); const s = arr.find(x=>x.id===id); if(!s) return;
      const name = prompt('Name', s.name); if(name!==null) s.name=name;
      const roll = prompt('Roll', s.roll); if(roll!==null) s.roll=roll;
      saveStudents(arr); render();
    }
    render();
  }

  // Admissions page logic
  if(location.pathname.endsWith('admissions.html')){
    document.getElementById('submitAdmission').addEventListener('click', ()=>{
      const s = {
        id:'st_'+Date.now(),
        name: document.getElementById('adm_name').value.trim(),
        roll: document.getElementById('adm_roll').value.trim(),
        cls: document.getElementById('adm_class').value.trim(),
        session: document.getElementById('adm_session').value.trim(),
        father: document.getElementById('adm_father').value.trim(),
        mother: document.getElementById('adm_mother').value.trim(),
        mobile: document.getElementById('adm_mobile').value.trim(),
        dob: document.getElementById('adm_dob').value,
        perm: document.getElementById('adm_perm').value.trim(),
        pres: document.getElementById('adm_pres').value.trim(),
        dist: document.getElementById('adm_dist').value.trim(),
        thana: document.getElementById('adm_thana').value.trim(),
        marks: []
      };
      if(!s.name){ alert('Enter name'); return; }
      const arr = readStudents(); arr.push(s); saveStudents(arr); alert('Admission saved'); location.href='students.html';
    });
  }

  // Marks page logic
  if(location.pathname.endsWith('marks.html')){
    const sel = document.getElementById('markStudent');
    function populateStudents(){
      const arr = readStudents();
      sel.innerHTML = '<option value="">-- select --</option>'+arr.map(s=>`<option value="${s.id}">${s.roll||''} - ${s.name}</option>`).join('');
    }
    populateStudents();
    document.getElementById('saveMarksBtn').addEventListener('click', ()=>{
      const id = sel.value; if(!id){ alert('select student'); return; }
      const text = document.getElementById('marksText').value.trim(); if(!text){ alert('enter marks'); return; }
      const lines = text.split(/\n+/).map(l=>l.trim()).filter(Boolean);
      const marks = lines.map(l=>{
        const p = l.split(':').map(x=>x.trim());
        return {subject:p[0]||'', obtained: Number(p[1]||0), full: Number(p[2]||100)};
      });
      const arr = readStudents(); const s = arr.find(x=>x.id===id); s.marks = (s.marks||[]).concat(marks); saveStudents(arr); alert('Saved marks');
    });
    document.getElementById('printMarksheetBtn').addEventListener('click', ()=>{
      const id = sel.value; if(!id){ alert('select student'); return; }
      const arr = readStudents(); const s = arr.find(x=>x.id===id);
      const rows = (s.marks||[]).map(m=>`<tr><td>${m.subject}</td><td style="text-align:right">${m.obtained}</td><td style="text-align:right">${m.full}</td><td style="text-align:right">${gradeFor(m.obtained)}</td></tr>`).join('');
      const total = (s.marks||[]).reduce((a,b)=>a+(b.obtained||0),0); const max = (s.marks||[]).reduce((a,b)=>a+(b.full||0),0);
      const html = `<html><head><title>Marksheet</title><style>body{font-family:Arial;padding:20px}.box{max-width:800px;margin:0 auto;background:#fff;padding:20px;border:8px solid #f2f2f2}.h{display:flex;align-items:center;gap:12px}.h h2{margin:0;color:#1e9b5a}.table{width:100%;border-collapse:collapse}.table th,.table td{border:1px solid #ddd;padding:8px}</style></head><body><div class="box"><div class="h"><div style="width:80px;height:80px;background:#eee"></div><div><h2>${settings.name}</h2><div>${settings.location}</div></div></div><h3>Marksheet</h3><div><b>Name:</b> ${s.name} &nbsp; <b>Roll:</b> ${s.roll||''}</div><table class="table"><thead><tr><th>Subject</th><th>Obtained</th><th>Full</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:12px"><b>Total:</b> ${total} / ${max}</div><div style="margin-top:60px;text-align:right">Principal: __________</div></div><script>window.print()</script></body></html>`;
      const w = window.open('','_blank'); w.document.write(html); w.document.close();
    });
    function gradeFor(m){ if(m>=80) return 'A+'; if(m>=70) return 'A'; if(m>=60) return 'A-'; if(m>=50) return 'B'; if(m>=40) return 'C'; return 'F'; }
  }

  // Certificates page
  if(location.pathname.endsWith('certificates.html')){
    const sel = document.getElementById('certStudent');
    function populate(){
      const arr = readStudents();
      sel.innerHTML = '<option value="">-- select --</option>'+arr.map(s=>`<option value="${s.id}">${s.roll||''} - ${s.name}</option>`).join('');
    }
    populate();
    document.getElementById('generateCert').addEventListener('click', ()=>{
      const id = sel.value; if(!id) return alert('select student');
      const s = readStudents().find(x=>x.id===id);
      const title='Certificate of Completion';
      const body = `${s.name} (Roll: ${s.roll||''}) has successfully completed the academic term.`;
      const html = `<html><head><title>${title}</title><style>body{font-family:Arial;padding:30px}.cert{border:14px solid #eee;padding:30px;text-align:center} h1{color:#1e9b5a}</style></head><body><div class="cert"><h1>${settings.name}</h1><div>${settings.location}</div><h2 style="margin-top:18px">${title}</h2><p style="font-size:18px;margin-top:20px">${body}</p><div style="margin-top:60px;text-align:right">Principal: __________</div></div><script>window.print()</script></body></html>`;
      const w = window.open('','_blank'); w.document.write(html); w.document.close();
    });
  }

  // Settings page
  if(location.pathname.endsWith('settings.html')){
    document.getElementById('set_name').value = settings.name; document.getElementById('set_loc').value = settings.location;
    document.getElementById('saveSettings').addEventListener('click', ()=>{
      const s = {name: document.getElementById('set_name').value.trim(), location: document.getElementById('set_loc').value.trim()};
      saveSettings(s); alert('Saved. Reload pages to see updated header.'); 
    });
  }

})();
