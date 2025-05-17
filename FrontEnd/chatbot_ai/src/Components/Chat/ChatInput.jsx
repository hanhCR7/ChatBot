// src/components/Chat/ChatInput.jsx
import { Paperclip, Send, XCircle } from 'lucide-react';

export default function ChatInput({ inputValue, setInputValue, handleKeyPress, handleSendMessage, handleAttachmentClick, removeAttachment, attachment, fileInputRef, handleFileChange }) {
  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {attachment && (
        <div className="bg-gray-100 border-t border-gray-200 p-2">
          <div className="flex items-center bg-white rounded-lg p-2 w-full max-w-xs">
            <div className="flex-1 truncate text-sm">
              📎 {attachment.name} ({Math.round(attachment.size / 1024)} KB)
            </div>
            <button onClick={removeAttachment} className="ml-2 text-gray-500 hover:text-gray-700">
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={handleAttachmentClick}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <Paperclip size={20} />
        </button>
        <div className="flex-1 mx-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={1}
          />
        </div>
        <button
          onClick={handleSendMessage}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={inputValue.trim() === '' && !attachment}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}