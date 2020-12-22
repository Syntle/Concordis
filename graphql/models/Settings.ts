import { Schema } from 'mongoose'

export const SettingsSchema = new Schema({
  userID: { type: String, required: true, unique: true },
  theme: { type: String, required: true },
})
