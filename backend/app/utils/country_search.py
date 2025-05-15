from functools import lru_cache

import geoip2.errors
from geoip2.database import Reader

from app.config import settings

_READER = Reader(settings.geoloc_data_path)


@lru_cache(maxsize=100_000)
def find_country_by_ip(client_ip: str) -> str | None:
    """Return 'US', 'SG'... 'DEV' / 'IDK' otherwise"""
    if client_ip.startswith("127."):
        return "DEV"
    try:
        return _READER.country(client_ip).country.iso_code
    except geoip2.errors.AddressNotFoundError:
        return "IDK"
