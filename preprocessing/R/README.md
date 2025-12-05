# R Preprocessing Pipeline

This folder contains R scripts for preprocessing experiment data and computing dependent variables.

## Folder Structure

```
preprocessing/R/
├── data/                              # Raw output from online tool (ignore)
│
├── raw_data_joined/                   # Joined raw data (for in-depth analysis)
│   ├── sessions.csv                   # Participant-level data (survey, group, game played)
│   ├── wordgame.csv                   # All WordGame actions across participants
│   ├── numbergame.csv                 # All NumberGame actions across participants
│   ├── datinggame_actions.csv         # All DatingGame user actions
│   ├── datinggame_matches.csv         # All matches made in DatingGame
│   ├── datinggame_people.csv          # All generated people in DatingGame
│   ├── sportsgame_actions.csv         # All SportsGame user actions
│   ├── sportsgame_matches.csv         # All matches played in SportsGame
│   └── sportsgame_players.csv         # All generated players in SportsGame
│
├── preprocessed/                      # Computed dependent variables (DVs)
│   ├── sessions.csv                   # Participant-level data (same as raw_data_joined)
│   ├── wordgame_dvs.csv               # WordGame DVs (words found, accuracy, etc.)
│   ├── numbergame_dvs.csv             # NumberGame DVs (solutions found, operations, etc.)
│   ├── datinggame_dvs.csv             # DatingGame DVs (compatibility scores, action counts)
│   └── sportsgame_dvs.csv             # SportsGame DVs (team fitness, action counts)
│
├── simulations/                       # Random baseline simulation data
│   ├── random_dating.csv              # simulations of random DatingGame play
│   ├── random_sports.csv              # simulations of random SportsGame play
│   └── *.png                          # Distribution histograms
│
├── join.R                             # Joins per-participant data into single files
├── main.R                             # Computes DVs from joined data
├── precompute_dating_matchscore.R     # Generates random DatingGame baseline
└── precompute_sports_fitness.R        # Generates random SportsGame baseline
```

## Script Descriptions

### join.R
Reads per-participant folders from `data/` and combines them into single CSV files in `raw_data_joined/`. Also extracts session-level information (which game was played, survey responses, etc.).

### precompute_dating_matchscore.R
Simulates N games of random DatingGame play (100 matches each) to establish baseline compatibility scores. Outputs `simulations/random_dating.csv` and distribution histograms.

### precompute_sports_fitness.R
Simulates N games of random SportsGame play (100 matches each) to establish baseline team fitness values. Outputs `simulations/random_sports.csv` and distribution histograms.

### main.R
Reads joined data from `raw_data_joined/` and simulation baselines from `simulations/`, then computes dependent variables for each game type. Outputs DV files to `preprocessed/`.

## Execution Order

When processing new data, run the scripts in this order:

1. **Precompute scripts** (one-time, or when regenerating baselines)
   ```r
   source("precompute_dating_matchscore.R")
   source("precompute_sports_fitness.R")
   ```

2. **join.R** (when new participant data arrives in `data/`)
   ```r
   source("join.R")
   ```

3. **main.R** (after running join.R, or after modifying main.R)
   ```r
   source("main.R")
   ```

## Important Notes

- The **simulation files are required** before running `main.R`. If you receive new data and want to run `main.R`, make sure the `simulations/` folder contains `random_dating.csv` and `random_sports.csv`.

- The **preprocessed DVs** in `preprocessed/` include comparisons against the random baselines (e.g., `mean_compatibility_vs_random`, `mean_fitness_vs_random`).

- The `data/` folder contains the raw output from the online experiment tool and can generally be ignored for analysis. Use `raw_data_joined/` for detailed inspection or `preprocessed/` for analysis-ready DVs.

## Dependencies

All scripts require the `tidyverse` package:

```r
install.packages("tidyverse")
```
