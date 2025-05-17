export default function ChatHeader({ title }) {
  return (
    <div className="bg-blue-600 text-white p-4 shadow-md">
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  );
}