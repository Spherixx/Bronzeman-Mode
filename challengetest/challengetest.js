const challenges = [
  {
    name: "First Wilderness Kill",
    reward: ["Perilous Moon Roll"]
  },
  {
    name: "Anti-PK 5m",
    reward: ["2 Unlock Points"]
  },
  {
    name: "Chaos Elemental 25 KC",
    reward: ["Perilous Moon Roll"]
  },
  {
    name: "Mage Arena II",
    reward: ["2 Unlock Points"]
  },
  {
    name: "Revenant Unique",
    reward: ["Perilous Moon Roll", "Bonus Roll"]
  },
  {
    name: "Voidwaker Piece",
    reward: ["3 Unlock Points"]
  },
  {
    name: "Fire Cape",
    reward: ["2 Unlock Points"]
  },
  {
    name: "Smite +1",
    reward: ["PvP Reward Roll"]
  },
  {
    name: "50 Revs Skulled",
    reward: ["Perilous Moon Roll"]
  },
  {
    name: "Wilderness Hard Diary",
    reward: ["2 Unlock Points"]
  },
  {
    name: "Dagon'hai Set",
    reward: ["3 Unlock Points", "Bonus Roll"]
  },
  {
    name: "Escape Multi",
    reward: ["PvP Reward Roll"]
  }
];

const SVG_NS = "http://www.w3.org/2000/svg";

const wheelRotator = document.querySelector("#wheelRotator");
const wheelSlices = document.querySelector("#wheelSlices");
const spinButton = document.querySelector("#spinChallengeButton");

const resultPanel = document.querySelector("#challengeResult");
const resultName = document.querySelector("#challengeResultName");
const rewardContainer = document.querySelector("#challengeReward");

const WHEEL_RADIUS = 292;
const LABEL_RADIUS = 205;
const SPIN_DURATION_MS = 6500;
const MINIMUM_FULL_SPINS = 6;

let currentRotation = 0;
let isSpinning = false;

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function polarToCartesian(radius, angleDegrees) {
  const angleRadians = degreesToRadians(angleDegrees);

  return {
    x: radius * Math.cos(angleRadians),
    y: radius * Math.sin(angleRadians)
  };
}

function createSlicePath(startAngle, endAngle, radius) {
  const start = polarToCartesian(radius, startAngle);
  const end = polarToCartesian(radius, endAngle);

  const angleSize = endAngle - startAngle;
  const largeArcFlag = angleSize > 180 ? 1 : 0;

  return [
    "M 0 0",
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

function splitLabel(name, maxCharacters = 17) {
  const words = name.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const possibleLine = currentLine
      ? `${currentLine} ${word}`
      : word;

    if (
      possibleLine.length > maxCharacters &&
      currentLine
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = possibleLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}

function createWheel() {
  wheelSlices.replaceChildren();

  const sliceAngle = 360 / challenges.length;

  challenges.forEach((challenge, index) => {
    /*
     * Slice zero is centered at the top.
     *
     * Because SVG angle zero points right, the top is -90 degrees.
     */
    const centerAngle = -90 + index * sliceAngle;
    const startAngle = centerAngle - sliceAngle / 2;
    const endAngle = centerAngle + sliceAngle / 2;

    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("wheel-slice-group");
    group.dataset.index = String(index);

    const path = document.createElementNS(SVG_NS, "path");
    path.classList.add("wheel-slice");
    path.setAttribute(
      "d",
      createSlicePath(startAngle, endAngle, WHEEL_RADIUS)
    );

    const labelPosition = polarToCartesian(
      LABEL_RADIUS,
      centerAngle
    );

    const text = document.createElementNS(SVG_NS, "text");
    text.classList.add("wheel-slice-label");
    text.setAttribute("x", labelPosition.x);
    text.setAttribute("y", labelPosition.y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");

    /*
     * Counter-rotate the text so it remains horizontal
     * instead of following the wheel slice angle.
     */
    text.setAttribute(
      "transform",
      `rotate(${-centerAngle} ${labelPosition.x} ${labelPosition.y})`
    );

    const lines = splitLabel(challenge.name);

    lines.forEach((line, lineIndex) => {
      const tspan = document.createElementNS(SVG_NS, "tspan");

      tspan.setAttribute("x", labelPosition.x);

      const lineOffset =
        (lineIndex - (lines.length - 1) / 2) * 19;

      tspan.setAttribute("dy", lineIndex === 0
        ? lineOffset
        : 19
      );

      tspan.textContent = line;
      text.appendChild(tspan);
    });

    group.append(path, text);
    wheelSlices.appendChild(group);
  });
}

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

function clearSelectedSlice() {
  document
    .querySelectorAll(".wheel-slice-group.selected")
    .forEach((slice) => {
      slice.classList.remove("selected");
    });
}

function selectSlice(index) {
  clearSelectedSlice();

  const selectedSlice = document.querySelector(
    `.wheel-slice-group[data-index="${index}"]`
  );

  selectedSlice?.classList.add("selected");
}

function showChallengeResult(index) {
  const challenge = challenges[index];

  resultName.textContent = challenge.name;
  rewardContainer.replaceChildren();

  challenge.reward.forEach((rewardName) => {
    const rewardElement = document.createElement("div");
    rewardElement.classList.add("reward-item");
    rewardElement.textContent = rewardName;

    rewardContainer.appendChild(rewardElement);
  });

  resultPanel.hidden = false;
}

function getTargetRotation(index) {
  const sliceAngle = 360 / challenges.length;

  /*
   * Slice zero begins centered at the top. Moving to slice N
   * requires rotating backward by N slices.
   */
  const targetNormalizedRotation = normalizeDegrees(
    -(index * sliceAngle)
  );

  const currentNormalizedRotation =
    normalizeDegrees(currentRotation);

  const forwardDistance = normalizeDegrees(
    targetNormalizedRotation - currentNormalizedRotation
  );

  return (
    currentRotation +
    MINIMUM_FULL_SPINS * 360 +
    forwardDistance
  );
}

function spinWheel() {
  if (isSpinning) return;

  isSpinning = true;
  spinButton.disabled = true;
  resultPanel.hidden = true;

  clearSelectedSlice();

  const selectedIndex = Math.floor(
    Math.random() * challenges.length
  );

  const targetRotation = getTargetRotation(selectedIndex);

  const animation = wheelRotator.animate(
    [
      {
        transform: `rotate(${currentRotation}deg)`
      },
      {
        transform: `rotate(${targetRotation}deg)`
      }
    ],
    {
      duration: SPIN_DURATION_MS,

      /*
       * Fast initial movement with a long, gradual slowdown.
       */
      easing: "cubic-bezier(0.08, 0.72, 0.12, 1)",
      fill: "forwards"
    }
  );

  animation.onfinish = () => {
    currentRotation = targetRotation;

    /*
     * Commit the final rotation to the element so that future
     * animations begin from the correct position.
     */
    wheelRotator.style.transform =
      `rotate(${currentRotation}deg)`;

    animation.cancel();

    selectSlice(selectedIndex);
    showChallengeResult(selectedIndex);

    isSpinning = false;
    spinButton.disabled = false;
  };

  animation.oncancel = () => {
    isSpinning = false;
    spinButton.disabled = false;
  };
}

spinButton.addEventListener("click", spinWheel);

createWheel();