export interface CertificateData {
  playerName: string;
  score: number;
  distance: number;
  combo: number;
  date: string;
}

export function generateCertificateImage(data: CertificateData): HTMLCanvasElement {
  const W = 900;
  const H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#f8f4e8");
  bg.addColorStop(1, "#e8f5e9");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = "#1b5e20";
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = "#f1c40f";
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Header ribbon
  ctx.fillStyle = "#1b5e20";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 200, 50, 400, 56, 12);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("🇧🇩 BanglaRun Achievement", W / 2, 88);

  // Title
  ctx.fillStyle = "#1b5e20";
  ctx.font = "bold 42px Georgia, serif";
  ctx.fillText("Certificate of Excellence", W / 2, 160);

  ctx.fillStyle = "#2e7d32";
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText("Milon MP — Master Player Award", W / 2, 195);

  // Body
  ctx.fillStyle = "#333";
  ctx.font = "18px Georgia, serif";
  ctx.fillText("This certifies that", W / 2, 250);

  ctx.fillStyle = "#1b5e20";
  ctx.font = "bold 36px Georgia, serif";
  ctx.fillText(data.playerName, W / 2, 300);

  ctx.fillStyle = "#444";
  ctx.font = "18px Georgia, serif";
  ctx.fillText("has successfully completed the 30-second Milon Run challenge", W / 2, 345);
  ctx.fillText("demonstrating dedication to learning and perseverance.", W / 2, 375);

  // Stats box
  ctx.fillStyle = "rgba(27,94,32,0.08)";
  ctx.beginPath();
  ctx.roundRect(120, 400, W - 240, 120, 16);
  ctx.fill();
  ctx.strokeStyle = "#1b5e20";
  ctx.lineWidth = 2;
  ctx.stroke();

  const stats = [
    `Score: ${data.score.toLocaleString()} pts`,
    `Distance: ${Math.floor(data.distance)}m`,
    `Best Combo: ×${data.combo}`,
  ];
  ctx.fillStyle = "#1b5e20";
  ctx.font = "bold 20px Georgia, serif";
  stats.forEach((s, i) => {
    ctx.fillText(s, W / 2, 440 + i * 32);
  });

  // Footer
  ctx.fillStyle = "#666";
  ctx.font = "14px Georgia, serif";
  ctx.fillText(`Awarded on ${data.date}`, W / 2, H - 60);
  ctx.fillStyle = "#f1c40f";
  ctx.font = "bold 16px Georgia, serif";
  ctx.fillText("★ Keep Running · Keep Learning ★", W / 2, H - 35);

  return canvas;
}

export function downloadCertificate(data: CertificateData, filename = "milon-mp-certificate.png") {
  const canvas = generateCertificateImage(data);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
