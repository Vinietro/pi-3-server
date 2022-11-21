const {DataTypes} = require('sequelize')
const sequelize = require('../dbConnection')

const Animal = sequelize.define('Animal',{
    slug : {
        type: DataTypes.STRING,
        allowNull: false ,
        primaryKey: true  
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    body: { 
      type: DataTypes.TEXT,  
      allowNull: false,
    }
})

module.exports = Animal

/* {
  "animal": {
    
    
    "tagList": ["dragons", "training"],
    "favorited": false,
    "favoritesCount": 0,
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }
} */