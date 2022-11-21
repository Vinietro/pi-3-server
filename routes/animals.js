const express = require('express')
const router = express.Router()

const {authByToken} = require('../middleware/auth')

const AnimalController = require('../controllers/animals')

router.get('/',AnimalController.getAllAnimals)                    //Get most recent animals from users you follow
router.get('/feed',authByToken,AnimalController.getFeed)           //Get most recent animals globally
router.post('/',authByToken,AnimalController.createAnimal)        //Create an animal
router.get('/:slug',AnimalController.getSingleAnimalBySlug)       //Get an animal
router.patch('/:slug',authByToken,AnimalController.updateAnimal)  //Update an animal 
router.delete('/:slug',authByToken,AnimalController.deleteAnimal) //Delete an animal

module.exports = router