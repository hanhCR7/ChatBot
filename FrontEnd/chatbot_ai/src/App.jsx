// src/App.jsx
import ChatbotUI from "./Components/ChatbotUI";
import LoginPage from "./pages/LoginPage";
import { useState, useEffect } from "react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  };

  return isLoggedIn ? (
    <ChatbotUI token={token} />
  ) : (
    <LoginPage onLogin={handleLoginSuccess} />
  );
}

export default App;
