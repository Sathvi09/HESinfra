import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
  "Puducherry", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu"
];

const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  email: z.string().email("Invalid email address"),
  presentAddress: z.string().min(10, "Address must be at least 10 characters"),
  state: z.string().min(1, "State is required"),
  maritalStatus: z.enum(["Single", "Married"]),
  numberOfChildren: z.number().min(0, "Number of children cannot be negative"),
  age: z.number().optional(),
  aadhaarCardUrl: z.string().optional(),
  panCardUrl: z.string().optional(),
  identityVerified: z.boolean().optional(),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
  data?: PersonalInfoData;
  onComplete: (data: { personalInfo: PersonalInfoData }) => void;
  onPrevious: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function PersonalInfoStep({
  data,
  onComplete,
  isLoading,
  setIsLoading,
}: PersonalInfoStepProps) {
  const { toast } = useToast();
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarUrl, setAadhaarUrl] = useState(data?.aadhaarCardUrl || "");
  const [panUrl, setPanUrl] = useState(data?.panCardUrl || "");
  const [identityVerified, setIdentityVerified] = useState(data?.identityVerified || false);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data || {
      numberOfChildren: 0,
    },
  });

  const watchedDateOfBirth = watch("dateOfBirth");

  // Calculate age automatically
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = watchedDateOfBirth ? calculateAge(watchedDateOfBirth) : 0;

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
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

  const handleFileUpload = async (file: File, type: 'aadhaar' | 'pan') => {
    try {
      setIsLoading(true);
      const url = await uploadFile(file, type);
      
      if (type === 'aadhaar') {
        setAadhaarUrl(url);
        setAadhaarFile(file);
      } else {
        setPanUrl(url);
        setPanFile(file);
      }
      
      toast({
        title: "File uploaded successfully",
        description: `${type === 'aadhaar' ? 'Aadhaar' : 'PAN'} card uploaded.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyIdentity = async () => {
    if (!aadhaarFile || !panFile) {
      toast({
        title: "Missing files",
        description: "Please upload both Aadhaar and PAN card images.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("aadhaar_file", aadhaarFile);
      formData.append("pan_file", panFile);
  
      const response = await fetch("http://127.0.0.1:8000/verify-identity", {
        method: "POST",
        body: formData,
      });
  
      const result = await response.json();
  
      if (result.success) {
        setIdentityVerified(true);
        toast({
          title: "Verified ",
          description: `Name: ${result.aadhaar_name}, DOB: ${result.pan_dob}`,
        });
      } else {
        toast({
          title: "Verification failed",
          description: `Aadhaar or PAN OCR did not extract required info.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "API error",
        description: "Failed to verify identity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const onSubmit = (formData: PersonalInfoData) => {
    if (!identityVerified) {
      toast({
        title: "Identity verification required",
        description: "Please verify your identity before proceeding.",
        variant: "destructive",
      });
      return;
    }

    const personalInfo: PersonalInfoData = {
      ...formData,
      age,
      aadhaarCardUrl: aadhaarUrl,
      panCardUrl: panUrl,
      identityVerified,
    };

    onComplete({ personalInfo });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            {...register("fullName")}
            placeholder="Enter your full name"
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            {...register("dateOfBirth")}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={age}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            {...register("phoneNumber")}
            placeholder="Enter 10-digit mobile number"
          />
          {errors.phoneNumber && (
            <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select onValueChange={(value) => setValue("state", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maritalStatus">Marital Status *</Label>
          <Select onValueChange={(value) => setValue("maritalStatus", value as "Single" | "Married")}>
            <SelectTrigger>
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Married">Married</SelectItem>
            </SelectContent>
          </Select>
          {errors.maritalStatus && (
            <p className="text-sm text-destructive">{errors.maritalStatus.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfChildren">Number of Children</Label>
          <Input
            id="numberOfChildren"
            type="number"
            min="0"
            {...register("numberOfChildren", { valueAsNumber: true })}
          />
          {errors.numberOfChildren && (
            <p className="text-sm text-destructive">{errors.numberOfChildren.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="presentAddress">Present Address *</Label>
        <Textarea
          id="presentAddress"
          {...register("presentAddress")}
          placeholder="Enter your current address"
          rows={3}
        />
        {errors.presentAddress && (
          <p className="text-sm text-destructive">{errors.presentAddress.message}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Identity Verification
            {identityVerified && <CheckCircle className="h-5 w-5 text-green-600" />}
            {!identityVerified && aadhaarUrl && panUrl && <XCircle className="h-5 w-5 text-red-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Aadhaar Card *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <input
                  ref={aadhaarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'aadhaar');
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => aadhaarInputRef.current?.click()}
                  className="w-full"
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {aadhaarUrl ? 'Change Aadhaar Card' : 'Upload Aadhaar Card'}
                </Button>
                {aadhaarUrl && (
                  <p className="text-sm text-green-600 mt-2">✓ Aadhaar card uploaded</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>PAN Card *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <input
                  ref={panInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'pan');
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => panInputRef.current?.click()}
                  className="w-full"
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {panUrl ? 'Change PAN Card' : 'Upload PAN Card'}
                </Button>
                {panUrl && (
                  <p className="text-sm text-green-600 mt-2">✓ PAN card uploaded</p>
                )}
              </div>
            </div>
          </div>

          {aadhaarUrl && panUrl && !identityVerified && (
            <Button
              type="button"
              onClick={verifyIdentity}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify Identity"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !identityVerified}>
          {isLoading ? "Processing..." : "Next Step"}
        </Button>
      </div>
    </form>
  );
}