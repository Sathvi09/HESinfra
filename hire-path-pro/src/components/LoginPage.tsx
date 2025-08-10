import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const router = useNavigate();

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });
    setLoading(false);

    if (error) {
      alert("Failed to send OTP: " + error.message);
    } else {
      alert("OTP sent to your email");
      setOtpSent(true);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("Please enter the OTP");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    });
    setLoading(false);

    if (error) {
      alert("Invalid OTP: " + error.message);
    } else if (data.session) {
      alert("Login successful!");
      router("/"); // ✅ Redirect to ApplicationForm
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 space-y-4 text-center">
      <h1 className="text-2xl font-bold">Supervisor Login</h1>

      {!otpSent ? (
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
      ) : (
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
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </>
      )}
    </div>
  );
}
