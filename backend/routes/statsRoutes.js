const router = require('express').Router();
const { adminStats, studentStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin', protect, authorize('admin'), adminStats);
router.get('/student', protect, authorize('student'), studentStats);

module.exports = router;
