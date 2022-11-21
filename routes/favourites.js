const express = require('express')
const router = express.Router()
const FavouriteController = require('../controllers/favourites')
const {authByToken} = require('../middleware/auth')

router.post('/:slug/favorite',authByToken,FavouriteController.addFavourite)         //Favorite an animal
router.delete('/:slug/favorite',authByToken,FavouriteController.removeFavourite)    //Unfavorite an animal

module.exports = router