import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = email input, 2 = OTP input
  const [loading, setLoading] = useState(false);
  const router = useNavigate();

  // Step 1: Request OTP
  const handleSendOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }, // Don't create new users automatically
    });
    setLoading(false);

    if (error) {
      alert("Failed to send OTP: " + error.message);
    } else {
      alert("OTP sent to your email!");
      setStep(2);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setLoading(false);

    if (error) {
      alert("OTP verification failed: " + error.message);
    } else {
      alert("Login successful!");
      router("/"); // Redirect after login
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 space-y-4 text-center">
      <h1 className="text-2xl font-bold">Supervisor Login</h1>

      {step === 1 && (
        <>
          <input
            className="border p-2 w-full"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleSendOtp}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-2"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            className="border p-2 w-full"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button
            onClick={handleVerifyOtp}
            className="bg-green-600 text-white px-4 py-2 rounded w-full mt-2"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
        </>
      )}
    </div>
  );
}
