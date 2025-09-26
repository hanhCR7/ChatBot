import React, { useMemo } from "react";
import { CheckCircle, XCircle } from "lucide-react";

const rules = [
    {
        label: "Ít nhất 8 ký tự",
        test: (pw) => pw.length >= 8,
    },
    {
        label: "Chứa chữ hoa (A-Z)",
        test: (pw) => /[A-Z]/.test(pw),
    },
    {
        label: "Chứa số (0-9)",
        test: (pw) => /[0-9]/.test(pw),
    },
    {
        label: "Chứa ký tự đặc biệt",
        test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw),
    }
];
export default function PasswordStrength({ password, onValidChange }) {
  const results = useMemo(
    () => rules.map((rule) => rule.test(password)),
    [password]
  );

  const isValid = results.every(Boolean);
  // callback cho parent biết khi nào allValid thay đổi
  React.useEffect(() => {
    if (onValidChange) onValidChange(isValid);
  }, [isValid, onValidChange]);

  return (
    <div className="mt-2 space-y-1">
      {rules.map((rule, index) => {
        const valid = results[index];
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            {valid ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className={valid ? "text-green-600" : "text-gray-500"}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}