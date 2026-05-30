
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

GRANT SELECT ON public.marketplace_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;

GRANT SELECT ON public.marketplace_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_images TO authenticated;
GRANT ALL ON public.marketplace_images TO service_role;

GRANT SELECT ON public.accommodations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accommodations TO authenticated;
GRANT ALL ON public.accommodations TO service_role;

GRANT SELECT ON public.accommodation_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accommodation_images TO authenticated;
GRANT ALL ON public.accommodation_images TO service_role;

GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT ON public.slider_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.slider_images TO authenticated;
GRANT ALL ON public.slider_images TO service_role;

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
