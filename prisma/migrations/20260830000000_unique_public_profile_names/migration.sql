ALTER TABLE "PublicUserProfile"
ADD COLUMN IF NOT EXISTS "displayNameKey" TEXT;

WITH normalized_profiles AS (
  SELECT
    "id",
    LOWER(REGEXP_REPLACE(BTRIM("displayName"), '[[:space:]]+', ' ', 'g')) AS "displayNameKey",
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(REGEXP_REPLACE(BTRIM("displayName"), '[[:space:]]+', ' ', 'g'))
      ORDER BY "createdAt", "id"
    ) AS "nameRank"
  FROM "PublicUserProfile"
  WHERE "displayName" IS NOT NULL
    AND BTRIM("displayName") <> ''
)
UPDATE "PublicUserProfile" AS profile
SET "displayNameKey" = CASE
  WHEN normalized_profiles."nameRank" = 1 THEN normalized_profiles."displayNameKey"
  ELSE NULL
END
FROM normalized_profiles
WHERE profile."id" = normalized_profiles."id";

CREATE UNIQUE INDEX IF NOT EXISTS "PublicUserProfile_displayNameKey_key"
ON "PublicUserProfile"("displayNameKey");
