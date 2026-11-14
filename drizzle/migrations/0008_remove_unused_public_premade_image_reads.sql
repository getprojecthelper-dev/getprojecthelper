-- Listing images are stored inline; no premade-images bucket or objects exist.
-- Remove unused anonymous download access without changing admin write policies.
DROP POLICY IF EXISTS "Anyone views premade images" ON storage.objects;