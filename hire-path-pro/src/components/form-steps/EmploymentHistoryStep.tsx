import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Upload, Plus, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const employmentHistorySchema = z.object({
  employmentHistory: z.array(z.object({
    employerName: z.string().min(2, "Employer name is required"),
    designation: z.string().min(2, "Designation is required"),
    address: z.string().min(5, "Address is required"),
    joiningDate: z.string().min(1, "Joining date is required"),
    leavingDate: z.string().optional(),
    takeHomeSalary: z.number().min(0, "Salary cannot be negative").optional(),
    reasonForLeaving: z.string().optional(),
    mayContactEmployer: z.boolean(),
    certificateUrl: z.string().optional(),
  })).max(4, "Maximum 4 employment records allowed"),
});

type EmploymentHistoryData = z.infer<typeof employmentHistorySchema>;

interface EmploymentHistoryStepProps {
  data?: EmploymentHistoryData["employmentHistory"];
  onComplete: (data: { employmentHistory: EmploymentHistoryData["employmentHistory"] }) => void;
  onPrevious: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function EmploymentHistoryStep({
  data,
  onComplete,
  onPrevious,
  isLoading,
  setIsLoading,
}: EmploymentHistoryStepProps) {
  const { toast } = useToast();
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmploymentHistoryData>({
    resolver: zodResolver(employmentHistorySchema),
    defaultValues: {
      employmentHistory: data && data.length > 0 ? data : [{
        employerName: "",
        designation: "",
        address: "",
        joiningDate: "",
        leavingDate: "",
        takeHomeSalary: 0,
        reasonForLeaving: "",
        mayContactEmployer: false,
        certificateUrl: "",
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "employmentHistory",
  });

  const watchedEmploymentHistory = watch("employmentHistory");

  const uploadFile = async (file: File, employmentIndex: number) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `employment/${Date.now()}_${employmentIndex}.${fileExt}`;
    
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

  const handleFileUpload = async (file: File, employmentIndex: number) => {
    try {
      setIsLoading(true);
      const url = await uploadFile(file, employmentIndex);
      setValue(`employmentHistory.${employmentIndex}.certificateUrl`, url);
      
      toast({
        title: "Certificate uploaded",
        description: "Employment certificate uploaded successfully.",
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

  const addMoreEmployment = () => {
    if (fields.length < 4) {
      append({
        employerName: "",
        designation: "",
        address: "",
        joiningDate: "",
        leavingDate: "",
        takeHomeSalary: 0,
        reasonForLeaving: "",
        mayContactEmployer: false,
        certificateUrl: "",
      });
    }
  };

  const onSubmit = (formData: EmploymentHistoryData) => {
    onComplete({ employmentHistory: formData.employmentHistory });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Employment History</h3>
        {fields.length < 4 && (
          <Button
            type="button"
            onClick={addMoreEmployment}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employment Record
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Employment Record {index + 1}</CardTitle>
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
                  <Label htmlFor={`employmentHistory.${index}.employerName`}>Employer Name *</Label>
                  <Input
                    id={`employmentHistory.${index}.employerName`}
                    {...register(`employmentHistory.${index}.employerName`)}
                    placeholder="Enter employer name"
                  />
                  {errors.employmentHistory?.[index]?.employerName && (
                    <p className="text-sm text-destructive">
                      {errors.employmentHistory[index]?.employerName?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`employmentHistory.${index}.designation`}>Designation *</Label>
                  <Input
                    id={`employmentHistory.${index}.designation`}
                    {...register(`employmentHistory.${index}.designation`)}
                    placeholder="Enter your designation"
                  />
                  {errors.employmentHistory?.[index]?.designation && (
                    <p className="text-sm text-destructive">
                      {errors.employmentHistory[index]?.designation?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`employmentHistory.${index}.address`}>Address *</Label>
                  <Textarea
                    id={`employmentHistory.${index}.address`}
                    {...register(`employmentHistory.${index}.address`)}
                    placeholder="Enter employer address"
                    rows={2}
                  />
                  {errors.employmentHistory?.[index]?.address && (
                    <p className="text-sm text-destructive">
                      {errors.employmentHistory[index]?.address?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`employmentHistory.${index}.joiningDate`}>Date of Joining *</Label>
                  <Input
                    id={`employmentHistory.${index}.joiningDate`}
                    type="date"
                    {...register(`employmentHistory.${index}.joiningDate`)}
                  />
                  {errors.employmentHistory?.[index]?.joiningDate && (
                    <p className="text-sm text-destructive">
                      {errors.employmentHistory[index]?.joiningDate?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`employmentHistory.${index}.leavingDate`}>Date of Leaving</Label>
                  <Input
                    id={`employmentHistory.${index}.leavingDate`}
                    type="date"
                    {...register(`employmentHistory.${index}.leavingDate`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`employmentHistory.${index}.takeHomeSalary`}>Take-home Salary</Label>
                  <Input
                    id={`employmentHistory.${index}.takeHomeSalary`}
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`employmentHistory.${index}.takeHomeSalary`, { valueAsNumber: true })}
                    placeholder="Enter salary amount"
                  />
                  {errors.employmentHistory?.[index]?.takeHomeSalary && (
                    <p className="text-sm text-destructive">
                      {errors.employmentHistory[index]?.takeHomeSalary?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`employmentHistory.${index}.reasonForLeaving`}>Reason for Leaving</Label>
                  <Textarea
                    id={`employmentHistory.${index}.reasonForLeaving`}
                    {...register(`employmentHistory.${index}.reasonForLeaving`)}
                    placeholder="Enter reason for leaving (optional)"
                    rows={2}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`mayContactEmployer-${index}`}
                      checked={watchedEmploymentHistory[index]?.mayContactEmployer || false}
                      onCheckedChange={(checked) => 
                        setValue(`employmentHistory.${index}.mayContactEmployer`, checked as boolean)
                      }
                    />
                    <Label htmlFor={`mayContactEmployer-${index}`} className="text-sm">
                      May we contact this employer for reference?
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Experience Certificate or Offer Letter</Label>
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
                      {watchedEmploymentHistory[index]?.certificateUrl ? 'Change Certificate' : 'Upload Certificate'}
                    </Button>
                    {watchedEmploymentHistory[index]?.certificateUrl && (
                      <p className="text-sm text-green-600 mt-2">✓ Certificate uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {fields.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">No employment history added yet.</p>
                <Button type="button" onClick={addMoreEmployment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employment Record
                </Button>
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : "Next Step"}
        </Button>
      </div>
    </form>
  );
}