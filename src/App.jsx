import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css";
import moveSoundFile from "./assets/Sounds/MoveSound.mp3";

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

const MIN_BOARD_SIZE = 2;
const MAX_BOARD_SIZE = 3;
const DEFAULT_BOARD_SIZE = 3;
const BOARD_SIZES = Array.from(
  { length: MAX_BOARD_SIZE - MIN_BOARD_SIZE + 1 },
  (_, i) => i + MIN_BOARD_SIZE
);

function createSolvedBoard(size) {
  const total = size * size;
  const arr = [];
  for (let i = 1; i < total; i++) {
    arr.push(i);
  }
  arr.push(0); // 0 = empty tile
  return arr;
}

function getInversionCount(tiles) {
  const arr = tiles.filter((n) => n !== 0);
  let inv = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] > arr[j]) inv++;
    }
  }
  return inv;
}

function isSolvable(tiles, size) {
  const inversions = getInversionCount(tiles);
  const emptyIndex = tiles.indexOf(0);
  const emptyRowFromTop = Math.floor(emptyIndex / size);
  const emptyRowFromBottom = size - emptyRowFromTop;

  if (size % 2 !== 0) {
    // odd grid: even inversions
    return inversions % 2 === 0;
  } else {
    // even grid
    const isBlankOnEvenRowFromBottom = emptyRowFromBottom % 2 === 0;
    if (isBlankOnEvenRowFromBottom) {
      return inversions % 2 === 1;
    } else {
      return inversions % 2 === 0;
    }
  }
}

function isSolved(tiles) {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}

function shuffleBoard(size) {
  const total = size * size;
  let arr = [];
  for (let i = 0; i < total; i++) {
    arr.push(i);
  }

  // Fisher–Yates shuffle until we get a solvable, non-trivial board
  let tries = 0;
  while (true) {
    tries++;
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (isSolvable(arr, size) && !isSolved(arr)) {
      return arr;
    }
    if (tries > 1000) {
      // Fallback: just return solved if shuffling keeps failing for some reason
      return createSolvedBoard(size);
    }
  }
}

// Medium–bräde: 3×3 där översta raden redan är rätt
function createMediumBoard() {
  const size = 3;
  const topRow = [1, 2, 3];
  const bottomTilesBase = [4, 5, 6, 7, 8, 0];

  let tries = 0;
  while (true) {
    tries++;
    const bottomTiles = [...bottomTilesBase];

    // Fisher–Yates på nedersta 2 raderna
    for (let i = bottomTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bottomTiles[i], bottomTiles[j]] = [bottomTiles[j], bottomTiles[i]];
    }

    const board = [...topRow, ...bottomTiles];

    if (isSolvable(board, size) && !isSolved(board)) {
      return board;
    }

    if (tries > 1000) {
      // Om något knasar, ta bara en vanlig shuffle
      return shuffleBoard(size);
    }
  }
}

// Hjälpare: skapa bräde utifrån svårighetsgrad
function generateBoardForDifficulty(size, difficulty) {
  if (difficulty === "easy") {
    return shuffleBoard(2); // 2×2 blandad
  }
  if (difficulty === "medium") {
    return createMediumBoard(); // 3×3, översta raden rätt
  }
  if (difficulty === "hard") {
    return shuffleBoard(3); // 3×3 blandad
  }
  // Ingen svårighet = "fri" storlek
  return shuffleBoard(size);
}

function Popup({ onClose }) {

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>🎉 Grattis du vann! 🎉</h2>
        <p>Du har löst pusslet!</p>
        <button onClick={onClose}>Spela igen</button>
      </div>
    </div>
  );
}

// === SIDOPANEL FÖR INSTÄLLNINGAR – SOM INNAN ===
function SettingsPanel({
  resetGame,
  size,
  handleInstantWin,
  toggleBoardFocus,
  boardFocusMode,
  soundOn,
  setSoundOn,
}) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      {/* Öppna panelen */}
      <button type="button" onClick={() => setIsPanelOpen(true)}>
        ⚙️ Inställningar
      </button>

      {/* Själva panelen + backdrop */}
      <div className={`side-panel ${isPanelOpen ? "open" : ""}`}>
        {isPanelOpen && (
          <div
            className="backdrop"
            onClick={() => setIsPanelOpen(false)}
          />
        )}

        {isPanelOpen && (
          <div className="side-panel-content">
            <button
              type="button"
              className="close-button"
              onClick={() => setIsPanelOpen(false)}
            >
              ❌
            </button>

            <button type="button" onClick={() => resetGame(size)}>
              Hur speler jag
            </button>
            <button type="button" onClick={() => resetGame(size)}>
              Ny omgång
            </button>
            <button type="button" onClick={handleInstantWin}>
              Vinn nu
            </button>
            <button type="button" onClick={() => {
              toggleBoardFocus();
              setIsPanelOpen(false)
            }}>
              {boardFocusMode ? "EJ Fokus på Pussel" : "Fokus på Pussel"}
            </button>
            <button
              type="button"
              onClick={() => setSoundOn((prev) => !prev)}
            >
              {soundOn ? "🔊 Ljud PÅ" : "🔇 Ljud AV"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  const STARTING_BOARD_SIZE = clamp(
    DEFAULT_BOARD_SIZE,
    MIN_BOARD_SIZE,
    MAX_BOARD_SIZE
  );

  const [size, setSize] = useState(STARTING_BOARD_SIZE);
  const [difficulty, setDifficulty] = useState(null); // "easy" | "medium" | "hard" | null
  const [tiles, setTiles] = useState(() =>
    shuffleBoard(STARTING_BOARD_SIZE)
  );
  const [moveCount, setMoveCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Use arrow keys or click tiles next to the empty space."
  );
  const [liveMessage, setLiveMessage] = useState("");
  const [boardFocusMode, setBoardFocusMode] = useState(false);
  const moveSoundRef = useRef(new Audio(moveSoundFile));

  const [showMainPage, setShowMainPage] = useState(true);
  const [showTutorialPage, setShowTutorialPage] = useState(false);
  const [showDifficultyPage, setShowDifficultyPage] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);
  // Holds DOM refs to each tile button by tile value (1..n)
  const tileRefs = useRef({});

  // // Global keyboard controls: arrow keys move the empty space
  // useEffect(() => {
  //   function handleKeyDown(e) {
  //     if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
  //       e.preventDefault();
  //       const direction = e.key.replace("Arrow", "").toLowerCase();
  //       moveUsingKeyboard(direction);
  //     }
  //   }

  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  function resetGame(newSize = size, newDifficulty = difficulty) {
    let boardSize = newSize;

    if (newDifficulty === "easy") {
      boardSize = 2;
    } else if (newDifficulty === "medium" || newDifficulty === "hard") {
      boardSize = 3;
    }

    const newTiles = generateBoardForDifficulty(boardSize, newDifficulty);

    setSize(boardSize);
    setDifficulty(newDifficulty ?? null);
    setTiles(newTiles);
    setMoveCount(0);
    setBoardFocusMode(false);
    setStatusMessage(
      "New puzzle! Use arrow keys or click tiles to move."
    );
    setLiveMessage("New puzzle started.");
    setShowPopup(false);
    setShowFullImage(false);

  }

  function handleSizeChange(e) {
    const newSize = Number(e.target.value);
    // Byter till "fri" storlek → ingen svårighetsgrad
    resetGame(newSize, null);
  }

  function startGameWithDifficulty(level) {
    setShowMainPage(false);
    setShowTutorialPage(false);
    setShowDifficultyPage(false);
    resetGame(size, level);
  }

  function swapTiles(index1, index2) {
    setTiles((prev) => {
      const newTiles = [...prev];

      if (soundOn) {
        const audio = moveSoundRef.current;
        audio.pause();
        audio.currentTime = 0;
        audio.play();
      }

      [newTiles[index1], newTiles[index2]] = [
        newTiles[index2],
        newTiles[index1],
      ];

      const movedTile =
        newTiles[index1] === 0 ? newTiles[index2] : newTiles[index1];
      const tileNumber =
        movedTile === 0 ? "empty space" : `tile ${movedTile}`;

      const newMoveCount = moveCount + 1;
      setMoveCount(newMoveCount);

      const message = `Moved ${tileNumber}. Total moves: ${newMoveCount}.`;
      setStatusMessage(message);
      setLiveMessage(message);

      if (isSolved(newTiles)) {
        const solvedMessage = `Puzzle solved in ${newMoveCount} moves! 🎉`;
        setStatusMessage(solvedMessage);
        setLiveMessage(solvedMessage);
        setBoardFocusMode(false);

        // 1. Visa helbilden ovanpå brädet
        setShowFullImage(true);

        // 2. Vänta lite, visa popup efteråt
        setTimeout(() => {
          setShowPopup(true);
        }, 3000); // t.ex. 1 sekund
      }


      return newTiles;
    });
  }

  function isTileMovable(index, tiles, size) {
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    return (
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1)
    );
  }

  function getMovableTilesClockwise(tiles, size) {
    const emptyIndex = tiles.indexOf(0);
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    const buckets = {
      top: null,
      right: null,
      bottom: null,
      left: null,
    };

    tiles.forEach((value, index) => {
      if (value === 0) return;
      if (!isTileMovable(index, tiles, size)) return;

      const row = Math.floor(index / size);
      const col = index % size;

      if (row === emptyRow - 1 && col === emptyCol) {
        buckets.top = { value, index };
      } else if (row === emptyRow && col === emptyCol + 1) {
        buckets.right = { value, index };
      } else if (row === emptyRow + 1 && col === emptyCol) {
        buckets.bottom = { value, index };
      } else if (row === emptyRow && col === emptyCol - 1) {
        buckets.left = { value, index };
      }
    });

    // Clockwise: top -> right -> bottom -> left
    return ["top", "right", "bottom", "left"]
      .map((dir) => buckets[dir])
      .filter(Boolean);
  }

  function toggleBoardFocus() {
    setBoardFocusMode((prev) => {
      const next = !prev;

      if (next) {
        const movable = getMovableTilesClockwise(tiles, size);

        if (movable.length > 0) {
          const firstValue = movable[0].value;
          const firstEl = tileRefs.current[firstValue];
          if (firstEl) {
            firstEl.focus();
          }
        }

        setLiveMessage(
          "Board focus mode enabled. Tab and Shift + Tab move between movable tiles in clockwise order. Press Escape or the Unfocus game board button to exit."
        );
      } else {
        setLiveMessage("Exited board focus mode.");
      }

      return next;
    });
  }

  useEffect(() => {
    function handleBoardFocusKeys(e) {
      if (!boardFocusMode) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setBoardFocusMode(false);
        setLiveMessage("Exited board focus mode.");
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();

        const movable = getMovableTilesClockwise(tiles, size);

        if (movable.length === 0) {
          return;
        }

        const active = document.activeElement;
        const currentIndex = movable.findIndex(
          ({ value }) => tileRefs.current[value] === active
        );

        let nextIndex;

        if (e.shiftKey) {
          if (currentIndex === -1 || currentIndex === 0) {
            nextIndex = movable.length - 1;
          } else {
            nextIndex = currentIndex - 1;
          }
        } else {
          if (currentIndex === -1 || currentIndex === movable.length - 1) {
            nextIndex = 0;
          } else {
            nextIndex = currentIndex + 1;
          }
        }

        const nextValue = movable[nextIndex].value;
        const nextEl = tileRefs.current[nextValue];
        if (nextEl) {
          nextEl.focus();
        }
      }
    }

    window.addEventListener("keydown", handleBoardFocusKeys);
    return () => window.removeEventListener("keydown", handleBoardFocusKeys);
  }, [boardFocusMode, tiles, size]);

  function tryMoveTile(index) {
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    const isAdjacent =
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1);

    if (isAdjacent) {
      swapTiles(index, emptyIndex);
    } else {
      setLiveMessage(
        "That tile cannot move; it is not next to the empty space."
      );
    }
  }

  // function moveUsingKeyboard(direction) {
  //   const emptyIndex = tiles.indexOf(0);
  //   const row = Math.floor(emptyIndex / size);
  //   const col = emptyIndex % size;

  //   let targetIndex = null;

  //   if (direction === "up" && row < size - 1) {
  //     targetIndex = emptyIndex + size;
  //   } else if (direction === "down" && row > 0) {
  //     targetIndex = emptyIndex - size;
  //   } else if (direction === "left" && col < size - 1) {
  //     targetIndex = emptyIndex + 1;
  //   } else if (direction === "right" && col > 0) {
  //     targetIndex = emptyIndex - 1;
  //   }

  //   if (targetIndex !== null) {
  //     swapTiles(targetIndex, emptyIndex);
  //   } else {
  //     setLiveMessage("Cannot move in that direction.");
  //   }
  // }

  function handleInstantWin() {
    const solved = createSolvedBoard(size);
    setTiles(solved);
    const message = "Cheat activated 😈 Puzzle instantly solved!";
    setStatusMessage(message);
    setLiveMessage(message);
    setBoardFocusMode(false);
  }

  // --- SIDOR / VIEWS ---

  if (showMainPage) {
    return (
      <div className="app main-page">
        <h1 className="app-title">🧩 Pussel 🧩</h1>
        <p>
          Välkommen till Sliding Puzzle spelet, här kan du testa din kluriga
          förmåga!
        </p>
        <div className="button-container">
          <button
            className="button"
            onClick={() => {
              setShowMainPage(false);
              setShowDifficultyPage(true);
            }}
          >
            Starta Spelet
          </button>
          <button
            className="button"
            onClick={() => {
              setShowMainPage(false);
              setShowTutorialPage(true);
            }}
          >
            Hur spelar jag
          </button>
        </div>
      </div>
    );
  }

  if (showTutorialPage) {
    return (
      <div className="app tutorial-page">
        <h1 className="app-title">🧩 Hur man spelar 🧩</h1>
        <p>
          Försök att få alla delar av bilden på rätt plats för att se vad den
          föreställer.
        </p>

        <div className="tutorial-images">
          <img
            src="/src/assets/Images/Tutorial1.png"
            alt="Tutorial steg 1"
            className="tutorial-image"
          />
          <img
            src="/src/assets/Images/Tutorial2.png"
            alt="Tutorial steg 2"
            className="tutorial-image"
          />
        </div>

        <button
          className="start-button"
          onClick={() => {
            setShowTutorialPage(false);
            setShowDifficultyPage(true);
          }}
        >
          Starta Spelet
        </button>
      </div>
    );
  }

  if (showDifficultyPage) {
    return (
      <div className="app difficulty-page">
        <h1 className="app-title">Välj svårighetsgrad</h1>
        <div className="button-container">
          <button
            className="button"
            onClick={() => startGameWithDifficulty("easy")}
          >
            Enkel
          </button>
          <button
            className="button"
            onClick={() => startGameWithDifficulty("medium")}
          >
            Medium
          </button>
          <button
            className="button"
            onClick={() => startGameWithDifficulty("hard")}
          >
            Svårt
          </button>
        </div>

        <button
          className="button"
          onClick={() => {
            setShowDifficultyPage(false);
            setShowMainPage(true);
          }}
        >
          Tillbaka
        </button>
      </div>
    );
  }

  // --- SJÄLVA SPELET ---

  return (
    <main className="app" aria-label="Sliding puzzle game">
      <h1 className="app-title">🧩 Pussel 🧩</h1>

      <div className="game-layout">

        <section className="controls" aria-label="Game settings">
          <div className="control-group">

            <button
              type="button"
              onClick={() => setShowDifficultyPage(true)}
            >
              Svårighetsgrad
            </button>

            {/* KNAPP + PANEL PÅ SIDAN */}
            <SettingsPanel
              resetGame={resetGame}
              size={size}
              handleInstantWin={handleInstantWin}
              toggleBoardFocus={toggleBoardFocus}
              boardFocusMode={boardFocusMode}
              soundOn={soundOn}
              setSoundOn={setSoundOn}
            />
          </div>

          <p id="instructions">
            Använd “Fokus på Pussel" för att skifta mellan tillgängliga rutor med
            Tab. Tryck på Escape för att avsluta Pussel Fokus.
          </p>
        </section>

        <div className="visually-hidden" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>

        <section
          className="puzzle-wrapper"
          aria-label={`${size} by ${size} sliding puzzle board`}
        >
          <div className="puzzle-grid-wrapper">
            <div
              className={`puzzle-grid ${showFullImage ? "puzzle-grid--faded" : ""}`}
              style={{
                gridTemplateColumns: `repeat(${size}, minmax(6rem, 8rem))`,
              }}
            >
              {tiles.map((value, index) => {
                if (value === 0) {
                  return (
                    <div
                      key="empty"
                      className="tile tile-empty"
                      aria-hidden="true"
                    />
                  );
                }

                const movable = isTileMovable(index, tiles, size);

                const col = (value - 1) % size;
                const row = Math.floor((value - 1) / size);

                const step = 100 / (size - 1);

                return (
                  <motion.button
                    key={value}
                    layout
                    className="tile"
                    type="button"
                    ref={(el) => {
                      tileRefs.current[value] = el;
                    }}
                    onClick={() => tryMoveTile(index)}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                    tabIndex={movable ? 0 : -1}
                    aria-disabled={!movable}
                    aria-label={
                      movable
                        ? `Tile ${value}. Press to move into the empty space.`
                        : `Tile ${value}. Not currently movable.`
                    }
                    style={{
                      //  backgroundImage: "url('/src/assets/Images/lorax.png')", 
                      backgroundImage:
                        difficulty === "easy"
                          ? "url('/src/assets/Images/regnbåge.png')"
                          : "url('/src/assets/Images/jul.png')",
                      backgroundSize: `${size * 100}% ${size * 100}%`,
                      backgroundPosition: `${col * step}% ${row * step}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                );
              })}
            </div>

            {showFullImage && (
              <div
                className="puzzle-full-image"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    difficulty === "easy"
                      ? "url('/src/assets/Images/regnbåge.png')"
                      : "url('/src/assets/Images/jul.png')",
                }}
              />
            )}
          </div>
        </section>

        {
          showPopup && (
            <Popup
              onClose={() => {
                setShowPopup(false);
                resetGame(size, difficulty);
              }}
            />
          )
        }
    </main >
  );
}
