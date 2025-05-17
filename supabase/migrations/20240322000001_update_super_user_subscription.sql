-- Update the user's subscription metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{subscription}',
  '{"type": "pro", "projectLimit": 999999}'
)
WHERE id IN ('aed89f04-6d12-4590-821c-b6f036471e68', '18a02ba1-8fd6-40c4-b797-14668e1123af'); 