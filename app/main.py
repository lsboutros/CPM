from __future__ import annotations

from fastapi import FastAPI

from . import __version__
from .routers import assets, controls, risks, vulnerabilities


def create_app() -> FastAPI:
    app = FastAPI(
        title="Cyber Portfolio Management",
        version=__version__,
        description=(
            "Track cybersecurity assets, the risks they face, the controls that "
            "mitigate those risks, and the vulnerabilities exposing them."
        ),
    )

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok", "version": __version__}

    app.include_router(assets.router)
    app.include_router(risks.router)
    app.include_router(controls.router)
    app.include_router(vulnerabilities.router)

    return app


app = create_app()
