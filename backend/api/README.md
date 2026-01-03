# UFC Pound-for-Pound Rankings - Backend API

This is a simple Flask API for updating the UFC rankings data. When it's up, the front end has a button that says "Update", otherwise the button is not there. This is the only function for the backend. You can run the app without the backend at all. In the future, the hosted project may permanently host the backend somewhere so the update button is always visible and available to use.

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt # Basically just Flask
```

2. Run the API:

```bash
python app.py
```

The API will be available at `http://localhost:5000`.

## Endpoints

### GET /health
Returns a simple health check response to indicate the API is running.

**Response:**
```json
{
  "status": "ok"
}
```

### POST /update
Triggers the execution of `scraper.py` and `elo.py` scripts sequentially to update the rankings data.

**Response (Success):**
```json
{
  "status": "ok",
  "scraper": "<scraper output>",
  "elo": "<elo output>"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "<error message>"
}
```
