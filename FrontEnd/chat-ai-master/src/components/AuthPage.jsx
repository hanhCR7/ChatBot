import { useState } from "react";
import LoginForm from "../components/LoginForm";
import OTPForm from "../components/OTPForm";

export default function AuthPage() {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");

  return (
    <div className="flex justify-center items-center h-screen bg-primaryBg-default">
      {step === 1 ? (
        <LoginForm onNext={() => setStep(2)} setUserId={setUserId} />
      ) : (
        <OTPForm userId={userId} />
      )}
    </div>
  );
}
