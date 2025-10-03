import { useEffect, useState } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import { useAdminImg } from "@/hooks/admin/useAdminImg";

export default function ImageManagement() {
  const {
    getAllImgUsers,
    deleteImage,
    updateImageDesc,
    searchImages,
    getStats,
  } = useAdminImg();

  const [images, setImages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    open: false,
    id: null,
    description: "",
  });

  // Load all images
  const fetchImages = async () => {
    setLoading(true);
    const data = await getAllImgUsers();
    setImages(data || []);
    setLoading(false);
  };

  // Load stats
  const fetchStats = async () => {
    const data = await getStats();
    setStats(data);
  };

  useEffect(() => {
    fetchImages();
    fetchStats();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      fetchImages();
    } else {
      const data = await searchImages(search);
      setImages(data);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateImageDesc(form.id, form.description);
    setForm({ open: false, id: null, description: "" });
    fetchImages();
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Image Management</h1>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <button
            type="submit"
            className="bg-emerald-600 text-white px-3 py-2 rounded flex items-center gap-1 hover:bg-emerald-700"
          >
            <Search size={16} /> Search
          </button>
        </form>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <p>Total Images: {stats.total_images}</p>
          <ul className="list-disc ml-6">
            {stats.by_user.map((u) => (
              <li key={u.user_id}>
                User {u.user_id}: {u.count} images
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Images Table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        {loading ? (
          <p>Loading...</p>
        ) : images.length === 0 ? (
          <p className="text-gray-500">No images found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">Preview</th>
                <th>Description</th>
                <th>User</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {images.map((img) => (
                <tr key={img.id} className="border-t">
                  <td className="p-2">
                    <img
                      src={img.url}
                      alt={img.description}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td>{img.description}</td>
                  <td>{img.user_id}</td>
                  <td className="text-right space-x-2">
                    <button
                      onClick={() =>
                        setForm({
                          open: true,
                          id: img.id,
                          description: img.description,
                        })
                      }
                      className="text-blue-600 hover:underline"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteImage(img.id).then(fetchImages)}
                      className="text-red-600 hover:underline"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Update */}
      {form.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Description</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm({ open: false, id: null, description: "" })
                  }
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
