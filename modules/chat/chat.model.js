const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    conversation_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Conversation", 
      required: true, 
      index: true 
    },
    sender_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    sender_role: { 
      type: String, enum: ["driver", "rider", "system"], 
      required: true 
    },
    message: { 
      type: String, 
      required: true },
    reply_to: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "ChatMessage", 
      default: null 
    },
    deleted: { 
      type: Boolean, 
      default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversation_id: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);


