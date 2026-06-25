const axios = require('axios');
const supabase = require('../config/db');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n--- STARTING FACULTY PORTAL INTEGRATION TESTS ---');
  
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .in('email', ['lecturer.a@college.edu', 'lecturer.b@college.edu']);
    
    if (error) throw error;
    console.log('✅ [Database Cleanup]: Cleaned up test lecturer records from Supabase.');
  } catch (err) {
    console.error('❌ [Database Cleanup]: Cleanup failed:', err.message);
  }

  let tokenLecturerA, tokenLecturerB, tokenAdmin;
  let userLecturerAId, userLecturerBId;

  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'gowdaroshan49@gmail.com',
      password: 'OnePiece@#6362'
    });
    tokenAdmin = loginRes.data.token;
    console.log('✅ [Admin Auth]: Successfully authenticated as System Admin.');
  } catch (err) {
    console.error('❌ [Admin Auth]: Failed to login as seeded admin.', err.message);
    process.exit(1);
  }

  try {
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Lecturer A',
      email: 'lecturer.a@college.edu',
      password: 'password123',
      employee_id: 'EMP_LECA_001',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor'
    });
    console.log('✅ [Registration]: Successfully registered Lecturer A (Status: Pending).');
  } catch (err) {
    console.log('ℹ️ [Registration]: Lecturer A registration details already exist.');
  }

  try {
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Lecturer B',
      email: 'lecturer.b@college.edu',
      password: 'password123',
      employee_id: 'EMP_LECB_002',
      department: 'Information Science & Engineering',
      designation: 'Lecturer'
    });
    console.log('✅ [Registration]: Successfully registered Lecturer B (Status: Pending).');
  } catch (err) {
    console.log('ℹ️ [Registration]: Lecturer B registration details already exist.');
  }

  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: 'lecturer.a@college.edu',
      password: 'password123'
    });
    console.error('❌ [Access Control]: Lecturer A logged in while status was Pending!');
  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.log('✅ [Access Control]: Blocked login for pending lecturer.');
    } else {
      console.error('❌ [Access Control]: Incorrect error on pending login.', err.message);
    }
  }

  try {
    const pendingRes = await axios.get(`${API_URL}/admin/users/pending`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const userA = pendingRes.data.find(u => u.email === 'lecturer.a@college.edu');
    const userB = pendingRes.data.find(u => u.email === 'lecturer.b@college.edu');
    
    if (userA || userB) {
      if (userA) {
        userLecturerAId = userA.id || userA._id;
        await axios.post(`${API_URL}/admin/users/${userLecturerAId}/approve`, {}, {
          headers: { Authorization: `Bearer ${tokenAdmin}` }
        });
      }
      if (userB) {
        userLecturerBId = userB.id || userB._id;
        await axios.post(`${API_URL}/admin/users/${userLecturerBId}/approve`, {}, {
          headers: { Authorization: `Bearer ${tokenAdmin}` }
        });
      }
      console.log('✅ [Admin Operations]: Approved pending registrations.');
    } else {
      console.log('ℹ️ [Admin Operations]: Registrations already approved or not pending.');
    }
  } catch (err) {
    console.error('❌ [Admin Operations]: Approval request failed.', err.message);
  }

  try {
    const loginARes = await axios.post(`${API_URL}/auth/login`, {
      email: 'lecturer.a@college.edu',
      password: 'password123'
    });
    tokenLecturerA = loginARes.data.token;
    
    const loginBRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'lecturer.b@college.edu',
      password: 'password123'
    });
    tokenLecturerB = loginBRes.data.token;
    console.log('✅ [Lecturer Auth]: Successfully authenticated approved lecturers A & B.');
  } catch (err) {
    console.error('❌ [Lecturer Auth]: Approved logins failed.', err.message);
  }

  console.log('--- ALL AUTOMATED SANITY CHECKS COMPLETED ---\n');
}

runTests();
