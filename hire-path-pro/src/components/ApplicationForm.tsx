import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // adjust if needed
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PersonalInfoStep from "./form-steps/PersonalInfoStep";
import EducationStep from "./form-steps/EducationStep";
import DrivingLicenseStep from "./form-steps/DrivingLicenseStep";
import EmploymentHistoryStep from "./form-steps/EmploymentHistoryStep";
import ApplicationSummary from "./form-steps/ApplicationSummary";
import LoginPage from "./LoginPage";

export interface ApplicationData {
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    age?: number;
    phoneNumber: string;
    email: string;
    presentAddress: string;
    state: string;
    maritalStatus: "Single" | "Married";
    numberOfChildren: number;
    aadhaarCardUrl?: string;
    panCardUrl?: string;
    identityVerified?: boolean;
  };
  education?: Array<{
    levelOfEducation: string;
    institutionName: string;
    institutionAddress: string;
    completionYear: number;
    completionMonth: number;
    marksObtained: number;
    maximumMarks: number;
    percentage: number;
    certificateUrl?: string;
  }>;
  drivingLicense?: {
    hasDrivingLicense: boolean;
    licenseNumber?: string;
    licenseIssueDate?: string;
    licenseExpiryDate?: string;
    issuingAuthority?: string;
    vehicleClasses?: string[];
    drivingLicenseUrl?: string;
    licenseVerified: boolean;
  };
  employmentHistory?: Array<{
    employerName: string;
    designation: string;
    address: string;
    joiningDate: string;
    leavingDate?: string;
    takeHomeSalary?: number;
    reasonForLeaving?: string;
    mayContactEmployer: boolean;
    certificateUrl?: string;
  }>;
}

const STEPS = [
  { id: 1, title: "Personal Information", description: "Basic details and identity verification" },
  { id: 2, title: "Education", description: "Educational qualifications and certificates" },
  { id: 3, title: "Driving License", description: "License verification and details" },
  { id: 4, title: "Employment History", description: "Work experience and certificates" },
  { id: 5, title: "Summary", description: "Review and submit application" },
];

export default function ApplicationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null); // track auth state
  const router = useNavigate(); // Adjust if using react-router or next/router

  // 🔐 Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!data.user || error) {
        setAuthenticated(false); // ❌ Not logged in
        router("/login"); // Redirect to login page
      } else {
        setAuthenticated(true); // ✅ Logged in
      }
    };

    checkAuth();
  }, []);

  // ⏳ Optional loading state
  if (authenticated === null) {
    return <div className="text-center mt-10 text-gray-500">Checking authentication...</div>;
  }

  const handleStepComplete = (stepData: any) => {
    setApplicationData(prev => ({
      ...prev,
      ...stepData,
    }));
  
    // Allow navigation without validation
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            data={applicationData.personalInfo}
            onComplete={handleStepComplete}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 2:
        return (
          <EducationStep
            data={applicationData.education}
            onComplete={handleStepComplete}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 3:
        return (
          <DrivingLicenseStep
            data={applicationData.drivingLicense}
            onComplete={handleStepComplete}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 4:
        return (
          <EmploymentHistoryStep
            data={applicationData.employmentHistory}
            onComplete={handleStepComplete}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 5:
        return (
          <ApplicationSummary
            data={applicationData}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              HR Job Application Form
            </CardTitle>
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`text-center flex-1 ${
                      currentStep === step.id
                        ? "text-primary font-medium"
                        : currentStep > step.id
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    <div className="hidden sm:block">
                      <div className="font-medium">Step {step.id}</div>
                      <div className="text-xs">{step.title}</div>
                    </div>
                    <div className="sm:hidden">
                      {step.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            {renderStep()}
            <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Next
            </button>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}