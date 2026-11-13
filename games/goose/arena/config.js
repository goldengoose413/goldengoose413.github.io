// THE ONE PLACE TO EDIT YOUR ARENA. Paths are relative to dist/index.html.
export const CONFIG = {
  board: { columns: 10, rows: 22, hiddenRows: 2 },
  gameplay: {
    startingSpeed: 800, speedDecay: 0.94, minimumSpeed: 180,
    pressureEveryMs: 90000, pressureEveryPieces: 50,
    // Optional exact milliseconds per level; falls back to the curve above.
    levelSpeeds: [], linesPerLevel: 10, primaryLevels: 50,
    enduranceMinimumSpeed: 140, enduranceDecay: 0.98,
    lockDelay: 500, lockResets: 8, repeatDelay: 150, repeatInterval: 45,
    backToBackWindowPieces: 12, majorCombo: 5
  },
  scoring: { lines: [0, 50, 150, 550, 10000], combo: 70, smallCombo: 25, backToBackMultiplier: 1.5, softDrop: 1, hardDrop: 2, survivalPerMinute: 0 },
  milestoneLevels: [5, 10, 20, 30, 40, 50],
  media: {
    music: {
      entranceTrack: '../media/music/entrance.mp3', // Vocal title-screen entrance
      mainTrack: '../media/music/gameplay.mp3', // Instrumental loop throughout normal play
      gooseTrack: '../media/music/goose.mp3', // Alternates with the instrumental after its first play
      anthemTrack: '../media/music/goose-anthem.mp3', // Follows Goose in the repeating gameplay rotation
      enduranceTrack: '../media/music/endurance.mp3' // WELCOME, SILVER GOOSE
    },
    // Each slot accepts any number of clips. The game picks a random variant.
    // e.g. fourLineClear: ['../media/videos/goose-1.mp4', '../media/videos/goose-2.mp4']
videos: { fourLineClear: ['../media/videos/tetris-1.mp4', '../media/videos/tetris-2.mp4'], fifthTetris: ['../media/videos/tetris-fifth.mp4'], backToBack: [], majorCombo: [], impressivePoints: ['../media/videos/impressive-fullscreen.mp4', '../media/videos/golden-goose-homerun.mp4'], milestone: [], level50: [], endurance: [], highScore: [], gameOver: [] },
    sfx: { fourLineClear: '', celebration: '', crowdChant: '', crowdCheer: '', levelUp: '', combo: '', button: '', pause: '', gameOver: '', highScore: '' }
  },
  audio: { musicVolume: 0.35, sfxVolume: 0.5, fadeDuration: 1800, enduranceTrackAt: 51 },
  effects: { impressivePointsThreshold: 500, celebrationDuration: 2200, videoLoadTimeout: 30000, maximumParticles: 220, videoVolume: 0.6 },
  leaderboard: { size: 10, storageKey: 'golden-goose-leaderboard-v1' }
};
