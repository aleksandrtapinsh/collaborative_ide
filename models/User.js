import mongoose, { model, mongo, Types } from "mongoose";
const Schema = mongoose.Schema
const userSchema = new Schema({
    username: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    projects: { type: [ { type: Types.ObjectId, ref: 'Project' } ], default: [] }
})
export default mongoose.model('User',userSchema)