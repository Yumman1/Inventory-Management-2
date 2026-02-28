-- Allow public signup and login when using anon key (backend)
-- Drop if exists in case of re-run
DROP POLICY IF EXISTS "public_signup_users" ON users;
CREATE POLICY "public_signup_users" ON users
  FOR INSERT
  TO anon
  WITH CHECK (role IN ('Operator', 'Viewer'));

-- Allow anon to read users (needed for login - find user by email)
DROP POLICY IF EXISTS "anon_read_users" ON users;
CREATE POLICY "anon_read_users" ON users
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon to read/write app_state (needed for setCurrentUser after login/signup)
DROP POLICY IF EXISTS "anon_app_state" ON app_state;
CREATE POLICY "anon_app_state" ON app_state
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
