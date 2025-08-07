import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, User, GraduationCap, Car, Briefcase } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ApplicationData } from "../ApplicationForm";

interface ApplicationSummaryProps {
  data: ApplicationData;
  onPrevious: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ApplicationSummary({
  data,
  onPrevious,
  isLoading,
  setIsLoading,
}: ApplicationSummaryProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitApplication = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to submit your application.",
          variant: "destructive",
        });
        return;
      }

      // Insert main application data
      const { data: applicationResult, error: applicationError } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          full_name: data.personalInfo?.fullName,
          date_of_birth: data.personalInfo?.dateOfBirth,
          age: data.personalInfo?.age,
          phone_number: data.personalInfo?.phoneNumber,
          email: data.personalInfo?.email,
          present_address: data.personalInfo?.presentAddress,
          state: data.personalInfo?.state,
          marital_status: data.personalInfo?.maritalStatus,
          number_of_children: data.personalInfo?.numberOfChildren,
          aadhaar_card_url: data.personalInfo?.aadhaarCardUrl,
          pan_card_url: data.personalInfo?.panCardUrl,
          identity_verified: data.personalInfo?.identityVerified || false,
          has_driving_license: data.drivingLicense?.hasDrivingLicense || false,
          license_number: data.drivingLicense?.licenseNumber,
          license_issue_date: data.drivingLicense?.licenseIssueDate,
          license_expiry_date: data.drivingLicense?.licenseExpiryDate,
          issuing_authority: data.drivingLicense?.issuingAuthority,
          vehicle_classes: data.drivingLicense?.vehicleClasses,
          driving_license_url: data.drivingLicense?.drivingLicenseUrl,
          license_verified: data.drivingLicense?.licenseVerified || false,
          status: 'submitted',
          current_step: 5,
        })
        .select()
        .single();

      if (applicationError) {
        throw applicationError;
      }

      // Insert education records
      if (data.education && data.education.length > 0) {
        const educationRecords = data.education.map(edu => ({
          application_id: applicationResult.id,
          level_of_education: edu.levelOfEducation,
          institution_name: edu.institutionName,
          institution_address: edu.institutionAddress,
          completion_year: edu.completionYear,
          completion_month: edu.completionMonth,
          marks_obtained: edu.marksObtained,
          maximum_marks: edu.maximumMarks,
          // percentage: edu.percentage,
          certificate_url: edu.certificateUrl,
        }));

        const { error: educationError } = await supabase
          .from('education')
          .insert(educationRecords);

        if (educationError) {
          throw educationError;
        }
      }

      // Insert employment history records
      if (data.employmentHistory && data.employmentHistory.length > 0) {
        const employmentRecords = data.employmentHistory.map(emp => ({
          application_id: applicationResult.id,
          employer_name: emp.employerName,
          designation: emp.designation,
          address: emp.address,
          joining_date: emp.joiningDate,
          leaving_date: emp.leavingDate,
          take_home_salary: emp.takeHomeSalary,
          reason_for_leaving: emp.reasonForLeaving,
          may_contact_employer: emp.mayContactEmployer,
          certificate_url: emp.certificateUrl,
        }));

        const { error: employmentError } = await supabase
          .from('employment_history')
          .insert(employmentRecords);

        if (employmentError) {
          throw employmentError;
        }
      }

      setIsSubmitted(true);
      toast({
        title: "Application submitted successfully!",
        description: "Your job application has been submitted and is under review.",
      });

    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message || error);
      toast({
        title: "Submission failed",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Application Submitted Successfully!</h2>
          <p className="text-muted-foreground">
            Thank you for your application. We will review your submission and contact you soon.
          </p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm">
            <strong>What's next?</strong><br />
            • We will review your application within 2-3 business days<br />
            • You will receive an email confirmation shortly<br />
            • If selected, we will contact you for the next steps
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Application Summary</h2>
        <p className="text-muted-foreground">
          Please review your information before submitting your application.
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
            {data.personalInfo?.identityVerified && (
              <Badge variant="secondary" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Name:</strong> {data.personalInfo?.fullName}</div>
            <div><strong>Age:</strong> {data.personalInfo?.age}</div>
            <div><strong>Phone:</strong> {data.personalInfo?.phoneNumber}</div>
            <div><strong>Email:</strong> {data.personalInfo?.email}</div>
            <div><strong>State:</strong> {data.personalInfo?.state}</div>
            <div><strong>Marital Status:</strong> {data.personalInfo?.maritalStatus}</div>
            <div className="md:col-span-2">
              <strong>Address:</strong> {data.personalInfo?.presentAddress}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education ({data.education?.length || 0} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.education && data.education.length > 0 ? (
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div key={index} className="border rounded-lg p-3 text-sm">
                  <div className="font-medium">{edu.levelOfEducation}</div>
                  <div>{edu.institutionName}</div>
                  <div className="text-muted-foreground">
                    {edu.completionYear} • {edu.percentage}% ({edu.marksObtained}/{edu.maximumMarks})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No education records added.</p>
          )}
        </CardContent>
      </Card>

      {/* Driving License */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Driving License
            {data.drivingLicense?.licenseVerified && (
              <Badge variant="secondary" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.drivingLicense?.hasDrivingLicense ? (
            <div className="space-y-2 text-sm">
              <div><strong>License Number:</strong> {data.drivingLicense.licenseNumber}</div>
              <div><strong>Issuing Authority:</strong> {data.drivingLicense.issuingAuthority}</div>
              <div><strong>Valid Until:</strong> {data.drivingLicense.licenseExpiryDate}</div>
              {data.drivingLicense.vehicleClasses && data.drivingLicense.vehicleClasses.length > 0 && (
                <div>
                  <strong>Vehicle Classes:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.drivingLicense.vehicleClasses.map((cls, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No driving license</p>
          )}
        </CardContent>
      </Card>

      {/* Employment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Employment History ({data.employmentHistory?.length || 0} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.employmentHistory && data.employmentHistory.length > 0 ? (
            <div className="space-y-4">
              {data.employmentHistory.map((emp, index) => (
                <div key={index} className="border rounded-lg p-3 text-sm">
                  <div className="font-medium">{emp.designation}</div>
                  <div>{emp.employerName}</div>
                  <div className="text-muted-foreground">
                    {emp.joiningDate} {emp.leavingDate && `to ${emp.leavingDate}`}
                    {emp.takeHomeSalary && ` • ₹${emp.takeHomeSalary.toLocaleString()}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No employment history added.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={submitApplication} 
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </div>
  );
}