import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/app";  // Đường dẫn tới file store redux của bạn
import Routes from "./routes/Routes";  // Đường dẫn tới file router của bạn
import './index.css';
import ToastProvider from "./components/common/ToastProvider";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <Routes />
      <ToastProvider />
    </Provider>
  </React.StrictMode>
);
