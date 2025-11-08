import chatModel from "../models/chatModel.js";

const saveMessage = async (req, res) => {
    try {
        const { sender, message } = req.body;


        if (!sender || !message) {
            return res.status(400).json({ error: "Sender and message are required." });
        }

        const newChat = await chatModel.create({
            message: message,
            user: req.user.id,
            sender: sender
        });

        res.status(201).json({
            success: true,
            message: "Message saved successfully.",
            data: newChat
        });
    } catch (error) {
        console.error("Error saving message:", error);
        res.status(500).json({ error: "Server error while saving message." });
    }
};

const getAllChat = async (req, res) => {
    try {
        const chats = await chatModel.find({ user: req.user.id }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: chats.length,
            chats: chats
        });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Server error while fetching chat history." });
    }
};




export {
    saveMessage,
    getAllChat
}