// Inside LoginPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";


export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useNavigate();

    const handleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email }); // or signInWithPassword
        setLoading(false);
        if (error) {
            alert("Login failed: " + error.message);
        } else {
            alert("Check your email for the login link!");
        }
    };

    useEffect(() => {
        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                // User is logged in, redirect to the application form
                router("/"); // Adjust the path as needed
            }
        });
    }, []);

    return (
        <div className="max-w-md mx-auto mt-20 space-y-4 text-center">
            <h1 className="text-2xl font-bold">Supervisor Login</h1>
            <input
                className="border p-2 w-full"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button
                onClick={handleLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-2"
                disabled={loading}
            >
                {loading ? "Sending..." : "Login with OTP"}
            </button>
        </div>
    );
}
