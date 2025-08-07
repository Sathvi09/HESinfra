-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'in_progress',
  current_step INTEGER NOT NULL DEFAULT 1,
  
  -- Personal Information
  full_name TEXT,
  date_of_birth DATE,
  age INTEGER,
  phone_number TEXT,
  email TEXT,
  present_address TEXT,
  state TEXT,
  marital_status TEXT,
  number_of_children INTEGER,
  aadhaar_card_url TEXT,
  pan_card_url TEXT,
  identity_verified BOOLEAN DEFAULT FALSE,
  
  -- Driving License
  has_driving_license BOOLEAN,
  license_number TEXT,
  license_issue_date DATE,
  license_expiry_date DATE,
  issuing_authority TEXT,
  vehicle_classes TEXT[],
  driving_license_url TEXT,
  license_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create education table
CREATE TABLE public.education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  level_of_education TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_address TEXT NOT NULL,
  completion_year INTEGER NOT NULL,
  completion_month INTEGER NOT NULL,
  marks_obtained DECIMAL NOT NULL,
  maximum_marks DECIMAL NOT NULL,
  percentage DECIMAL GENERATED ALWAYS AS (ROUND((marks_obtained / maximum_marks) * 100, 2)) STORED,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employment_history table
CREATE TABLE public.employment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  employer_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  address TEXT NOT NULL,
  joining_date DATE NOT NULL,
  leaving_date DATE,
  take_home_salary DECIMAL,
  reason_for_leaving TEXT,
  may_contact_employer BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for applications
CREATE POLICY "Users can view their own applications" 
ON public.applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
ON public.applications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for education
CREATE POLICY "Users can view their own education records" 
ON public.education 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.applications 
  WHERE applications.id = education.application_id 
  AND applications.user_id = auth.uid()
));

CREATE POLICY "Users can create their own education records" 
ON public.education 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.applications 
  WHERE applications.id = education.application_id 
  AND applications.user_id = auth.uid()
));

CREATE POLICY "Users can update their own education records" 
ON public.education 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.applications 
  WHERE applications.id = education.application_id 
  AND applications.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own education records" 
ON public.education 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.applications 
  WHERE applications.id = education.application_id 
  AND applications.user_id = auth.uid()
));

-- Create policies for employment_history
CREATE POLICY "Users can view their own employment history" 
ON public.employment_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.applications 
  WHERE applications.id = employment_history.application_id 
  AND applications.user_id = auth.uid()
));

CREATE POLICY "Users can create their own employment history" 
ON public.employment_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.applications 
  WHERE applications.id = employment_history.application_id 
  AND applications.user_id = auth.uid()
));

CREATE POLICY "Users can update their own employment history" 
ON public.employment_history 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.applications 
  WHERE applications.id = employment_history.application_id 
  AND applications.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own employment history" 
ON public.employment_history 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.applications 
  WHERE applications.id = employment_history.application_id 
  AND applications.user_id = auth.uid()
));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('hr-documents', 'hr-documents', false);

-- Create storage policies
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'hr-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'hr-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'hr-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'hr-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();