import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Upload } from "lucide-react";
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
  const [selectedVehicleClasses, setSelectedVehicleClasses] = useState<string[]>(data?.vehicleClasses || []);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DrivingLicenseData>({
    resolver: zodResolver(drivingLicenseSchema),
    defaultValues: data || {
      hasDrivingLicense: false,
    },
  });

  const watchedHasLicense = watch("hasDrivingLicense");

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `driving-license/${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('hr-documents')
      .upload(fileName, file);

    if (error) throw error;

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

      // Call backend to extract license details
      const formData = new FormData();
      formData.append("licence_file", file);

      const res = await fetch("https://hesinfra.onrender.com/verify-driving-licence", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        if (result.licence_number) setValue("licenseNumber", result.licence_number);
        if (result.issue_date) setValue("licenseIssueDate", result.issue_date);
        if (result.valid_till) setValue("licenseExpiryDate", result.valid_till);
        if (result.issuing_authority) setValue("issuingAuthority", result.issuing_authority);
        if (result.vehicle_classes && Array.isArray(result.vehicle_classes)) {
          setSelectedVehicleClasses(result.vehicle_classes);
          setValue("vehicleClasses", result.vehicle_classes);
        }

        toast({
          title: "Data Extracted",
          description: "License details auto-filled successfully",
        });
      } else {
        toast({
          title: "Extraction failed",
          description: "Could not auto-fill details. Please enter manually.",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Upload error",
        description: "Something went wrong while processing the license.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleClassChange = (vehicleClass: string, checked: boolean) => {
    let updatedClasses = checked
      ? [...selectedVehicleClasses, vehicleClass]
      : selectedVehicleClasses.filter(cls => cls !== vehicleClass);
    setSelectedVehicleClasses(updatedClasses);
    setValue("vehicleClasses", updatedClasses);
  };

  const onSubmit = (formData: DrivingLicenseData) => {
    onComplete({
      drivingLicense: {
        ...formData,
        vehicleClasses: selectedVehicleClasses,
        drivingLicenseUrl: licenseUrl,
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Driving License Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Checkbox for license possession */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDrivingLicense"
              checked={watchedHasLicense}
              onCheckedChange={(checked) => setValue("hasDrivingLicense", checked as boolean)}
            />
            <Label htmlFor="hasDrivingLicense" className="text-sm font-medium">
              Do you hold a valid driving license?
            </Label>
          </div>

          {watchedHasLicense && (
            <div className="space-y-4 pl-6 border-l-2 border-muted">
              {/* Upload first */}
              <div className="space-y-2">
                <Label>Upload Driving License *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    ref={licenseInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => licenseInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {licenseUrl ? 'Change License' : 'Upload License'}
                  </Button>
                  {licenseUrl && (
                    <p className="text-sm text-green-600 mt-2">✓ License uploaded</p>
                  )}
                </div>
              </div>

              {/* Auto-filled inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>License Number</Label>
                  <Input {...register("licenseNumber")} />
                </div>
                <div>
                  <Label>Issuing Authority</Label>
                  <Input {...register("issuingAuthority")} />
                </div>
                <div>
                  <Label>Date of Issue</Label>
                  <Input type="date" {...register("licenseIssueDate")} />
                </div>
                <div>
                  <Label>Date of Expiry</Label>
                  <Input type="date" {...register("licenseExpiryDate")} />
                </div>
              </div>

              {/* Vehicle Classes */}
              <div className="space-y-3">
                <Label>Class of Vehicles</Label>
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
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : "Next Step"}
        </Button>
      </div>
    </form>
  );
}
