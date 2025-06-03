-- Update food images with cleaner URLs
UPDATE foods 
SET image_url = 'https://source.unsplash.com/featured/400x300/?food,' || 
  TRIM(BOTH ',' FROM REGEXP_REPLACE(
    REGEXP_REPLACE(
      LOWER(description),
      '[^a-z0-9]+',
      ','
    ),
    ',{2,}',
    ','
  )); 