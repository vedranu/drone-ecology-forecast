%REVISION_RUNS  Additional analyses requested by the MIPRO reviewer (rev. 1):
%  1. sat_counts  - count forecast averaged over the SATURATING models only
%                   (logistic, Gompertz, Bass; exponential excluded), 1000 replicates
%  2. no2025      - full re-fit on 2005-2024 (sensitivity of counts AND share
%                   to the partly artefactual 2025 observation); horizons chosen
%                   so that forecast years remain 2028/2030/2032/2035
%  3. den_field23 - share analysis with the classification-based denominator
%                   (OpenAlex field 23, Environmental Science)
%  4. den_allworks- share analysis with all indexed works as denominator
%  Output: ../results_rev/<run>/   Run:  >> revision_runs
clear; close all;
rev_runs = { ...
  struct('name','sat_counts',  'over', struct('models', {{'logistic','gompertz','bass'}}, 'nboot', 1000)), ...
  struct('name','no2025',      'over', struct('fit_years', [2005 2024], 'horizons', [4 6 8 11], 'nboot', 1000, 'sensitivity_drop_last', false)), ...
  struct('name','den_field23', 'over', struct('denominator', 'field23_envsci', 'nboot', 300, 'sensitivity_drop_last', false)), ...
  struct('name','den_allworks','over', struct('denominator', 'all_works',      'nboot', 300, 'sensitivity_drop_last', false)) };
for rev_i = 1:numel(rev_runs)
    opt_override = rev_runs{rev_i}.over;
    opt_override.outdir = fullfile('..', 'results_rev', rev_runs{rev_i}.name);
    fprintf('\n########## revision run: %s ##########\n', rev_runs{rev_i}.name);
    drone_env_forecast;
end
clear opt_override
fprintf('\nAll revision runs written to ../results_rev\n');
