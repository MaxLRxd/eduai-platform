# syntax=docker/dockerfile:1

FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

# Tesseract (CU-P02, OCR de imagenes y PDF escaneado) + poppler (pdf2image).
# spa = espanol, eng = ingles (muchos apuntes mezclan ambos).
# tesseract-ocr-all-tr / poppler-utils son las imagenes que exponen ambos binarios.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-spa \
        tesseract-ocr-eng \
        poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# --- Desarrollo: hot reload ---
FROM base AS dev
RUN python -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-dev.txt
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload"]

# --- Dependencias de producción ---
FROM base AS prod-deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# --- Producción: imagen mínima ---
FROM base AS prod
ENV PATH="/app/.venv/bin:$PATH"
COPY --from=prod-deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
