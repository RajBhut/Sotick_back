import mongoose from "mongoose";
 const chatSchema = new mongoose.Schema({
        message: {
            type: String,
            required: true,
        },
        sender: {
            type: String,
            required: true,
        },
        receiver: {
            type: String,
            required: true,
 }},{timestamps:true});
    const Chat = mongoose.model("Chat", chatSchema);
    export default Chat;