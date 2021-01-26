import axios from 'axios'

export default function (socket, io) {
  socket.on('disconnect', () => {
    disconnectHandler(socket, io)
  })

  return Object.freeze({
    // Rooms
    joinedRoom({ user, room }) {
      joinedRoom(socket, io, user, room)
    },
    leaveRoom({ user }) {
      leaveRoom(socket, io, user)
    },
    friendRequest({ user, room }) {
      friendRequest(socket, io, user, room)
    },
    acceptedFriend({ user, room }) {
      acceptedFriend(socket, io, user, room)
    },
    rejectedFriend({ userID, room }) {
      rejectedFriend(socket, io, userID, room)
    },
    // Messages
    typing({ user, room }) {
      typing(socket, io, user, room)
    },
    message({ message }) {
      messageHandler(socket, io, message)
    },
    notification({ type, roomID, user, interests }) {
      notification(socket, io, type, roomID, user, interests)
    },
    // Users
    getSocketID() {
      getSocketID(socket, io)
    },
    updateUser({ user }) {
      updateUser(socket, io, user)
    },
  })
}

// Rooms

const joinedRoom = async (socket, io, user, room) => {
  await updateUser(socket, io, user)

  const { data: rooms } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getRooms`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  const { data: users } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getUsers`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  if (
    !rooms.find((r) => r.id === room) ||
    !rooms.find((r) => r.users.includes(user.id))
  ) {
    return socket.emit('joinedRoom', { response: 'Unauthorised' })
  }

  io.of('room').sockets[`/room#${user.socketID}`].join(room)

  const roomUsers = rooms.find((r) => r.id === room).users
  const user2ID = roomUsers.find((u) => u !== user.id)
  user = users.find((u) => u.id === user.id)
  const user2 = users.find((u) => u.id === user2ID)

  const { data: user1Friends } = await axios({
    method: 'post',
    url: `${process.env.WEBSITE_URL}/graphql`,
    data: {
      query:
        'query Friends($userID: String!) { \
          getFriends(userID: $userID) { \
            friends { \
              username \
            } \
          } \
        }',
      variables: { userID: user.id },
    },
    headers: { 'Content-Type': 'application/json' },
  })

  let areFriends = null
  if (user1Friends.data.getFriends) {
    areFriends = user1Friends.data.getFriends.friends.find(
      (friend) => friend.username === user2.username
    )
  }

  if (areFriends) {
    await axios.post(`${process.env.WEBSITE_URL}/api/io/setRoomFriendStatus`, {
      token: process.env.IO_API_KEY,
      userID: user.id,
      areFriends,
    })

    io.of('room').to(`/room#${user.socketID}`).emit('alreadyFriends', {
      user: user2,
    })

    io.of('room').to(`/room#${user2.socketID}`).emit('alreadyFriends', {
      user,
    })
  }

  const userInterests = user.interests.map((interest) => {
    return interest.toLowerCase()
  })
  const user2Interests = user2.interests.map((interest) => {
    return interest.toLowerCase()
  })

  if (userInterests.length && user2Interests.length) {
    const interestsInCommon = userInterests.filter((interest) => {
      return user2Interests.includes(interest)
    })

    if (interestsInCommon.length) {
      notification(socket, io, 'interests', room, null, interestsInCommon)
    }
  }
}

const leaveRoom = async (socket, io, user) => {
  if (!user) return
  const { data: rooms } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getRooms`,
    {
      token: process.env.IO_API_KEY,
    }
  )
  const room = rooms.find((room) => room.users.find((u) => u === user.id))

  if (room) io.of('room').in(room.id).emit('userLeft')

  await axios.post(`${process.env.WEBSITE_URL}/api/io/deleteRoom`, {
    token: process.env.IO_API_KEY,
    userID: user.id,
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

const friendRequest = async (socket, io, user, room) => {
  const { data: users } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getUsers`,
    {
      token: process.env.IO_API_KEY,
    }
  )
  const { data: rooms } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getRooms`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  const r = rooms.find((r) => r.id === room)
  const receiverID = r.users.find((u) => u !== user.id)
  const receiver = users.find((u) => u.id === receiverID)

  io.of('room').to(`/room#${receiver.socketID}`).emit('friendRequest')
}

const acceptedFriend = async (socket, io, user, room) => {
  const { data: users } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getUsers`,
    {
      token: process.env.IO_API_KEY,
    }
  )
  const { data: rooms } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getRooms`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  const r = rooms.find((r) => r.id === room)
  const receiverID = r.users.find((u) => u !== user.id)
  const receiver = users.find((u) => u.id === receiverID)

  await axios.post(`${process.env.WEBSITE_URL}/api/io/setRoomFriendStatus`, {
    token: process.env.IO_API_KEY,
    userID: user.id,
    areFriends: true,
  })

  io.of('room').to(`/room#${receiver.socketID}`).emit('acceptedFriend', {
    user,
  })

  await axios({
    method: 'post',
    url: `${process.env.WEBSITE_URL}/graphql`,
    data: {
      query:
        'mutation Friend($userID: String! $friendID: String! $friendUsername: String!) { \
          addFriend(userID: $userID friendID: $friendID friendUsername: $friendUsername) \
        }',
      variables: {
        userID: user.id,
        friendID: receiver.id,
        friendUsername: receiver.username,
      },
    },
    headers: { 'Content-Type': 'application/json' },
  })
}

const rejectedFriend = async (socket, io, userID, room) => {
  const { data: users } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getUsers`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  const { data: rooms } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getRooms`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  const r = rooms.find((r) => r.id === room)
  const receiverID = r.users.find((u) => u !== userID)
  const receiver = users.find((u) => u.id === receiverID)

  io.of('room').to(`/room#${receiver.socketID}`).emit('rejectedFriend')
}

//  Messages

const typing = (socket, io, user, room) => {}

const messageHandler = async (socket, io, message) => {
  const { data: rooms } = await axios.post(
    `${process.env.WEBSITE_URL}/api/io/getRooms`,
    {
      token: process.env.IO_API_KEY,
    }
  )

  const room = rooms.find((room) => room.id === message.roomID)
  if (!room.areFriends) {
    message.userID = null
    message.username = null
  }

  io.of('room').in(room.id).emit('message', { msg: message })
}

const notification = (socket, io, type, roomID, user, interests) => {
  io.of('room').in(roomID).emit('notification', {
    type,
    user,
    interests,
  })
}

//  Users

const getSocketID = (socket, io) => {
  socket.emit('getSocketID', { socketID: socket.client.id })
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
    const updateUser = await axios.post(
      `${process.env.WEBSITE_URL}/api/io/updateUser`,
      {
        token: process.env.IO_API_KEY,
        userID: user.id,
        socketID: socket.client.id,
      }
    )
  }
}

const deleteUser = async (socket, io, user) => {
  if (user) return
  await axios.post(`${process.env.WEBSITE_URL}/api/io/deleteUser`, {
    token: process.env.IO_API_KEY,
    userID: user.id,
  })
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
    if (await isInRoom(socket, io, user)) {
      await leaveRoom(socket, io, user)
    }
    await deleteUser(socket, io, user)
  }
}
