const express = require('express')
const router = express.Router()
const CommentController = require('../controllers/comments')
const {authByToken} = require('../middleware/auth')

router.get('/:slug/comments',CommentController.getAllComments)                      //Get the comments for an animal. 
router.post('/:slug/comments',authByToken,CommentController.postNewComment)         //Create a comment for an animal. 
router.delete('/:slug/comments/:id',authByToken,CommentController.deleteComment)    //Delete a comment for an animal.

module.exports = router