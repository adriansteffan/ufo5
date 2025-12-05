library(tidyverse)

DATA_DIR <- "raw_data_joined"
OUTPUT_DIR <- "preprocessed"
dir.create(OUTPUT_DIR, showWarnings = FALSE)

dating_sim <- read_csv("simulations/random_dating.csv", show_col_types = FALSE)
BASELINE_SCORE_PER_DATING_MATCH <- mean(dating_sim$score)

sports_sim <- read_csv("simulations/random_sports.csv", show_col_types = FALSE)
BASELINE_OVERALL_FITNESS <- mean(sports_sim$overall_fitness)
BASELINE_FITNESS_DIFF <- mean(sports_sim$fitness_diff)

# ==============================================================================
# WordGame DV Computation
# ==============================================================================

compute_wordgame_dvs <- function(data, session_id) {
  # Get the words (each word appears multiple times for each action due to the structure, so we filter this down)
  words <- data %>%
    filter(!is.na(word)) %>%
    distinct(roundIndex, foundWordIndex, word, isCorrect, submitTime)

  if (nrow(words) == 0) return(NULL)

  actions_per_attempt <- data %>%
    filter(!is.na(word)) %>%
    group_by(roundIndex, foundWordIndex) %>%
    summarise(
      n_actions = max(actionIndex) + 1,
      isCorrect = first(isCorrect),
      .groups = "drop"
    )

  # each set is called a round in our data, so roundindex identifies sets
  words_per_set <- words %>%
    group_by(roundIndex) %>%
    summarise(
      n_words = n(),
      n_accurate = sum(as.logical(isCorrect), na.rm = TRUE),
      .groups = "drop"
    )

  # Exclude last set (wasn't followed by reset, just ended by timer)
  attempts_before_reset <- head(words_per_set$n_words, -1)

  accurate_words <- words %>% filter(as.logical(isCorrect))
  accurate_actions <- actions_per_attempt %>% filter(as.logical(isCorrect))

  # Hard letters in accurate words - more than 5 points in scrabble
  hard_letters <- c("q", "x", "z", "j", "k")
  hard_letter_count <- sum(str_count(tolower(paste(accurate_words$word, collapse = "")),
                                      paste0("[", paste(hard_letters, collapse = ""), "]")))

  # time between words (within each round only)
  time_diffs <- words %>%
    group_by(roundIndex) %>%
    arrange(submitTime, .by_group = TRUE) %>%
    mutate(time_diff = submitTime - lag(submitTime)) %>%
    pull(time_diff)

  tibble(
    session_id = session_id,
    game = "WordGame",

    total_words = nrow(words),
    total_accurate_words = nrow(accurate_words),
    n_sets = n_distinct(words$roundIndex),

    mean_words_per_set = mean(words_per_set$n_words, na.rm = TRUE),
    mean_accurate_words_per_set = mean(words_per_set$n_accurate, na.rm = TRUE),
    mean_attempts_before_reset = mean(attempts_before_reset, na.rm = TRUE),

    mean_word_length = mean(nchar(words$word), na.rm = TRUE),
    mean_accurate_word_length = mean(nchar(accurate_words$word), na.rm = TRUE),

    word_list = paste(words$word, collapse = ", "),
    accurate_word_list = paste(accurate_words$word, collapse = ", "),

    hard_letters_used_in_accurate = hard_letter_count,

    mean_time_between_words = mean(time_diffs, na.rm = TRUE),

    mean_edits_per_attempt = mean(actions_per_attempt$n_actions, na.rm = TRUE),
    mean_edits_per_accurate = mean(accurate_actions$n_actions, na.rm = TRUE),
  )
}

# ==============================================================================
# NumberGame DV Computation
# ==============================================================================

compute_numbergame_dvs <- function(data, session_id) {
  # All recorded expressions are correct (game only saves when result == target)
  expressions <- data %>%
    filter(!is.na(expression)) %>%
    distinct(roundIndex, foundExpressionIndex, expression, result, submitTime, target)

  if (nrow(expressions) == 0) return(NULL)

  actions_per_attempt <- data %>%
    filter(!is.na(expression)) %>%
    group_by(roundIndex, foundExpressionIndex) %>%
    summarise(
      n_actions = max(actionIndex) + 1,
      n_deletes = sum(button == "DELETE", na.rm = TRUE),
      .groups = "drop"
    )

  solutions_per_set <- expressions %>%
    group_by(roundIndex) %>%
    summarise(n_solutions = n(), .groups = "drop")

  # Exclude last set (wasn't followed by reset, just ended by timer)
  attempts_before_reset <- head(solutions_per_set$n_solutions, -1)

  # Inputs = numbers + operators, Operations = just operators (+, -, *, /)
  expression_stats <- expressions %>%
    mutate(
      n_numbers = str_count(expression, "\\d+"),
      n_operations = str_count(expression, "[+\\-*/]"),
      n_inputs = n_numbers + n_operations
    )

  # time between solutions (within each round only)
  time_diffs <- expressions %>%
    group_by(roundIndex) %>%
    arrange(submitTime, .by_group = TRUE) %>%
    mutate(time_diff = submitTime - lag(submitTime)) %>%
    pull(time_diff)

  tibble(
    session_id = session_id,
    game = "NumberGame",

    total_solutions = nrow(expressions),
    n_sets = n_distinct(expressions$roundIndex),
    mean_solutions_per_set = mean(solutions_per_set$n_solutions, na.rm = TRUE),

    mean_inputs_per_solution = mean(expression_stats$n_inputs, na.rm = TRUE),
    mean_operations_per_solution = mean(expression_stats$n_operations, na.rm = TRUE),
    total_operations = sum(expression_stats$n_operations, na.rm = TRUE),
    mean_operations_per_set = total_operations / n_sets,

    solution_list = paste(expressions$expression, collapse = ", "),

    mean_time_between_solutions = mean(time_diffs, na.rm = TRUE),
    mean_edits_per_attempt = mean(actions_per_attempt$n_actions, na.rm = TRUE),
    mean_attempts_before_reset = mean(attempts_before_reset, na.rm = TRUE)
  )
}

# ==============================================================================
# DatingGame DV Computation
# ==============================================================================

score_trait <- function(v1, v2) {
  diff <- abs(v1 - v2)
  case_when(
    diff <= 1 ~ 25, diff == 2 ~ 18, diff == 3 ~ 12,
    diff == 4 ~ 7, diff == 5 ~ 3, diff == 6 ~ 1, TRUE ~ 0
  )
}

compute_match_components <- function(matches, people) {
  pref_cols <- c("cats", "dogs", "smoking", "drinking", "travel",
                 "cooking", "reading", "music", "movies", "outdoors")

  joined <- matches %>%
    left_join(people, by = c("partner1Id" = "id"), suffix = c("", "_p1")) %>%
    left_join(people, by = c("partner2Id" = "id"), suffix = c("_p1", "_p2")) %>%
    mutate(
      openness_score = score_trait(coreTraits_openness_p1, coreTraits_openness_p2),
      sportiness_score = score_trait(coreTraits_sportiness_p1, coreTraits_sportiness_p2),
      social_score = score_trait(coreTraits_social_p1, coreTraits_social_p2),
      natural_score = score_trait(coreTraits_natural_p1, coreTraits_natural_p2),
      trait_score = openness_score + sportiness_score + social_score + natural_score,
      p1_attracted = lookingFor_p1 == gender_p2 | lookingFor_p1 == "both",
      p2_attracted = lookingFor_p2 == gender_p1 | lookingFor_p2 == "both",
      is_compatible = p1_attracted & p2_attracted
    )

  pref_score <- rep(0, nrow(joined))
  n_pref_matches <- rep(0, nrow(joined))
  n_pref_conflicts <- rep(0, nrow(joined))

  for (pref in pref_cols) {
    v1 <- joined[[paste0("miscPreferences_", pref, "_p1")]]
    v2 <- joined[[paste0("miscPreferences_", pref, "_p2")]]
    both_non_neutral <- v1 != "neutral" & v2 != "neutral"
    same_value <- v1 == v2

    pref_score <- pref_score + ifelse(both_non_neutral & same_value, 20,
                                       ifelse(both_non_neutral & !same_value, -20, 0))
    n_pref_matches <- n_pref_matches + (both_non_neutral & same_value)
    n_pref_conflicts <- n_pref_conflicts + (both_non_neutral & !same_value)
  }

  joined %>%
    mutate(
      preference_score = pref_score,
      n_pref_matches = n_pref_matches,
      n_pref_conflicts = n_pref_conflicts
    ) %>%
    select(matchIndex, openness_score, sportiness_score, social_score, natural_score,
           trait_score, preference_score, n_pref_matches, n_pref_conflicts, is_compatible)
}

compute_datinggame_dvs <- function(actions, matches, people, session_id) {
  if (nrow(actions) == 0 || nrow(matches) == 0) return(NULL)

  n_matches <- nrow(matches)

  action_counts <- actions %>%
    count(action) %>%
    pivot_wider(names_from = action, values_from = n, values_fill = 0)

  action_times <- actions %>%
    arrange(timestamp) %>%
    mutate(time_diff = timestamp - lag(timestamp))

  random_total_baseline <- n_matches * BASELINE_SCORE_PER_DATING_MATCH

  components <- compute_match_components(matches, people)

  result <- tibble(
    session_id = session_id,
    game = "DatingGame",

    total_matches = n_matches,
    sum_compatibility = sum(matches$assignedScore, na.rm = TRUE),
    mean_compatibility = mean(matches$assignedScore, na.rm = TRUE),

    random_total_baseline = random_total_baseline,
    total_compatibility_vs_random = sum(matches$assignedScore, na.rm = TRUE) - random_total_baseline,

    random_mean_baseline = BASELINE_SCORE_PER_DATING_MATCH,
    mean_compatibility_vs_random = mean_compatibility - BASELINE_SCORE_PER_DATING_MATCH,

    sum_openness_score = sum(components$openness_score, na.rm = TRUE),
    sum_sportiness_score = sum(components$sportiness_score, na.rm = TRUE),
    sum_social_score = sum(components$social_score, na.rm = TRUE),
    sum_natural_score = sum(components$natural_score, na.rm = TRUE),
    sum_trait_score = sum(components$trait_score, na.rm = TRUE),
    sum_preference_score = sum(components$preference_score, na.rm = TRUE),
    n_preference_matches = sum(components$n_pref_matches, na.rm = TRUE),
    n_preference_conflicts = sum(components$n_pref_conflicts, na.rm = TRUE),
    n_compatible_matches = sum(components$is_compatible, na.rm = TRUE),
    n_incompatible_matches = n_matches - n_compatible_matches,

    match_scores_list = paste(matches$assignedScore, collapse = ", "),

    total_actions = nrow(actions),
    mean_time_between_actions = mean(action_times$time_diff, na.rm = TRUE)
  )

  # Add action type counts as separate columns
  if (ncol(action_counts) > 0) {
    for (col in names(action_counts)) {
      result[[paste0("action_", col)]] <- action_counts[[col]]
    }
  }

  result
}

# ==============================================================================
# SportsGame DV Computation
# ==============================================================================

compute_sportsgame_dvs <- function(actions, matches, session_id) {
  if (nrow(actions) == 0 || nrow(matches) == 0) return(NULL)

  n_matches <- nrow(matches)

  action_counts <- actions %>%
    count(action) %>%
    pivot_wider(names_from = action, values_from = n, values_fill = 0)

  action_times <- actions %>%
    arrange(timestamp) %>%
    mutate(time_diff = timestamp - lag(timestamp))

  fitness_stats <- matches %>%
    mutate(
      overall_fitness = (teamAFitness + teamBFitness) / 2,
      fitness_diff = abs(teamAFitness - teamBFitness)
    )

  random_baseline_fitness <- n_matches * BASELINE_OVERALL_FITNESS
  random_baseline_diff <- n_matches * BASELINE_FITNESS_DIFF

  result <- tibble(
    session_id = session_id,

    game = "SportsGame",

    total_matches = n_matches,

    sum_fitness_overall = sum(fitness_stats$overall_fitness, na.rm = TRUE),
    sum_fitness_diff = sum(fitness_stats$fitness_diff, na.rm = TRUE),
    mean_fitness_overall = mean(fitness_stats$overall_fitness, na.rm = TRUE),
    mean_fitness_difference = mean(fitness_stats$fitness_diff, na.rm = TRUE),

    random_total_baseline_fitness = random_baseline_fitness,
    random_total_baseline_diff = random_baseline_diff,
    total_fitness_vs_random = sum_fitness_overall - random_baseline_fitness,
    total_balance_vs_random = sum_fitness_diff - random_baseline_diff,

    random_mean_baseline_fitness = BASELINE_OVERALL_FITNESS,
    random_mean_baseline_diff = BASELINE_FITNESS_DIFF,
    mean_fitness_vs_random = mean_fitness_overall - BASELINE_OVERALL_FITNESS,
    mean_balance_vs_random = mean_fitness_difference - BASELINE_FITNESS_DIFF,


    fitness_list = paste(paste0("(", matches$teamAFitness, ", ", matches$teamBFitness, ")"),
                         collapse = ", "),

    total_actions = nrow(actions),
    mean_time_between_actions = mean(action_times$time_diff, na.rm = TRUE)
  )

  # Add action type counts as separate columns
  if (ncol(action_counts) > 0) {
    for (col in names(action_counts)) {
      result[[paste0("action_", col)]] <- action_counts[[col]]
    }
  }

  result
}

# ==============================================================================
# Main Aggregation
# ==============================================================================


wordgame_data <- read_csv(file.path(DATA_DIR, "wordgame.csv"), show_col_types = FALSE)
numbergame_data <- read_csv(file.path(DATA_DIR, "numbergame.csv"), show_col_types = FALSE)
datinggame_actions <- read_csv(file.path(DATA_DIR, "datinggame_actions.csv"), show_col_types = FALSE)
datinggame_matches <- read_csv(file.path(DATA_DIR, "datinggame_matches.csv"), show_col_types = FALSE)
datinggame_people <- read_csv(file.path(DATA_DIR, "datinggame_people.csv"), show_col_types = FALSE)
sportsgame_actions <- read_csv(file.path(DATA_DIR, "sportsgame_actions.csv"), show_col_types = FALSE)
sportsgame_matches <- read_csv(file.path(DATA_DIR, "sportsgame_matches.csv"), show_col_types = FALSE)
sessions <- read_csv(file.path(DATA_DIR, "sessions.csv"), show_col_types = FALSE)

# Compute DVs by session_id
wordgame_dvs <- wordgame_data %>%
  group_by(session_id) %>%
  group_map(\(data, key) compute_wordgame_dvs(data, key$session_id)) %>%
  bind_rows()

numbergame_dvs <- numbergame_data %>%
  group_by(session_id) %>%
  group_map(\(data, key) compute_numbergame_dvs(data, key$session_id)) %>%
  bind_rows()

# For Dating/Sports, need to join actions and matches by session_id
datinggame_dvs <- datinggame_actions %>%
  distinct(session_id) %>%
  pull(session_id) %>%
  map_dfr(function(sid) {
    actions <- datinggame_actions %>% filter(session_id == sid)
    matches <- datinggame_matches %>% filter(session_id == sid)
    people <- datinggame_people %>% filter(session_id == sid)
    compute_datinggame_dvs(actions, matches, people, sid)
  }) %>%
  mutate(across(starts_with("action_"), \(x) replace_na(x, 0)))

sportsgame_dvs <- sportsgame_actions %>%
  distinct(session_id) %>%
  pull(session_id) %>%
  map_dfr(function(sid) {
    actions <- sportsgame_actions %>% filter(session_id == sid)
    matches <- sportsgame_matches %>% filter(session_id == sid)
    compute_sportsgame_dvs(actions, matches, sid)
  }) %>%
  mutate(across(starts_with("action_"), \(x) replace_na(x, 0)))

all_dvs <- list(
  wordgame = wordgame_dvs,
  numbergame = numbergame_dvs,
  datinggame = datinggame_dvs,
  sportsgame = sportsgame_dvs
)

write_csv(wordgame_dvs, file.path(OUTPUT_DIR, "wordgame_dvs.csv"))
write_csv(numbergame_dvs, file.path(OUTPUT_DIR, "numbergame_dvs.csv"))
write_csv(datinggame_dvs, file.path(OUTPUT_DIR, "datinggame_dvs.csv"))
write_csv(sportsgame_dvs, file.path(OUTPUT_DIR, "sportsgame_dvs.csv"))
write_csv(sessions, file.path(OUTPUT_DIR, "sessions.csv"))
