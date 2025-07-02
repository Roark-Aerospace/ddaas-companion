
-- Add columns for manually entered coordinates
ALTER TABLE public.ddaas_devices 
ADD COLUMN manual_latitude numeric,
ADD COLUMN manual_longitude numeric,
ADD COLUMN manual_location_notes text;

-- Update the existing devices to have null values for the new columns
-- (This is handled automatically by the ALTER TABLE statement)
