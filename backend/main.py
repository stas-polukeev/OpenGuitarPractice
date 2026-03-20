from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.config import FRONTEND_DIR
from backend.modes.registry import mount_mode_routers, get_mode_meta_list
from backend.routers.theory import router as theory_router
from backend.routers.settings import router as settings_router

app = FastAPI(title="Guitar Training")

# API routers
app.include_router(theory_router)
app.include_router(settings_router)

# Auto-discover and mount practice mode routers
mode_meta = mount_mode_routers(app.router)


@app.get("/api/modes")
def list_modes():
    return get_mode_meta_list()


# Serve frontend static files (must be last)
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
