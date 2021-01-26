import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'
import { SessionSchema } from './models/Session'
import { createConnection } from 'mongoose'
import { FriendSchema } from './models/Friends'
import { SettingsSchema } from './models/Settings'

const sessionConn = createConnection(process.env.MONGODB_URL!, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
})

const SessionModel = sessionConn.model('Session', SessionSchema)

const settingsConn = createConnection(process.env.MONGODB_URL!, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
})

const SettingsModel = settingsConn.model('Settings', SettingsSchema)

const friendsConn = createConnection(process.env.MONGODB_URL!, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
})

const FriendModel = friendsConn.model('Friend', FriendSchema)

interface SessionData {
  id: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  scope: string
}

interface SettingsData {
  userID: string
  theme: string
}

interface FriendData {
  userID: string
  friendID: string
  friendUsername: string
}

const schema = buildSchema(`
  type Query {
    getSession(id: ID!): Session
    sessionExists(accessToken: String!): Session
    getSettings(userID: String!): Settings
    getFriends(userID: String!): FriendList
  }
  
  type Mutation {
    setSession(
      accessToken: String!
      refreshToken: String!
      expiresIn: Int!
      scope: String!
    ): Session!
    deleteSession(id: ID!): String
    setSettings(userID: String! theme: String!): Settings
    addFriend(
      userID: String!
      friendID: String!
      friendUsername: String!
    ): String
    removeFriend(userID: String! friendID: String!): String
  }
  
  type Session {
    id: ID!
    accessToken: String!
    expiresIn: Int!
    refreshToken: String!
    scope: String!
  }

  type Settings {
    userID: String!
    theme: String!
  }

  type Friend {
    id: String!
    username: String!
  }

  type FriendList {
    userID: String!
    friends: [Friend]!
  }
`)

const resolvers = {
  setSession: ({ accessToken, refreshToken, expiresIn, scope }: SessionData) =>
    SessionModel.create({
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresIn: expiresIn,
      scope: scope,
    }),
  deleteSession: ({ id }: SessionData) => SessionModel.findByIdAndDelete(id),
  getSession: ({ id }: SessionData) => SessionModel.findById(id),
  sessionExists: ({ accessToken }: SessionData) =>
    SessionModel.findOne({ accessToken: accessToken }),
  setSettings: async ({ userID, theme }: SettingsData) => {
    const settings = await SettingsModel.exists({ userID: userID })

    if (settings) {
      await SettingsModel.updateOne({ userID: userID }, { theme: theme })
    } else {
      await SettingsModel.create({
        userID: userID,
        theme: theme,
      })
    }

    return SettingsModel.findOne({ userID: userID })
  },
  getSettings: ({ userID }: SettingsData) =>
    SettingsModel.findOne({ userID: userID }),
  addFriend: async ({ userID, friendID, friendUsername }: FriendData) => {
    const friendList = await FriendModel.exists({ userID: userID })

    if (friendList) {
      const friend = await FriendModel.exists({
        userID: userID,
        friends: { id: friendID, username: friendUsername },
      })

      if (!friend) {
        await FriendModel.updateOne(
          { userID: userID },
          { $push: { friends: { id: friendID, username: friendUsername } } }
        )
      }
    } else {
      await FriendModel.create({ userID: userID })

      await FriendModel.updateOne(
        { userID: userID },
        { $push: { friends: { id: friendID, username: friendUsername } } }
      )
    }
  },
  getFriends: ({ userID }: FriendData) =>
    FriendModel.findOne({ userID: userID }),
  removeFriend: async ({ userID, friendID }: FriendData) => {
    await FriendModel.updateOne(
      { userID: userID },
      { $pull: { friends: { id: friendID } } }
    )

    await FriendModel.updateOne(
      { userID: friendID },
      { $pull: { friends: { id: userID } } }
    )
  },
}

export default {
  path: '/graphql',
  handler: graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: process.env.NODE_ENV === 'development',
  }),
}
