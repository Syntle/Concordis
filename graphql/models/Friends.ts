import { Schema } from 'mongoose'

const friend = new Schema(
  {
    id: { type: String },
    username: { type: String },
  },
  { _id: false }
)

export const FriendSchema = new Schema({
  userID: { type: String, required: true, unique: true },
  friends: [friend],
})
