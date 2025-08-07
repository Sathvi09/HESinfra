import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, Plus, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EDUCATION_LEVELS = [
  "SSLC",
  "Intermediate/ITI", 
  "Diploma",
  "Graduation",
  "Post-Graduation"
];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const educationSchema = z.object({
  education: z.array(z.object({
    levelOfEducation: z.string().min(1, "Education level is required"),
    institutionName: z.string().min(2, "Institution name is required"),
    institutionAddress: z.string().min(5, "Institution address is required"),
    completionYear: z.number().min(1950, "Invalid year").max(new Date().getFullYear(), "Year cannot be in future"),
    completionMonth: z.number().min(1, "Month is required").max(12, "Invalid month"),
    marksObtained: z.number().min(0, "Marks cannot be negative"),
    maximumMarks: z.number().min(1, "Maximum marks must be greater than 0"),
    certificateUrl: z.string().optional(),
  })).min(1, "At least one education record is required"),
});

type EducationData = z.infer<typeof educationSchema>;

interface EducationStepProps {
  data?: EducationData["education"];
  onComplete: (data: { education: EducationData["education"] }) => void;
  onPrevious: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function EducationStep({
  data,
  onComplete,
  onPrevious,
  isLoading,
  setIsLoading,
}: EducationStepProps) {
  const { toast } = useToast();
  const [currentEducationIndex, setCurrentEducationIndex] = useState(0);
  const [showAddMore, setShowAddMore] = useState(false);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EducationData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      education: data && data.length > 0 ? data : [{
        levelOfEducation: "",
        institutionName: "",
        institutionAddress: "",
        completionYear: new Date().getFullYear(),
        completionMonth: 1,
        marksObtained: 0,
        maximumMarks: 0,
        certificateUrl: "",
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  const watchedEducation = watch("education");

  // Calculate percentage for each education record
  const calculatePercentage = (index: number) => {
    const education = watchedEducation[index];
    if (education?.marksObtained && education?.maximumMarks && education.maximumMarks > 0) {
      return ((education.marksObtained / education.maximumMarks) * 100).toFixed(2);
    }
    return "0";
  };

  const uploadFile = async (file: File, educationIndex: number) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `education/${Date.now()}_${educationIndex}.${fileExt}`;
    
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

  const handleFileUpload = async (file: File, educationIndex: number) => {
    try {
      setIsLoading(true);
      const url = await uploadFile(file, educationIndex);
      setValue(`education.${educationIndex}.certificateUrl`, url);
      
      toast({
        title: "Certificate uploaded",
        description: "Educational certificate uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMoreEducation = () => {
    append({
      levelOfEducation: "",
      institutionName: "",
      institutionAddress: "",
      completionYear: new Date().getFullYear(),
      completionMonth: 1,
      marksObtained: 0,
      maximumMarks: 0,
      certificateUrl: "",
    });
    setCurrentEducationIndex(fields.length);
    setShowAddMore(false);
  };

  const onSubmit = (formData: EducationData) => {
    const educationWithPercentage = formData.education.map((edu, index) => ({
      ...edu,
      percentage: parseFloat(calculatePercentage(index)),
    }));

    onComplete({ education: educationWithPercentage });
  };

  const handleCurrentEducationComplete = () => {
    setShowAddMore(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-8">
        {fields.map((field, index) => (
          <Card key={field.id} className={`${index === currentEducationIndex ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Education Record {index + 1}</CardTitle>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`education.${index}.levelOfEducation`}>Level of Education *</Label>
                  <Select
                    onValueChange={(value) => setValue(`education.${index}.levelOfEducation`, value)}
                    defaultValue={watchedEducation[index]?.levelOfEducation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.education?.[index]?.levelOfEducation && (
                    <p className="text-sm text-destructive">
                      {errors.education[index]?.levelOfEducation?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`education.${index}.institutionName`}>Institution Name *</Label>
                  <Input
                    id={`education.${index}.institutionName`}
                    {...register(`education.${index}.institutionName`)}
                    placeholder="Enter institution name"
                  />
                  {errors.education?.[index]?.institutionName && (
                    <p className="text-sm text-destructive">
                      {errors.education[index]?.institutionName?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`education.${index}.institutionAddress`}>Institution Address *</Label>
                  <Textarea
                    id={`education.${index}.institutionAddress`}
                    {...register(`education.${index}.institutionAddress`)}
                    placeholder="Enter institution address"
                    rows={2}
                  />
                  {errors.education?.[index]?.institutionAddress && (
                    <p className="text-sm text-destructive">
                      {errors.education[index]?.institutionAddress?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`education.${index}.completionYear`}>Completion Year *</Label>
                  <Input
                    id={`education.${index}.completionYear`}
                    type="number"
                    min="1950"
                    max={new Date().getFullYear()}
                    {...register(`education.${index}.completionYear`, { valueAsNumber: true })}
                  />
                  {errors.education?.[index]?.completionYear && (
                    <p className="text-sm text-destructive">
                      {errors.education[index]?.completionYear?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`education.${index}.completionMonth`}>Completion Month *</Label>
                  <Select
                    onValueChange={(value) => setValue(`education.${index}.completionMonth`, parseInt(value))}
                    defaultValue={watchedEducation[index]?.completionMonth?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.education?.[index]?.completionMonth && (
                    <p className="text-sm text-destructive">
                      {errors.education[index]?.completionMonth?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`education.${index}.marksObtained`}>Marks Obtained *</Label>
                  <Input
                    id={`education.${index}.marksObtained`}
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`education.${index}.marksObtained`, { valueAsNumber: true })}
                  />
                  {errors.education?.[index]?.marksObtained && (
                    <p className="text-sm text-destructive">
                      {errors.education[index]?.marksObtained?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`education.${index}.maximumMarks`}>Maximum Marks *</Label>
                  <Input
                    id={`education.${index}.maximumMarks`}
                    type="number"
                    min="1"
                    step="0.01"
                    {...register(`education.${index}.maximumMarks`, { valueAsNumber: true })}
                  />
                  {errors.education?.[index]?.maximumMarks && (
                    <p className="text-sm text-destructive">
                      {errors.education[index]?.maximumMarks?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Percentage</Label>
                  <Input
                    type="text"
                    value={`${calculatePercentage(index)}%`}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Educational Certificate</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <input
                      ref={(el) => { fileInputRefs.current[index] = el; }}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, index);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {watchedEducation[index]?.certificateUrl ? 'Change Certificate' : 'Upload Certificate'}
                    </Button>
                    {watchedEducation[index]?.certificateUrl && (
                      <p className="text-sm text-green-600 mt-2">✓ Certificate uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {index === currentEducationIndex && index === fields.length - 1 && (
                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={handleCurrentEducationComplete}
                    variant="outline"
                    className="w-full"
                  >
                    Complete this education record
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {showAddMore && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Do you have any higher education to enter?</p>
                <div className="flex gap-4 justify-center">
                  <Button type="button" onClick={addMoreEducation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yes, Add More Education
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddMore(false)}>
                    No, Continue to Next Step
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        {!showAddMore && (
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Next Step"}
          </Button>
        )}
      </div>
    </form>
  );
}