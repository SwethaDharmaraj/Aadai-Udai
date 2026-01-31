const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { get, add, update, remove } = require('../controllers/cartController');

router.use(auth);
router.get('/', get);
router.post('/', add);
router.patch('/', update);
router.delete('/:id', remove);

module.exports = router;
