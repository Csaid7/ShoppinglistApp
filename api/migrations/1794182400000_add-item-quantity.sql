-- Up Migration

-- optional free text: "2", "1 gallon", "a dozen"
ALTER TABLE items ADD COLUMN quantity text CHECK (length(quantity) <= 50);

-- Down Migration

ALTER TABLE items DROP COLUMN quantity;
