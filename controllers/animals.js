const Animal = require('../models/Animal');
const User = require('../models/User');
const Tag = require('../models/Tag');
const { slugify } = require('../utils/stringUtil');
const sequelize = require('../dbConnection');

function sanitizeOutput(animal, count, favorited, user) {
	const newTagList = [];
	for (let t of animal.dataValues.Tags) {
		newTagList.push(t.name);
	}
	delete animal.dataValues.Tags;
	animal.dataValues.tagList = newTagList;

	if (animal) {
		delete user.dataValues.password;
		delete user.dataValues.email;
		delete user.dataValues.following;
		animal.dataValues.author = user;
		animal.dataValues.favorited = favorited
        animal.dataValues.favoritedCount = count
		return animal;
	}
}

function sanitizeOutputMultiple(animal) {
	const newTagList = [];
	for (let t of animal.dataValues.Tags) {
		newTagList.push(t.name);
	}
	delete animal.dataValues.Tags;
	animal.dataValues.tagList = newTagList;

	let user = {
		username: animal.dataValues.User.username,
		email: animal.dataValues.User.email,
		bio: animal.dataValues.User.bio,
		image: animal.dataValues.User.image,
	};

	delete animal.dataValues.User;
	animal.dataValues.author = user;

	return animal;
}

module.exports.createAnimal = async (req, res) => {
	try {
		if (!req.body.animal) throw new Error('No animals data');
		const data = req.body.animal;
		if (!data.title) throw new Error('Animal title is required');
		if (!data.body) throw new Error('Animal body is required');

		//Find out author object
		const user = await User.findByPk(req.user.email);
		if (!user) throw new Error('User does not exist');
		const slug = slugify(data.title);
		let animal = await Animal.create({
			slug: slug,
			title: data.title,
			image: data.image,
			body: data.body,
			UserEmail: user.email,
		});

		if (data.tagList) {
			for (let t of data.tagList) {
				let tagExists = await Tag.findByPk(t);
				let newTag;
				if (!tagExists) {
					newTag = await Tag.create({ name: t });
					animal.addTag(newTag);
				} else {
					animal.addTag(tagExists);
				}
			}
		}

		animal = await Animal.findByPk(slug, { include: Tag });
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

		animal = sanitizeOutput(animal, count, !!userFavorited.length, user);
		res.status(201).json({ animal });
	} catch (e) {
		return res.status(422).json({
			errors: { body: ['Could not create animal', e.message] },
		});
	}
};

module.exports.getSingleAnimalBySlug = async (req, res) => {
	try {
		const { slug } = req.params;
		console.log(slug);
		let animal = await Animal.findByPk(slug, { include: Tag });

		const user = await animal.getUser();

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

		animal = sanitizeOutput(animal, count, !!userFavorited.length, user);

		res.status(200).json({ animal });
	} catch (e) {
		return res.status(422).json({
			errors: { body: ['Could not get animal', e.message] },
		});
	}
};

module.exports.updateAnimal = async (req, res) => {
	try {
		if (!req.body.animal) throw new Error('No animals data');
		const data = req.body.animal;
		const slugInfo = req.params.slug;
		let animal = await Animal.findByPk(slugInfo, { include: Tag });

		if (!animal) {
			res.status(404);
			throw new Error('Animal not found');
		}

		const user = await User.findByPk(req.user.email);

		if (user.email != animal.UserEmail) {
			res.status(403);
			throw new Error('You must be the author to modify this animal');
		}

		const title = data.title ? data.title : animal.title;
		const body = data.body ? data.body : animal.body;
		const slug = data.title ? slugify(title) : slugInfo;

		const updatedAnimal = await animal.update({ slug, title, body });

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

		animal = sanitizeOutput(updatedAnimal, count, !!userFavorited.length, user);
		res.status(200).json({ animal });
	} catch (e) {
		const code = res.statusCode ? res.statusCode : 422;
		return res.status(code).json({
			errors: { body: ['Could not update animal', e.message] },
		});
	}
};

module.exports.deleteAnimal = async (req, res) => {
	try {
		const slugInfo = req.params.slug;
		let animal = await Animal.findByPk(slugInfo, { include: Tag });

		if (!animal) {
			res.status(404);
			throw new Error('Animal not found');
		}

		const user = await User.findByPk(req.user.email);

		if (user.email != animal.UserEmail) {
			res.status(403);
			throw new Error('You must be the author to modify this animal');
		}

		await Animal.destroy({ where: { slug: slugInfo } });
		res.status(200).json({ message: 'Animal deleted successfully' });
	} catch (e) {
		const code = res.statusCode ? res.statusCode : 422;
		return res.status(code).json({
			errors: { body: ['Could not delete animal', e.message] },
		});
	}
};

module.exports.getAllAnimals = async (req, res) => {
	try {
		//Get all animals:

		const { tag, author, limit = 20, offset = 0 } = req.query;
		let animal;
		if (!author && tag) {
			animal = await Animal.findAll({
				include: [
					{
						model: Tag,
						attributes: ['name'],
						where: { name: tag },
					},
					{
						model: User,
						attributes: ['email', 'username', 'bio', 'image'],
					},
				],
				limit: parseInt(limit),
				offset: parseInt(offset),
			});
		} else if (author && !tag) {
			animal = await Animal.findAll({
				include: [
					{
						model: Tag,
						attributes: ['name'],
					},
					{
						model: User,
						attributes: ['email', 'username', 'bio', 'image'],
						where: { username: author },
					},
				],
				limit: parseInt(limit),
				offset: parseInt(offset),
			});
		} else if (author && tag) {
			animal = await Animal.findAll({
				include: [
					{
						model: Tag,
						attributes: ['name'],
						where: { name: tag },
					},
					{
						model: User,
						attributes: ['email', 'username', 'bio', 'image'],
						where: { username: author },
					},
				],
				limit: parseInt(limit),
				offset: parseInt(offset),
			});
		} else {
			animal = await Animal.findAll({
				include: [
					{
						model: Tag,
						attributes: ['name'],
					},
					{
						model: User,
						attributes: ['email', 'username', 'bio', 'image'],
					},
				],
				limit: parseInt(limit),
				offset: parseInt(offset),
			});
		}
		let animals = [];
		for (let t of animal) {
			let addArt = sanitizeOutputMultiple(t);
			animals.push(addArt);
		}

		res.json({ animals });
	} catch (e) {
		const code = res.statusCode ? res.statusCode : 422;
		return res.status(code).json({
			errors: { body: ['Could not create animal', e.message] },
		});
	}
};

module.exports.getFeed = async (req, res) => {
	try {
		const query = `
            SELECT UserEmail
            FROM followers
            WHERE followerEmail = "${req.user.email}"`;
		const followingUsers = await sequelize.query(query);
		if (followingUsers[0].length == 0) {
			return res.json({ animals: [] });
		}
		let followingUserEmail = [];
		for (let t of followingUsers[0]) {
			followingUserEmail.push(t.UserEmail);
		}

		let animal = await Animal.findAll({
			where: {
				UserEmail: followingUserEmail,
			},
			include: [Tag, User],
		});

		let animals = [];
		for (let t of animal) {
			let addArt = sanitizeOutputMultiple(t);
			animals.push(addArt);
		}

		res.json({ animals });
	} catch (e) {
		const code = res.statusCode ? res.statusCode : 422;
		return res.status(code).json({
			errors: { body: ['Could not get feed ', e.message] },
		});
	}
};
