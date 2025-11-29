-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('intern', 'company')),
    full_name TEXT,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    notification_preferences JSONB DEFAULT '{"push_enabled": true}'::jsonb
);

-- Create intern_profiles table
CREATE TABLE IF NOT EXISTS public.intern_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    photo TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    education JSONB DEFAULT '{"degree": "", "university": "", "graduationYear": ""}',
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    experience JSONB[] DEFAULT ARRAY[]::JSONB[],
    certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
    languages TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create company_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.company_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    logo TEXT,
    website TEXT CHECK (website ~ '^(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$'),
    email TEXT NOT NULL CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone TEXT,
    location TEXT,
    size TEXT,
    founded TEXT,
    specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
    benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
    social_media JSONB DEFAULT '{
        "linkedin": "",
        "twitter": "",
        "facebook": ""
    }',
    stats JSONB DEFAULT '{
        "employees": "",
        "founded": "",
        "internships": ""
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT website_format CHECK (
        website IS NULL OR 
        website ~ '^(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$'
    )
);

-- Create internships table
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    position TEXT NOT NULL,
    department TEXT,
    requirements TEXT NOT NULL,
    responsibilities TEXT NOT NULL,
    deadline DATE NOT NULL,
    duration TEXT NOT NULL,
    work_type TEXT NOT NULL CHECK (work_type IN ('onsite', 'remote', 'hybrid')),
    is_paid BOOLEAN NOT NULL DEFAULT false,
    stipend NUMERIC,
    skills TEXT[] NOT NULL DEFAULT '{}',
    location TEXT,
    spots INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    intern_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    resume_url TEXT NOT NULL,
    cover_letter_url TEXT,
    phone_number TEXT NOT NULL,
    portfolio_url TEXT,
    available_start_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(intern_id, internship_id)
);

-- Create interviews table if it doesn't exist
DROP TABLE IF EXISTS public.interviews CASCADE;
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    location TEXT NOT NULL,
    meeting_link TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create interview_feedback table for hiring decisions
CREATE TABLE IF NOT EXISTS public.interview_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    technical_skills INTEGER CHECK (technical_skills >= 1 AND technical_skills <= 5),
    communication_skills INTEGER CHECK (communication_skills >= 1 AND communication_skills <= 5),
    problem_solving INTEGER CHECK (problem_solving >= 1 AND problem_solving <= 5),
    overall_feedback TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    hire_recommendation BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (
        type IN (
            'internship_posted',
            'application_approved',
            'application_rejected',
            'interview_scheduled',
            'hired',
            'not_hired'
        )
    ),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_profiles_industry ON public.company_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_company_profiles_location ON public.company_profiles(location);
CREATE INDEX IF NOT EXISTS idx_company_profiles_name ON public.company_profiles(name);
CREATE INDEX IF NOT EXISTS idx_internships_company_id ON public.internships(company_id);
CREATE INDEX IF NOT EXISTS idx_internships_work_type ON public.internships(work_type);
CREATE INDEX IF NOT EXISTS idx_internships_location ON public.internships(location);
CREATE INDEX IF NOT EXISTS idx_internships_deadline ON public.internships(deadline);
CREATE INDEX IF NOT EXISTS idx_applications_intern_id ON public.applications(intern_id);
CREATE INDEX IF NOT EXISTS idx_applications_internship_id ON public.applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON public.interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON public.interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interviewer_id ON public.interview_feedback(interviewer_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Enable read access for authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable update for users based on id"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create policies for intern_profiles table
CREATE POLICY "Enable read access for authenticated users on intern_profiles"
    ON public.intern_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for intern users"
    ON public.intern_profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'intern'
        )
    );

CREATE POLICY "Enable update for intern users"
    ON public.intern_profiles FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'intern'
        )
    )
    WITH CHECK (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'intern'
        )
    );

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users on company_profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Enable insert for company users" ON public.company_profiles;
DROP POLICY IF EXISTS "Enable update for company users" ON public.company_profiles;
DROP POLICY IF EXISTS "Enable delete for company users" ON public.company_profiles;

-- Create policies for company_profiles table with proper security definer
CREATE POLICY "Enable read access for authenticated users on company_profiles"
    ON public.company_profiles 
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for company users"
    ON public.company_profiles 
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'company'
        )
    );

CREATE POLICY "Enable update for company users"
    ON public.company_profiles 
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'company'
        )
    )
    WITH CHECK (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'company'
        )
    );

CREATE POLICY "Enable delete for company users"
    ON public.company_profiles 
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'company'
        )
    );

-- Create policies for internships table
CREATE POLICY "Enable read access for authenticated users on internships"
    ON public.internships 
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for company users"
    ON public.internships 
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'company'
        )
    );

CREATE POLICY "Enable update for company users"
    ON public.internships 
    FOR UPDATE
    TO authenticated
    USING (
        company_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'company'
        )
    )
    WITH CHECK (
        company_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'company'
        )
    );

CREATE POLICY "Enable delete for company users"
    ON public.internships 
    FOR DELETE
    TO authenticated
    USING (
        company_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'company'
        )
    );

-- Create policies for applications table
CREATE POLICY "Enable read access for application owners and internship companies"
    ON public.applications FOR SELECT
    TO authenticated
    USING (
        intern_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.internships i
            WHERE i.id = internship_id AND i.company_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for authenticated intern users"
    ON public.applications FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = intern_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'intern'
        )
    );

CREATE POLICY "Enable update for application owners and companies"
    ON public.applications FOR UPDATE
    TO authenticated
    USING (
        intern_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.internships i
            WHERE i.id = internship_id AND i.company_id = auth.uid()
        )
    )
    WITH CHECK (
        intern_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.internships i
            WHERE i.id = internship_id AND i.company_id = auth.uid()
        )
    );

-- Policy for companies to view interviews for their applications
CREATE POLICY "Companies can view interviews for their applications"
    ON public.interviews FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            JOIN public.internships i ON a.internship_id = i.id
            WHERE a.id = interviews.application_id
            AND i.company_id = auth.uid()
        )
    );

-- Policy for companies to create interviews for their applications
CREATE POLICY "Companies can create interviews for their applications"
    ON public.interviews FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.applications a
            JOIN public.internships i ON a.internship_id = i.id
            WHERE a.id = interviews.application_id
            AND i.company_id = auth.uid()
        )
    );

-- Policy for companies to update interviews for their applications
CREATE POLICY "Companies can update interviews for their applications"
    ON public.interviews FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            JOIN public.internships i ON a.internship_id = i.id
            WHERE a.id = interviews.application_id
            AND i.company_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.applications a
            JOIN public.internships i ON a.internship_id = i.id
            WHERE a.id = interviews.application_id
            AND i.company_id = auth.uid()
        )
    );

-- Policy for interns to view their own interviews
CREATE POLICY "Interns can view their own interviews"
    ON public.interviews FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = interviews.application_id
            AND a.intern_id = auth.uid()
        )
    );

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_company_profile_timestamp ON public.company_profiles;
CREATE TRIGGER update_company_profile_timestamp
    BEFORE UPDATE ON public.company_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_update();

DROP TRIGGER IF EXISTS update_internships_timestamp ON public.internships;
CREATE TRIGGER update_internships_timestamp
    BEFORE UPDATE ON public.internships
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_update();

-- Create function to handle new user creation with improved error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    profile_role TEXT;
BEGIN
    -- Get the role from metadata with validation
    profile_role := COALESCE(NEW.raw_user_meta_data->>'role', 'intern');
    IF profile_role NOT IN ('intern', 'company') THEN
        RAISE EXCEPTION 'Invalid role: %', profile_role;
    END IF;

    -- Insert into profiles table
    INSERT INTO public.profiles (id, role, full_name, company_name)
    VALUES (
        NEW.id,
        profile_role,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'company_name'
    );

    -- Create appropriate profile based on role
    IF profile_role = 'company' THEN
        INSERT INTO public.company_profiles (
            id,
            name,
            email,
            industry,
            description,
            website,
            location,
            size,
            founded,
            stats,
            social_media
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'industry', ''),
            COALESCE(NEW.raw_user_meta_data->>'description', ''),
            NULLIF(COALESCE(NEW.raw_user_meta_data->>'website', ''), ''),
            COALESCE(NEW.raw_user_meta_data->>'location', ''),
            COALESCE(NEW.raw_user_meta_data->>'size', ''),
            COALESCE(NEW.raw_user_meta_data->>'founded', ''),
            jsonb_build_object(
                'employees', COALESCE(NEW.raw_user_meta_data->>'employees', '0'),
                'founded', COALESCE(NEW.raw_user_meta_data->>'founded', ''),
                'internships', COALESCE(NEW.raw_user_meta_data->>'internships', '0')
            ),
            jsonb_build_object(
                'linkedin', '',
                'twitter', '',
                'facebook', ''
            )
        );
    ELSE
        -- Create intern profile
        INSERT INTO public.intern_profiles (
            id,
            name,
            title,
            photo,
            email,
            phone,
            location,
            education,
            skills,
            experience,
            certifications,
            languages
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            '',
            '',
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            COALESCE(NEW.raw_user_meta_data->>'location', ''),
            jsonb_build_object(
                'degree', COALESCE(NEW.raw_user_meta_data->>'education_degree', ''),
                'university', COALESCE(NEW.raw_user_meta_data->>'education_university', ''),
                'graduationYear', COALESCE(NEW.raw_user_meta_data->>'education_graduation_year', '')
            ),
            ARRAY[]::TEXT[],
            ARRAY[]::JSONB[],
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[]
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error with more details
        RAISE LOG 'Error in handle_new_user for user %: %, SQLSTATE: %', 
            NEW.id, 
            SQLERRM,
            SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to verify user role access
CREATE OR REPLACE FUNCTION public.verify_user_role_access(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN user_role = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.company_profiles TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.intern_profiles TO authenticated;
GRANT ALL ON public.internships TO authenticated;
GRANT ALL ON public.applications TO authenticated;
GRANT ALL ON public.interviews TO authenticated;
GRANT ALL ON public.interview_feedback TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Create storage bucket for applications if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications', 'applications', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;

-- Create storage policies for applications bucket
CREATE POLICY "Enable read access for all users"
ON storage.objects FOR SELECT
USING (bucket_id = 'applications');

CREATE POLICY "Enable insert for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'applications' AND
    (auth.role() = 'authenticated')
);

CREATE POLICY "Enable update for authenticated users"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'applications' AND (auth.role() = 'authenticated'))
WITH CHECK (bucket_id = 'applications' AND (auth.role() = 'authenticated'));

CREATE POLICY "Enable delete for authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'applications' AND (auth.role() = 'authenticated'));

-- Create trigger for interviews timestamp
DROP TRIGGER IF EXISTS update_interviews_timestamp ON public.interviews;
CREATE TRIGGER update_interviews_timestamp
    BEFORE UPDATE ON public.interviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_update();

-- Create trigger for interview_feedback timestamp
DROP TRIGGER IF EXISTS update_interview_feedback_timestamp ON public.interview_feedback;
CREATE TRIGGER update_interview_feedback_timestamp
    BEFORE UPDATE ON public.interview_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_update();

-- Create indexes for better query performance
DROP INDEX IF EXISTS idx_interviews_application_id;
DROP INDEX IF EXISTS idx_interviews_scheduled_at;
DROP INDEX IF EXISTS idx_interviews_status;

CREATE INDEX idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX idx_interviews_scheduled_at ON public.interviews(scheduled_at);
CREATE INDEX idx_interviews_status ON public.interviews(status);

-- Enable RLS on interview_feedback table
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for interview_feedback table
CREATE POLICY "Enable read access for interview participants"
    ON public.interview_feedback FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.interviews iv
            JOIN public.applications a ON iv.application_id = a.id
            JOIN public.internships i ON a.internship_id = i.id
            WHERE iv.id = interview_id 
            AND (
                -- Company can view their interview feedback
                i.company_id = auth.uid() OR
                -- Intern can view feedback for their interviews
                a.intern_id = auth.uid()
            )
        )
    );

CREATE POLICY "Enable insert for company users"
    ON public.interview_feedback FOR INSERT
    TO authenticated
    WITH CHECK (
        interviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.interviews iv
            JOIN public.applications a ON iv.application_id = a.id
            JOIN public.internships i ON a.internship_id = i.id
            WHERE iv.id = interview_id 
            AND i.company_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() 
                AND role = 'company'
            )
        )
    );

CREATE POLICY "Enable update for company users"
    ON public.interview_feedback FOR UPDATE
    TO authenticated
    USING (
        interviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.interviews iv
            JOIN public.applications a ON iv.application_id = a.id
            JOIN public.internships i ON a.internship_id = i.id
            WHERE iv.id = interview_id 
            AND i.company_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() 
                AND role = 'company'
            )
        )
    )
    WITH CHECK (
        interviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.interviews iv
            JOIN public.applications a ON iv.application_id = a.id
            JOIN public.internships i ON a.internship_id = i.id
            WHERE iv.id = interview_id 
            AND i.company_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() 
                AND role = 'company'
            )
        )
    );

-- Create indexes for interview_feedback table
DROP INDEX IF EXISTS idx_interview_feedback_interview_id;
DROP INDEX IF EXISTS idx_interview_feedback_interviewer_id;
CREATE INDEX idx_interview_feedback_interview_id ON public.interview_feedback(interview_id);
CREATE INDEX idx_interview_feedback_interviewer_id ON public.interview_feedback(interviewer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_interviews_updated_at ON public.interviews;
CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON public.interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_interviews_updated_at();

-- Create policy to allow users to read their own notifications
CREATE POLICY "Users can read their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policy to allow users to update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Function to create internship posted notification
CREATE OR REPLACE FUNCTION notify_internship_posted()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify all interns
    INSERT INTO notifications (user_id, type, title, message, metadata)
    SELECT 
        p.id AS user_id,
        'internship_posted'::TEXT AS type,
        'New Internship Posted'::TEXT AS title,
        format('New %s position at %s', NEW.position, (SELECT name FROM company_profiles WHERE id = NEW.company_id)) AS message,
        jsonb_build_object('internship_id', NEW.id)
    FROM profiles p
    WHERE p.role = 'intern';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create application status notification
CREATE OR REPLACE FUNCTION notify_application_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            metadata
        )
        VALUES (
            NEW.intern_id,
            CASE 
                WHEN NEW.status = 'approved' THEN 'application_approved'
                ELSE 'application_rejected'
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Application Approved'
                ELSE 'Application Not Approved'
            END,
            format(
                'Your application for %s has been %s',
                (SELECT position FROM internships WHERE id = NEW.internship_id),
                NEW.status
            ),
            jsonb_build_object('application_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create interview scheduled notification
CREATE OR REPLACE FUNCTION notify_interview_scheduled()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        metadata
    )
    SELECT
        a.intern_id,
        'interview_scheduled'::TEXT,
        'Interview Scheduled'::TEXT,
        format(
            'Interview scheduled for %s position at %s',
            i.position,
            to_char(NEW.scheduled_at, 'Mon DD, YYYY HH:MI AM')
        ),
        jsonb_build_object(
            'interview_id', NEW.id,
            'application_id', NEW.application_id
        )
    FROM applications a
    JOIN internships i ON i.id = a.internship_id
    WHERE a.id = NEW.application_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create hiring decision notification
CREATE OR REPLACE FUNCTION notify_hiring_decision()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            metadata
        )
        VALUES (
            NEW.intern_id,
            CASE 
                WHEN NEW.status = 'approved' THEN 'hired'
                ELSE 'not_hired'
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Congratulations! You''re Hired!'
                ELSE 'Application Update'
            END,
            format(
                'You have been %s for the %s position',
                CASE WHEN NEW.status = 'approved' THEN 'hired' ELSE 'not selected' END,
                (SELECT position FROM internships WHERE id = NEW.internship_id)
            ),
            jsonb_build_object('application_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_internship_posted
    AFTER INSERT ON internships
    FOR EACH ROW
    EXECUTE FUNCTION notify_internship_posted();

CREATE TRIGGER on_application_status_change
    AFTER UPDATE OF status ON applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_application_status();

CREATE TRIGGER on_interview_scheduled
    AFTER INSERT ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_interview_scheduled();

CREATE TRIGGER on_hiring_decision
    AFTER UPDATE OF status ON applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_hiring_decision();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Function to track hired interns
CREATE OR REPLACE FUNCTION update_hired_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a notification when an intern is hired
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            metadata
        )
        VALUES (
            NEW.intern_id,
            'hired',
            'Congratulations! You''re Hired!',
            format(
                'You have been hired for the %s position',
                (SELECT position FROM internships WHERE id = NEW.internship_id)
            ),
            jsonb_build_object(
                'application_id', NEW.id,
                'internship_id', NEW.internship_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tracking hired interns
DROP TRIGGER IF EXISTS on_intern_hired ON public.applications;
CREATE TRIGGER on_intern_hired
    AFTER UPDATE OF status ON public.applications
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
    EXECUTE FUNCTION update_hired_count();

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void AS $$
DECLARE
    user_role text;
BEGIN
    -- Get the user's role
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();

    -- Delete role-specific data first
    IF user_role = 'intern' THEN
        -- Delete intern applications (cascades to interviews)
        DELETE FROM public.applications
        WHERE intern_id = auth.uid();

        -- Delete intern profile
        DELETE FROM public.intern_profiles
        WHERE id = auth.uid();
    ELSIF user_role = 'company' THEN
        -- Delete company internships (cascades to applications and interviews)
        DELETE FROM public.internships
        WHERE company_id = auth.uid();

        -- Delete company profile
        DELETE FROM public.company_profiles
        WHERE id = auth.uid();
    END IF;

    -- Delete notifications
    DELETE FROM public.notifications
    WHERE user_id = auth.uid();

    -- Delete main profile
    DELETE FROM public.profiles
    WHERE id = auth.uid();

    -- Delete auth user
    DELETE FROM auth.users
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on delete_user function
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- Add notification preferences support
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"push_enabled": true}'::jsonb;

-- Function to update notification preferences
CREATE OR REPLACE FUNCTION update_notification_preferences(push_enabled BOOLEAN)
RETURNS TABLE (preferences JSONB) AS $$
DECLARE
    updated_prefs JSONB;
BEGIN
    UPDATE public.profiles
    SET notification_preferences = jsonb_set(
        COALESCE(notification_preferences, '{}'::jsonb),
        '{push_enabled}',
        to_jsonb(push_enabled)
    )
    WHERE id = auth.uid()
    RETURNING notification_preferences INTO updated_prefs;

    RETURN QUERY SELECT updated_prefs AS preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION update_notification_preferences(BOOLEAN) TO authenticated;