-- AlterTable
ALTER TABLE "planning_clases" ADD COLUMN     "material_url" TEXT,
ADD COLUMN     "material_nombre" VARCHAR(255),
ADD COLUMN     "material_formato" VARCHAR(20),
ADD COLUMN     "material_tamano_kb" INTEGER;
