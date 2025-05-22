import { Paperclip, Send, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function ChatInput({
  inputValue,
  setInputValue,
  handleKeyPress,
  handleSendMessage,
  handleAttachmentClick,
  removeAttachment,
  attachment,
  fileInputRef,
  handleFileChange,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [inputValue]);

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {attachment && (
        <div className="mb-2 flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2">
          <span className="text-sm truncate">
            📎 {attachment.name} ({Math.round(attachment.size / 1024)} KB)
          </span>
          <button onClick={removeAttachment} className="text-gray-500 hover:text-red-500">
            <XCircle size={18} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={handleAttachmentClick}
          className="p-2 text-gray-500 hover:text-gray-700 transition"
        >
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-300 bg-white py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
        />

        <button
          onClick={handleSendMessage}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={inputValue.trim() === '' && !attachment}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
