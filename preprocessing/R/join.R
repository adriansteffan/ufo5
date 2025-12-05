library(tidyverse)

DATA_DIR <- "data"
OUTPUT_DIR <- "raw_data_joined"

dir.create(OUTPUT_DIR, showWarnings = FALSE)

participant_dirs <- list.dirs(DATA_DIR, recursive = FALSE, full.names = TRUE)

read_and_tag <- function(dir_path, pattern) {
  session_id <- basename(dir_path)
  file_path <- list.files(dir_path, pattern = pattern, full.names = TRUE)[1]
  if (is.na(file_path)) return(NULL)
  read_csv(file_path, show_col_types = FALSE) %>%
    mutate(session_id = session_id, .before = 1)
}

build_session_summary <- function(dir_path) {
  session_id <- basename(dir_path)


  main_file <- list.files(dir_path, pattern = paste0("^", session_id, "\\.csv$"), full.names = TRUE)[1]
  if (is.na(main_file)) return(NULL)
  result <- read_csv(main_file, show_col_types = FALSE)

  # Read task ratings (if exists)
  rating_file <- list.files(dir_path, pattern = "_TASK_RATING_", full.names = TRUE)[1]
  if (!is.na(rating_file)) {
    rating_data <- read_csv(rating_file, show_col_types = FALSE)
    result$SportsGame_rating <- rating_data$SportsGame_rating[1]
    result$DatingGame_rating <- rating_data$DatingGame_rating[1]
    result$NumberGame_rating <- rating_data$NumberGame_rating[1]
    result$WordGame_rating <- rating_data$WordGame_rating[1]
  }

  wanted_to_continue <- FALSE

  action_files <- list.files(dir_path, pattern = "_actions\\.csv$", full.names = TRUE)
  for (f in action_files) {
    actions <- read_csv(f, show_col_types = FALSE)
    if ("action" %in% names(actions) && "POPUP_CONTINUE" %in% actions$action) {
      wanted_to_continue <- TRUE
      break
    }
  }


  if (!wanted_to_continue) {
    game_files <- list.files(dir_path, pattern = "_(WORDGAME|NUMBERGAME)_[0-9]+\\.csv$", full.names = TRUE)
    for (f in game_files) {
      game_data <- read_csv(f, show_col_types = FALSE)
      if ("button" %in% names(game_data) && "POPUP_CONTINUE" %in% game_data$button) {
        wanted_to_continue <- TRUE
        break
      }
    }
  }

  result$wanted_to_continue <- wanted_to_continue

  # Determine which game was played
  if (length(list.files(dir_path, pattern = "_WORDGAME_")) > 0) {
    result$game <- "WordGame"
  } else if (length(list.files(dir_path, pattern = "_NUMBERGAME_")) > 0) {
    result$game <- "NumberGame"
  } else if (length(list.files(dir_path, pattern = "_DATINGGAME_")) > 0) {
    result$game <- "DatingGame"
  } else if (length(list.files(dir_path, pattern = "_SPORTSGAME_")) > 0) {
    result$game <- "SportsGame"
  } else {
    result$game <- NA
  }

  result
}


wordgame <- participant_dirs %>% map_dfr(~read_and_tag(.x, "_WORDGAME_"))
numbergame <- participant_dirs %>% map_dfr(~read_and_tag(.x, "_NUMBERGAME_"))

datinggame_actions <- participant_dirs %>% map_dfr(~read_and_tag(.x, "_DATINGGAME_.*_actions\\.csv"))
datinggame_matches <- participant_dirs %>% map_dfr(~read_and_tag(.x, "_DATINGGAME_.*_matchDatabase\\.csv"))
datinggame_people <- participant_dirs %>% map_dfr(~read_and_tag(.x, "_DATINGGAME_.*_peopleDatabase\\.csv"))

sportsgame_actions <- participant_dirs %>% map_dfr(~read_and_tag(.x, "_SPORTSGAME_.*_actions\\.csv"))
sportsgame_matches <- participant_dirs %>% map_dfr(~read_and_tag(.x, "_SPORTSGAME_.*_matchDatabase\\.csv"))
sportsgame_players <- participant_dirs %>% map_dfr(~read_and_tag(.x, "_SPORTSGAME_.*_playerDatabase\\.csv"))

sessions <- participant_dirs %>% map_dfr(build_session_summary)

write_csv(wordgame, file.path(OUTPUT_DIR, "wordgame.csv"))
write_csv(numbergame, file.path(OUTPUT_DIR, "numbergame.csv"))
write_csv(datinggame_actions, file.path(OUTPUT_DIR, "datinggame_actions.csv"))
write_csv(datinggame_matches, file.path(OUTPUT_DIR, "datinggame_matches.csv"))
write_csv(datinggame_people, file.path(OUTPUT_DIR, "datinggame_people.csv"))
write_csv(sportsgame_actions, file.path(OUTPUT_DIR, "sportsgame_actions.csv"))
write_csv(sportsgame_matches, file.path(OUTPUT_DIR, "sportsgame_matches.csv"))
write_csv(sportsgame_players, file.path(OUTPUT_DIR, "sportsgame_players.csv"))
write_csv(sessions, file.path(OUTPUT_DIR, "sessions.csv"))
