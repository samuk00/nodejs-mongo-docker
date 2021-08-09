require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const routers = require('./routers')

const url = 'mongodb://mongo:27017/docker-node-mongo'

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })

app.use(express.static('build'))
app.use(cors())
app.use(express.json())
app.use(routers)


const PORT = 3100
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})