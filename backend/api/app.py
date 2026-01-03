import subprocess
import sys
from pathlib import Path
from flask import Flask, jsonify, request

app = Flask(__name__)

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"


def run_script(script_name: str) -> str:
    """Run a Python script from the scripts directory and return stdout."""
    script_path = SCRIPTS_DIR / script_name
    if not script_path.exists():
        raise FileNotFoundError(f"Script not found: {script_path}")

    result = subprocess.run(
        [sys.executable, str(script_path)],
        check=False,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"{script_name} failed with exit code {result.returncode}: {result.stderr.strip()}"
        )

    return result.stdout.strip()


@app.after_request
def add_cors_headers(response):
    """Allow simple cross-origin calls from the frontend."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/health", methods=["GET"])
def health():
    """Lightweight health endpoint to signal the API is up."""
    return jsonify({"status": "ok"})


@app.route("/update", methods=["POST", "OPTIONS"])
def update():
    """Trigger the scraper and Elo scripts sequentially."""
    if request.method == "OPTIONS":
        return ("", 204)

    try:
        scraper_output = run_script("scraper.py")
        elo_output = run_script("elo.py")
        return jsonify({"status": "ok", "scraper": scraper_output, "elo": elo_output})
    except Exception as exc:  # noqa: BLE001 (simple minimal handler)
        return jsonify({"status": "error", "message": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
