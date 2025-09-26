export default function TestHover() {
  return (
    <div className="group relative px-4 py-2 flex items-center bg-gray-900 text-white rounded-md w-72 mt-8">
      <span className="flex-1">Test Hover</span>
      <div className="hidden group-hover:flex absolute right-2 top-1/2 -translate-y-1/2 z-50">
        <button className="h-8 w-8 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600">
          <span className="text-xl">...</span>
        </button>
      </div>
    </div>
  );
}
