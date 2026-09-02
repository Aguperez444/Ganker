FROM python:3.14-slim

# Evitar generación de archivos .pyc y forzar salida inmediata de prints/logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY . .

# Comando para desarrollo: host 0.0.0.0 para Docker y reload activado
CMD ["uvicorn", "app.infrastructure.start.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]