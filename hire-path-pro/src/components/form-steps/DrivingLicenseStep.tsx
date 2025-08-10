import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VEHICLE_CLASSES = [
  "LMV (Light Motor Vehicle)",
  "HMV (Heavy Motor Vehicle)", 
  "3W (Three Wheeler)",
  "2W (Two Wheeler)",
  "TRANS (Transport Vehicle)",
  "PSV (Public Service Vehicle)",
];

const drivingLicenseSchema = z.object({
  hasDrivingLicense: z.boolean(),
  licenseNumber: z.string().optional(),
  licenseIssueDate: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
  issuingAuthority: z.string().optional(),
  vehicleClasses: z.array(z.string()).optional(),
  drivingLicenseUrl: z.string().optional(),
  licenseVerified: z.boolean().optional(),
}).refine((data) => {
  if (data.hasDrivingLicense) {
    return data.licenseNumber && data.licenseIssueDate && data.licenseExpiryDate && data.issuingAuthority;
  }
  return true;
}, {
  message: "All license fields are required when you have a driving license",
  path: ["licenseNumber"],
});

type DrivingLicenseData = z.infer<typeof drivingLicenseSchema>;

interface DrivingLicenseStepProps {
  data?: DrivingLicenseData;
  onComplete: (data: { drivingLicense: DrivingLicenseData }) => void;
  onPrevious: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function DrivingLicenseStep({
  data,
  onComplete,
  onPrevious,
  isLoading,
  setIsLoading,
}: DrivingLicenseStepProps) {
  const { toast } = useToast();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState(data?.drivingLicenseUrl || "");
  const [licenseVerified, setLicenseVerified] = useState(data?.licenseVerified || false);
  const [selectedVehicleClasses, setSelectedVehicleClasses] = useState<string[]>(data?.vehicleClasses || []);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DrivingLicenseData>({
    resolver: zodResolver(drivingLicenseSchema),
    defaultValues: data || {
      hasDrivingLicense: false,
      licenseVerified: false,
    },
  });

  const watchedHasLicense = watch("hasDrivingLicense");

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `driving-license/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('hr-documents')
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('hr-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      const url = await uploadFile(file);
      setLicenseUrl(url);
      setLicenseFile(file);
      setValue("drivingLicenseUrl", url);
      
      toast({
        title: "License uploaded",
        description: "Driving license uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload license. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLicense = async () => {
    if (!licenseFile) {
      toast({
        title: "License required",
        description: "Please upload your driving license before verification.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      setIsLoading(true);
  
      const formData = new FormData();
      formData.append("licence_file", licenseFile);
  
      const response = await fetch("https://hesinfra.onrender.com/verify-driving-licence", {
        method: "POST",
        body: formData,
      });
  
      const result = await response.json();
  
      if (response.ok && result.success) {
        setValue("licenseNumber", result.licence_number || "");
        setValue("licenseIssueDate", result.issue_date || "");
        setValue("licenseExpiryDate", result.valid_till || "");
        setLicenseVerified(true);
        setValue("licenseVerified", true);
  
        toast({
          title: "License verified ✅",
          description: `DL Number: ${result.licence_number || "Not found"}, Issued: ${result.issue_date || "NA"}, Valid till: ${result.valid_till || "NA"}`,
        });
      } else {
        toast({
          title: "Verification failed ❌",
          description: "Could not extract license details. Please enter manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("License verification error:", error);
      toast({
        title: "Verification error",
        description: "Something went wrong during verification. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleVehicleClassChange = (vehicleClass: string, checked: boolean) => {
    let updatedClasses;
    if (checked) {
      updatedClasses = [...selectedVehicleClasses, vehicleClass];
    } else {
      updatedClasses = selectedVehicleClasses.filter(cls => cls !== vehicleClass);
    }
    setSelectedVehicleClasses(updatedClasses);
    setValue("vehicleClasses", updatedClasses);
  };

  const onSubmit = (formData: DrivingLicenseData) => {
    if (formData.hasDrivingLicense && !licenseVerified) {
      toast({
        title: "License verification required",
        description: "Please verify your driving license before proceeding.",
        variant: "destructive",
      });
      return;
    }

    const drivingLicense: DrivingLicenseData = {
      ...formData,
      vehicleClasses: selectedVehicleClasses,
      drivingLicenseUrl: licenseUrl,
      licenseVerified,
    };

    onComplete({ drivingLicense });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Driving License Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasDrivingLicense"
                checked={watchedHasLicense}
                onCheckedChange={(checked) => setValue("hasDrivingLicense", checked as boolean)}
              />
              <Label htmlFor="hasDrivingLicense" className="text-sm font-medium">
                Do you hold a valid motor vehicle driving license?
              </Label>
            </div>

            {watchedHasLicense && (
              <div className="space-y-4 pl-6 border-l-2 border-muted">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      {...register("licenseNumber")}
                      placeholder="Enter license number"
                    />
                    {errors.licenseNumber && (
                      <p className="text-sm text-destructive">{errors.licenseNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issuingAuthority">Issuing Authority *</Label>
                    <Input
                      id="issuingAuthority"
                      {...register("issuingAuthority")}
                      placeholder="Enter issuing authority"
                    />
                    {errors.issuingAuthority && (
                      <p className="text-sm text-destructive">{errors.issuingAuthority.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseIssueDate">Date of Issue *</Label>
                    <Input
                      id="licenseIssueDate"
                      type="date"
                      {...register("licenseIssueDate")}
                    />
                    {errors.licenseIssueDate && (
                      <p className="text-sm text-destructive">{errors.licenseIssueDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseExpiryDate">Date of Expiry *</Label>
                    <Input
                      id="licenseExpiryDate"
                      type="date"
                      {...register("licenseExpiryDate")}
                    />
                    {errors.licenseExpiryDate && (
                      <p className="text-sm text-destructive">{errors.licenseExpiryDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Class of Vehicles Authorized</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {VEHICLE_CLASSES.map((vehicleClass) => (
                      <div key={vehicleClass} className="flex items-center space-x-2">
                        <Checkbox
                          id={vehicleClass}
                          checked={selectedVehicleClasses.includes(vehicleClass)}
                          onCheckedChange={(checked) => handleVehicleClassChange(vehicleClass, checked as boolean)}
                        />
                        <Label htmlFor={vehicleClass} className="text-sm">
                          {vehicleClass}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      License Verification
                      {licenseVerified && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {!licenseVerified && licenseUrl && <XCircle className="h-5 w-5 text-red-600" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Driving License *</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                        <input
                          ref={licenseInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => licenseInputRef.current?.click()}
                          className="w-full"
                          disabled={isLoading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {licenseUrl ? 'Change Driving License' : 'Upload Driving License'}
                        </Button>
                        {licenseUrl && (
                          <p className="text-sm text-green-600 mt-2">✓ Driving license uploaded</p>
                        )}
                      </div>
                    </div>

                    {licenseUrl && !licenseVerified && (
                      <Button
                        type="button"
                        onClick={verifyLicense}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? "Verifying..." : "Verify License"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button type="submit" disabled={isLoading || (watchedHasLicense && !licenseVerified)}>
          {isLoading ? "Processing..." : "Next Step"}
        </Button>
      </div>
    </form>
  );
}