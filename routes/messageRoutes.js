const express = require('express');
const router = express.Router();
const { getConversations, getOrCreateConversation, getMessages, sendMessage, deleteMessage, deleteConversation } = require('../controllers/messageController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);
router.get('/conversations/:conversationId', getMessages);
router.delete('/conversations/:id', deleteConversation);
router.post('/', sendMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
