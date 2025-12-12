import React, { useState } from "react";
import { Eye, EyeOff, Key } from "lucide-react";

export default function PasswordInput({ value, onChange, placeholder, id }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Key
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={20}
      />

      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder || "Mật khẩu"}
        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
      />

      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
