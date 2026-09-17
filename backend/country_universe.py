from __future__ import annotations

from typing import Iterable

import pandas as pd
import pycountry


# Kosovo is widely used as XKX in World Bank and other international datasets even
# though it is not an assigned ISO 3166-1 alpha-3 code. Keep it as an explicit
# production-economy exception. Taiwan (TWN) is already an assigned ISO code.
SPECIAL_ECONOMY_CODES = {"XKX"}


def is_production_country_iso3(value: object) -> bool:
    code = str(value or "").upper().strip()
    if code in SPECIAL_ECONOMY_CODES:
        return True
    if len(code) != 3:
        return False
    return pycountry.countries.get(alpha_3=code) is not None


def filter_production_country_universe(df: pd.DataFrame) -> pd.DataFrame:
    """Remove World Bank regional/income aggregates while retaining ISO economies."""
    if "iso3" not in df.columns:
        return df.copy()
    mask = df["iso3"].map(is_production_country_iso3)
    return df.loc[mask].copy().reset_index(drop=True)


def invalid_country_codes(values: Iterable[object]) -> list[str]:
    return sorted({str(value).upper() for value in values if not is_production_country_iso3(value)})
