import mongoose from "mongoose";
const { Schema, Types } = mongoose;
const fileSchema = new Schema({
    projectId: {type: Types.ObjectId, required: true, ref: 'Project'},
    dirpath: {type: String, default: "/"},
    fname: {type: String, required: true},
    extension: {type: String, default: "txt"},
    contents: {type: Buffer}
});
export default mongoose.model('File',fileSchema);