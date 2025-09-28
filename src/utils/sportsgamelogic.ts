import { SURNAMES, CLUB_NAME_PARTS, MATCH_COMMENTARY, LIVE_TICKER_EVENTS } from './sportsgamelist';

export type PlayerType = 'defense' | 'mid' | 'attack';

const STAR_VALUES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
export const MAX_STAR_RATING = Math.max(...STAR_VALUES);

export interface PlayerStats {
  defense: number;
  passing: number;
  shooting: number;
  stamina: number;
}

export interface Player {
  id: number;
  name: string;
  image: string;
  playerType: PlayerType;
  stats: PlayerStats;
}

export type TeamPosition =
  | 'defenseA'
  | 'midA1'
  | 'midA2'
  | 'offenseA'
  | 'offenseB'
  | 'midB1'
  | 'midB2'
  | 'defenseB';

export interface TeamSetup {
  defenseA: Player | null;
  midA1: Player | null;
  midA2: Player | null;
  offenseA: Player | null;
  offenseB: Player | null;
  midB1: Player | null;
  midB2: Player | null;
  defenseB: Player | null;
}

export interface MatchResult {
  teamAScore: number;
  teamBScore: number;
  teamAFitness: number;
  teamBFitness: number;
  winner: 'A' | 'B' | 'tie';
}

const MEN_IMAGES = Array.from({ length: 53 }, (_, i) => `/dating/men/man_${i + 1}.png`);

const generateStatValue = (): number => {
  return STAR_VALUES.sample()[0];
};

const generateBiasedStatValue = (): number => {
  const weights = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return STAR_VALUES[i];
  }
  return STAR_VALUES[STAR_VALUES.length - 1];
};

export const createPlayerGenerator = () => {
  let playerCount: number = 0;

  const generateRandomPlayer = (): Player => {
    const playerType: PlayerType = ['defense', 'mid', 'attack'][
      Math.floor(Math.random() * 3)
    ] as PlayerType;
    const name = SURNAMES.sample()[0];
    const image = MEN_IMAGES.sample()[0];

    const stats: PlayerStats = {
      defense: playerType === 'defense' ? generateBiasedStatValue() : generateStatValue(),
      passing: playerType === 'mid' ? generateBiasedStatValue() : generateStatValue(),
      shooting: playerType === 'attack' ? generateBiasedStatValue() : generateStatValue(),
      stamina: generateStatValue(),
    };

    const id = playerCount;
    playerCount = playerCount + 1;

    return {
      id,
      name,
      image,
      playerType,
      stats,
    };
  };

  return generateRandomPlayer;
};

export const calculateTeamFitness = (team: {
  defense?: Player;
  mid1?: Player;
  mid2?: Player;
  offense?: Player;
}): number => {
  const positions = [
    { player: team.defense, primaryStat: 'defense' as keyof PlayerStats },
    { player: team.mid1, primaryStat: 'passing' as keyof PlayerStats },
    { player: team.mid2, primaryStat: 'passing' as keyof PlayerStats },
    { player: team.offense, primaryStat: 'shooting' as keyof PlayerStats },
  ];

  const fitnessScores = positions
    .filter((pos) => pos.player)
    .map((pos) => pos.player!.stats[pos.primaryStat] * 2 + pos.player!.stats.stamina);

  return fitnessScores.length > 0
    ? fitnessScores.reduce((sum, score) => sum + score, 0) / fitnessScores.length
    : 0;
};

export const simulateMatch = (teamSetup: TeamSetup): MatchResult => {
  const teamA = {
    defense: teamSetup.defenseA || undefined,
    mid1: teamSetup.midA1 || undefined,
    mid2: teamSetup.midA2 || undefined,
    offense: teamSetup.offenseA || undefined,
  };

  const teamB = {
    defense: teamSetup.defenseB || undefined,
    mid1: teamSetup.midB1 || undefined,
    mid2: teamSetup.midB2 || undefined,
    offense: teamSetup.offenseB || undefined,
  };

  const teamAFitness = calculateTeamFitness(teamA);
  const teamBFitness = calculateTeamFitness(teamB);

  const fitnessDiff = teamAFitness - teamBFitness;
  let goalDiff = Math.max(-5, Math.min(5, Math.round(fitnessDiff / 3)));

  // Add weighted noise: 50% = 0, 16.67% each = +-1, 8.33% each = +-2
  const noiseOptions = [0, 0, 0, 0, 0, 0, 1, 1, -1, -1, 2, -2];
  goalDiff += noiseOptions[Math.floor(Math.random() * noiseOptions.length)];
  goalDiff = Math.max(-4, Math.min(4, goalDiff));

  // Generate baseline for losing team
  const losingTeamGoals = Math.floor(Math.random() * 3);

  const teamAScore = losingTeamGoals + Math.max(0, goalDiff);
  const teamBScore = losingTeamGoals + Math.max(0, -goalDiff);

  let winner: 'A' | 'B' | 'tie';
  if (teamAScore > teamBScore) winner = 'A';
  else if (teamBScore > teamAScore) winner = 'B';
  else winner = 'tie';

  return {
    teamAScore,
    teamBScore,
    teamAFitness,
    teamBFitness,
    winner,
  };
};

export const generateTeamNames = (): { teamAName: string; teamBName: string } => {
  const generateTeamName = () => {
    const first = CLUB_NAME_PARTS.first.sample()[0];
    const second = CLUB_NAME_PARTS.second.sample()[0];
    const suffix = CLUB_NAME_PARTS.suffix.sample()[0];
    return `${first} ${second} ${suffix}`;
  };

  const teamAName = generateTeamName();
  let teamBName = generateTeamName();

  while (teamBName === teamAName) {
    teamBName = generateTeamName();
  }

  return { teamAName, teamBName };
};

export const generateLiveTickerEvents = (
  result: MatchResult,
  teamAName: string,
  teamBName: string,
  teamSetup: TeamSetup,
): Array<{
  type: 'kickoff' | 'event' | 'goal' | 'fulltime';
  message: string;
  scoreA: number;
  scoreB: number;
  delay: number;
}> => {
  const events: Array<{
    type: 'kickoff' | 'event' | 'goal' | 'fulltime';
    message: string;
    scoreA: number;
    scoreB: number;
    delay: number;
  }> = [];
  const totalGoals = result.teamAScore + result.teamBScore;

  const teamAScorers = [teamSetup.midA1, teamSetup.midA2, teamSetup.offenseA].filter(
    Boolean,
  ) as Player[];
  const teamBScorers = [teamSetup.midB1, teamSetup.midB2, teamSetup.offenseB].filter(
    Boolean,
  ) as Player[];

  let currentScoreA = 0;
  let currentScoreB = 0;

  const allGoals: Array<{ team: 'A' | 'B'; scorer: string }> = [];
  for (let i = 0; i < result.teamAScore; i++) {
    const randomPlayer = teamAScorers[Math.floor(Math.random() * teamAScorers.length)];
    allGoals.push({ team: 'A', scorer: randomPlayer?.name || 'Unknown' });
  }
  for (let i = 0; i < result.teamBScore; i++) {
    const randomPlayer = teamBScorers[Math.floor(Math.random() * teamBScorers.length)];
    allGoals.push({ team: 'B', scorer: randomPlayer?.name || 'Unknown' });
  }

  const goalEvents = allGoals.shuffle();

  // Create mixed event timeline: kickoff + goals + build-up events
  const allEvents: Array<{
    type: 'kickoff' | 'event' | 'goal';
    message: string;
    scoreA: number;
    scoreB: number;
    delay: number;
    order: number;
  }> = [];

  // Add kickoff (always first)
  allEvents.push({
    type: 'kickoff',
    message: LIVE_TICKER_EVENTS.kickoff.sample()[0],
    scoreA: 0,
    scoreB: 0,
    delay: 1000,
    order: 0,
  });

  goalEvents.forEach((goal, index) => {
    const teamName = goal.team === 'A' ? teamAName : teamBName;

    if (goal.team === 'A') currentScoreA++;
    else currentScoreB++;

    const isEqualizer = currentScoreA === currentScoreB && currentScoreA > 0;
    const goalType = isEqualizer ? 'equalizer' : 'goal';

    allEvents.push({
      type: 'goal',
      message: LIVE_TICKER_EVENTS[goalType]
        .sample()[0]
        .replace('{scorer}', goal.scorer)
        .replace('{team}', teamName),
      scoreA: currentScoreA,
      scoreB: currentScoreB,
      delay: 1800 + Math.random() * 500,
      order: (index + 1) * 10, // Goals at 10, 20, 30... to leave space for build-up events
    });
  });

  // Add 1-2 build-up events randomly distributed between goals
  const buildUpCount = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < buildUpCount; i++) {
    const eventType = Math.random() < 0.6 ? 'chance' : 'defense';
    const randomTeam = Math.random() < 0.5 ? teamAName : teamBName;

    // Place randomly in timeline (between goals)
    const maxOrder = goalEvents.length * 10;
    const randomOrder = Math.random() * maxOrder + 1;

    // Calculate current score at this point in timeline
    const goalsBefore = goalEvents.slice(0, Math.floor(randomOrder / 10));
    const currentScoreA = goalsBefore.filter((g) => g.team === 'A').length;
    const currentScoreB = goalsBefore.filter((g) => g.team === 'B').length;

    allEvents.push({
      type: 'event',
      message: LIVE_TICKER_EVENTS[eventType].sample()[0].replace('{team}', randomTeam),
      scoreA: currentScoreA,
      scoreB: currentScoreB,
      delay: 1800 + Math.random() * 500,
      order: randomOrder,
    });
  }

  allEvents.sort((a, b) => a.order - b.order);

  allEvents.forEach((event) => {
    events.push({
      type: event.type as 'kickoff' | 'event' | 'goal' | 'fulltime',
      message: event.message,
      scoreA: event.scoreA,
      scoreB: event.scoreB,
      delay: event.delay,
    });
  });

  const scoreDifference = Math.abs(currentScoreA - currentScoreB);

  let commentaryCategory: keyof typeof MATCH_COMMENTARY;
  if (currentScoreA === currentScoreB) {
    commentaryCategory = 'tie';
  } else if (scoreDifference >= 3) {
    commentaryCategory = 'blowout';
  } else if (totalGoals >= 6) {
    commentaryCategory = 'highScore';
  } else if (totalGoals <= 2) {
    commentaryCategory = 'lowScore';
  } else {
    commentaryCategory = 'regular';
  }

  events.push({
    type: 'fulltime',
    message: MATCH_COMMENTARY[commentaryCategory].sample()[0],
    scoreA: currentScoreA,
    scoreB: currentScoreB,
    delay: 2000,
  });

  return events;
};
