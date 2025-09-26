// src/pages/admin/BannedKeywordsTable.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import useBannedKeywordsApi from "@/hooks/admin/banedKeywordsApi";

export default function BannedKeywordsTable() {
  const { getAllBannedKeywords, addBannedKeyword, deleteBannedKeyword } =
    useBannedKeywordsApi();

  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const data = await getAllBannedKeywords();
      setKeywords(data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleAdd = async () => {
    if (!newKeyword.trim()) return;
    await addBannedKeyword(newKeyword);
    setNewKeyword("");
    fetchKeywords();
  };

  const handleDelete = async (id) => {
    await deleteBannedKeyword(id);
    fetchKeywords();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Quản lý từ khóa bị cấm</h1>

      <div className="flex items-center gap-2">
        <input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Nhập từ khóa mới"
          className="border rounded px-3 py-2 w-full max-w-sm"
        />
        <Button onClick={handleAdd}>Thêm</Button>
      </div>

      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">STT</TableHead>
              <TableHead>Từ khóa</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3}>Đang tải...</TableCell>
              </TableRow>
            ) : keywords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>Chưa có từ khóa nào</TableCell>
              </TableRow>
            ) : (
              keywords.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.keyword}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      Xoá
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
