import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ApplicationForm from "@/components/ApplicationForm";
import LoginPage from "@/components/LoginPage"

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  if (isAuthenticated === null) {
    return <div className="text-center mt-10">Checking authentication...</div>;
  }

  return isAuthenticated ? <ApplicationForm /> : <LoginPage />;
};

export default Index;

