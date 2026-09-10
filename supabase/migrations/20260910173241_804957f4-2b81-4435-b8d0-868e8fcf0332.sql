-- helper_details: replace table-wide read with per-column reads (excludes helper_references)
REVOKE SELECT ON public.helper_details FROM anon, authenticated;
GRANT SELECT (id,user_id,age,gender,languages,city,country,willing_to_work_abroad,years_experience,skills,salary_expectation,salary_negotiable,about_me,is_published,created_at,updated_at,salary_min,salary_max,video_introduction_url,is_featured,featured_until,featured_status,featured_type,average_rating,total_reviews,background_check_status,background_check_requested,background_check_available,availability_status,available_from,work_type,preferred_hours,work_authorization_status,video_views,skill_experience,province,latitude,longitude)
  ON public.helper_details TO anon, authenticated;

-- institution_announcements: exclude payment_reference
REVOKE SELECT ON public.institution_announcements FROM anon, authenticated;
GRANT SELECT (id,institution_id,title,caption,image_url,is_paid,expires_at,created_at)
  ON public.institution_announcements TO anon, authenticated;

-- helper_subscriptions: only public status fields
REVOKE SELECT ON public.helper_subscriptions FROM anon, authenticated;
GRANT SELECT (user_id,status,trial_end,current_period_end,featured_active,featured_expires_at)
  ON public.helper_subscriptions TO anon, authenticated;