library(tidyverse)

STAR_VALUES <- c(0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0)
BIASED_WEIGHTS <- c(1, 1, 2, 2, 3, 3, 4, 4, 5, 5)

generate_stat_uniform <- function() {
  sample(STAR_VALUES, 1)
}

generate_stat_biased <- function() {
  sample(STAR_VALUES, 1, prob = BIASED_WEIGHTS)
}

generate_random_player <- function() {
  player_type <- sample(c("defense", "mid", "attack"), 1)

  list(
    player_type = player_type,
    defense = if (player_type == "defense") generate_stat_biased() else generate_stat_uniform(),
    passing = if (player_type == "mid") generate_stat_biased() else generate_stat_uniform(),
    shooting = if (player_type == "attack") generate_stat_biased() else generate_stat_uniform(),
    stamina = generate_stat_uniform()
  )
}

calculate_position_fitness <- function(player, position) {
  primary_stat <- case_when(
    position == "defense" ~ player$defense,
    position %in% c("mid1", "mid2") ~ player$passing,
    position == "offense" ~ player$shooting
  )
  primary_stat * 2 + player$stamina
}

simulate_random_match <- function() {
  players <- replicate(8, generate_random_player(), simplify = FALSE)
  positions <- c("defense", "mid1", "mid2", "offense")

  shuffled <- sample(seq_along(players))

  teamA_fitness <- mean(sapply(1:4, function(i) {
    calculate_position_fitness(players[[shuffled[i]]], positions[i])
  }))

  teamB_fitness <- mean(sapply(5:8, function(i) {
    calculate_position_fitness(players[[shuffled[i]]], positions[i - 4])
  }))

  c(teamA_fitness = teamA_fitness, teamB_fitness = teamB_fitness)
}

simulate_random_game <- function(n_matches) {
  results <- t(replicate(n_matches, simulate_random_match()))
  as_tibble(results) %>%
    mutate(
      match_index = row_number(),
      overall_fitness = (teamA_fitness + teamB_fitness) / 2,
      fitness_diff = abs(teamA_fitness - teamB_fitness)
    )
}


n_sims <- 6000
matches_per_sim <- 100

set.seed(42)
results <- map_dfr(seq_len(n_sims), function(sim_id) {
  simulate_random_game(matches_per_sim) %>%
    mutate(sim_id = sim_id - 1, .before = 1)
})

dir.create("simulations", showWarnings = FALSE)
write_csv(results, "simulations/random_sports.csv")
message(sprintf("Mean overall fitness: %.4f", mean(results$overall_fitness)))
message(sprintf("Mean fitness diff: %.4f", mean(results$fitness_diff)))

# Histogram 1: Overall fitness per match
ggplot(results, aes(x = overall_fitness)) +
  geom_histogram(bins = 50, fill = "steelblue", color = "white") +
  labs(title = "Distribution of Overall Team Fitness",
       x = "Overall Fitness (avg of both teams)", y = "Count") +
  theme_minimal()
ggsave("simulations/random_sports_overall.png", width = 8, height = 5)

# Histogram 2: Fitness difference per match
ggplot(results, aes(x = fitness_diff)) +
  geom_histogram(bins = 50, fill = "steelblue", color = "white") +
  labs(title = "Distribution of Fitness Difference Between Teams",
       x = "Fitness Difference", y = "Count") +
  theme_minimal()
ggsave("simulations/random_sports_diff.png", width = 8, height = 5)

# Histogram 3: Mean overall fitness per simulation
sim_means <- results %>%
  group_by(sim_id) %>%
  summarise(mean_overall = mean(overall_fitness), .groups = "drop")

ggplot(sim_means, aes(x = mean_overall)) +
  geom_histogram(bins = 50, fill = "steelblue", color = "white") +
  labs(title = "Distribution of Mean Overall Fitness per Simulation",
       x = "Mean Overall Fitness", y = "Count") +
  theme_minimal()
ggsave("simulations/random_sports_sim_means.png", width = 8, height = 5)
