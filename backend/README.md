cd backend
source .venv/bin/activate  # if not already activated
uvicorn main:app --host 0.0.0.0 --port 8000 --reload