-- Update only built-in text prompt presets to the new response key contract.
-- Custom presets are intentionally left unchanged and will be warned at runtime.
UPDATE "prompt_presets"
SET "prompt" = REPLACE("prompt", 'translated_text', 'text')
WHERE "type" = 'text'
  AND "name" IN ('Text (Default)', 'Text (Strict)')
  AND "prompt" LIKE '%translated_text%';
