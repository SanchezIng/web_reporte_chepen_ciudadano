/*
  # Add soft delete support to incidents table

  1. Changes
    - Add `is_deleted` column to incidents table (default false)
    - Add `deleted_at` column to track deletion timestamp
    - Update RLS policies to exclude deleted incidents from queries
    
  2. Security
    - Deleted incidents will be hidden from all queries by default
    - Only visible to the user who created the incident when viewing their history
    
  3. Benefits
    - Allows re-registration of the same incident
    - Maintains data integrity and audit trail
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE incidents ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE incidents ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

DROP POLICY IF EXISTS "Citizens can view own incidents" ON incidents;
DROP POLICY IF EXISTS "Citizens can create incidents" ON incidents;
DROP POLICY IF EXISTS "Authority can view all non-deleted incidents" ON incidents;
DROP POLICY IF EXISTS "Authority can update incident status" ON incidents;

CREATE POLICY "Citizens can view own incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND (is_deleted = false OR auth.uid() = user_id)
  );

CREATE POLICY "Citizens can create incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authority can view all non-deleted incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'authority'
    ) AND is_deleted = false
  );

CREATE POLICY "Authority can update incident status"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'authority'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'authority'
    )
  );

CREATE POLICY "Users can soft delete their incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
