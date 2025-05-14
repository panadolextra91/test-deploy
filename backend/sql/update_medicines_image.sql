-- Rename the column from image_url to image
ALTER TABLE medicines CHANGE COLUMN image_url image VARCHAR(255) NULL DEFAULT NULL; 