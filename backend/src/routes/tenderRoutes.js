const express = require('express');

const tenderController = require('../controllers/tenderController');

const router = express.Router();

router.route('/').get(tenderController.listTenders).post(tenderController.createTender);
router.route('/:id').get(tenderController.getTender);
router.route('/:id/bids').post(tenderController.submitBid);

module.exports = router;
