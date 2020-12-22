import { Schema } from 'mongoose'

export const SessionSchema = new Schema({
  accessToken: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: true, unique: true },
  expiresIn: { type: Number, required: true },
  scope: { type: String, required: true },
})
