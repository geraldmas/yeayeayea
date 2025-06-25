import React, { useState } from "react";
import type { Player, CharismeModifier } from "../types/index";
import { getModifiedMaxCharisme } from "../utils/charismeService";
import "./CharismeDisplay.css";

interface CharismeDisplayProps {
  player: Player;
  isActive?: boolean;
}

/**
 * Composant CharismeDisplay - Affiche le charisme du joueur
 *
 * Ce composant montre la quantité de charisme disponible pour un joueur,
 * ainsi que les modificateurs actifs si demandé.
 */
const CharismeDisplay: React.FC<CharismeDisplayProps> = ({
  player,
  isActive = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = () => setShowDetails((prev) => !prev);

  const maxCharisme = getModifiedMaxCharisme(player);
  const fillPercentage = Math.min(
    100,
    ((player.charisme || 0) / maxCharisme) * 100,
  );

  const getBarColor = (): string => {
    if (fillPercentage < 30) return "red";
    if (fillPercentage < 60) return "orange";
    return "green";
  };

  const renderModifiers = () => {
    if (!player.charismeModifiers || player.charismeModifiers.length === 0) {
      return null;
    }

    return (
      <div className="charisme-modifiers">
        {player.charismeModifiers.map((mod: CharismeModifier) => (
          <div key={mod.id} className="charisme-modifier">
            <span className="modifier-source">{mod.source}</span>
            <span
              className={`modifier-value ${mod.value >= 0 ? "positive" : "negative"}`}
            >
              {mod.value > 0 ? "+" : ""}
              {mod.value}
              {mod.isPercentage ? "%" : ""}
            </span>
            {mod.duration !== undefined && mod.duration > 0 && (
              <span className="modifier-duration">
                ({mod.duration} {mod.duration > 1 ? "tours" : "tour"})
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`charisme-display ${isActive ? "active" : ""}`}
      onClick={toggleDetails}
    >
      <div className="charisme-header">
        <h3>Charisme</h3>
        <div className="charisme-value">
          {player.charisme ?? 0} / {maxCharisme}
        </div>
      </div>

      <div className="charisme-bar-container">
        <div
          className="charisme-bar"
          style={{
            width: `${fillPercentage}%`,
            backgroundColor: getBarColor(),
          }}
        ></div>
      </div>

      {(isActive || showDetails) && renderModifiers()}
    </div>
  );
};

export default CharismeDisplay;
