import mongoose, { model, mongo, Types } from "mongoose";
const { Schema, Types } = mongoose;
const projectSchema = new Schema({
    name: {type: String},
    owner: {type: Types.ObjectId, required: true, ref: 'User'},
    sharedWith: [ {type: Types.ObjectId, ref: 'User'} ],
    dateCreated: {type: Date, required: true}
});
export default mongoose.model('Project',projectSchema);