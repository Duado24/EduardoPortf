import { crux, darkLlama, projectEquatorial } from '../../data/southernSky.js';

const backgroundStars = [
  [52, 36, 1.4, 0.42], [98, 112, 1.1, 0.34], [148, 69, 1.7, 0.48],
  [192, 154, 1, 0.3], [235, 81, 1.2, 0.4], [275, 190, 1.6, 0.46],
  [318, 92, 1, 0.38], [354, 146, 1.5, 0.48], [392, 58, 1.1, 0.32],
  [428, 202, 1.3, 0.35], [463, 106, 1.8, 0.52], [505, 162, 1.1, 0.32],
  [548, 46, 1.3, 0.39], [574, 245, 1, 0.34], [612, 115, 1.6, 0.43],
  [648, 64, 1.1, 0.33], [690, 192, 1.3, 0.38], [728, 93, 1.8, 0.5],
  [766, 168, 1, 0.3], [804, 50, 1.5, 0.44], [842, 228, 1.1, 0.35],
  [884, 104, 1.4, 0.42], [928, 181, 1.2, 0.34], [962, 66, 1, 0.31],
  [78, 292, 1.4, 0.4], [176, 253, 1, 0.31], [292, 325, 1.2, 0.36],
  [378, 276, 1, 0.3], [487, 349, 1.4, 0.37], [596, 292, 1, 0.32],
  [712, 346, 1.5, 0.4], [824, 304, 1, 0.33], [943, 368, 1.2, 0.34],
];

const cruxLines = crux.l.map(line => {
  const points = [];
  for (let i = 0; i < line.length; i += 2) {
    const [x, y] = projectEquatorial(line[i], line[i + 1]);
    points.push([100 + x * 520, 80 - y * 520]);
  }
  return points;
});
const cruxStars = [...new Map(cruxLines.flat().map(point => [point.join(','), point])).values()];

export default function JourneySky() {
  return (
    <div className="journey-celestial-sky" aria-hidden="true">
      <svg className="journey-sky-art" viewBox="0 0 1000 600" preserveAspectRatio="none" focusable="false">



        {backgroundStars.map(([cx, cy, radius, opacity]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} fill="#f3ebe1" opacity={opacity} />
        ))}

        <path d={darkLlama} fill="#130f10" opacity=".36" />
        <svg x="765" y="62" width="180" height="155" viewBox="0 0 200 170" className="journey-sky-reference">
          {cruxLines.map((points, index) => <polyline key={index} points={points.map(p => p.join(',')).join(' ')} fill="none" stroke="#d9d5cf" strokeOpacity=".4" strokeWidth=".8" />)}
          {cruxStars.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1" fill="#f3ebe1" />)}
          <text x="28" y="160">CRUX · SOUTHERN CROSS</text>
        </svg>

      </svg>
    </div>
  );
}

// The horizon stays still while the visitor explores the sky.
export function JourneyLandscape() {
  return (
    <svg className="journey-landscape-art" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="journey-horizon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#857c79" stopOpacity="0" />
            <stop offset="1" stopColor="#857c79" stopOpacity=".15" />
          </linearGradient>
        </defs>        <path d="M0 520 C112 495 172 516 253 493 C343 468 398 500 493 481 C579 463 658 502 738 477 C828 450 901 485 1000 460 L1000 600 0 600Z"
          fill="#181516" />
        <path d="M0 530 94 495 162 510 251 478 329 509 407 486 486 508 560 475 656 505 728 481 811 510 881 474 1000 504 1000 600 0 600Z"
          fill="#211c1d" />
        <path d="M0 545 117 521 214 538 314 505 393 538 489 512 581 541 675 508 757 537 859 511 934 535 1000 522 1000 600 0 600Z"
          fill="#292122" />
        <path d="M0 500 C230 476 347 512 521 486 C717 458 843 493 1000 458 L1000 518 C829 521 682 494 526 520 C344 550 171 508 0 532Z"
          fill="url(#journey-horizon)" />
    </svg>
  );
}
