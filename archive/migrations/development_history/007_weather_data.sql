-- Migration: Add weather data columns to vehicle_events
-- Purpose: Store historical weather conditions at time of fuel fill-up
-- Impact: Enables weather-adjusted MPG analysis and insights

-- Add weather columns to vehicle_events table
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS weather_temperature_f DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weather_condition VARCHAR(20),
ADD COLUMN IF NOT EXISTS weather_precipitation_mm DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weather_windspeed_mph DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weather_humidity_percent INT,
ADD COLUMN IF NOT EXISTS weather_pressure_inhg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weather_source VARCHAR(50) DEFAULT 'open_meteo';

-- Add comment to table
COMMENT ON COLUMN vehicle_events.weather_temperature_f IS 'Temperature in Fahrenheit at time of fill-up';
COMMENT ON COLUMN vehicle_events.weather_condition IS 'Weather condition: clear, rain, snow, cloudy, extreme';
COMMENT ON COLUMN vehicle_events.weather_precipitation_mm IS 'Precipitation in millimeters';
COMMENT ON COLUMN vehicle_events.weather_windspeed_mph IS 'Wind speed in miles per hour';
COMMENT ON COLUMN vehicle_events.weather_source IS 'Source of weather data (e.g., open_meteo)';

-- Create index for weather-based queries
CREATE INDEX IF NOT EXISTS idx_vehicle_events_weather_condition 
ON vehicle_events(weather_condition) 
WHERE weather_condition IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_events_temperature 
ON vehicle_events(weather_temperature_f) 
WHERE weather_temperature_f IS NOT NULL;

-- Sample query to analyze weather impact:
-- SELECT 
--   weather_condition,
--   COUNT(*) as fillups,
--   AVG(miles_driven / gallons) as avg_mpg,
--   AVG(weather_temperature_f) as avg_temp
-- FROM vehicle_events
-- WHERE type = 'fuel' 
--   AND miles_driven > 0 
--   AND weather_condition IS NOT NULL
-- GROUP BY weather_condition
-- ORDER BY avg_mpg DESC;
