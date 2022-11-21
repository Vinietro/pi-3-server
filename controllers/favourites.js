const User = require('../models/User')
const Animal = require('../models/Animal')
const Tag = require('../models/Tag')

function sanitizeOutput(animal,user,favorited,count){
    const newTagList = []
    for(let t of animal.dataValues.Tags){
        newTagList.push(t.name)
    }
    delete animal.dataValues.Tags
    animal.dataValues.tagList = newTagList
        
    if(animal){
        delete user.dataValues.password
        delete user.dataValues.email
        animal.dataValues.author = user
        animal.dataValues.favorited = favorited
        animal.dataValues.favoritedCount = count
        return animal
    }
}

module.exports.addFavourite = async (req,res) => {
    try{
        let animal = await Animal.findByPk(req.params.slug,{include:Tag})
        if(!animal){
            res.status(404)
            throw new Error('Animal not found')
        }
        await animal.addUsers(req.user.email)
        const user = await animal.getUser()
        const count = await animal.countUsers()

        const userFavorited = await User.findAll({
			include: [
				{
					model: Animal,
					through: 'Favourites',
					where: {
						slug: animal.slug
					}
				},
			]
			
		})	

        animal = sanitizeOutput(animal,user,!!userFavorited.length,count)
        res.json(animal)
    }catch(e){
        const code = res.statusCode ? res.statusCode : 422
        return res.status(code).json({
            errors: { body: [  e.message ] }
        })
    }
}

module.exports.removeFavourite = async (req,res) => {
    try{
        let animal = await Animal.findByPk(req.params.slug,{include:Tag})
        if(!animal){
            res.status(404)
            throw new Error('Animal not found')
        }
        await animal.removeUsers(req.user.email)
        const user = await animal.getUser()
        const count = await animal.countUsers()

        const userFavorited = await User.findAll({
			include: [
				{
					model: Animal,
					through: 'Favourites',
					where: {
						slug: animal.slug
					}
				},
			]
			
		})	

        animal = sanitizeOutput(animal,user,!!userFavorited.length,count)
        res.json(animal)
    }catch(e){
        const code = res.statusCode ? res.statusCode : 422
        return res.status(code).json({
            errors: { body: [  e.message ] }
        })
    }
}