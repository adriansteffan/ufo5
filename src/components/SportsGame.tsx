import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BaseComponentProps, now } from '@adriansteffan/reactive';
import { motion, AnimatePresence } from 'motion/react';
import { CgSearch } from 'react-icons/cg';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { HelpModal } from './HelpModal';
import { Timer } from './Timer';
import {
  createPlayerGenerator,
  simulateMatch,
  generateTeamNames,
  generateLiveTickerEvents,
  MAX_STAR_RATING,
  type Player,
  type TeamSetup,
  type TeamPosition,
  type MatchResult,
} from '../utils/sportsgamelogic';

const ACTIONS = {
  INITIAL_HAND: 'INITIAL_HAND',
  DRAFT_PLAYER: 'DRAFT_PLAYER',
  DISCARD_PLAYER: 'DISCARD_PLAYER',
  PLACE_SLOT: 'PLACE_SLOT',
  MOVE_SLOT: 'MOVE_SLOT',
  RETURN_TO_HAND: 'RETURN_TO_HAND',
  DISMISS_FROM_SLOT: 'DISMISS_FROM_SLOT',
  CLEAR_FIELD: 'CLEAR_FIELD',
  SIMULATE_MATCH: 'SIMULATE_MATCH',
  GAME_END: 'GAME_END',
  HELP: 'HELP',
} as const;

interface ActionLog {
  actionIndex: number;
  action: string;
  involvedPlayerIds?: number[];
  fromPosition?: TeamPosition | 'hand';
  toPosition?: TeamPosition | 'hand';
  timestamp: number;
}

interface RoundData {
  roundIndex: number;
  teamSetup: TeamSetup;
  matchResult: MatchResult | null; // null for final round
  actionLog: ActionLog[];
  startTime: number;
  endTime?: number;
}

interface MatchRecord {
  matchIndex: number;
  roundIndex: number;

  defenseA_playerId: number | null;
  midA1_playerId: number | null;
  midA2_playerId: number | null;
  offenseA_playerId: number | null;
  offenseB_playerId: number | null;
  midB1_playerId: number | null;
  midB2_playerId: number | null;
  defenseB_playerId: number | null;

  defenseA_fitness: number;
  midA1_fitness: number;
  midA2_fitness: number;
  offenseA_fitness: number;
  offenseB_fitness: number;
  midB1_fitness: number;
  midB2_fitness: number;
  defenseB_fitness: number;

  teamAFitness: number;
  teamBFitness: number;

  teamAScore: number;
  teamBScore: number;
  winner: 'A' | 'B' | 'tie';

  timestamp: number;
}

type SportsGameData = {
  playerDatabase: Player[];
  rounds: RoundData[];
  matchDatabase: MatchRecord[];
  starttime: number;
};

const MAX_INITIAL_HAND = 5;
const MAX_HAND_SIZE = 6;


const TEAM_POSITIONS = {
  offenseA: { positionClass: 'right-0 top-1/2 transform -translate-y-1/2', emptyLabel: 'ATT' },
  midA1: { positionClass: 'bottom-0 left-1/2 transform -translate-x-1/2', emptyLabel: 'MID' },
  midA2: { positionClass: 'top-0 left-1/2 transform -translate-x-1/2', emptyLabel: 'MID' },
  defenseA: { positionClass: 'left-0 top-1/2 transform -translate-y-1/2', emptyLabel: 'DEF' },
  defenseB: { positionClass: 'right-0 top-1/2 transform -translate-y-1/2', emptyLabel: 'DEF' },
  midB1: { positionClass: 'bottom-0 left-1/2 transform -translate-x-1/2', emptyLabel: 'MID' },
  midB2: { positionClass: 'top-0 left-1/2 transform -translate-x-1/2', emptyLabel: 'MID' },
  offenseB: { positionClass: 'left-0 top-1/2 transform -translate-y-1/2', emptyLabel: 'ATT' },
} as const;

const createEmptyTeamSetup = (): TeamSetup => ({
  defenseA: null,
  midA1: null,
  midA2: null,
  offenseA: null,
  offenseB: null,
  midB1: null,
  midB2: null,
  defenseB: null,
});

const StarRating = React.memo(
  ({
    value,
    size = 12,
    gap = 'gap-0.5',
    className = '',
  }: {
    value: number;
    size?: number;
    gap?: string;
    className?: string;
  }) => {
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 !== 0;
    const emptyStars = MAX_STAR_RATING - Math.ceil(value);

    return (
      <div className={`flex ${gap} ${className}`}>
        {Array.from({ length: fullStars }, (_, i) => (
          <FaStar key={`full-${i}`} className='text-yellow-400' size={size} />
        ))}
        {hasHalfStar && <FaStarHalfAlt key='half' className='text-yellow-400' size={size} />}
        {Array.from({ length: emptyStars }, (_, i) => (
          <FaRegStar key={`empty-${i}`} className='text-gray-300' size={size} />
        ))}
      </div>
    );
  },
);

const PLAYER_STATS_CONFIG = [
  { key: 'defense' as const, shortLabel: 'Def', fullLabel: 'Defense' },
  { key: 'passing' as const, shortLabel: 'Pas', fullLabel: 'Passing' },
  { key: 'shooting' as const, shortLabel: 'Sho', fullLabel: 'Shooting' },
  { key: 'stamina' as const, shortLabel: 'Sta', fullLabel: 'Stamina' },
];

const EnlargeButton = ({ className }: { className: string }) => (
  <motion.div
    variants={{
      initial: { opacity: 0, scale: 0.8 },
      hover: { opacity: 1, scale: 1 },
    }}
    transition={{ duration: 0.2 }}
    className={`absolute bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-xs cursor-pointer z-20 ${className}`}
  >
    <CgSearch className='pr-[2px]' size={className.includes('w-5') ? 12 : 16} />
  </motion.div>
);

const PlayerName = ({ player, isInSlot }: { player: Player; isInSlot: boolean }) => (
  <h3
    className={`font-bold leading-tight select-none ${
      isInSlot ? 'text-white text-xs drop-shadow-lg' : 'text-black text-sm mb-2'
    }`}
  >
    {player.name}
  </h3>
);

const PlayerStats = ({
  player,
  isInSlot,
  isEnlarged,
}: {
  player: Player;
  isInSlot: boolean;
  isEnlarged: boolean;
}) => (
  <div
    className={
      isInSlot
        ? 'space-y-0.5 text-xs'
        : `text-sm ${isEnlarged ? 'space-y-1' : 'flex flex-col gap-1'}`
    }
  >
    {PLAYER_STATS_CONFIG.map((stat) => (
      <div key={stat.key} className='flex justify-between items-center'>
        <span
          className={`font-medium select-none ${
            isInSlot ? 'text-white drop-shadow-lg' : 'text-black text-xs'
          }`}
        >
          {isInSlot ? stat.shortLabel : stat.fullLabel}
          {isEnlarged && !isInSlot ? ':' : ''}
        </span>
        <StarRating
          value={player.stats[stat.key]}
          size={isInSlot ? 8 : undefined}
          className={isInSlot ? 'drop-shadow-lg' : undefined}
        />
      </div>
    ))}
  </div>
);

const ControlButton = ({
  onClick,
  disabled = false,
  className = '',
  children,
  size = 'base',
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  size?: 'base' | 'lg';
}) => {
  const sizeClasses = size === 'lg' ? 'px-8 py-3 text-lg' : 'px-6 py-3 text-base';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer bg-white border-2 border-black font-bold text-black rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none select-none ${sizeClasses} ${disabled ? 'disabled:bg-white disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'hover:bg-white'} ${className}`}
    >
      {children}
    </button>
  );
};

const TeamNameResults = ({
  teamName,
  isWinner,
  className = '',
}: {
  teamName: string;
  isWinner?: boolean;
  className?: string;
}) => {
  const winnerColor = isWinner === true ? 'text-green-600' : 'text-black';

  return (
    <div
      className={`text-center h-16 flex items-center justify-center text-xl font-bold select-none ${winnerColor} ${className}`}
    >
      {teamName}
    </div>
  );
};

const TeamScore = ({
  score,
  isWinner,
  className = '',
}: {
  score: number;
  isWinner?: boolean;
  className?: string;
}) => {
  const winnerColor = isWinner === true ? 'text-green-600' : 'text-black';

  return (
    <div className={`text-center text-6xl font-bold select-none ${winnerColor} ${className}`}>
      {score}
    </div>
  );
};

const MatchResultModal = ({
  isOpen,
  matchResult,
  teamNames,
  tickerEvents,
  onClose,
}: {
  isOpen: boolean;
  matchResult: MatchResult | null;
  teamNames: { teamAName: string; teamBName: string };
  tickerEvents: Array<{ message: string; scoreA: number; scoreB: number; delay: number }> | null;
  onClose: () => void;
}) => {
  const [liveScore, setLiveScore] = useState({ teamA: 0, teamB: 0 });
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);

  // Reset state when modal opens and play ticker events
  useEffect(() => {
    if (!isOpen || !tickerEvents) return;

    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

    const scheduleNext = (index: number) => {
      if (isCancelled || index >= tickerEvents.length) return;

      const event = tickerEvents[index];
      timeoutId = setTimeout(() => {
        if (isCancelled) return;

        setCurrentMessage(event.message);
        setLiveScore({ teamA: event.scoreA, teamB: event.scoreB });

        if (index === tickerEvents.length - 1) {
          setIsMatchPlaying(false);
        } else {
          scheduleNext(index + 1);
        }
      }, event.delay);
    };

    // Start sequence
    setLiveScore({ teamA: 0, teamB: 0 });
    setCurrentMessage('');
    setIsMatchPlaying(true);
    scheduleNext(0);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isOpen, tickerEvents]);

  if (!isOpen || !matchResult) return null;

  return (
    <AnimatePresence>
      <motion.div
        className='fixed inset-0 bg-black/70 flex items-center justify-center z-50'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className='bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 w-[600px] mx-4'
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className='text-center space-y-6'>
            <div>
              <h2 className='text-3xl font-bold mb-14 select-none'>
                {isMatchPlaying ? 'Live Match' : 'Final Score'}
              </h2>
              <div className='mb-6'>
                <div className='grid grid-cols-3 gap-4 mb-4'>
                  <TeamNameResults
                    teamName={teamNames.teamAName}
                    isWinner={isMatchPlaying ? undefined : matchResult?.winner === 'A'}
                  />
                  <div></div>
                  <TeamNameResults
                    teamName={teamNames.teamBName}
                    isWinner={isMatchPlaying ? undefined : matchResult?.winner === 'B'}
                  />
                </div>

                <div className='grid grid-cols-3 items-center gap-4'>
                  <TeamScore
                    score={liveScore.teamA}
                    isWinner={isMatchPlaying ? undefined : matchResult?.winner === 'A'}
                  />
                  <div className='text-4xl font-bold text-center select-none'>-</div>
                  <TeamScore
                    score={liveScore.teamB}
                    isWinner={isMatchPlaying ? undefined : matchResult?.winner === 'B'}
                  />
                </div>
              </div>

              {!isMatchPlaying && matchResult && (
                <div className='text-2xl font-bold p-4 mt-10 select-none'>
                  {matchResult.winner === 'tie'
                    ? "It's a Draw! 🤝"
                    : `${matchResult.winner === 'A' ? teamNames.teamAName : teamNames.teamBName} Wins! 🏆`}
                </div>
              )}
            </div>

            <div className='p-4 h-[7.5rem] flex items-center justify-center'>
              <motion.div
                key={currentMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='text-center text-base select-none'
              >
                {currentMessage || (isMatchPlaying ? 'Match starting...' : 'Match completed')}
              </motion.div>
            </div>

            <ControlButton
              onClick={onClose}
              disabled={isMatchPlaying}
              size='lg'
              className={`w-full ${
                isMatchPlaying ? 'bg-gray-300 opacity-50' : 'hover:bg-gray-100'
              }`}
            >
              {isMatchPlaying ? 'Match in Progress...' : 'Next Match'}
            </ControlButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Team = ({
  side,
  teamName,
  teamSetup,
  dragOverSlot,
  sharedSlotProps,
}: {
  side: 'A' | 'B';
  teamName: string;
  teamSetup: TeamSetup;
  dragOverSlot: TeamPosition | null;
  sharedSlotProps: any;
}) => {
  const {
    slotRefs,
    setEnlargedPlayer,
    handlePlayerDragEnd,
    setDragOverSlot,
    findHoveredSlot,
    roundOver,
  } = sharedSlotProps;

  const positions =
    side === 'A'
      ? (['offenseA', 'midA1', 'midA2', 'defenseA'] as const)
      : (['defenseB', 'midB1', 'midB2', 'offenseB'] as const);

  return (
    <div className='flex flex-col items-center gap-8'>
      <div className='text-lg font-bold text-white text-center select-none'>{teamName}</div>
      <div className='relative'>
        <div className='relative w-96 h-96'>
          {positions.map((position: TeamPosition) => (
            <div
              key={position}
              ref={(el) => (slotRefs.current[position] = el)}
              className={`absolute w-28 h-41 border-2 border-dashed rounded-lg flex items-center justify-center ${TEAM_POSITIONS[position].positionClass} ${
                dragOverSlot === position
                  ? 'bg-white/30 border-white'
                  : 'bg-white/10 border-white/50'
              }`}
            >
              {teamSetup[position] ? (
                <PlayerCard
                  player={teamSetup[position]!}
                  isInSlot={true}
                  onEnlarge={() => setEnlargedPlayer(teamSetup[position])}
                  onDragEnd={(player, info) => handlePlayerDragEnd(player, info, position)}
                  onDrag={(_, info) => setDragOverSlot(findHoveredSlot(info))}
                  disableHover={roundOver}
                  disableDrag={roundOver}
                />
              ) : (
                <div className='text-center text-white text-xs select-none'>
                  {TEAM_POSITIONS[position].emptyLabel}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PlayerCard = React.memo(
  ({
    player,
    isInSlot = false,
    disableHover = false,
    disableDrag = false,
    isEnlarged = false,
    onClick,
    onDiscard,
    onEnlarge,
    onDragEnd,
    onDrag,
  }: {
    player: Player;
    isInSlot?: boolean;
    disableHover?: boolean;
    disableDrag?: boolean;
    isEnlarged?: boolean;
    onClick?: () => void;
    onDiscard?: () => void;
    onEnlarge?: () => void;
    onDragEnd?: (player: Player, info: any) => void;
    onDrag?: (player: Player, info: any) => void;
  }) => {
    return (
      <motion.div
        onTap={onClick}
        drag={!disableDrag}
        dragSnapToOrigin={true}
        dragElastic={0.1}
        whileHover={!disableHover ? { scale: 1.05 } : {}}
        whileDrag={{ scale: 1.1, zIndex: 1000, rotate: 5, cursor: 'grabbing' }}
        onDrag={(_, info) => onDrag?.(player, info)}
        onDragEnd={(_, info) => onDragEnd?.(player, info)}
        className={`relative bg-white border-2 border-black rounded-lg ${!disableHover ? 'cursor-grab' : 'cursor-pointer'} select-none ${isInSlot ? 'w-28 h-40' : 'w-40 h-60 pt-2 pb-6'} overflow-hidden`}
      >
        {!isInSlot && onDiscard && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDiscard();
            }}
            className='absolute top-1.5 left-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center text-black font-bold text-[10px] hover:bg-gray-100 cursor-pointer z-20'
          >
            ✕
          </button>
        )}

        {isInSlot ? (
          /* In-slot card: Full background image with overlay */
          <motion.div
            className='absolute inset-0 cursor-pointer overflow-hidden'
            initial='initial'
            whileHover='hover'
            onTap={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onEnlarge) onEnlarge();
            }}
          >
            <motion.img
              src={player.image}
              alt={player.name}
              className='absolute inset-0 w-full h-full object-cover object-top scale-103'
              draggable={false}
            />
            <div className='absolute inset-0 bg-black/55'></div>
            <div className='relative z-10 h-full flex flex-col justify-between p-2'>
              <PlayerName player={player} isInSlot={true} />
              <PlayerStats player={player} isInSlot={true} isEnlarged={isEnlarged} />
            </div>
            {onEnlarge && <EnlargeButton className='w-5 h-5 top-1 right-1' />}
          </motion.div>
        ) : (
          /* Hand card: Layout with upper image and bottom stats */
          <>
            <motion.div
              className='absolute top-0 left-0 right-0 h-28 cursor-pointer overflow-hidden'
              initial='initial'
              whileHover='hover'
              onTap={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onEnlarge) onEnlarge();
              }}
            >
              <motion.img
                src={player.image}
                alt={player.name}
                className='w-full h-full object-cover object-top scale-103'
                draggable={false}
              />
              {onEnlarge && <EnlargeButton className='w-5 h-5 top-1.5 right-1.5' />}
            </motion.div>
            <div className='absolute bottom-6 left-0 right-0 bg-white px-2 py-2 h-24'>
              <PlayerName player={player} isInSlot={false} />
              <PlayerStats player={player} isInSlot={false} isEnlarged={isEnlarged} />
            </div>
          </>
        )}
      </motion.div>
    );
  },
);

type ModalState =
  | { type: 'help' }
  | {
      type: 'match';
      tickerEvents: Array<{ message: string; scoreA: number; scoreB: number; delay: number }>;
    }
  | { type: 'enlarged'; player: Player }
  | null;

type GameState = 'setup' | 'playing' | 'finished';

export const SportsGame = ({
  next,
  timelimit,
}: BaseComponentProps & {
  timelimit?: number;
}) => {
  // generator to have a closured id counter
  const generateRandomPlayer = useMemo(() => createPlayerGenerator(), []);

  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentModal, setCurrentModal] = useState<ModalState>(null);
  const [dragOverSlot, setDragOverSlot] = useState<TeamPosition | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [teamNames, setTeamNames] = useState(() => generateTeamNames());
  const [currentActionLog, setCurrentActionLog] = useState<ActionLog[]>([]);

  const slotRefs = useRef<Record<TeamPosition, HTMLDivElement | null>>({
    defenseA: null,
    midA1: null,
    midA2: null,
    offenseA: null,
    offenseB: null,
    midB1: null,
    midB2: null,
    defenseB: null,
  });

  const [teamSetup, setTeamSetup] = useState<TeamSetup>(createEmptyTeamSetup);

  const [data, setData] = useState<SportsGameData>(() => {
    const initialHand = Array.from({ length: MAX_INITIAL_HAND }, () => generateRandomPlayer());
    return {
      playerDatabase: [...initialHand],
      rounds: [],
      matchDatabase: [],
      starttime: now(),
    };
  });

  const [hand, setHand] = useState<Player[]>([]);

  // Initialize hand and action log after component mounts based on initial hand data
  useEffect(() => {
    const initialHand = data.playerDatabase.slice(0, MAX_INITIAL_HAND);
    setHand(initialHand);
    setCurrentActionLog([
      {
        actionIndex: 0,
        action: ACTIONS.INITIAL_HAND,
        involvedPlayerIds: initialHand.map((p) => p.id),
        timestamp: now(),
      },
    ]);
  }, []);

  const pushAction = (
    action: string,
    involvedPlayerIds: number[] = [],
    fromPosition?: TeamPosition | 'hand',
    toPosition?: TeamPosition | 'hand',
  ) => {
    const actionLog: ActionLog = {
      actionIndex: currentActionLog.length,
      action,
      involvedPlayerIds: involvedPlayerIds.length > 0 ? involvedPlayerIds : undefined,
      fromPosition,
      toPosition,
      timestamp: now(),
    };

    setCurrentActionLog((prev) => [...prev, actionLog]);
  };

  const findHoveredSlot = React.useCallback((info: any): TeamPosition | null => {
    for (const [position, ref] of Object.entries(slotRefs.current)) {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (
          info.point.x >= rect.left &&
          info.point.x <= rect.right &&
          info.point.y >= rect.top &&
          info.point.y <= rect.bottom
        ) {
          return position as TeamPosition;
        }
      }
    }
    return null;
  }, []);

  const handleDraftPlayer = () => {
    if (roundOver || hand.length >= MAX_HAND_SIZE) return;

    const newPlayer = generateRandomPlayer();
    setData((prev) => ({
      ...prev,
      playerDatabase: [...prev.playerDatabase, newPlayer],
    }));

    pushAction(ACTIONS.DRAFT_PLAYER, [newPlayer.id]);
    setHand((prev) => [...prev, newPlayer]);
  };

  const handleDiscardPlayer = (playerId: number) => {
    if (roundOver) return;

    pushAction(ACTIONS.DISCARD_PLAYER, [playerId]);
    setHand((prev) => prev.filter((p) => p.id !== playerId));
  };

  const handlePlayerDragEnd = React.useCallback(
    (player: Player, info: any, fromPosition?: TeamPosition) => {
      setDragOverSlot(null);

      const hoveredSlot = findHoveredSlot(info);

      if (hoveredSlot && !teamSetup[hoveredSlot]) {
        // Place in empty slot
        setTeamSetup((prev) => ({ ...prev, [hoveredSlot]: player }));
        pushAction(ACTIONS.PLACE_SLOT, [player.id], fromPosition || 'hand', hoveredSlot);

        // Remove from previous position or hand
        if (fromPosition) {
          setTeamSetup((prev) => ({ ...prev, [fromPosition]: null }));
        } else {
          setHand((prev) => prev.filter((p) => p.id !== player.id));
        }
      } else if (hoveredSlot && teamSetup[hoveredSlot]) {
        // Swap with existing player in slot
        const existingPlayer = teamSetup[hoveredSlot]!;
        setTeamSetup((prev) => ({ ...prev, [hoveredSlot]: player }));
        pushAction(
          ACTIONS.MOVE_SLOT,
          [player.id, existingPlayer.id],
          fromPosition || 'hand',
          hoveredSlot,
        );

        if (fromPosition) {
          // Slot to slot swap
          setTeamSetup((prev) => ({ ...prev, [fromPosition]: existingPlayer }));
        } else {
          // Hand to slot, put displaced player back in hand
          setHand((prev) => {
            const filtered = prev.filter((p) => p.id !== player.id);
            return filtered.length < MAX_HAND_SIZE ? [...filtered, existingPlayer] : filtered;
          });
        }
      } else {
        // Dropped outside of any valid slot - return to hand
        if (fromPosition) {
          // Return to hand if there's space, otherwise dismiss
          setTeamSetup((prev) => ({ ...prev, [fromPosition]: null }));
          setHand((prev) => {
            if (prev.length < MAX_HAND_SIZE) {
              pushAction(ACTIONS.RETURN_TO_HAND, [player.id], fromPosition, 'hand');
              return [...prev, player];
            } else {
              pushAction(ACTIONS.DISMISS_FROM_SLOT, [player.id], fromPosition);
              return prev;
            }
          });
        }
      }
    },
    [findHoveredSlot, teamSetup, pushAction],
  );

  const handleClearAllSlots = () => {
    if (roundOver) return;

    const playersInField = Object.values(teamSetup).filter(Boolean) as Player[];
    if (playersInField.length === 0) return;

    pushAction(
      ACTIONS.CLEAR_FIELD,
      playersInField.map((p) => p.id),
    );

    // Return only as many players as the hand can fit, excess players vanish
    setHand((prev) => {
      const combined = [...prev, ...playersInField];
      return combined.slice(0, MAX_HAND_SIZE);
    });

    setTeamSetup(createEmptyTeamSetup());
  };

  const allSlotsFilled = Object.values(teamSetup).every(Boolean);

  const roundOver = gameState === 'finished';
  const isReady = gameState === 'setup' && allSlotsFilled;

  // both teams get the same props - might be an idea to use a wrappercomponent instead
  const sharedSlotProps = useMemo(
    () => ({
      slotRefs,
      setEnlargedPlayer: (player: Player | null) =>
        player ? setCurrentModal({ type: 'enlarged', player }) : setCurrentModal(null),
      handlePlayerDragEnd,
      setDragOverSlot,
      findHoveredSlot,
      roundOver,
    }),
    [handlePlayerDragEnd, setDragOverSlot, findHoveredSlot, roundOver],
  );

  const handleSimulateMatch = () => {
    if (gameState !== 'setup' || !allSlotsFilled) return;

    const result = simulateMatch(teamSetup);
    const tickerEvents = generateLiveTickerEvents(
      result,
      teamNames.teamAName,
      teamNames.teamBName,
      teamSetup,
    );

    setMatchResult(result);
    setGameState('playing');
    setCurrentModal({ type: 'match', tickerEvents });

    pushAction(
      ACTIONS.SIMULATE_MATCH,
      Object.values(teamSetup).map((p) => p!.id),
    );

    const matchRecord: MatchRecord = {
      matchIndex: data.matchDatabase.length,
      roundIndex: data.rounds.length,

      defenseA_playerId: teamSetup.defenseA?.id || null,
      midA1_playerId: teamSetup.midA1?.id || null,
      midA2_playerId: teamSetup.midA2?.id || null,
      offenseA_playerId: teamSetup.offenseA?.id || null,
      offenseB_playerId: teamSetup.offenseB?.id || null,
      midB1_playerId: teamSetup.midB1?.id || null,
      midB2_playerId: teamSetup.midB2?.id || null,
      defenseB_playerId: teamSetup.defenseB?.id || null,

      defenseA_fitness: teamSetup.defenseA ? teamSetup.defenseA.stats.defense * 2 + teamSetup.defenseA.stats.stamina : 0,
      midA1_fitness: teamSetup.midA1 ? teamSetup.midA1.stats.passing * 2 + teamSetup.midA1.stats.stamina : 0,
      midA2_fitness: teamSetup.midA2 ? teamSetup.midA2.stats.passing * 2 + teamSetup.midA2.stats.stamina : 0,
      offenseA_fitness: teamSetup.offenseA ? teamSetup.offenseA.stats.shooting * 2 + teamSetup.offenseA.stats.stamina : 0,
      offenseB_fitness: teamSetup.offenseB ? teamSetup.offenseB.stats.shooting * 2 + teamSetup.offenseB.stats.stamina : 0,
      midB1_fitness: teamSetup.midB1 ? teamSetup.midB1.stats.passing * 2 + teamSetup.midB1.stats.stamina : 0,
      midB2_fitness: teamSetup.midB2 ? teamSetup.midB2.stats.passing * 2 + teamSetup.midB2.stats.stamina : 0,
      defenseB_fitness: teamSetup.defenseB ? teamSetup.defenseB.stats.defense * 2 + teamSetup.defenseB.stats.stamina : 0,

      teamAFitness: result.teamAFitness,
      teamBFitness: result.teamBFitness,

      teamAScore: result.teamAScore,
      teamBScore: result.teamBScore,
      winner: result.winner,

      timestamp: now(),
    };

    const roundData: RoundData = {
      roundIndex: data.rounds.length,
      teamSetup: { ...teamSetup },
      matchResult: result,
      actionLog: [
        ...currentActionLog,
        {
          actionIndex: currentActionLog.length,
          action: ACTIONS.SIMULATE_MATCH,
          involvedPlayerIds: Object.values(teamSetup).map((p) => p!.id),
          timestamp: now(),
        },
      ],
      startTime: now(),
    };

    setData((prev) => ({
      ...prev,
      rounds: [...prev.rounds, roundData],
      matchDatabase: [...prev.matchDatabase, matchRecord],
    }));

    setCurrentActionLog([]);
  };

  const handleCloseMatchModal = () => {
    setData((prev) => {
      const updatedRounds = [...prev.rounds];
      if (updatedRounds.length > 0) {
        const lastRound = updatedRounds[updatedRounds.length - 1];
        updatedRounds[updatedRounds.length - 1] = {
          ...lastRound,
          endTime: now(),
        };
      }
      return {
        ...prev,
        rounds: updatedRounds,
      };
    });

    setCurrentModal(null);
    setMatchResult(null);
    setGameState('setup');

    setTeamSetup(createEmptyTeamSetup());
    setTeamNames(generateTeamNames());
  };

  const handleNext = () => {
    pushAction(ACTIONS.GAME_END);

    // Create final virtual round with remaining actions
    const finalRound: RoundData = {
      roundIndex: data.rounds.length,
      teamSetup: createEmptyTeamSetup(),
      matchResult: null, // No match result for final round
      actionLog: [
        ...currentActionLog,
        {
          actionIndex: currentActionLog.length,
          action: ACTIONS.GAME_END,
          timestamp: now(),
        },
      ],
      startTime: now(),
      endTime: now(),
    };

    const finalData: SportsGameData = {
      ...data,
      rounds: [...data.rounds, finalRound],
    };

    next({ sportsData: finalData });
  };

  return (
    <div className='min-h-screen w-full pt-0 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col overflow-hidden'>
      {/* Main Section - Timer, Field Layout */}
      <div className='p-1 flex mt-0'>
        {/* Left Side - Timer */}
        <div className='w-56 flex flex-col items-center'>
          <Timer
            timelimit={timelimit || 300}
            roundOver={roundOver}
            onEnd={() => setGameState('finished')}
          />
          <div className='flex flex-col gap-3 mt-4'>
            <ControlButton onClick={() => setCurrentModal({ type: 'help' })}>HELP</ControlButton>
            <ControlButton onClick={handleClearAllSlots}>CLEAR</ControlButton>
          </div>
        </div>

        {/* Center - Field Layout */}
        <div className='flex-1 flex flex-col items-center justify-center'>
          {/* Team Field Layout */}
          <div className='bg-green-700 rounded-lg px-12 pt-12 pb-10 mb-0 mt-6 relative overflow-hidden'>
            {/* Soccer field lines */}
            <div className='absolute inset-0 pointer-events-none'>
              {/* Center line - vertical for horizontal field */}
              <div className='absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/60 transform -translate-x-0.5'></div>

              {/* Center circle */}
              <div className='absolute left-1/2 top-1/2 w-24 h-24 border-2 border-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2'></div>

              {/* Goal areas */}
              <div className='absolute left-0 top-1/2 w-16 h-32 border-2 border-white/60 border-l-0 transform -translate-y-1/2'></div>
              <div className='absolute left-0 top-1/2 w-8 h-20 border-2 border-white/60 border-l-0 transform -translate-y-1/2'></div>
              <div className='absolute right-0 top-1/2 w-16 h-32 border-2 border-white/60 border-r-0 transform -translate-y-1/2'></div>
              <div className='absolute right-0 top-1/2 w-8 h-20 border-2 border-white/60 border-r-0 transform -translate-y-1/2'></div>

              {/* Corner arcs - corrected orientation */}
              <div className='absolute top-0 left-0 w-6 h-6 border-2 border-white/60 border-t-0 border-l-0 rounded-br-full'></div>
              <div className='absolute top-0 right-0 w-6 h-6 border-2 border-white/60 border-t-0 border-r-0 rounded-bl-full'></div>
              <div className='absolute bottom-0 left-0 w-6 h-6 border-2 border-white/60 border-b-0 border-l-0 rounded-tr-full'></div>
              <div className='absolute bottom-0 right-0 w-6 h-6 border-2 border-white/60 border-b-0 border-r-0 rounded-tl-full'></div>
            </div>

            <div className='flex justify-between items-center gap-12 h-96 relative z-10'>
              <Team
                side='A'
                teamName={teamNames.teamAName}
                teamSetup={teamSetup}
                dragOverSlot={dragOverSlot}
                sharedSlotProps={sharedSlotProps}
              />

              <div className='text-4xl font-bold text-white flex items-center justify-center self-center mt-20 select-none'>
                VS
              </div>

              <Team
                side='B'
                teamName={teamNames.teamBName}
                teamSetup={teamSetup}
                dragOverSlot={dragOverSlot}
                sharedSlotProps={sharedSlotProps}
              />
            </div>

            <div className='flex flex-col items-center gap-4 mt-6'>
              {gameState === 'setup' && (
                <ControlButton
                  onClick={handleSimulateMatch}
                  disabled={!isReady}
                  size='lg'
                  className='z-20'
                >
                  START MATCH
                </ControlButton>
              )}
              {gameState === 'finished' && (
                <ControlButton onClick={handleNext} size='lg' className='z-20 hover:bg-gray-100'>
                  END
                </ControlButton>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Empty for balancing */}
        <div className='w-56'></div>
      </div>

      {/* Bottom Section - Hand */}
      <div className='relative mt-5'>
        {/* Hand - centered independently */}
        <div className='flex justify-center items-center'>
          <div className='flex items-center gap-4'>
            {/* Hand Cards */}
            <motion.div
              className='flex gap-3 justify-center'
              layout
              transition={{ type: 'spring', stiffness: 250, damping: 50 }}
            >
              <AnimatePresence>
                {hand.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={roundOver ? false : { opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                  >
                    <PlayerCard
                      player={player}
                      onDiscard={() => handleDiscardPlayer(player.id)}
                      onEnlarge={() => setCurrentModal({ type: 'enlarged', player })}
                      onDragEnd={(player, info) => handlePlayerDragEnd(player, info)}
                      onDrag={(_, info) => setDragOverSlot(findHoveredSlot(info))}
                      disableHover={roundOver}
                      disableDrag={roundOver}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {hand.length === 0 && (
                <div className='text-gray-500 text-center italic py-8 px-8 h-60 flex items-center select-none'>
                  No players in hand - use DRAFT to get new players!
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Draft Deck - positioned absolutely, doesn't affect centering */}
        <div className='absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2'>
          <div className='text-sm font-bold text-black select-none'>
            Hand: {hand.length}/{MAX_HAND_SIZE}
          </div>
          <button
            onClick={handleDraftPlayer}
            disabled={roundOver || hand.length >= MAX_HAND_SIZE}
            className='w-32 h-48 border-2 border-black rounded-lg bg-white hover:bg-gray-100 disabled:bg-white disabled:cursor-not-allowed cursor-pointer flex flex-col items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] pt-2 pb-6 select-none'
          >
            {hand.length >= MAX_HAND_SIZE ? (
              <>
                <div className='text-lg mb-1 font-bold'>HAND</div>
                <div className='text-lg font-bold'>FULL</div>
              </>
            ) : (
              <>
                <div className='text-3xl mb-2 font-bold'>+</div>
                <div className='text-sm font-bold'>DRAFT</div>
              </>
            )}
          </button>
        </div>
      </div>

      <HelpModal isOpen={currentModal?.type === 'help'} onClose={() => setCurrentModal(null)}>
        <div className='space-y-4'>
          <div>
            <h3 className='font-bold mb-2 select-none'>Goal:</h3>
            <p className='text-sm select-none'>
              Build two football teams by placing players in the right positions, then start matches
              to see which team performs better! Keep in mind that certain players have a better
              time in certain positions ;-)
            </p>
          </div>

          <div>
            <h3 className='font-bold mb-2 select-none'>Controls:</h3>
            <ul className='text-sm space-y-1 list-disc list-outside pl-4 select-none'>
              <li>
                Use DRAFT to add new players to your hand for a selection of up to 6 at a time
              </li>
              <li>Drag players from your hand to team positions on the field to assign them</li>
              <li>You can drag players between positions to swap them</li>
              <li>Click START MATCH when the positions of both team are filled</li>
              <li>Drag players from positions to an area with no slots</li>
              <li>Click ✕ on hand cards to discard unwanted players</li>
              <li>Use CLEAR to return field players to hand</li>
            </ul>
          </div>
        </div>
      </HelpModal>

      {/* Enlarged Player Modal */}
      <AnimatePresence>
        {currentModal?.type === 'enlarged' && (
          <motion.div
            className='fixed inset-0 bg-black/70 flex items-center justify-center z-50'
            onClick={() => setCurrentModal(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='relative transform scale-[1.4]'
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.4 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <PlayerCard
                player={currentModal.player}
                disableHover={true}
                disableDrag={true}
                isEnlarged={true}
                onClick={() => setCurrentModal(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MatchResultModal
        isOpen={currentModal?.type === 'match'}
        matchResult={matchResult}
        teamNames={teamNames}
        tickerEvents={currentModal?.type === 'match' ? currentModal.tickerEvents : null}
        onClose={handleCloseMatchModal}
      />
    </div>
  );
};
