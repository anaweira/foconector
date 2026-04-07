-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all profiles  
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role to insert influencer_sales (for webhooks)
CREATE POLICY "Service can insert sales" ON public.influencer_sales
  FOR INSERT TO authenticated
  WITH CHECK (true);