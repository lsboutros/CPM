# CPM — Cyber Portfolio Management Tool

A FastAPI-based tool for managing a cybersecurity portfolio: tracking **Assets**, the
**Risks** that threaten them, the **Controls** that mitigate those risks, and the
**Vulnerabilities** that may expose them.

## Domain model

| Resource        | Purpose                                                                 |
|-----------------|-------------------------------------------------------------------------|
| `Asset`         | Anything of value: systems, applications, data stores, hardware.        |
| `Risk`          | A scenario of harm to one or more assets, scored by likelihood/impact.  |
| `Control`       | A safeguard (preventive / detective / corrective) reducing risk.        |
| `Vulnerability` | A specific weakness on an asset (CVE, misconfig, etc.).                 |

Resources are linked: a `Risk` references an `Asset`, a `Control` references one or
more `Risks` it mitigates, a `Vulnerability` references the `Asset` it affects.

## Quickstart

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run the dev server
uvicorn app.main:app --reload

# In another terminal: hit the API docs
open http://127.0.0.1:8000/docs
```

## Layout

```
app/
  main.py              # FastAPI app + router wiring
  models.py            # Pydantic schemas (Asset / Risk / Control / Vulnerability)
  storage.py           # In-memory repository (swap for a DB later)
  routers/
    assets.py
    risks.py
    controls.py
    vulnerabilities.py
tests/
  test_assets.py
  test_risks.py
  test_controls.py
  test_vulnerabilities.py
```

The storage layer is intentionally in-memory so the scaffold runs with zero setup;
replacing `app/storage.py` with a SQLAlchemy- or Tortoise-backed implementation
is the natural next step.

## Tests

```bash
pytest
```

## License

MIT — see [LICENSE](LICENSE).
