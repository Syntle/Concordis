import express from 'express'
import bodyParser from 'body-parser'

const users: any = []
const rooms: any = []
const queue: any = []

const router = express.Router()

const app = express()
router.use((req, res, next) => {
  Object.setPrototypeOf(req, app.request)
  Object.setPrototypeOf(res, app.response)
  req.res = res
  res.req = req

  next()
})

// Users
router.post('/getUsers', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  return res.json(users)
})

router.post('/createUser', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  if (req.body.interests) req.body.user.interests = req.body.interests
  users.push(req.body.user)
  return res.json({ message: 'Created user', user: req.body.user })
})

router.post('/updateUser', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  const user = users.find((u: any) => u.id === req.body.userID)
  if (user) {
    user.socketID = req.body.socketID
    if (req.body.interests) user.interests = req.body.interests
  }

  return res.json({ message: 'Updated user', user: user })
})

router.post('/deleteUser', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  const index = users.findIndex((u: any) => u.id === req.body.userID)

  if (index > -1) users.splice(index, 1)

  return res.json({ message: 'Deleted user', userID: req.body.userID })
})

// Rooms
router.post('/getRooms', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  return res.json(rooms)
})

router.post('/createRoom', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  rooms.push(req.body.room)

  return res.json({ message: 'Created room', room: req.body.room })
})

router.post('/deleteRoom', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  const index = rooms.findIndex((room: any) =>
    room.users.find((u: any) => u === req.body.userID)
  )

  const room = rooms[index]

  if (index > -1) rooms.splice(index, 1)
  return res.json({ message: 'Deleted room', room: room })
})

router.post('/setRoomFriendStatus', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  const room = rooms.find((r: any) =>
    r.users.find((u: any) => u === req.body.userID)
  )
  room.areFriends = req.body.areFriends

  return res.json(room)
})

// Queue
router.post('/getQueue', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  return res.json(queue)
})

router.post('/addToQueue', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  queue.push(req.body.user)

  return res.json({ message: 'Added user to queue', user: req.body.user })
})

router.post('/removeFromQueue', bodyParser.json(), (req, res) => {
  if (!req.body.token) return res.sendStatus(400)
  if (req.body.token !== process.env.IO_API_KEY) return res.sendStatus(401)

  const index = queue.findIndex((u: any) => u.id === req.body.userID)

  if (index > -1) queue.splice(index, 1)

  return res.json({
    message: 'Removed user from queue',
    userID: req.body.userID,
  })
})

export default {
  path: '/api/io',
  handler: router,
}
