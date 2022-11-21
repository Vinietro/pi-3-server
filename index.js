const dotenv = require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const {notFound,errorHandler} = require('./middleware/errorHandler')
const sequelize = require('./dbConnection')

const User = require('./models/User')
const Animal = require('./models/Animal')
const Tag = require('./models/Tag')
const Comment = require('./models/Comments')

const userRoute = require('./routes/users')
const animalRoute = require('./routes/animals')
const commentRoute = require('./routes/comments')
const tagRoute = require('./routes/tags')
const profileRoute = require('./routes/profile')
const favouriteRoute = require('./routes/favourites')

const app = express()

//CORS
app.use(cors({credentials: true, origin: true})) 



//RELATIONS:
//1 to many relation between user and animal
User.hasMany(Animal,{
    onDelete: 'CASCADE'
})
Animal.belongsTo(User)

//many to many relation between animal and taglist
Animal.belongsToMany(Tag,{through: 'TagList',uniqueKey:false,timestamps:false})
Tag.belongsToMany(Animal,{through: 'TagList',uniqueKey:false,timestamps:false})

//One to many relation between Animal and Comments
Animal.hasMany(Comment,{onDelete: 'CASCADE'})
Comment.belongsTo(Animal)

//One to many relation between User and Comments
User.hasMany(Comment,{onDelete: 'CASCADE'})
Comment.belongsTo(User)

//Many to many relation between User and User
User.belongsToMany(User,{
    through:'Followers',
    as:'followers',
    timestamps:false,
})

//favourite Many to many relation between User and animal
User.belongsToMany(Animal,{through: 'Favourites',timestamps:false})
Animal.belongsToMany(User,{through: 'Favourites',timestamps:false})



const sync = async () => await sequelize.sync({alter:true})
sync()

app.use(express.json())
app.use(morgan('tiny'))

app.get('/',(req,res) => {
    res.json({status:"API is running"});
})
app.use('/api',userRoute)
app.use('/api/animals',animalRoute)
app.use('/api/animals',commentRoute)
app.use('/api/tags',tagRoute)
app.use('/api/profiles',profileRoute)
app.use('/api/animals',favouriteRoute)
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 8080

app.listen(PORT,() => {
    console.log(`Server running on http://localhost:8080`);
})