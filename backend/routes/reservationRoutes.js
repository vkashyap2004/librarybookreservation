const router = require('express').Router();
const c = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('student'), c.createReservation);
router.get('/my', authorize('student'), c.getMyReservations); // must stay above "/:id"
router.get('/', authorize('admin'), c.getAllReservations);
router.get('/:id', c.getReservation);
router.put('/:id/cancel', authorize('student'), c.cancelReservation);
router.put('/:id/status', authorize('admin'), c.reviewReservation);
router.put('/:id/collect', authorize('admin'), c.collectReservation);
router.put('/:id/return', authorize('admin'), c.returnReservation);
router.put('/:id/pay-fine', authorize('admin'), c.payFine);

module.exports = router;
