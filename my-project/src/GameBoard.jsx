import React, { useState } from "react";
import "./GameBoard.css";

const GRID_SIZE = 8;

// 10 players with unique colors
const playerList = [
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "cyan",
  "lime",
  "magenta",
];

// Initial token placement
const initialPositions = {
  "0,0": "red",
  "0,4": "blue",
  "1,7": "green",
  "2,0": "yellow",
  "3,7": "orange",
  "4,0": "purple",
  "5,7": "pink",
  "6,0": "cyan",
  "7,3": "lime",
  "7,7": "magenta",
};

export default function GameBoard() {
  const [cells, setCells] = useState(() => {
    const map = {};
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        map[`${r},${c}`] = {
          color: "#333",
          consolidated: false,
          token: null,
          owner: null, // which player 'owns' this cell (null if none)
        };
      }
    }
    Object.entries(initialPositions).forEach(([pos, color]) => {
      map[pos].token = color;
    });
    return map;
  });

  const [selected, setSelected] = useState(null);
  const [scores, setScores] = useState(
    Object.fromEntries(playerList.map((p) => [p, 0]))
  );

  const [territories, setTerritories] = useState(
    Object.fromEntries(playerList.map((p) => [p, []]))
  );

  // Helper: darken a CSS color string by factor (returns rgb(...))
  const darkenColor = (color, factor = 0.8) => {
    const temp = document.createElement("div");
    temp.style.color = color;
    document.body.appendChild(temp);
    const computed = getComputedStyle(temp).color;
    document.body.removeChild(temp);

    const nums = computed.match(/\d+/g);
    if (!nums) return color;
    const rgb = nums.map(Number).map((v) => Math.floor(v * factor));
    return `rgb(${rgb.join(",")})`;
  };

  // Select a token
  const handleSelect = (pos, color) => {
    setSelected({ pos, color });
  };

  // Handle movement
  const handleMove = (r, c) => {
    if (!selected) return;

    const [sr, sc] = selected.pos.split(",").map(Number);
    const dr = Math.abs(sr - r);
    const dc = Math.abs(sc - c);

    // Only allow adjacent moves (Manhattan distance = 1)
    if (dr + dc !== 1) {
      alert("Move only to an adjacent cell!");
      return;
    }

    const fromKey = `${sr},${sc}`;
    const toKey = `${r},${c}`;

    const newCells = { ...cells };
    const fromCell = { ...newCells[fromKey] };
    const toCell = { ...newCells[toKey] };
    const player = selected.color;

    if (toCell.token) {
      alert("That square already has a token!");
      return;
    }

    let gained = 0;
    if (toCell.owner === null) {
      gained = 1;
    } else if (toCell.owner !== player) {
      gained = toCell.consolidated ? 4 : 2;
    } else {
      gained = 0;
    }

    toCell.token = player;
    fromCell.token = null;

    if (toCell.owner === player) {
      // keep existing toCell.consolidated & toCell.color & owner
    } else {
      toCell.owner = player;
      toCell.consolidated = false;
      toCell.color = darkenColor(player, 0.85);
    }

    if (fromCell.consolidated) {
      if (fromCell.owner === null) {
        fromCell.owner = player;
      }
    } else {
      fromCell.owner = player;
      fromCell.consolidated = false;
      fromCell.color = darkenColor(player, 0.7);
    }

    newCells[fromKey] = fromCell;
    newCells[toKey] = toCell;

    setTerritories((prev) => ({
      ...prev,
      [player]: [...(prev[player] || []), fromKey],
    }));

    if (gained > 0) {
      setScores((prev) => ({
        ...prev,
        [player]: prev[player] + gained,
      }));
    }

    setCells(newCells);
    setSelected({ pos: toKey, color: player });
  };

  // Consolidate last moved square
  const handleConsolidate = () => {
    if (!selected) {
      alert("Select a token to consolidate its territory.");
      return;
    }

    const player = selected.color;
    const history = territories[player];
    if (!history || history.length === 0) {
      alert("No previous block to consolidate!");
      return;
    }

    const prevKey = history[history.length - 1];
    const newCells = { ...cells };
    const cell = { ...newCells[prevKey] };

    if (cell.owner !== player) {
      alert("You can only consolidate your own previous block.");
      return;
    }

    cell.consolidated = true;
    cell.color = darkenColor(player, 0.4);
    cell.owner = player;

    newCells[prevKey] = cell;
    setCells(newCells);

    setScores((prev) => ({
      ...prev,
      [player]: prev[player] + 2,
    }));
  };

  return (
    <div className="game-container">
      <div className="left-side">
        <h2>QUAZAR - Round 3</h2>

        {/* Scoreboard Container */}
        <div className="scoreboard-container">
          {/* Left Scoreboard */}
          <div className="scoreboard">
            {playerList.slice(0, 5).map((p) => (
              <div
                key={p}
                className="score-item"
                style={{
                  color: p,
                  fontWeight: selected?.color === p ? "bold" : "normal",
                }}
              >
                {p.toUpperCase()}: {scores[p]}
              </div>
            ))}
          </div>

          {/* Right Scoreboard */}
          <div className="scoreboard">
            {playerList.slice(5).map((p) => (
              <div
                key={p}
                className="score-item"
                style={{
                  color: p,
                  fontWeight: selected?.color === p ? "bold" : "normal",
                }}
              >
                {p.toUpperCase()}: {scores[p]}
              </div>
            ))}
          </div>
        </div>

        {/* Consolidate Button */}
        <button className="consolidate-btn" onClick={handleConsolidate}>
          Consolidate
        </button>
      </div>

      {/* Game Grid */}
      <div className="grid-container">
        <div className="grid">
          {Array.from({ length: GRID_SIZE }).map((_, r) =>
            Array.from({ length: GRID_SIZE }).map((_, c) => {
              const key = `${r},${c}`;
              const cell = cells[key];

              return (
                <div
                  key={key}
                  className="cell"
                  style={{
                    backgroundColor: cell.color,
                    border:
                      selected?.pos === key
                        ? "2px solid yellow"
                        : "1px solid #555",
                  }}
                  onClick={() => handleMove(r, c)}
                >
                  {cell.token && (
                    <div
                      className={`token ${selected?.pos === key ? "selected" : ""}`}
                      style={{ backgroundColor: cell.token }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(key, cell.token);
                      }}
                    />
                  )}
                  {cell.consolidated && <div className="consolidation-badge" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
