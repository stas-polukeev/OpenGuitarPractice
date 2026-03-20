import importlib
import pkgutil

from fastapi import APIRouter

import backend.modes as modes_package


def discover_modes() -> list[dict]:
    found = []
    package_path = modes_package.__path__
    for importer, modname, ispkg in pkgutil.iter_modules(package_path):
        if not ispkg:
            continue
        try:
            mod = importlib.import_module(f"backend.modes.{modname}.router")
            meta = getattr(mod, "MODE_META", None)
            router = getattr(mod, "router", None)
            if meta and router:
                found.append({"meta": meta, "router": router, "module": modname})
        except Exception:
            continue
    return found


def mount_mode_routers(parent_router: APIRouter) -> list[dict]:
    modes = discover_modes()
    meta_list = []
    for mode in modes:
        slug = mode["meta"]["slug"]
        parent_router.include_router(
            mode["router"],
            prefix=f"/api/modes/{slug}",
            tags=[slug],
        )
        meta_list.append(mode["meta"])
    return meta_list


_cached_meta: list[dict] | None = None


def get_mode_meta_list() -> list[dict]:
    global _cached_meta
    if _cached_meta is None:
        _cached_meta = [m["meta"] for m in discover_modes()]
    return _cached_meta
