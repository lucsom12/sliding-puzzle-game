import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css";

const DEFAULT_BOARD_SIZE = 3;
const MAX_BOARD_SIZE = 5;
const BOARD_SIZES = Array.from({ length: MAX_BOARD_SIZE - DEFAULT_BOARD_SIZE + 1 }, (_, i) => i + DEFAULT_BOARD_SIZE);

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
  const total = size * size;
  const emptyIndex = tiles.indexOf(0);
  const emptyRowFromTop = Math.floor(emptyIndex / size);
  const emptyRowFromBottom = size - emptyRowFromTop;

  if (size % 2 !== 0) {
    // odd grid: even inversions
    return inversions % 2 === 0;
  } else {
    // even grid
    // If blank is on even row counting from bottom, then number of inversions must be odd.
    // If blank is on odd row counting from bottom, then number of inversions must be even.
    const isBlankOnEvenRowFromBottom = emptyRowFromBottom % 2 === 0;
    if (isBlankOnEvenRowFromBottom) {
      return inversions % 2 === 1;
    } else {
      return inversions % 2 === 0;
    }
  }
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

function isSolved(tiles) {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}

export default function App() {
  const [size, setSize] = useState(DEFAULT_BOARD_SIZE);
  const [tiles, setTiles] = useState(() => shuffleBoard(DEFAULT_BOARD_SIZE));
  const [moveCount, setMoveCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Use arrow keys or click tiles next to the empty space."
  );
  const [liveMessage, setLiveMessage] = useState("");
  const [boardFocusMode, setBoardFocusMode] = useState(false);

  const [showMainPage, setShowMainPage] = useState(true);


  // Holds DOM refs to each tile button by tile value (1..n)
  const tileRefs = useRef({});

  // Reshuffle when the board size changes
  useEffect(() => {
    resetGame(size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // Global keyboard controls: arrow keys move the empty space
  useEffect(() => {
    function handleKeyDown(e) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace("Arrow", "").toLowerCase();
        moveUsingKeyboard(direction);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function resetGame(newSize = size) {
    setTiles(shuffleBoard(newSize));
    setMoveCount(0);
    setBoardFocusMode(false);
    setStatusMessage("New puzzle! Use arrow keys or click tiles to move.");
    setLiveMessage("New puzzle started.");
  }

  function handleSizeChange(e) {
    const newSize = Number(e.target.value);
    setSize(newSize);
  }

  function swapTiles(index1, index2) {
    setTiles((prev) => {
      const newTiles = [...prev];
      [newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];

      const movedTile = newTiles[index1] === 0 ? newTiles[index2] : newTiles[index1];
      const tileNumber = movedTile === 0 ? "empty space" : `tile ${movedTile}`;

      const newMoveCount = moveCount + 1;
      setMoveCount(newMoveCount);

      const message = `Moved ${tileNumber}. Total moves: ${newMoveCount}.`;
      setStatusMessage(message);
      setLiveMessage(message);

      if (isSolved(newTiles)) {
        const solvedMessage = `Puzzle solved in ${newMoveCount} moves! 🎉`;
        setStatusMessage(solvedMessage);
        setLiveMessage(solvedMessage);
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
        // Entering board focus mode
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
        // Leaving board focus mode
        setLiveMessage("Exited board focus mode.");
      }

      return next;
    });
  }

  useEffect(() => {
    function handleBoardFocusKeys(e) {
      if (!boardFocusMode) return;

      // Escape: exit board focus mode
      if (e.key === "Escape") {
        e.preventDefault();
        setBoardFocusMode(false);
        setLiveMessage("Exited board focus mode.");
        return;
      }

      // Trap Tab / Shift+Tab inside movable tiles
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
          // Shift+Tab: backwards in clockwise list
          if (currentIndex === -1 || currentIndex === 0) {
            nextIndex = movable.length - 1;
          } else {
            nextIndex = currentIndex - 1;
          }
        } else {
          // Tab: forwards in clockwise list
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
      setLiveMessage("That tile cannot move; it is not next to the empty space.");
    }
  }

  function moveUsingKeyboard(direction) {
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;

    let targetIndex = null;

    if (direction === "up" && row < size - 1) {
      // Move tile below into empty space
      targetIndex = emptyIndex + size;
    } else if (direction === "down" && row > 0) {
      targetIndex = emptyIndex - size;
    } else if (direction === "left" && col < size - 1) {
      targetIndex = emptyIndex + 1;
    } else if (direction === "right" && col > 0) {
      targetIndex = emptyIndex - 1;
    }

    if (targetIndex !== null) {
      swapTiles(targetIndex, emptyIndex);
    } else {
      setLiveMessage("Cannot move in that direction.");
    }
  }

  function handleInstantWin() {
    const solved = createSolvedBoard(size);
    setTiles(solved);
    const message = "Cheat activated 😈 Puzzle instantly solved!";
    setStatusMessage(message);
    setLiveMessage(message);
    setBoardFocusMode(false);
  }

  if (showMainPage) {
  return (
    <div className="app main-page">
      <h1 className="app-title">Sliding Puzzle</h1>
      <button
        className="start-button"
        onClick={() => setShowMainPage(false)}
      >
        Start Game
      </button>
    </div>
  );
}
 

  return (
    <main
      className="app"
      aria-label="Sliding puzzle game"
    >
      <h1 className="app-title">Sliding Puzzle</h1>

            <section
        className="controls"
        aria-label="Game settings"
      >
        <label htmlFor="board-size" className="visually-hidden">
          Board size
        </label>
        <div className="control-group">
          <span id="board-size-label">Board size:</span>
          <select
            id="board-size"
            aria-labelledby="board-size-label"
            value={size}
            onChange={handleSizeChange}
          >
            {BOARD_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} × {s}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => resetGame(size)}>
            New game
          </button>

          <button type="button" onClick={handleInstantWin}>
            Instant win
          </button>

          <button
            type="button"
            onClick={toggleBoardFocus}
            aria-pressed={boardFocusMode}
          >
            {boardFocusMode ? "Unfocus game board" : "Focus game board"}
          </button>
        </div>

                <p id="instructions">
          Use “Focus game board” to
          cycle between movable tiles with Tab. Press Escape to exit board focus.
        </p>
      </section>

      {/* <section
        className="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p>{statusMessage}</p>
        <p>
          Moves: <strong>{moveCount}</strong>
        </p>
      </section> */}

      {/* Live region for screen readers only (more concise announcements) */}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      <section
        className="puzzle-wrapper"
        aria-label={`${size} by ${size} sliding puzzle board`}
      >
        <div
          className="puzzle-grid"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(3rem, 5rem))`,
          }}
        >
                    {tiles.map((value, index) => {
            if (value === 0) {
              // Empty space: keep it visible for layout, but not interactive
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
                  backgroundImage: "url('/src/assets/Images/lorax.png')",
                  backgroundSize: `${size * 100}% ${size * 100}%`,
                  backgroundPosition: `${col * step}% ${row * step}%`,
                  backgroundRepeat: "no-repeat",
                }}
              >
                <span aria-hidden="true">{value}</span>
              </motion.button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
