import { v4 as uuid } from 'uuid'
import axios from 'axios'

export default function (socket, io) {
  socket.on('disconnect', () => {
    disconnectHandler(socket, io)
  })

  return Object.freeze({
    // Queues
    addToQueue({ user, interests }) {
      addToQueue(socket, io, user, interests)
    },
    removeFromQueue({ user }) {
      removeFromQueue(socket, io, user)
    },
    matchUsers() {
      matchUsers(socket, io)
    },
    // Users
    isConnected({ user }) {
      isConnected(socket, io, user)
    },
    getSocketID() {
      getSocketID(socket, io)
    },
    updateUser({ user }) {
      updateUser(socket, io, user)
    },
  })
}

//  Queues

const addToQueue = async (socket, io, user, interests) => {
  const { data: queue } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getQueue`,
    {
      token: process.env.IO_API_KEY,
    }
  )
  if (await isInRoom(socket, io, user)) {
    await removeFromQueue(socket, io, user)
    return socket.emit('alreadyInRoom')
  }

  if (!queue.find((slot) => slot.id === user.id)) {
    user.interests = interests
    await updateUser(socket, io, user)

    const { data: users } = await axios.post(
      `${process.env.WEBSITE_URL}/api/io/getUsers`,
      {
        token: process.env.IO_API_KEY,
      }
    )

    let userData = users.find((u) => u.id === user.id)

    if (!userData) {
      userData = await createUser(socket, io, user, interests)
    }

    await axios.post(`${process.env.WEBSITE_URL}/api/io/addToQueue`, {
      token: process.env.IO_API_KEY,
      user: userData,
    })
  }

  await matchUsers(socket, io)
}

const removeFromQueue = async (socket, io, user) => {
  if (!user) return
  await axios.post(`${process.env.WEBSITE_URL}/api/io/removeFromQueue`, {
    token: process.env.IO_API_KEY,
    userID: user.id,
  })
}

const matchUsers = async (socket, io) => {
  const { data: queue } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getQueue`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  if (queue.length <= 1) return

  const sortedQueue = {}

  const addToLeftoverQueue = (userID) => {
    if (!sortedQueue[' ']) {
      sortedQueue[' '] = [userID]
    } else if (!sortedQueue[' '].includes(userID)) {
      sortedQueue[' '].push(userID)
    }
  }

  const removeFromSortedQueue = async (userID) => {
    delete sortedQueue[userID]

    for (const id in sortedQueue) {
      if (!sortedQueue[id].length) continue

      const index = sortedQueue[id].findIndex((id) => id === userID)

      if (index > -1) {
        sortedQueue[id].splice(index, 1)
      }
    }
  }

  queue.forEach((user) => {
    queue.forEach((user2) => {
      if (user.id !== user2.id) {
        addToLeftoverQueue(user.id)
        addToLeftoverQueue(user2.id)

        if (user.interests.length && user2.interests.length) {
          const userInterests = user.interests.map((interest) => {
            return interest.toLowerCase()
          })
          const user2Interests = user2.interests.map((interest) => {
            return interest.toLowerCase()
          })

          const interestsInCommon = userInterests.filter((interest) => {
            return user2Interests.indexOf(interest) != -1
          })

          if (interestsInCommon.length) {
            if (!sortedQueue[user.id]) sortedQueue[user.id] = []

            // Allow duplicate entries, more in interests in common means higher chance of matching up
            sortedQueue[user.id].push(user2.id)
          }
        }
      }
    })
  })

  for (const user1ID in sortedQueue) {
    if (
      !sortedQueue[user1ID] ||
      !sortedQueue[user1ID].length ||
      user1ID === ' '
    ) {
      continue
    }

    const user2ID =
      sortedQueue[user1ID][
        Math.floor(Math.random() * sortedQueue[user1ID].length)
      ]

    await removeFromSortedQueue(user1ID)
    await removeFromQueue(socket, io, { id: user1ID })

    await removeFromSortedQueue(user2ID)
    await removeFromQueue(socket, io, { id: user2ID })

    const { data: users } = await axios.post(
      `${process.env.WEBSITE_URL}/api/io/getUsers`,
      {
        token: process.env.IO_API_KEY,
      }
    )

    const user1 = users.find((u) => u.id === user1ID)
    const user2 = users.find((u) => u.id === user2ID)

    await createRoom(socket, io, user1, user2)
  }

  // Process leftover queue last
  if (sortedQueue[' '].length > 1) {
    for (let user1ID in sortedQueue[' ']) {
      user1ID = sortedQueue[' '][user1ID]
      await removeFromSortedQueue(user1ID)
      await removeFromQueue(socket, io, { id: user1ID })

      const user2ID =
        sortedQueue[' '][Math.floor(Math.random() * sortedQueue[' '].length)]
      await removeFromSortedQueue(user2ID)
      await removeFromQueue(socket, io, { id: user2ID })

      const { data: users } = await axios.post(
        `${process.env.WEBSITE_URL}/api/io/getUsers`,
        {
          token: process.env.IO_API_KEY,
        }
      )

      const user1 = users.find((u) => u.id === user1ID)
      const user2 = users.find((u) => u.id === user2ID)

      await createRoom(socket, io, user1, user2)
    }
  }
}

//  Rooms

const createRoom = async (socket, io, user1, user2) => {
  if (
    !isConnected(socket, io, user1) ||
    !isConnected(socket, io, user2) ||
    (await isInRoom(socket, io, user1)) ||
    (await isInRoom(socket, io, user2))
  ) {
    await addToQueue(socket, io, user1)
    await addToQueue(socket, io, user2)
    return
  }

  const id = uuid()

  await axios.post(`${process.env.WEBSITE_URL}/api/io/createRoom`, {
    token: process.env.IO_API_KEY,
    room: {
      id,
      users: [user1.id, user2.id],
    },
  })

  io.of('queue').sockets[`/queue#${user1.socketID}`].emit('joinRoom', {
    route: id,
  })
  io.of('queue').sockets[`/queue#${user2.socketID}`].emit('joinRoom', {
    route: id,
  })
}

const isInRoom = async (socket, io, user) => {
  const { data: rooms } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getRooms`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  return rooms.find((room) => room.users.find((u) => u === user.id))
}

//  Users

const getSocketID = (socket, io) => {
  socket.emit('getSocketID', { socketID: socket.client.id })
}

const isConnected = (socket, io, user) => {
  if (user) {
    if (Object.keys(io.of('queue').sockets).length) {
      if (io.of('queue').sockets[socket.id]) return true
      return false
    }
    return false
  } else {
    if (Object.keys(io.sockets.sockets).length) {
      if (io.sockets.sockets[user.socketID]) return true
      return false
    }
    return false
  }
}

const createUser = async (socket, io, user, interests) => {
  if (!user) return
  const { data: createUser } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/createUser`,
    {
      token: process.env.IO_API_KEY,
      user,
      interests,
    }
  )

  return createUser.user
}

const updateUser = async (socket, io, user) => {
  if (!user) return
  const { data: users } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getUsers`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  const usr = users.find((u) => u.id === user.id)

  if (usr) {
    await axios.post(`${process.env.WEBSITE_URL}/api/io/updateUser`, {
      token: process.env.IO_API_KEY,
      userID: user.id,
      socketID: socket.client.id,
      interests: user.interests,
    })
  }
}

const disconnectHandler = async (socket, io) => {
  const { data: users } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getUsers`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  const user = users.find((u) => u.socketID === socket.client.id)

  if (user) {
    await removeFromQueue(socket, io, user)
  }
}
