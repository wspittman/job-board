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
}

export function checksToStats(results: CheckOut[]): Stats {
  const statList = results.map(checkToStat);
  return combineStats(statList);
}

export function combineStats(statList: Stats[]): Stats {
  const combined: Stats = {};
  statList.forEach((stats) => addStats(combined, stats));

  if (combined.match?.score) {
    combined.match.score /= combined.match.total || 1;
  }

  if (combined.omit) {
    const { good, badFind, badOmit } = combined.omit;
    const precision = good / (good + badOmit || 1);
    const recall = good / (good + badFind || 1);
    combined.omit.precision = precision;
    combined.omit.recall = recall;
    combined.omit.f1 = (2 * (precision * recall)) / (precision + recall || 1);
  }

  return combined;
}

function addStats(acc: Stats, { match, omit }: Stats): void {
  if (match) {
    acc.match ??= { good: 0, bad: 0, total: 0, score: 0 };
    acc.match.good += match.good;
    acc.match.bad += match.bad;
    acc.match.total += match.total;
    acc.match.score += match.score;
  }

  if (omit) {
    acc.omit ??= { good: 0, badFind: 0, badOmit: 0, total: 0 };
    acc.omit.good += omit.good;
    acc.omit.badFind += omit.badFind;
    acc.omit.badOmit += omit.badOmit;
    acc.omit.total += omit.total;
  }
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
