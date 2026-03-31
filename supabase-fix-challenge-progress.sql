-- Fix foreign key for user_challenge_progress to allow joining with profiles
ALTER TABLE public.user_challenge_progress
DROP CONSTRAINT IF EXISTS user_challenge_progress_user_id_fkey;

ALTER TABLE public.user_challenge_progress
ADD CONSTRAINT user_challenge_progress_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Allow anyone to read user_challenge_progress so leaderboards work
DROP POLICY IF EXISTS "Anyone can view all progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Admin can view all progress" ON public.user_challenge_progress;

CREATE POLICY "Anyone can view all progress"
ON public.user_challenge_progress
FOR SELECT
USING (true);

-- Change progress_hours to NUMERIC to allow fractional hours
ALTER TABLE public.user_challenge_progress
ALTER COLUMN progress_hours TYPE NUMERIC(10, 2);

-- Create a trigger to update challenge progress when a study session is completed
CREATE OR REPLACE FUNCTION update_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
    session_hours NUMERIC;
    r RECORD;
BEGIN
    -- Only count sessions that are marked as counted and have duration
    IF COALESCE(NEW.is_counted, true) = false OR COALESCE(NEW.duration_minutes, 0) = 0 THEN
        RETURN NEW;
    END IF;

    -- Calculate hours from duration_minutes
    session_hours := NEW.duration_minutes / 60.0;

    -- Loop through all active challenges the user has joined and are not completed
    FOR r IN 
        SELECT ucp.id, ucp.progress_hours, c.target_hours, c.reward_stars, c.id as challenge_id
        FROM public.user_challenge_progress ucp
        JOIN public.challenges c ON ucp.challenge_id = c.id
        WHERE ucp.user_id = NEW.user_id
        AND ucp.completed = false
        AND CURRENT_DATE >= c.start_date
        AND CURRENT_DATE <= c.end_date
    LOOP
        -- Update the progress
        UPDATE public.user_challenge_progress
        SET 
            progress_hours = progress_hours + session_hours,
            completed = CASE WHEN (progress_hours + session_hours) >= r.target_hours THEN true ELSE false END,
            completed_at = CASE WHEN (progress_hours + session_hours) >= r.target_hours THEN CURRENT_TIMESTAMP ELSE null END
        WHERE id = r.id;

        -- If completed, award stars to the user
        IF (r.progress_hours + session_hours) >= r.target_hours THEN
            UPDATE public.profiles
            SET total_stars = COALESCE(total_stars, 0) + r.reward_stars
            WHERE id = NEW.user_id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_study_session_completed ON public.study_sessions;
CREATE TRIGGER on_study_session_completed
AFTER INSERT ON public.study_sessions
FOR EACH ROW
EXECUTE FUNCTION update_challenge_progress();
