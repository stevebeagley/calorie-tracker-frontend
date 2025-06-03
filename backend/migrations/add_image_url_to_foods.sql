-- Add image_url column to foods table
ALTER TABLE foods ADD COLUMN image_url VARCHAR(255);

-- Update existing foods with default images based on their descriptions
UPDATE foods 
SET image_url = CONCAT(
  'https://source.unsplash.com/featured/?food,',
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      LOWER(description),
      '[^a-z0-9]+',
      ','
    ),
    ',+$',
    ''
  )
)
WHERE image_url IS NULL; 