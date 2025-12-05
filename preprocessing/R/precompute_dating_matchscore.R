library(tidyverse)

generate_random_person <- function() {
  gender <- sample(c("male", "female"), 1)
  rand <- runif(1)
  looking_for <- if (rand < 0.75) {
    if (gender == "male") "female" else "male"
  } else if (rand < 0.80) {
    gender
  } else {
    "both"
  }

  core_traits <- list(
    openness = sample(0:10, 1),
    sportiness = sample(0:10, 1),
    social = sample(0:10, 1),
    natural = sample(0:10, 1)
  )

  pref_names <- c("cats", "dogs", "smoking", "drinking", "travel",
                  "cooking", "reading", "music", "movies", "outdoors")
  misc_prefs <- setNames(rep("neutral", 10), pref_names)
  selected_prefs <- sample(pref_names, sample(1:2, 1))
  misc_prefs[selected_prefs] <- sample(c("positive", "negative"),
                                        length(selected_prefs),
                                        replace = TRUE)

  list(
    gender = gender,
    looking_for = looking_for,
    core_traits = core_traits,
    misc_prefs = misc_prefs
  )
}

are_compatible <- function(p1, p2) {
  (p1$looking_for == p2$gender || p1$looking_for == "both") &&
  (p2$looking_for == p1$gender || p2$looking_for == "both")
}

generate_compatible_person <- function(existing) {
  if (length(existing) > 0 && runif(1) < 0.8) {
    for (i in 1:100) {
      person <- generate_random_person()
      if (any(sapply(existing, \(p) are_compatible(p, person)))) {
        return(person)
      }
    }
    person
  } else {
    generate_random_person()
  }
}

score_couple <- function(p1, p2) {
  traits <- c("openness", "sportiness", "social", "natural")
  diffs <- abs(unlist(p1$core_traits[traits]) - unlist(p2$core_traits[traits]))
  trait_scores <- case_when(
    diffs <= 1 ~ 25, diffs == 2 ~ 18, diffs == 3 ~ 12,
    diffs == 4 ~ 7, diffs == 5 ~ 3, diffs == 6 ~ 1, TRUE ~ 0
  )
  score <- sum(trait_scores)

  prefs1 <- p1$misc_prefs[p1$misc_prefs != "neutral"]
  prefs2 <- p2$misc_prefs[p2$misc_prefs != "neutral"]
  shared <- intersect(names(prefs1), names(prefs2))
  score <- score + sum(ifelse(prefs1[shared] == prefs2[shared], 20, -20))

  score <- max(0, min(100, round(score)))
  if (!are_compatible(p1, p2)) score <- score - 100
  score
}

simulate_random_game <- function(n_matches) {
  if (n_matches == 0) return(numeric(0))

  hand <- list(generate_random_person(), generate_random_person())
  for (i in 3:5) hand <- c(hand, list(generate_compatible_person(hand)))

  scores <- numeric(n_matches)
  for (i in seq_len(n_matches)) {
    idx <- sample(seq_along(hand), 2)
    scores[i] <- score_couple(hand[[idx[1]]], hand[[idx[2]]])
    hand <- hand[-idx]
    hand <- c(hand, list(
      generate_compatible_person(hand),
      generate_compatible_person(hand)
    ))
  }
  scores
}


n_sims <- 6000
matches_per_sim <- 100

set.seed(42)
results <- map_dfr(seq_len(n_sims), function(sim_id) {
  scores <- simulate_random_game(matches_per_sim)
  tibble(sim_id = sim_id - 1, match_index = seq_along(scores), score = scores)
})

dir.create("simulations", showWarnings = FALSE)
write_csv(results, "simulations/random_dating.csv")
message(sprintf("Mean score per match: %.6f", mean(results$score)))

# Histogram 1: Mean score per simulation
sim_means <- results %>%
  group_by(sim_id) %>%
  summarise(mean_score = mean(score), .groups = "drop")

ggplot(sim_means, aes(x = mean_score)) +
  geom_histogram(bins = 50, fill = "steelblue", color = "white") +
  labs(title = "Distribution of Mean Match Score per Simulation",
       x = "Mean Score per Simulation", y = "Count") +
  theme_minimal()
ggsave("simulations/random_dating_sim_means.png", width = 8, height = 5)

# Histogram 2: All individual match scores
ggplot(results, aes(x = score)) +
  geom_histogram(binwidth = 5, fill = "steelblue", color = "white") +
  labs(title = "Distribution of All Individual Match Scores",
       x = "Match Score", y = "Count") +
  theme_minimal()
ggsave("simulations/random_dating_all_scores.png", width = 8, height = 5)
