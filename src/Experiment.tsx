/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ExperimentRunner,
  ExperimentConfig,
  getParam,
  registerArrayExtensions,
  subsetExperimentByParam,
  TrialData,
} from '@adriansteffan/reactive';

import {
  TaskRanking,
  WordGame,
  NumberGame,
  DatingGame,
  SportsGame,
  ElementsGame,
} from './components';

registerArrayExtensions();

const config: ExperimentConfig = { showProgressBar: false };

const TASK_TIME_LIMIT = getParam(
  'task_time_limit',
  240,
  'number',
  'Time limit for timed tasks in seconds',
);

const TASKS = ['WordGame', 'NumberGame', 'DatingGame', 'SportsGame', 'ElementsGame'];

const groups = ['choice', 'anti-choice', 'random'];
const PARTICIPANT_GROUP =
  getParam(
    'group',
    '',
    'string',
    'Participant group (default picks one group randomly): choice, anti-choice, random',
  ) || groups.sample()[0];

const FORCE_TASK = getParam(
  'task',
  '',
  'string',
  'Force specific task: word, number, dating, sports, elements',
);
const FORCED_TASK_NAME = FORCE_TASK
  ? FORCE_TASK.charAt(0).toUpperCase() + FORCE_TASK.slice(1).toLowerCase() + 'Game'
  : '';

// TODO: create a decent flattener
const flatteners = {
  TaskRanking: (item: TrialData) => {
    const { index, trialNumber, start, end, duration, type, name } = item;
    const { rankings } = item.responseData;

    return [
      {
        trialIndex: index,
        trialNumber,
        trialStart: start,
        trialEnd: end,
        trialDuration: duration,
        trialType: type,
        trialName: name,
        rankings: rankings ? JSON.stringify(rankings) : '',
      },
    ];
  },
};

const experiment = subsetExperimentByParam([
  {
    name: 'introduction',
    type: 'Text',
    props: {
      buttonText: "Let's Begin",
      animate: true,
      content: (
        <>
          <h1>
            <strong>Welcome to our study!</strong>
          </h1>
          <br />
          Thank you for participating in our research. In this study, you will complete various
          tasks that help us understand human behavior and decision-making.
          <br />
        </>
      ),
    },
  },

  {
    name: 'CheckDevice',
    type: 'CheckDevice',
    props: {
      check: (deviceInfo: any) => {
        return !deviceInfo.isMobile;
      },
    },
  },

  {
    name: 'InitialQuestionnaire',
    type: 'Quest',
    props: {
      surveyJson: {
        pages: [
          {
            name: 'demographics',
            title: 'Background Information',
            elements: [
              {
                type: 'rating',
                name: 'computer_experience',
                title: 'How experienced are you with using computers?',
                isRequired: true,
                rateMin: 1,
                rateMax: 7,
                minRateDescription: 'Not experienced',
                maxRateDescription: 'Very experienced',
              },
            ],
          },
        ],
      },
    },
  },

  {
    type: 'IF_BLOCK',
    cond: () => PARTICIPANT_GROUP === 'choice' || PARTICIPANT_GROUP === 'anti-choice',
    timeline: [
      {
        name: 'TaskRanking',
        type: 'TaskRanking',
        props: {
          tasks: TASKS,
          instruction:
            'Please rank these tasks from most interesting (1) to least interesting (5):',
        },
      },
    ],
  },

  {
    name: 'TaskSelection',
    type: 'UPDATE_STORE',
    fun: (data: any) => {
      let selectedTask: string | undefined;
      let taskRankings = null;

      if (PARTICIPANT_GROUP === 'choice' || PARTICIPANT_GROUP === 'anti-choice') {
        const rankings = data[data.length - 1].responseData.rankings;
        const targetRank = PARTICIPANT_GROUP === 'choice' ? 1 : 5;
        selectedTask = Object.keys(rankings).find((task) => rankings[task] === targetRank);
        taskRankings = rankings;
      } else {
        // random group
        selectedTask = TASKS.sample()[0];
      }

      return {
        selectedTask: FORCED_TASK_NAME || selectedTask,
        taskRankings,
      };
    },
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'WordGame',
    timeline: [
      {
        name: 'WordGameInstructions',
        type: 'Text',
        props: {
          buttonText: 'Start Word Game',
          content: (
            <>
              <h1>
                <strong>Word Game</strong>
              </h1>
              <p>Instructions for Word Game will go here...</p>
            </>
          ),
        },
      },
      {
        name: 'InitWordGameTimer',
        type: 'UPDATE_STORE',
        fun: () => ({
          wordgame_timelimit: TASK_TIME_LIMIT,
        }),
      },
      {
        name: 'WordGameLoop',
        type: 'WHILE_BLOCK',
        cond: (_data: any, store: any) => store.wordgame_timelimit > 0,
        timeline: [
          {
            name: 'WordGameTrial',
            type: 'WordGame',
            props: (_data: any, store: any) => ({
              timelimit: store.wordgame_timelimit,
            }),
          },
          {
            type: 'UPDATE_STORE',
            fun: (data: any) => ({
              wordgame_timelimit: data[data.length - 1].responseData.timeLeft,
            }),
          },
        ],
      },
    ],
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'NumberGame',
    timeline: [
      {
        name: 'NumberGameInstructions',
        type: 'Text',
        props: {
          buttonText: 'Start Number Game',
          content: (
            <>
              <h1>
                <strong>Number Game</strong>
              </h1>
              <p>Instructions for Number Game will go here...</p>
            </>
          ),
        },
      },
      {
        name: 'InitNumberGameTimer',
        type: 'UPDATE_STORE',
        fun: () => ({
          numbergame_timelimit: TASK_TIME_LIMIT,
        }),
      },
      {
        name: 'NumberGameLoop',
        type: 'WHILE_BLOCK',
        cond: (_data: any, store: any) => store.numbergame_timelimit > 0,
        timeline: [
          {
            name: 'NumberGameTrial',
            type: 'NumberGame',
            props: (_data: any, store: any) => ({
              timelimit: store.numbergame_timelimit,
            }),
          },
          {
            type: 'UPDATE_STORE',
            fun: (data: any) => ({
              numbergame_timelimit: data[data.length - 1].responseData.timeLeft,
            }),
          },
        ],
      },
    ],
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'DatingGame',
    timeline: [
      {
        name: 'DatingGameInstructions',
        type: 'Text',
        props: {
          buttonText: 'Start Dating Game',
          content: (
            <>
              <h1>
                <strong>Dating Game</strong>
              </h1>
              <p>Instructions for Dating Game will go here...</p>
            </>
          ),
        },
      },
      {
        name: 'DatingGame',
        type: 'DatingGame',
        props: {
          // Dating Game specific props
        },
      },
    ],
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'SportsGame',
    timeline: [
      {
        name: 'SportsGameInstructions',
        type: 'Text',
        props: {
          buttonText: 'Start Sports Game',
          content: (
            <>
              <h1>
                <strong>Sports Game</strong>
              </h1>
              <p>Instructions for Sports Game will go here...</p>
            </>
          ),
        },
      },
      {
        name: 'SportsGame',
        type: 'SportsGame',
        props: {
          // Sports Game specific props
        },
      },
    ],
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'ElementsGame',
    timeline: [
      {
        name: 'ElementsGameInstructions',
        type: 'Text',
        props: {
          buttonText: 'Start Elements Game',
          content: (
            <>
              <h1>
                <strong>Elements Game</strong>
              </h1>
              <p>Instructions for Elements Game will go here...</p>
            </>
          ),
        },
      },
      {
        name: 'ElementsGame',
        type: 'ElementsGame',
        props: {
          // Elements Game specific props
        },
      },
    ],
  },

  {
    name: 'ExitQuestionnaire',
    type: 'Quest',
    props: {
      surveyJson: {
        pages: [
          {
            name: 'experience',
            title: 'Your Experience',
            elements: [
              {
                type: 'rating',
                name: 'task_difficulty',
                title: 'How difficult did you find the task?',
                isRequired: true,
                rateMin: 1,
                rateMax: 7,
                minRateDescription: 'Very easy',
                maxRateDescription: 'Very difficult',
              },
              {
                type: 'rating',
                name: 'task_enjoyment',
                title: 'How much did you enjoy the task?',
                isRequired: true,
                rateMin: 1,
                rateMax: 7,
                minRateDescription: 'Not at all',
                maxRateDescription: 'Very much',
              },
              {
                type: 'comment',
                name: 'feedback',
                title: 'How sad are you that there are no other questions yet?',
                isRequired: false,
              },
            ],
          },
        ],
      },
    },
  },

  {
    name: 'Upload',
    type: 'Upload',
    props: {
      sessionCSVBuilder: {
        filename: '',
        trials: ['CheckDevice'],
        fun: (sessionInfo: Record<string, any>) => {
          return sessionInfo;
        },
      },
      trialCSVBuilder: {
        flatteners: flatteners,
        builders: [
          {
            filename: `_DEMOGRAPHICS_${Date.now()}`,
            trials: ['InitialQuestionnaire'],
          },
          {
            filename: `_TASK_RANKING_${Date.now()}`,
            trials: ['TaskRanking'],
          },
          {
            filename: `_TASK_TRIALS_${Date.now()}`,
            trials: [
              'WordGameTrial',
              'NumberGameTrial',
              'DatingGame',
              'SportsGame',
              'ElementsGame',
            ],
          },
          {
            filename: `_EXIT_QUESTIONNAIRE_${Date.now()}`,
            trials: ['ExitQuestionnaire'],
          },
        ],
      },
    },
  },
  {
    type: 'ProlificEnding',
    hideSettings: true,
    props: { prolificCode: import.meta.env.VITE_PROLIFIC_CODE },
  },
]);

export default function Experiment() {
  return (
    <ExperimentRunner
      config={config}
      timeline={experiment}
      components={{
        TaskRanking,
        WordGame,
        NumberGame,
        DatingGame,
        SportsGame,
        ElementsGame,
      }}
    />
  );
}
