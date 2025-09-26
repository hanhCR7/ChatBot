import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import useAllChatUsers from "@/hooks/admin/AllChatUsers";

export default function AdminChatUserDetail() {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const { getAllMessageForChat } = useAllChatUsers();

  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const res = await getAllMessageForChat(user_id);
      setUserDetail(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [user_id]);

  if (loading) {
    return <div className="p-6">Đang tải dữ liệu...</div>;
  }

  if (!userDetail) {
    return <div className="p-6">Không tìm thấy dữ liệu user.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Nút quay lại */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Button>

      {/* Thông tin user */}
      <div className="space-y-1 border rounded-md p-4">
        <h2 className="text-xl font-semibold mb-2">Thông tin User</h2>
        <div>
          <strong>User ID:</strong> {userDetail.user_id}
        </div>
        <div>
          <strong>Username:</strong> {userDetail.username || "-"}
        </div>
        <div>
          <strong>Email:</strong> {userDetail.email || "-"}
        </div>
        <div>
          <strong>Số phiên chat:</strong> {userDetail.sessions.length}
        </div>
      </div>

      <Separator />

      {/* Danh sách session */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Danh sách Chat</h2>

        {userDetail.sessions.length === 0 ? (
          <div>Chưa có phiên chat nào</div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {userDetail.sessions.map((s, i) => (
              <AccordionItem key={s.id} value={`session-${s.id}`}>
                <AccordionTrigger>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold">
                      {i + 1}. {s.title || "Không có tiêu đề"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleString("vi-VN")} -{" "}
                      {s.message.length} tin nhắn
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {s.message.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      Không có tin nhắn
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Người gửi</TableHead>
                          <TableHead>Nội dung</TableHead>
                          <TableHead>Thời gian</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {s.message.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">
                              {m.role}
                            </TableCell>
                            <TableCell>{m.content}</TableCell>
                            <TableCell>
                              {new Date(m.created_at).toLocaleString("vi-VN")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
