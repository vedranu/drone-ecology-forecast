# drone-ecology-forecast

Reproducible data set and toolbox-free MATLAB pipeline behind the paper
**"Drones in Ecology and Environmental Monitoring: Bibliometric State of the Art and Growth Forecasts to 2035"**
(MIPRO Robotics, special session RTA-DRONES, submitted 2027).

Annual counts of OpenAlex articles combining UAV terms with ecological and environmental
terms (2005–2025), three normalising denominators and six application sub-domains, plus a
MATLAB algorithm that fits four growth models (exponential, logistic, Gompertz, Bass),
compares them with QAICc, backtests them and produces bootstrapped forecasts for
3/5/7/10-year horizons.

## Contents

| Folder | What it holds |
|---|---|
| `data/` | `openalex_drone_env_annual.csv` (input, one row per year), `raw_openalex_counts.csv` (long format), `registry_indicators.csv` (FAA/AESA/EASA/HACZ context figures), `codebook.md` (query definitions, variables, limitations) |
| `matlab/` | `drone_env_forecast.m` (main script, OPTIONS block at the top), `drone_env_projection_10y.m` (year-by-year projection 2026–2035 for the core series and each sub-domain) and the functions they call |
| `python/` | `replicate_fits.py` (independent replication of the fits with scipy), `build_projection.py` (assembles the projection workbook and figures) |

## Requirements

MATLAB R2016b or later **without any toolbox** (uses `fminsearch`, `randg`, `betainc`, `gammaln`),
or GNU Octave 8+. Python 3.9+ with numpy, scipy, pandas, matplotlib, openpyxl for the optional scripts.

## Run

```matlab
cd matlab
drone_env_forecast          % ~1–3 min in MATLAB with 1000 bootstrap replicates; writes ../results
drone_env_projection_10y    % ~10 min; writes ../projection/<series>/
```

Outputs: `models_count.csv`, `models_share.csv`, `forecast_count.csv`, `forecast_share.csv`,
three figures (PNG 600 dpi + EPS) and a `.mat` file with the full result structure.
Set `opt.nboot = 50` for a quick test; set `opt.numerator = 'sub_forest'` (etc.) to forecast a sub-domain.

## Data provenance

Retrieved on 26 August 2026 from the OpenAlex API (`/works`, `group_by=publication_year`,
`type:article|review`). OpenAlex is updated retroactively, so the retrieval date is part of the
data definition; the exact Boolean strings and the URL template are in `data/codebook.md`.
OpenAlex data are released under CC0.

## Method in one paragraph

Growth models are fitted to annual counts by minimising the Poisson deviance with Nelder–Mead
from multiple starting points; the share of the environmental literature is modelled with the
denominator as an offset. Overdispersion (Pearson ĉ ≈ 20) is handled with QAICc and Akaike
weights, which also give a model-averaged forecast. Out-of-sample accuracy is assessed by
rolling-origin backtesting (origins 2018, 2020, 2022). Forecast intervals come from a parametric
negative-binomial bootstrap (1000 replicates, models refitted and re-weighted on every replicate).

## Citation

If you use the data or the code, please cite the paper and this repository (see `CITATION.cff`;
a Zenodo DOI is added on release).

## Licence

Code: MIT (see `LICENSE`). Data files in `data/`: CC BY 4.0; the underlying bibliographic
counts derive from OpenAlex (CC0).
