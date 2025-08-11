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
      setTimeout(async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          router("/"); // Redirect to form page
        } else {
          alert("Session not ready yet. Please try again.");
        }
      }, 500);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router("/");
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Supervisor Login
        </h1>

        {!otpSent ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={handleSendOtp}
              className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-lg w-full mt-4 font-medium"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              onClick={handleVerifyOtp}
              className="bg-green-600 hover:bg-green-700 transition-colors text-white px-4 py-2 rounded-lg w-full mt-4 font-medium"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={() => setOtpSent(false)}
              className="text-sm text-blue-600 mt-4 hover:underline"
            >
              Back to Email Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
