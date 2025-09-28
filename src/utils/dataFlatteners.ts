// Data flatteners for converting nested game data to flat CSV-ready structures


export const flattenTaskRankingData = (data: any) => {
  const { rankings } = data;
  return [
    {
      rankings: rankings ? JSON.stringify(rankings) : '',
    },
  ];
};


export const flattenTaskRatingData = (data: any) => {
  const { ratings } = data;
  const flattened: any = {};

  if (ratings) {
    Object.keys(ratings).forEach(gameKey => {
      flattened[`${gameKey}_rating`] = ratings[gameKey];
    });
  }

  return [flattened];
};

// WordGame flattener: Rounds -> Words -> Actions (flattened to actions)
export const flattenWordGameData = (data: any[]) => {
  const flattened: any[] = [];

  data.forEach(round => {
    round.found.forEach((wordData: any) => {
      wordData.actions.forEach((action: any) => {
        flattened.push({
          // Round-level data
          roundIndex: round.roundIndex,
          letters: round.letters,
          starttime: round.starttime,

          // Word-level data
          foundWordIndex: wordData.foundWordIndex,
          word: wordData.word,
          isCorrect: wordData.isCorrect,
          submitTime: wordData.submitTime,

          // Action-level data
          actionIndex: action.actionIndex,
          button: action.button,
          timestamp: action.timestamp,
        });
      });
    });
  });

  return flattened;
};

// NumberGame flattener: Rounds -> Expressions -> Actions (flattened to actions)
export const flattenNumberGameData = (data: any) => {
  const gameData = data.numbersData;
  const flattened: any[] = [];

  gameData.forEach((round: any) => {
    round.found.forEach((expressionData: any) => {
      expressionData.actions.forEach((action: any) => {
        flattened.push({
          // Round-level data
          roundIndex: round.roundIndex,
          numbers: round.numbers,
          target: round.target,
          starttime: round.starttime,

          // Expression-level data
          foundExpressionIndex: expressionData.foundExpressionIndex,
          expression: expressionData.expression,
          result: expressionData.result,
          submitTime: expressionData.submitTime,

          // Action-level data
          actionIndex: action.actionIndex,
          button: action.button,
          timestamp: action.timestamp,
        });
      });
    });
  });

  return flattened;
};

// SportsGame flattener: Returns { actions, playerDatabase, matchDatabase }
export const flattenSportsGameData = (data: any) => {
  const gameData = data.sportsData;
  const actions: any[] = [];

  // Flatten actions from all rounds
  gameData.rounds.forEach((round: any) => {
    round.actionLog.forEach((action: any) => {
      actions.push({
        // Round-level data
        roundIndex: round.roundIndex,
        startTime: round.startTime,
        endTime: round.endTime,

        // Match result data (flattened)
        teamAScore: round.matchResult?.teamAScore,
        teamBScore: round.matchResult?.teamBScore,
        teamAFitness: round.matchResult?.teamAFitness,
        teamBFitness: round.matchResult?.teamBFitness,
        winner: round.matchResult?.winner,

        // Team setup (just IDs)
        defenseA: round.teamSetup?.defenseA?.id,
        midA1: round.teamSetup?.midA1?.id,
        midA2: round.teamSetup?.midA2?.id,
        offenseA: round.teamSetup?.offenseA?.id,
        offenseB: round.teamSetup?.offenseB?.id,
        midB1: round.teamSetup?.midB1?.id,
        midB2: round.teamSetup?.midB2?.id,
        defenseB: round.teamSetup?.defenseB?.id,

        // Action-level data
        actionIndex: action.actionIndex,
        action: action.action,
        involvedPlayerIds: action.involvedPlayerIds?.join('|') || '',
        fromPosition: action.fromPosition || '',
        toPosition: action.toPosition || '',
        timestamp: action.timestamp,
      });
    });
  });

  // Flatten player database
  const playerDatabase = gameData.playerDatabase.map((player: any) => ({
    id: player.id,
    name: player.name,
    image: player.image,
    playerType: player.playerType,

    // Flatten stats
    stats_defense: player.stats.defense,
    stats_passing: player.stats.passing,
    stats_shooting: player.stats.shooting,
    stats_stamina: player.stats.stamina,
  }));

  // Flatten match database
  const matchDatabase = gameData.matchDatabase.map((match: any) => ({
    matchIndex: match.matchIndex,
    roundIndex: match.roundIndex,

    // Player positions (IDs)
    defenseA_playerId: match.defenseA_playerId,
    midA1_playerId: match.midA1_playerId,
    midA2_playerId: match.midA2_playerId,
    offenseA_playerId: match.offenseA_playerId,
    offenseB_playerId: match.offenseB_playerId,
    midB1_playerId: match.midB1_playerId,
    midB2_playerId: match.midB2_playerId,
    defenseB_playerId: match.defenseB_playerId,

    // Individual position fitness scores
    defenseA_fitness: match.defenseA_fitness,
    midA1_fitness: match.midA1_fitness,
    midA2_fitness: match.midA2_fitness,
    offenseA_fitness: match.offenseA_fitness,
    offenseB_fitness: match.offenseB_fitness,
    midB1_fitness: match.midB1_fitness,
    midB2_fitness: match.midB2_fitness,
    defenseB_fitness: match.defenseB_fitness,

    // Team fitness scores
    teamAFitness: match.teamAFitness,
    teamBFitness: match.teamBFitness,

    // Match results
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    winner: match.winner,

    timestamp: match.timestamp,
  }));

  return { actions, playerDatabase, matchDatabase };
};

// DatingGame flattener: Returns { actions, matchDatabase, peopleDatabase }
export const flattenDatingGameData = (data: any) => {
  const gameData = data.datingData;

  // Flatten action log
  const actions = gameData.actionLog.map((action: any) => ({
    actionIndex: action.actionIndex,
    action: action.action,
    involvedPersonIds: action.involvedPersonIds?.join('|') || '',
    timestamp: action.timestamp,
    starttime: gameData.starttime,
  }));

  // Flatten match database
  const matchDatabase = gameData.matchDatabase.map((match: any) => ({
    matchIndex: match.matchIndex,
    partner1Id: match.partner1.id,
    partner2Id: match.partner2.id,
    timestamp: match.timestamp,
    assignedScore: match.assignedScore,
  }));

  // Flatten people database
  const peopleDatabase = gameData.peopleDatabase.map((person: any) => ({
    id: person.id,
    name: person.name,
    image: person.image,
    gender: person.gender,
    lookingFor: person.lookingFor,

    // Flatten core traits
    coreTraits_openness: person.coreTraits.openness,
    coreTraits_sportiness: person.coreTraits.sportiness,
    coreTraits_social: person.coreTraits.social,
    coreTraits_natural: person.coreTraits.natural,

    // Flatten misc preferences
    miscPreferences_cats: person.miscPreferences.cats,
    miscPreferences_dogs: person.miscPreferences.dogs,
    miscPreferences_smoking: person.miscPreferences.smoking,
    miscPreferences_drinking: person.miscPreferences.drinking,
    miscPreferences_travel: person.miscPreferences.travel,
    miscPreferences_cooking: person.miscPreferences.cooking,
    miscPreferences_reading: person.miscPreferences.reading,
    miscPreferences_music: person.miscPreferences.music,
    miscPreferences_movies: person.miscPreferences.movies,
    miscPreferences_outdoors: person.miscPreferences.outdoors,

    // Join display traits with delimiter
    displayTraits: person.displayTraits.join('|'),
  }));

  return { actions, matchDatabase, peopleDatabase };
};