CREATE TABLE IF NOT EXISTS carbon_index (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(100) NOT NULL,
    carbon_index FLOAT NOT NULL
);

TRUNCATE TABLE carbon_index RESTART IDENTITY;

INSERT INTO carbon_index (timestamp, location, carbon_index) VALUES
('2023-10-01 06:00:00', 'Saigon', 120.5),
('2023-10-01 07:00:00', 'Saigon', 120.5),
('2023-10-01 08:00:00', 'Saigon', 120.5),
('2023-10-01 09:00:00', 'Saigon', 50.5),
('2023-10-01 10:00:00', 'Saigon', 120.5),
('2023-10-01 11:00:00', 'Saigon', 90.3),
('2023-10-01 06:00:00', 'London', 95.2),
('2023-10-01 07:00:00', 'London', 90.2),
('2023-10-01 08:00:00', 'London', 90.2),
('2023-10-01 09:00:00', 'London', 70.2),
('2023-10-01 10:00:00', 'London', 100.2),
('2023-10-01 11:00:00', 'London', 94.8);


-- Create a trigger function
CREATE OR REPLACE FUNCTION notify_carbon_index_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('carbon_index_update', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger on the carbon_index table
CREATE TRIGGER carbon_index_trigger
AFTER INSERT ON carbon_index
FOR EACH ROW
EXECUTE FUNCTION notify_carbon_index_update();

-- Create a function to insert random data
INSERT INTO carbon_index (timestamp, location, carbon_index)
VALUES (NOW(), 'London', 110.0 + (RANDOM() * 10)),
       (NOW(), 'Saigon', 90.0 + (RANDOM() * 10));
