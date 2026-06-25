const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

const auth = require('../controllers/authController');
const submissions = require('../controllers/submissionController');
const adminOps = require('../controllers/adminController');
const master = require('../controllers/masterController');

const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Auth routes
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/profile', protect, auth.getProfile);
router.put('/auth/profile', protect, auth.updateProfile);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);

// Submission routes (Lecturer)
router.get('/submissions', protect, submissions.getSubmissions);
router.post('/submissions', protect, upload.single('file'), submissions.createSubmission);
router.put('/submissions/:id', protect, upload.single('file'), submissions.updateSubmission);
router.delete('/submissions/:id', protect, submissions.deleteSubmission);

// Admin routes
router.get('/admin/users/pending', protect, admin, adminOps.getPendingUsers);
router.post('/admin/users/:id/approve', protect, admin, adminOps.approveUser);
router.post('/admin/users/:id/reject', protect, admin, adminOps.rejectUser);
router.get('/admin/users', protect, admin, adminOps.getUsers);
router.get('/admin/submissions', protect, admin, adminOps.getAllSubmissions);
router.post('/admin/submissions/:id/verify', protect, admin, adminOps.verifySubmission);
router.post('/admin/submissions/:id/reject', protect, admin, adminOps.rejectSubmission);
router.get('/admin/submissions/download-zip', protect, admin, adminOps.downloadZip);
router.get('/admin/audit-logs', protect, admin, adminOps.getAuditLogs);

// Master Data routes
router.get('/master/departments', master.getDepartments);
router.post('/master/departments', protect, admin, master.createDepartment);
router.delete('/master/departments/:id', protect, admin, master.deleteDepartment);

router.get('/master/designations', master.getDesignations);
router.post('/master/designations', protect, admin, master.createDesignation);
router.delete('/master/designations/:id', protect, admin, master.deleteDesignation);

router.get('/master/categories', master.getCategories);
router.post('/master/categories', protect, admin, master.createCategory);
router.delete('/master/categories/:id', protect, admin, master.deleteCategory);

// Notifications routes
router.get('/notifications', protect, async (req, res) => {
  try {
    const { data: list, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(list || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/notifications/read', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
