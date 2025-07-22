# UFC Pound-for-Pound Rankings - Backend API

This is a simple Flask API that serves the UFC rankings data. It's empty right now but at some point in the future I'll fill it in.

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

1. Run the API:

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## Endpoints

- `GET /api/fighters/current` - Current ELO rankings
- `GET /api/fighters/historical` - Historical peak ELOs
- `GET /api/fighters/metadata` - Fighter metadata including weight classes
- `GET /api/stats/latest-event` - Latest fight information
