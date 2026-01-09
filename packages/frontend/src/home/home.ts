import "../sharedStyles/all.css";
import "./home.css";

const schedule = (callback: () => void): void => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => callback());
  } else {
    setTimeout(callback, 0);
  }
};

schedule(() => {
  void import("./heroIcons.ts");
  void import("./stats.ts");
});
