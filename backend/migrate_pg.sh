#!/bin/bash
export DATABASE_URL="postgresql+psycopg2://dev_user:dev_password@localhost:5433/app_db"
alembic "$@"