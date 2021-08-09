const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('./models/User')
const Expense = require('./models/Expense')

const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7)
    }
    return null
}


router.get('/api/users', async (request, response, next) => {
    try {
        const users = await User.find({})
        response.json(users)
    } catch (expection) {
        next(expection)
    }
})

router.post('/api/users', async (request, response, next) => {
    const body = request.body
    if (!body.password || body.password.length < 6) {
        response.status(400).json({
            error: 'Password must be at least 6 characters'
        })
    } else {

        const saltRounds = 10
        const passwordHash = await bcrypt.hash(body.password, saltRounds)

        const user = new User({
            username: body.username,
            password: passwordHash
        })

        try {
            const savedUser = await user.save()
            response.status(201).json(savedUser.toJSON())
        } catch (expection) {
            next(expection)
        }
    }

})

router.post('/api/login', async (request, response) => {
    const body = request.body
    const user = await User.findOne({ username: body.username })

    const passwordCorrect = user === null
        ? false
        : await bcrypt.compare(body.password, user.password)

    if (!(user && passwordCorrect)) {
        return response.status(401).json({
            error: 'invalid username or password'
        })
    } else {
        const userForToken = {
            username: user.username,
            id: user.id
        }

        const token = jwt.sign(userForToken, process.env.SECRET)
        response.status(200).send({ token, id: user.id, username: user.username })
    }

})


router.get('/api/expenses/:id', async (request, response, next) => {
    const id = request.params.id
    try {
        const expenses = await Expense.find({ user: id })
        response.json(expenses)
    } catch (expection) {
        next(expection)
    }
})

router.post('/api/expenses', async (request, response, next) => {
    const body = request.body
    const token = getTokenFrom(request)

    try {
        const decodedToken = jwt.verify(token, process.env.SECRET)
        const user = await User.findById(decodedToken.id)


        const expense = new Expense({
            euros: body.euros,
            desc: body.desc,
            user: user.id
        })

        const savedExpense = await expense.save()
        user.expenses = user.expenses.concat(savedExpense)
        await user.save()
        response.status(201).json(savedExpense)
    } catch (exception) {
        next(exception)
    }
})

router.delete('/api/expenses/:id', async (request, response, next) => {
    const id = request.params.id
    try {
        await Expense.findByIdAndRemove(id)
        response.status(204).end()
    } catch (exception) {
        next(exception)
    }
})

module.exports = router