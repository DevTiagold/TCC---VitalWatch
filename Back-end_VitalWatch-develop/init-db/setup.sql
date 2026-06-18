CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nome VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'paciente' CHECK (role IN ('paciente', 'enfermeira'))
);

CREATE TABLE pacientes (
    paciente_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    enfermeira_id UUID REFERENCES users(id) ON DELETE SET NULL,
    id_micro VARCHAR(100) UNIQUE,
    nome VARCHAR(100),
    idade INT,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20)
);

CREATE TABLE medidas_brutas (
    time TIMESTAMPTZ NOT NULL,
    paciente_id UUID NOT NULL REFERENCES pacientes(paciente_id) ON DELETE CASCADE,
    batimentos INT,
    oxigenacao INT
);

SELECT create_hypertable('medidas_brutas', 'time');

CREATE MATERIALIZED VIEW estatisticas_horarias
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS data_referencia,
    paciente_id,
    avg(batimentos)::INT AS media_batimentos,
    avg(oxigenacao)::INT AS media_oxigenacao,
    min(batimentos) AS min_batimentos,
    max(batimentos) AS max_batimentos,
    min(oxigenacao) AS min_oxigenacao,
    max(oxigenacao) AS max_oxigenacao
FROM medidas_brutas
GROUP BY data_referencia, paciente_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('estatisticas_horarias',
    start_offset => INTERVAL '2 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

ALTER MATERIALIZED VIEW estatisticas_horarias SET (timescaledb.materialized_only = false);

SELECT add_retention_policy('medidas_brutas', INTERVAL '2 days');

-- ===============================================
-- ALERTAS (mesma arquitetura das medidas)
-- ===============================================

CREATE TABLE alertas_brutos (
    time         TIMESTAMPTZ NOT NULL,
    paciente_id  UUID NOT NULL REFERENCES pacientes(paciente_id) ON DELETE CASCADE,
    tipo         VARCHAR(50)  NOT NULL,
    severidade   VARCHAR(50)  NOT NULL,
    nivel        INT          NOT NULL
);

SELECT create_hypertable('alertas_brutos', 'time');

CREATE MATERIALIZED VIEW alertas_horarios
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS data_referencia,
    paciente_id,
    count(*)::INT AS total_alertas,
    max(nivel) AS pior_nivel,
    count(*) FILTER (WHERE nivel = 3)::INT AS alertas_criticos,
    count(*) FILTER (WHERE nivel = 2)::INT AS alertas_atencao
FROM alertas_brutos
GROUP BY data_referencia, paciente_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('alertas_horarios',
    start_offset => INTERVAL '2 days',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

ALTER MATERIALIZED VIEW alertas_horarios SET (timescaledb.materialized_only = false);

SELECT add_retention_policy('alertas_brutos', INTERVAL '2 days');