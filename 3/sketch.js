let pathPoints = []; // 儲存路徑中心點
let pathWidths = []; // 儲存每個點的通道寬度
let gameState = "START";
let numPoints = 150; // 增加點的密度，讓路線更複雜
let noiseSeedVal;

function setup() {
  createCanvas(windowWidth, windowHeight);
  initGame();
}

function initGame(keepSeed = false) {
  pathPoints = [];
  pathWidths = [];
  if (!keepSeed) {
    noiseSeedVal = random(1000); // 只有非改變視窗大小時才產生新路線
  }
  
  let startX = 50;
  let endX = width - 50;
  let spacing = (endX - startX) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    let x = startX + i * spacing;
    
    // 使用 Perlin Noise 產生上下起伏 (高度在 100~400 之間)
    // 調整 0.005 這個數值可以改變曲線的「陡峭程度」
    let y = noise(i * 0.05, noiseSeedVal) * (height - 200) + 100; 
    
    // 通道寬度也稍微隨機變化 (30 ~ 60 像素)
    let w = noise(i * 0.1, noiseSeedVal + 100) * 30 + 30;

    pathPoints.push({ x: x, y: y });
    pathWidths.push(w);
  }
  
  gameState = "START";
}

function draw() {
  background(25); // 深灰色背景

  // 1. 繪製複雜路徑
  drawPath();

  // 2. 繪製 Start & Goal 圓圈
  drawMarkers();

  // 3. 處理遊戲狀態
  if (gameState === "START") {
    drawOverlay(color(0, 200), "點擊綠色 START 開始遊戲\n滑鼠請沿著白線移動，不要碰到深灰色邊緣！");
  } 
  else if (gameState === "PLAYING") {
    checkCollision();
    // 提示點
    fill(255, 255, 0);
    noStroke();
    circle(mouseX, mouseY, 6);
  } 
  else if (gameState === "FAIL") {
    drawOverlay(color(200, 0, 0, 180), "失敗！碰到牆壁了\n點擊畫面重新開始");
  } 
  else if (gameState === "SUCCESS") {
    drawOverlay(color(0, 200, 0, 180), "成功！你太強了\n點擊畫面挑戰下一關");
  }
}

function drawPath() {
  // 畫深灰色底色 (牆壁區域)
  noFill();
  stroke(80); // 牆壁顏色
  strokeJoin(ROUND);
  
  // 先畫一層粗的作為通道背景
  beginShape();
  for (let i = 0; i < pathPoints.length; i++) {
    strokeWeight(pathWidths[i] + 10); // 牆壁寬度
    vertex(pathPoints[i].x, pathPoints[i].y);
  }
  endShape();

  // 再畫一層細白線作為導引
  stroke(255);
  strokeWeight(2);
  beginShape();
  for (let p of pathPoints) {
    vertex(p.x, p.y);
  }
  endShape();
}

function drawMarkers() {
  let start = pathPoints[0];
  let end = pathPoints[pathPoints.length - 1];

  // START
  fill(0, 255, 0);
  noStroke();
  circle(start.x, start.y, 30);
  fill(0);
  textSize(10);
  textAlign(CENTER, CENTER);
  text("START", start.x, start.y);

  // GOAL
  fill(255, 0, 0);
  circle(end.x, end.y, 30);
  fill(255);
  text("GOAL", end.x, end.y);
}

function drawOverlay(c, txt) {
  fill(c);
  rect(0, 0, width, height);
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(txt, width / 2, height / 2);
}

function mousePressed() {
  if (gameState === "START") {
    let start = pathPoints[0];
    if (dist(mouseX, mouseY, start.x, start.y) < 30) {
      gameState = "PLAYING";
    }
  } else if (gameState === "FAIL" || gameState === "SUCCESS") {
    initGame();
  }
}

function checkCollision() {
  // 檢查滑鼠是否在通道內
  let inSafeZone = false;

  // 起點與終點的圓圈範圍 (半徑 15) 也算作安全區域，避免滑鼠超出線段端點時直接失敗
  let start = pathPoints[0];
  let end = pathPoints[pathPoints.length - 1];
  if (dist(mouseX, mouseY, start.x, start.y) <= 15) inSafeZone = true;
  if (dist(mouseX, mouseY, end.x, end.y) <= 15) inSafeZone = true;

  for (let i = 0; i < pathPoints.length - 1; i++) {
    let p1 = pathPoints[i];
    let p2 = pathPoints[i + 1];

    // 判斷滑鼠 X 是否在這個線段區間內
    if (mouseX >= p1.x && mouseX <= p2.x) {
      // 計算當前 X 對應的中心 Y 座標
      let t = (mouseX - p1.x) / (p2.x - p1.x);
      let centerY = lerp(p1.y, p2.y, t);
      let currentW = lerp(pathWidths[i], pathWidths[i+1], t);

      // 深灰色邊緣的寬度為 currentW + 10，安全半徑放寬為 (currentW + 10) / 2
      if (abs(mouseY - centerY) <= (currentW + 10) / 2) {
        inSafeZone = true;
      }
      break; 
    }
  }

  // 判斷是否抵達終點
  if (dist(mouseX, mouseY, end.x, end.y) < 20) {
    gameState = "SUCCESS";
    return;
  }

  if (!inSafeZone) {
    gameState = "FAIL";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 調整視窗大小時，保持原本的隨機路線形狀（傳入 true）
  initGame(true);
}