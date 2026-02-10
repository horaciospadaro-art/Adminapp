-- CreateTable
CREATE TABLE "ISLRConcept" (
    "id" TEXT NOT NULL,
    "seniat_code" TEXT,
    "description" TEXT NOT NULL,
    "rate" DECIMAL(5, 2) NOT NULL,
    "base_percentage" DECIMAL(5, 2) NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ISLRConcept_pkey" PRIMARY KEY ("id")
);
-- Seed Data (from image)
INSERT INTO "ISLRConcept" (
        "id",
        "description",
        "rate",
        "base_percentage",
        "updatedAt"
    )
VALUES (
        gen_random_uuid(),
        'Honorarios Profesionales',
        5.00,
        100.00,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Pagos a Contratistas y Subcontratistas',
        2.00,
        100.00,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Pagos de los Administradores de Bienes e Inmuebles',
        5.00,
        100.00,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Arrendamientos Bienes e Inmuebles',
        5.00,
        100.00,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Fletes a Empresas Nacionales',
        3.00,
        100.00,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Pago a Empresas de Seguros o Agentes',
        5.00,
        100.00,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Publicidad y Propaganda',
        5.00,
        100.00,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Publicidad y Propaganda a Emisoras Radiodifusoras',
        3.00,
        100.00,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Comisiones',
        5.00,
        100.00,
        CURRENT_TIMESTAMP
    );