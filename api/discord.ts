import axios from 'axios'
import express from 'express'
import bodyParser from 'body-parser'

const router = express.Router()

const app = express()
router.use((req, res, next) => {
  Object.setPrototypeOf(req, app.request)
  Object.setPrototypeOf(res, app.response)
  req.res = res
  res.req = req
  next()
})

router.post('/user', bodyParser.json(), async (req, res) => {
  const { data } = await axios({
    method: 'get',
    url: `${process.env.DISCORD_API_BASE}/users/@me`,
    headers: {
      Authorization: `Bearer ${req.body.token}`,
    },
  })

  return res.json(data)
})

export default {
  path: '/api/discord',
  handler: router,
}
