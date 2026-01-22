-- SQL Query to check Manual Confirmation settings for all appointment types

SELECT 
  id,
  title,
  manual_confirmation,
  is_published,
  created_at
FROM appointment_types
ORDER BY created_at DESC;

-- To update all appointment types to have manual_confirmation = false
-- (Only run if you want to reset all to automatic confirmation)
-- UPDATE appointment_types SET manual_confirmation = false WHERE manual_confirmation IS NULL OR manual_confirmation = true;

-- To update all existing 'request' bookings to 'booked' for appointments with manual_confirmation = false
-- UPDATE bookings 
-- SET status = 'booked' 
-- WHERE status = 'request' 
-- AND appointment_type_id IN (
--   SELECT id FROM appointment_types WHERE manual_confirmation = false
-- );
