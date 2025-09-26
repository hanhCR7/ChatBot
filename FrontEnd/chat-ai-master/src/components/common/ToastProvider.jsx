import { Toaster } from "sonner";

const ToastProvider = () => (
  <Toaster
    position="top-right"
    richColors
    closeButton
    toastOptions={{
      duration: 9000,
      success: {
        style: { background: "#4caf50", color: "#fff" },
      },
      error: {
        style: { background: "#f44336", color: "#fff" },
      },
      warning: {
        style: { background: "#ff9800", color: "#fff" },
      },
      info: {
        style: { background: "#2196f3", color: "#fff" },
      },
    }}
  />
);

export default ToastProvider;
