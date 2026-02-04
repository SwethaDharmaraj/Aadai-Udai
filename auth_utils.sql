-- SQL Snippets for Admin Setup and Auth Debugging

-- 1. Create/Update Admin User
-- After you sign up with admin@aadaiudai.com, run this to give yourself admin rights:
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@aadaiudai.com');

-- 2. If you want to manually create an admin record in profiles for an existing user:
-- INSERT INTO public.profiles (id, name, role)
-- VALUES ('<USER_ID_FROM_AUTH_USERS>', 'Admin User', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 3. To see all users and their roles:
SELECT p.id, u.email, p.role, p.name 
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;

-- 4. To clear rate limits (Wait 1 hour or change settings in Auth -> Settings -> Rate Limits)
