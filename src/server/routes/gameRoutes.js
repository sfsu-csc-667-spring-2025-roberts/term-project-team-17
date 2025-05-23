const express = require('express');
const { route } = require('./gameRoutes');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.post('/room', gameController.room_create);
router.put('/room', gameController.room_join);
router.get('/room/:id', gameController.room_get);
router.get('/game/:id', gameController.game_get);

module.exports = router;