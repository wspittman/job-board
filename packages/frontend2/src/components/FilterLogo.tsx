import { Breakpoint, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  AlarmClock,
  Angry,
  ArrowLeftRight,
  Asterisk,
  Binary,
  Clock,
  CloudRainWind,
  Dices,
  DollarSign,
  Drill,
  Drum,
  FileStack,
  Filter,
  Frown,
  Hash,
  HeartCrack,
  Hourglass,
  Megaphone,
  PartyPopper,
  RadioTower,
  Smile,
  Sparkles,
  Speech,
  TrendingUpDown,
  Volume2,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";

type Sizer = number | Partial<Record<Breakpoint, number>>;

// To keep things from moving around on repaint, we calculate some random things once on initial load of the site
const randoms = Array.from({ length: 50 }, Math.random);
const inputIcons = [
  AlarmClock,
  Angry,
  ArrowLeftRight,
  Asterisk,
  Binary,
  Clock,
  CloudRainWind,
  Dices,
  Drill,
  Drum,
  FileStack,
  Frown,
  Hash,
  HeartCrack,
  Hourglass,
  Megaphone,
  RadioTower,
  Sparkles,
  Speech,
  TrendingUpDown,
  Volume2,
  Wind,
  Wrench,
  Zap,
].sort(() => Math.random() - 0.5);
const randomColors = Array.from({ length: inputIcons.length }, () => {
  const hue = Math.random() * 360;
  const saturation = 70 + Math.random() * 30;
  const lightness = 25 + Math.random() * 20;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
});

function useSize(size: Sizer) {
  const { breakpoints } = useTheme();
  const xs = useMediaQuery(breakpoints.up("xs"));
  const sm = useMediaQuery(breakpoints.up("sm"));
  const md = useMediaQuery(breakpoints.up("md"));
  const lg = useMediaQuery(breakpoints.up("lg"));
  const xl = useMediaQuery(breakpoints.up("xl"));

  if (typeof size === "number") {
    return size;
  }

  if (xl && size.xl != undefined) return size.xl;
  if (lg && size.lg != undefined) return size.lg;
  if (md && size.md != undefined) return size.md;
  if (sm && size.sm != undefined) return size.sm;
  if (xs && size.xs != undefined) return size.xs;

  return 32;
}

interface Props {
  size: Sizer;
  style?: React.CSSProperties;
}

export const FilterLogo = ({ size: sizeDef, style }: Props) => {
  const theme = useTheme();
  const size = useSize(sizeDef);

  // To keep things from moving around on repaint, we always use the same randoms in the same order
  let randomIndex = 0;
  const getRandomRange = (min: number, max: number) =>
    Math.floor(randoms[randomIndex++ % randoms.length] * (max - min)) + min;

  const filterSize = size * 0.9;
  const filterOffset = (size - filterSize) / 2;

  const inputRows = 1 + Math.max(0, Math.floor((size - 150) / 50));
  const inputCount = ((inputRows + 1) * inputRows) / 2;
  const inputSize = (size * (0.35 + 0.05 * inputRows)) / inputRows;
  const inputOffsets: [number, number][] = [];

  for (let row = 0; row < inputRows; row++) {
    const countInRow = inputRows - row;
    const rowStartX =
      // Start in the middle
      size / 2 -
      // Move to the left by half the row width
      (countInRow / 2) * inputSize -
      // Add some buffer for space between inputs
      Math.floor(countInRow / 2) * inputSize * 0.2;

    for (let col = 0; col < countInRow; col++) {
      inputOffsets.push([rowStartX + col * inputSize * 1.2, row * inputSize]);
    }
  }

  const outputSize = (1 + 0.15 * inputRows) * inputSize;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        ...style,
      }}
    >
      {inputIcons.slice(0, inputCount).map((Icon, index) => {
        // Add some random variance
        const actualSize = getRandomRange(0.75 * inputSize, 1.25 * inputSize);
        const [x, y] = inputOffsets[index];
        const left = getRandomRange(0.9 * x, 1.1 * x);
        const top = getRandomRange(0.9 * y, 1.1 * y);

        return (
          <Icon
            key={index}
            size={actualSize}
            style={{ position: "absolute", left, top }}
            color={randomColors[index]}
          />
        );
      })}

      <Filter
        size={filterSize}
        style={{
          position: "absolute",
          top: filterOffset,
          left: filterOffset,
        }}
        color={theme.palette.primary.dark}
        strokeWidth={1}
      />

      <DollarSign
        size={outputSize}
        style={{
          position: "absolute",
          left: size * 0.5 - outputSize,
          top: size - outputSize,
        }}
        color={theme.palette.success.dark}
      />

      {inputRows > 1 && (
        <Smile
          size={outputSize}
          style={{
            position: "absolute",
            left: Math.max(0, size * 0.48 - 1.8 * outputSize),
            top: size - outputSize,
          }}
          color={theme.palette.success.main}
        />
      )}

      {inputRows > 2 && (
        <PartyPopper
          size={outputSize}
          style={{
            position: "absolute",
            left: size * 0.48 + 0.4 * outputSize,
            top: size - outputSize,
          }}
          color={theme.palette.warning.main}
        />
      )}
    </div>
  );
};
