import { Session } from '@/types';
import { formatTime, score } from './engine';
import { categoryColors } from '@/components/topic-roulette';

export function shareToken(s: Session) {
  const data = { ...s, notes: {}, reflections: ['', '', '', s.reflections[3]] };
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data))));
}

export function decodeShare(token: string) {
  if (token.length > 50000) throw new Error('Share link is too large');
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(token), (c) => c.charCodeAt(0))));
}

export async function renderResult(s: Session): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image export is unavailable in this browser.');

  const catStyle = categoryColors[s.challenge.category] || {
    bg: '#1f1b13',
    text: '#ff642c',
    border: '#7c2d12',
    glow: 'rgba(255,100,44,0.3)',
  };

  // 1. Deep charcoal/dark background
  ctx.fillStyle = '#0a0d0d';
  ctx.fillRect(0, 0, 1080, 1350);

  // Subtle background texture / grid lines
  ctx.strokeStyle = '#181f1e';
  ctx.lineWidth = 1;
  for (let x = 60; x < 1080; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1350);
    ctx.stroke();
  }
  for (let y = 60; y < 1350; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1080, y);
    ctx.stroke();
  }

  // Card outline frame
  ctx.strokeStyle = '#283230';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 1000, 1270);

  // 2. Top Header
  // Brand vertical accent
  ctx.fillStyle = '#ff642c';
  ctx.fillRect(70, 70, 8, 48);

  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.fillStyle = '#ff642c';
  ctx.fillText('30', 92, 106);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(' MINUTE', 134, 106);

  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#9ca7a4';
  ctx.fillText(
    `TEST #${String(s.number).padStart(3, '0')} · ${s.practice ? 'PRACTICE' : 'OFFICIAL RUN'}`,
    700,
    102
  );

  // Separator
  ctx.strokeStyle = '#283230';
  ctx.beginPath();
  ctx.moveTo(70, 145);
  ctx.lineTo(1010, 145);
  ctx.stroke();

  // 3. Category & Difficulty Badges
  let curY = 195;
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = catStyle.text;
  ctx.fillText(`${s.challenge.category.toUpperCase()} / ${s.challenge.type.toUpperCase()}`, 70, curY);

  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`DIFFICULTY: ${s.challenge.difficulty.toUpperCase()}`, 750, curY);
  curY += 60;

  // 4. Topic Title (Large & Bold)
  const wrap = (text: string, yStart: number, width: number, lineH: number, maxLines: number) => {
    let row = '';
    let lines = 0;
    let y = yStart;
    for (const word of text.split(/\s+/)) {
      if (ctx.measureText(row + word).width > width && row) {
        ctx.fillText(row.trim(), 70, y);
        y += lineH;
        lines++;
        row = '';
        if (lines >= maxLines) {
          ctx.fillText('…', 70, y);
          return y + lineH;
        }
      }
      row += word + ' ';
    }
    ctx.fillText(row.trim(), 70, y);
    return y + lineH;
  };

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 76px Arial, sans-serif';
  curY = wrap(s.challenge.title, curY, 940, 84, 2);
  curY += 20;

  // 5. Metrics Strip (3 boxes: Research, Pitch, Self Score)
  ctx.fillStyle = '#111616';
  ctx.fillRect(70, curY, 940, 140);
  ctx.strokeStyle = '#2c3634';
  ctx.strokeRect(70, curY, 940, 140);

  const metrics = [
    { label: 'RESEARCH TIME', val: formatTime(s.researchSeconds), color: '#ffffff' },
    { label: 'PITCH TIME', val: formatTime(s.pitchSeconds), color: '#ffffff' },
    { label: 'SELF SCORE', val: `${score(s).toFixed(1)}/10`, color: '#ff642c' },
  ];

  metrics.forEach((m, idx) => {
    const x = 95 + idx * 320;
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#8b9794';
    ctx.fillText(m.label, x, curY + 45);

    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.fillStyle = m.color;
    ctx.fillText(m.val, x, curY + 108);
  });
  curY += 180;

  // 6. Detailed Score Breakdown Bars
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#ff642c';
  ctx.fillText('SCORE BREAKDOWN', 70, curY);
  curY += 25;

  const scoreItems = [
    { name: 'Technical Understanding', val: s.scores[2] || 5 },
    { name: 'Business & Moat', val: s.scores[3] || 5 },
    { name: 'Clarity & Delivery', val: Math.round(((s.scores[5] || 5) + (s.scores[6] || 5)) / 2) },
    { name: 'Original Insight', val: s.scores[7] || 5 },
  ];

  scoreItems.forEach((item) => {
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#d1dbd8';
    ctx.fillText(item.name, 70, curY + 22);

    // Score track
    const barX = 480;
    const barW = 440;
    ctx.fillStyle = '#1c2423';
    ctx.fillRect(barX, curY + 8, barW, 14);

    // Score fill
    ctx.fillStyle = item.val >= 8 ? '#ff642c' : item.val >= 6 ? '#f59e0b' : '#38bdf8';
    ctx.fillRect(barX, curY + 8, (item.val / 10) * barW, 14);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${item.val}/10`, 940, curY + 22);

    curY += 42;
  });
  curY += 30;

  // 7. Key Takeaway Section
  ctx.fillStyle = '#111616';
  ctx.fillRect(70, curY, 940, 240);
  ctx.strokeStyle = '#2c3634';
  ctx.strokeRect(70, curY, 940, 240);

  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#ff642c';
  ctx.fillText('THE KEY TAKEAWAY', 100, curY + 45);

  ctx.font = '26px Arial, sans-serif';
  ctx.fillStyle = '#efefea';
  const takeaway = s.reflections[3] || 'A new architectural perspective, earned under 30 minutes of pressure.';
  wrap(`“${takeaway}”`, curY + 95, 870, 38, 3);

  // 8. Footer Signoff
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#8b9794';
  ctx.fillText('30 MINUTES TO UNDERSTAND. 5 MINUTES TO PITCH.', 70, 1270);
  ctx.fillText('#30MINUTE', 910, 1270);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export the image.'))),
      'image/png'
    )
  );
}

export function contentAssets(s: Session) {
  const t = s.challenge.title;
  const insight = s.reflections[3];
  return [
    ['YouTube title', `I Had 30 Minutes to Figure Out How ${t} Works`],
    [
      'YouTube hook',
      `One unfamiliar subject: ${t}. Exactly thirty minutes to understand it. Exactly five minutes to explain it on camera.`,
    ],
    ['Instagram Reel hook', `I had 30 minutes to understand ${t}. Here is what I learned.`],
    [
      'Instagram caption angle',
      `30 minutes to understand it. 5 minutes to pitch it.\n\nToday's challenge: ${t}.\n\nKey takeaway: ${insight || 'The difference between knowing buzzwords and actually understanding the mechanics.'}\n\n#30Minute #LearnInPublic #Tech`,
    ],
    [
      'LinkedIn post angle',
      `I gave myself exactly 30 minutes to understand ${t}.\n\n${insight || 'Under a running clock, you are forced to cut through PR copy and map out the real data flow and unit economics.'}\n\nWhat would you research next?`,
    ],
    [
      'Short description',
      `30 MINUTE TEST #${String(s.number).padStart(3, '0')}: ${t}. Timed research & pitch challenge. Self-assessed ${score(s).toFixed(1)}/10.`,
    ],
  ];
}
