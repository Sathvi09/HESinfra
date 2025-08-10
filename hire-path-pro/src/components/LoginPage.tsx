import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);

    if (error) {
      alert("Error sending OTP: " + error.message);
    } else {
      setOtpSent(true);
      alert("OTP sent to your email");
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setLoading(false);

    if (error) {
      alert("Invalid OTP: " + error.message);
    } else {
      alert("Login successful!");
      
      // ✅ Wait for Supabase to update session
      setTimeout(async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          router("/"); // Redirect to form page
        } else {
          alert("Session not ready yet. Please try again.");
        }
      }, 500); // Small delay to allow session persistence
    }
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router("/");
      }
    });
  }, []);

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
