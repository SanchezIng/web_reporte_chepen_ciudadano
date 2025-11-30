/*
  # Fix profile visibility for public data
  
  This migration allows authenticated users to view all profiles.
  This is safe because profiles only contain public information (name, email, role).
  
  1. Changes
    - Replace restrictive profile view policy with a more permissive one
    - All authenticated users can now view all profiles
  
  2. Security
    - Only authenticated users can view profiles
    - Profile data is public to all authenticated users (no sensitive data exposed)
*/

-- Remove restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Add permissive policy for all authenticated users
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);
