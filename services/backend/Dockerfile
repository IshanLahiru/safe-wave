FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    postgresql-client \
    ffmpeg \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock* ./

ARG POETRY_WITH_DEV=false

RUN if [ "$POETRY_WITH_DEV" = "true" ]; then \
      poetry install --no-root --with dev; \
    else \
      poetry install --no-root --only main; \
    fi

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini
COPY scripts ./scripts
COPY main.py ./main.py

EXPOSE 8000

CMD ["bash", "-lc", "poetry run alembic upgrade head && poetry run gunicorn main:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --timeout 120 --workers 2"]