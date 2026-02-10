-- Drop old table if exists (to avoid conflicts with previous partial migrations)
DROP TABLE IF EXISTS "ISLRConcept";
-- CreateTableV2
CREATE TABLE "ISLRConcept" (
    "id" TEXT NOT NULL,
    "seniat_code" TEXT,
    "description" TEXT NOT NULL,
    "pn_resident_rate" TEXT,
    "pj_domiciled_rate" TEXT,
    "pn_non_resident_rate" TEXT,
    "pj_non_domiciled_rate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ISLRConcept_pkey" PRIMARY KEY ("id")
);
-- Seed Data V2
INSERT INTO "ISLRConcept" (
        "id",
        "seniat_code",
        "description",
        "pn_resident_rate",
        "pj_domiciled_rate",
        "pn_non_resident_rate",
        "pj_non_domiciled_rate",
        "updatedAt"
    )
VALUES (
        gen_random_uuid(),
        '001/002',
        'Honorarios Profesionales',
        '3% - Sust.',
        '5%',
        '34% (s/90%)',
        '34% (s/90%)',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '011',
        'Arrendamiento Inmuebles',
        '3% - Sust.',
        '5%',
        '34%',
        '34%',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '012',
        'Arrendamiento Muebles',
        '3% - Sust.',
        '5%',
        '34%',
        '34%',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '015',
        'Comisiones',
        '3% - Sust.',
        '5%',
        '34%',
        '34%',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '023',
        'Contratistas / Servicios',
        '1% - Sust.',
        '2%',
        '34%',
        '34%',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '036',
        'Fletes / Transporte',
        '1% - Sust.',
        '3%',
        '10% (s/base)',
        '10% (s/base)',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '040',
        'Primas de Seguro',
        '3%',
        '5%',
        '10% (s/30%)',
        '10% (s/30%)',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '042',
        'Publicidad y Propaganda',
        '3% - Sust.',
        '5%',
        '34%',
        '34%',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '005',
        'Asistencia Técnica',
        '-',
        '-',
        '34% (s/30%)',
        '34% (s/30%)',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '006',
        'Servicios Tecnológicos',
        '-',
        '-',
        '34% (s/50%)',
        '34% (s/50%)',
        CURRENT_TIMESTAMP
    );