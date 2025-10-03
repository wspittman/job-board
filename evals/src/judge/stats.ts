import { addNumBags, calcF1, truncate } from "../utils/mathUtils";
import { CheckOut } from "./checks";

export interface Stats {
  match?: {
    good: number;
    bad: number;
    total: number;
    score: number;
  };
  omit?: {
    good: number;
    badFind: number;
    badOmit: number;
    total: number;
    precision?: number;
    recall?: number;
    f1?: number;
  };
  overall?: number;
}

export function checksToStats(results: CheckOut[]): Stats {
  const statList = results.map(checkToStat);
  return combineStats(statList);
}

export function combineStats(statList: Stats[]): Stats {
  const combined = statList.reduce(addStats, {});

  if (combined.match?.score) {
    combined.match.score = truncate(
      combined.match.score / (combined.match.total || 1)
    );
  }

  if (combined.omit) {
    const { good, badFind, badOmit } = combined.omit;
    const precision = good / (good + badOmit || 1);
    const recall = good / (good + badFind || 1);
    combined.omit.precision = truncate(precision);
    combined.omit.recall = truncate(recall);
    combined.omit.f1 = calcF1(precision, recall);
  }

  const { score = 0, total = 0 } = combined.match ?? {};
  const { f1 = 0, total: omitTotal = 0 } = combined.omit ?? {};
  const scoreWeighted = score * total;
  const omitWeighted = f1 * omitTotal;
  combined.overall = truncate(
    (scoreWeighted + omitWeighted) / (total + omitTotal || 1)
  );

  return combined;
}

function addStats(acc: Stats, { match, omit }: Stats): Stats {
  if (match) {
    const aMatch = acc.match ?? { good: 0, bad: 0, total: 0, score: 0 };
    const { good, bad, total, score } = match;
    addNumBags(aMatch, { good, bad, total, score: 0 });

    // Score need to be weighted
    aMatch.score += (score ?? 0) * total;

    // Ensure acc.match always comes before omit
    if (!acc.match) {
      acc = { match: aMatch, ...acc };
    }
  }

  if (omit) {
    acc.omit ??= { good: 0, badFind: 0, badOmit: 0, total: 0 };
    addNumBags(acc.omit, omit);
  }

  return acc;
}

function checkToStat({ score, omit }: CheckOut): Stats {
  if (omit) {
    return {
      omit: {
        good: omit === "good" ? 1 : 0,
        badFind: omit === "badFind" ? 1 : 0,
        badOmit: omit === "badOmit" ? 1 : 0,
        total: 1,
      },
    };
  }

  score = score ?? 0;
  return {
    match: {
      good: score >= 0.8 ? 1 : 0,
      bad: score < 0.8 ? 1 : 0,
      total: 1,
      score,
    },
  };
}
