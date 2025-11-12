-- Clear apiEndpoint field from all automations to use global setting
-- All automations will now use the default_api_endpoint from Settings table
UPDATE "Automation" SET "apiEndpoint" = '' WHERE "apiEndpoint" IS NOT NULL;
