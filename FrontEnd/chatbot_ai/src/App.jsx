// src/App.jsx
import ChatbotUI from "./Components/ChatbotUI";
import LoginPage from "./pages/LoginPage";
import { useState, useEffect } from "react";
import { ChatProvider } from "./contexts/ChatContext.jsx";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return isLoggedIn ? (
    <ChatProvider>
      <ChatbotUI />
    </ChatProvider>
  ) : (
    <LoginPage onLogin={handleLoginSuccess} />
  );
}
