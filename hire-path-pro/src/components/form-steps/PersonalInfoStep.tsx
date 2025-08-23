import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
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
  secondaryPhoneNumber: z.string().optional(),
  email: z.string().email("Invalid email address"),
  presentAddress: z.string().min(10, "Address must be at least 10 characters"),
  secondaryAddress: z.string().optional(),
  state: z.string().min(1, "State is required"),
  maritalStatus: z.enum(["Single", "Married"]),
  numberOfChildren: z.number().min(0, "Number of children cannot be negative"),
  age: z.number().optional(),
  aadhaarNumber: z.string().optional(),
  panNumber: z.string().optional(),
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
  const [aadhaarFileName, setAadhaarFileName] = useState<string | null>(null);
  const [panFileName, setPanFileName] = useState<string | null>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data || {
      numberOfChildren: 0,
    },
  });

  const watchedDateOfBirth = watch("dateOfBirth");

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = watchedDateOfBirth ? calculateAge(watchedDateOfBirth) : 0;

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("hr-documents")
      .upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from("hr-documents")
      .getPublicUrl(fileName);
    return publicUrl;
  };

  const handleBothFilesUploaded = async (aadhaar: File, pan: File) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("aadhaar_file", aadhaar);
      formData.append("pan_file", pan);

      const res = await fetch("https://hesinfra.onrender.com/extract-personal-info", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.fullName) setValue("fullName", result.fullName);
      if (result.dateOfBirth) {
        // Convert DD/MM/YYYY or DD-MM-YYYY -> YYYY-MM-DD
        const parts = result.dateOfBirth.split(/[\/-]/);
        if (parts.length === 3) {
          const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`; // "1992-12-14"
          setValue("dateOfBirth", formatted);
        } else {
          setValue("dateOfBirth", result.dateOfBirth);
        }
      }
      if (result.presentAddress) setValue("presentAddress", result.presentAddress);
      if (result.state) setValue("state", result.state);
      if (result.mobileNumber) setValue("phoneNumber", result.mobileNumber);
      if (result.aadhaarNumber) setValue("aadhaarNumber", result.aadhaarNumber);
      if (result.panNumber) setValue("panNumber", result.panNumber);

      toast({
        title: "Data Extracted",
        description: "Form auto-filled from Aadhaar/PAN",
      });

    } catch (err) {
      toast({
        title: "Error",
        description: "Could not extract data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: "aadhaar" | "pan") => {
    try {
      setIsLoading(true);
      await uploadFile(file, type);

      if (type === "aadhaar") {
        setAadhaarFile(file);
        setAadhaarFileName(file.name);
      } else {
        setPanFile(file);
        setPanFileName(file.name);
      }

      toast({
        title: `${type === "aadhaar" ? "Aadhaar" : "PAN"} uploaded`,
        description: `File "${file.name}" successfully uploaded.`,
      });

      const newAadhaarFile = type === "aadhaar" ? file : aadhaarFile;
      const newPanFile = type === "pan" ? file : panFile;

      if (newAadhaarFile && newPanFile) {
        await handleBothFilesUploaded(newAadhaarFile, newPanFile);
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (formData: PersonalInfoData) => {
    onComplete({ personalInfo: { ...formData, age } });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Aadhaar & PAN Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Aadhaar & PAN</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aadhaar Upload */}
          <div>
            <Label>Aadhaar Card *</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                ref={aadhaarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "aadhaar")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => aadhaarInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Aadhaar
              </Button>
              {aadhaarFileName && (
                <p className="text-green-600 mt-2">Uploaded ✅ {aadhaarFileName}</p>
              )}
            </div>
          </div>

          {/* PAN Upload */}
          <div>
            <Label>PAN Card *</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                ref={panInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "pan")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => panInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" /> Upload PAN
              </Button>
              {panFileName && (
                <p className="text-green-600 mt-2">Uploaded ✅ {panFileName}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-filled & Editable Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Full Name *</Label>
          <Input {...register("fullName")} />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label>Date of Birth *</Label>
          <Input type="date" {...register("dateOfBirth")} />
        </div>
        <div>
          <Label>Age</Label>
          <Input value={age} disabled />
        </div>
        <div>
          <Label>Primary Phone *</Label>
          <Input {...register("phoneNumber")} />
        </div>
        <div>
          <Label>Secondary Phone</Label>
          <Input {...register("secondaryPhoneNumber")} />
        </div>
        <div>
          <Label>Email *</Label>
          <Input type="email" {...register("email")} />
        </div>
        <div>
          <Label>Aadhaar Number</Label>
          <Input {...register("aadhaarNumber")} />
        </div>
        <div>
          <Label>PAN Number</Label>
          <Input {...register("panNumber")} />
        </div>
        <div>
          <Label>State *</Label>
          <Select
            value={watch("state") || ""}
            onValueChange={(v) => setValue("state", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Marital Status *</Label>
          <Select onValueChange={(v) => setValue("maritalStatus", v as "Single" | "Married")}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Married">Married</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Number of Children</Label>
          <Input type="number" {...register("numberOfChildren", { valueAsNumber: true })} />
        </div>
      </div>

      <div>
        <Label>Present Address *</Label>
        <Textarea {...register("presentAddress")} rows={3} />
      </div>
      <div>
        <Label>Secondary Address</Label>
        <Textarea {...register("secondaryAddress")} rows={3} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>Next Step</Button>
      </div>
    </form>
  );
}
