const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:5001/api/v1';
const PASSWORD = process.env.SEED_PASS || 'Test1234!';

function pickToken(json){
  if(!json) return '';
  if(json.data && json.data.token) return json.data.token;
  if(json.token) return json.token;
  return '';
}

async function login(tckn){
  const res = await fetch(`${BASE}/auth/personnel/login`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({tckn, password: PASSWORD})
  });
  const j = await res.json().catch(()=>null);
  const token = pickToken(j);
  console.log(`login ${tckn} -> token ${token?'<OK>':'<FAIL>'}`);
  return token;
}

async function main(){
  try{
    const doctorTckn = '11111111111';
    const laborantTckn = '44444444441';
    const adminTckn = '99999999999';

    const doctorToken = await login(doctorTckn);
    const laborantToken = await login(laborantTckn);
    const adminToken = await login(adminTckn);

    if(!doctorToken || !laborantToken){
      console.error('Missing tokens; aborting');
      process.exit(2);
    }

    // Find patient id (by admin)
    let patientId = '';
    try{
      const pr = await fetch(`${BASE}/patients`, {headers:{Authorization:`Bearer ${adminToken}`}});
      const pj = await pr.json();
      if(Array.isArray(pj.data)){
        const p = pj.data.find(x=> x.user && x.user.tckn === '22222222221');
        patientId = p ? (p.id || p.userId || (p.user && p.user.id)) : '';
      }
    }catch(e){/* ignore */}
    if(!patientId) patientId = process.env.PATIENT_ID || 1;
    console.log('Using patientId =', patientId);

    // Create lab request as doctor
    const createRes = await fetch(`${BASE}/lab-requests`, {
      method: 'POST', headers: {Authorization:`Bearer ${doctorToken}`, 'Content-Type':'application/json'},
      body: JSON.stringify({patientId, fileTitle: 'Hemogram', notes: 'Please upload hemogram results'})
    });
    const createJson = await createRes.json().catch(()=>null);
    console.log('create request ->', JSON.stringify(createJson));
    const reqId = createJson && (createJson.data? createJson.data.id : createJson.id);
    if(!reqId){ console.error('Failed to create request'); process.exit(3); }

    // List requests as doctor
    const listRes = await fetch(`${BASE}/lab-requests`, {headers:{Authorization:`Bearer ${doctorToken}`}});
    console.log('list doctor ->', JSON.stringify(await listRes.json().catch(()=>null)));

    // Laborant claim
    const claimRes = await fetch(`${BASE}/lab-requests/${reqId}/claim`, {method:'PUT', headers:{Authorization:`Bearer ${laborantToken}`}});
    console.log('claim ->', JSON.stringify(await claimRes.json().catch(()=>null)));

    // Prepare small dummy file
    const tmpFile = path.join(__dirname,'tmp_test.pdf');
    fs.writeFileSync(tmpFile, '%PDF-1.4\n%Dummy PDF');

    // Upload medical file with requestId using curl to avoid multipart edge-cases
    const { spawnSync } = require('child_process');
    const curlArgs = [
      '-sS', '-X', 'POST', `${BASE}/medical-files`,
      '-H', `Authorization: Bearer ${laborantToken}`,
      '-F', `file=@${tmpFile}`,
      '-F', `patientId=${patientId}`,
      '-F', `testName=Hemogram`,
      '-F', `testDate=2025-12-01`,
      '-F', `description=Uploaded for request`,
      '-F', `requestId=${reqId}`
    ];

    const proc = spawnSync('curl', curlArgs, { encoding: 'utf8' });
    let uploadOut = proc.stdout || '';
    if (proc.stderr) uploadOut += '\n' + proc.stderr;
    console.log('upload ->', uploadOut.trim());

    // Verify request details
    const detailRes = await fetch(`${BASE}/lab-requests/${reqId}`, {headers:{Authorization:`Bearer ${doctorToken}`}});
    console.log('detail ->', JSON.stringify(await detailRes.json().catch(()=>null)));

    // List patient files
    const filesRes = await fetch(`${BASE}/medical-files/patient/${patientId}`, {headers:{Authorization:`Bearer ${doctorToken}`}});
    console.log('patient files ->', JSON.stringify(await filesRes.json().catch(()=>null)));

    fs.unlinkSync(tmpFile);
  }catch(err){
    console.error('Error in test script', err);
    process.exit(1);
  }
}

(async ()=>{ await main(); })();
