// components/Chat/Suggestions.jsx
export default function Suggestions({ onPromptClick }) {
  const prompts = [
    "Tôi có thể làm gì với mã JavaScript này?",
    "Tạo mô tả sản phẩm hấp dẫn",
    "Cách cải thiện giấc ngủ của tôi",
  ];

  return (
    <div className="px-6 py-10 space-y-4">
      <h2 className="text-xl font-bold text-gray-700">Bạn muốn hỏi điều gì?</h2>
      {prompts.map((p, i) => (
        <button key={i} onClick={() => onPromptClick(p)} className="block w-full bg-gray-100 hover:bg-gray-200 text-left px-4 py-2 rounded-lg">
          {p}
        </button>
      ))}
    </div>
  );
}
