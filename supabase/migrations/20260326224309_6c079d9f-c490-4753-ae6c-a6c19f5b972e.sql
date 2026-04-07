-- Drop the overly permissive policy and replace with a proper one
DROP POLICY IF EXISTS "Service can insert sales" ON public.influencer_sales;

-- The webhook uses service_role key which bypasses RLS, so no insert policy needed for authenticated users
-- Instead let admins insert
CREATE POLICY "Admins can insert sales" ON public.influencer_sales
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));