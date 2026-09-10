// Columns readable by anon/authenticated. Sensitive columns
// (registration_number, registration_document_url, rejection_reason,
// payment_reference) are column-revoked in the database and only
// available via secure RPCs to owners/admins.
export const INSTITUTION_PUBLIC_COLUMNS =
  "id,user_id,institution_name,description,country,city,phone,email,website,facebook_url,instagram_url,tiktok_url,logo_url,banner_url,verification_status,verification_paid,verified_at,is_suspended,created_at,updated_at";

export const INSTITUTION_ANNOUNCEMENT_COLUMNS =
  "id,institution_id,title,caption,image_url,is_paid,expires_at,created_at";

// helper_details minus the access-restricted helper_references column
export const HELPER_DETAILS_COLUMNS =
  "id,user_id,age,gender,languages,city,country,willing_to_work_abroad,years_experience,skills,salary_expectation,salary_negotiable,about_me,is_published,created_at,updated_at,salary_min,salary_max,video_introduction_url,is_featured,featured_until,featured_status,featured_type,average_rating,total_reviews,background_check_status,background_check_requested,background_check_available,availability_status,available_from,work_type,preferred_hours,work_authorization_status,video_views,skill_experience,province,latitude,longitude";
