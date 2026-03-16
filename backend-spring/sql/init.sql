DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fitsphere') THEN
        CREATE ROLE fitsphere LOGIN PASSWORD 'fitsphere';
    END IF;
END
$$;

SELECT 'CREATE DATABASE fitsphere OWNER fitsphere'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fitsphere')
\gexec

GRANT ALL PRIVILEGES ON DATABASE fitsphere TO fitsphere;
