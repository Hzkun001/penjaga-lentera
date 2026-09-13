import Phaser from "phaser";

// All artwork is rasterized with integer rectangles, without canvas paths or smoothing.
const ink = "#243b36", wood = "#76513b", lightWood = "#bd925e";
const cream = "#ead4a0", leaf = "#537d47", leafLight = "#8faf62";
type Rect = (x: number, y: number, w: number, h: number, color: string) => void;
export const directions = ["down", "left", "right", "up"] as const;
export type Direction = typeof directions[number];
export function directionOf(x: number, y: number): Direction {
  return Math.abs(x) > Math.abs(y) ? x < 0 ? "left" : "right" : y < 0 ? "up" : "down";
}

export function addVillageHouseFrames(scene: Phaser.Scene) {
  const atlas = scene.textures.get("serene-village");
  const houses = [
    [2, 344, 43, 51], [50, 344, 43, 51], [2, 472, 43, 51], [50, 600, 43, 51],
    [7, 405, 67, 54], [87, 405, 67, 54], [99, 592, 56, 59],
    [7, 533, 67, 54], [99, 464, 56, 59], [7, 661, 67, 54],
    [99, 336, 56, 59],
  ] as const;
  houses.forEach(([x, y, width, height], index) => {
    const frame = `house-${index}`;
    if (!atlas.has(frame)) atlas.add(frame, 0, x, y, width, height);
  });
}

export function createPixelArt(scene: Phaser.Scene) {
  if (scene.textures.exists("terrain")) return;
  const asset = (key: string, w: number, h: number, draw: (r: Rect) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    draw((x, y, width, height, color) => {
      if(color === "rgba(0,0,0,0)"){ctx.clearRect(Math.round(x),Math.round(y),Math.round(width),Math.round(height));return;}
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    });
    return scene.textures.addCanvas(key, canvas)!;
  };
  const cluster = (r: Rect, x: number, y: number, w: number, h: number, c: string) => {
    r(x + 4, y, w - 8, h, c); r(x, y + 4, w, h - 8, c);
  };
  const shadow = (r: Rect, x: number, y: number, w: number) => {
    r(x + 3, y, w - 6, 4, ink); r(x, y + 1, w, 2, ink);
  };
  // A single tileset: grass, forest, dirt, animated water, and interior planks.
  asset("terrain", 16 * 14, 16, (r) => {
    for (let tile = 0; tile < 14; tile++) {
      const x = tile * 16;
      const base = tile < 4 ? "#81955c" : tile < 6 ? "#405f43" : tile < 8 ? "#c3aa79" : tile < 12 ? "#437a7b" : lightWood;
      r(x, 0, 16, 16, base);
      if (tile < 6) {
        r(x + 2, 4, 2, 1, tile < 4 ? "#a2b574" : leaf);
        r(x + 11, 12, 3, 1, tile < 4 ? "#6e8652" : "#36523d");
        if (tile % 3 === 1) {
          r(x + 7, 8, 1, 3, leaf); r(x + 6, 7, 1, 2, leafLight);
          r(x + 8, 6, 1, 3, leafLight);
        }
      } else if (tile < 8) {
        r(x + 2, 5, 2, 1, "#a58b60"); r(x + 9, 11, 3, 1, cream);
      } else if (tile < 12) {
        const shift = tile - 8;
        r(x + 1 + shift, 4, 5, 1, "#72a7a0");
        r(x + 8 - shift, 11, 5, 1, "#9bbfad");
        r(x + 2 + shift, 5, 2, 1, "#568f8c");
      } else {
        r(x, 7, 16, 1, wood); r(x, 15, 16, 1, wood);
        r(x + (tile === 12 ? 2 : 10), 0, 1, 7, wood);
        r(x + (tile === 12 ? 10 : 2), 8, 1, 7, wood);
        r(x + 4, 2, 5, 1, "#cda574"); r(x + 7, 10, 6, 1, "#cda574");
      }
    }
  });
  const outfits = [
    ["hero", "#dca16b", "#654330", "#427b80", "#c7774d"],
    ["npc-sari", "#dca16b", "#d7d4b7", "#867b70", "#aeb49a"],
    ["npc-bima", "#ae7451", "#44332b", "#547783", "#aa6d46"],
    ["npc-lila", "#e0ac7b", "#623c36", "#975e78", "#e0b66a"],
    ["npc-raka", "#c99260", "#553f30", "#567b4a", "#cbb572"],
    ["npc-mira", "#aa7858", "#30342f", "#526780", "#98b5b0"],
    ["npc-ratih", "#c99260", "#49362e", "#b56c4e", "#edce91"],
    ["npc-damar", "#ae7451", "#6b6555", "#697b53", "#c5a36e"],
    ["npc-nina", "#e0ac7b", "#483a30", "#779ca0", "#d3b769"],
  ];
  for (const [key, skin, hair, shirt, accent] of outfits) {
    const sheet = asset(key, 24 * 4, 32 * 4, (r) => {
      directions.forEach((direction, row) => {
        for (let frame = 0; frame < 4; frame++) {
          const p: Rect = (x, y, w, h, c) => r(x + frame * 24, y + row * 32, w, h, c);
          const step = [0, 1, 0, -1][frame];
          const bob = frame % 2;
          shadow(p, 4, 29, 16);
          p(7, 24, 4, 5 + step, ink); p(14, 24, 4, 5 - step, ink);
          p(7, 27 + step, 5, 2, wood); p(14, 27 - step, 5, 2, wood);
          p(5, 15 + bob, 15, 11, ink); p(6, 16 + bob, 13, 8, shirt);
          p(7, 23, 11, 2, accent);
          p(4, 17 + bob + step, 3, 6, skin); p(19, 17 + bob - step, 2, 6, skin);
          p(6, 4 + bob, 14, 12, ink); p(7, 5 + bob, 12, 10, skin);
          p(6, 3 + bob, 14, 5, hair); p(5, 5 + bob, 3, 6, hair);
          if (direction === "up") {
            p(7, 7 + bob, 12, 7, hair);
            if(key === "hero") {p(8, 17 + bob, 9, 7, wood); p(9, 18 + bob, 7, 4, lightWood);}
            else p(8, 17 + bob, 10, 1, accent);
          } else {
            const eye = direction === "left" ? 8 : 15;
            p(eye, 10 + bob, 2, 2, ink);
            if (direction === "down") p(9, 10 + bob, 2, 2, ink);
            p(12, 14 + bob, 3, 1, wood);
          }
          if (direction === "left" || direction === "right") {
            // Side views need a side silhouette, not a front body with one eye.
            p(0, 0, 24, 29, "rgba(0,0,0,0)");
            const side: Rect = (x,y,w,h,c) => p(direction === "left" ? 24-x-w : x,y,w,h,c);
            side(8-step*2,24,4,5,ink);side(12+step*2,24,4,5,wood);
            side(8,15+bob,10,10,ink);side(9,16+bob,8,8,shirt);
            if(key === "hero") {side(7,17+bob,3,7,wood);side(8,18+bob,2,4,lightWood);}
            else side(9,23,8,2,accent);
            side(12+step,18+bob,3,6,skin);
            side(8,4+bob,11,12,ink);side(10,6+bob,8,9,skin);
            side(8,3+bob,11,5,hair);side(8,7+bob,3,7,hair);
            side(16,10+bob,2,2,ink);side(18,12+bob,2,2,skin);
          }
          const profile = direction === "left" || direction === "right";
          const detail: Rect = (x,y,w,h,c) => p(direction === "left" ? 24-x-w : x,y,w,h,c);
          if (key === "hero" || key === "npc-raka") {
            if(profile) {detail(7,4+bob,15,3,cream);detail(9,1+bob,9,4,accent);}
            else {p(4,4+bob,18,3,cream);p(8,1+bob,10,4,accent);}
          }
          if (key === "npc-sari") {
            if(profile) {
              detail(5,6+bob,5,5,hair);
              detail(15,22+bob,2,8,wood);detail(13,21+bob,4,2,skin);
            } else {
              p(4,5+bob,5,5,hair);p(20,22+bob,2,8,wood);
              p(19,21+bob,3,2,skin);
            }
          }
          if (key === "npc-bima" || key === "npc-damar") {
            if(profile) {detail(14,14+bob,4,3,hair);detail(15,18+bob,2,7,accent);}
            else if(direction === "down") {p(9,14+bob,9,3,hair);p(9,18+bob,8,8,accent);}
          }
          if (key === "npc-lila" || key === "npc-nina") {
            if(profile) {detail(7,9+bob,3,12,hair);detail(7,20+bob,3,2,accent);}
            else if(direction === "up") {p(10,12+bob,4,10,hair);p(10,21+bob,4,2,accent);}
            else {p(18,8+bob,3,12,hair);p(18,19+bob,3,2,accent);}
          }
          if (key === "npc-mira" || key === "npc-ratih") {
            if(profile) {detail(8,2+bob,11,4,accent);detail(7,6+bob,3,8,accent);}
            else {p(5,2+bob,16,4,accent);if(direction === "up")p(7,6+bob,12,9,accent);else p(18,6+bob,3,8,accent);}
          }
        }
      });
    });
    directions.forEach((d, row) => {
      for (let frame = 0; frame < 4; frame++) sheet.add(`${d}-${frame}`, 0, frame * 24, row * 32, 24, 32);
      scene.anims.create({key: `${key}-${d}`, frames: [0, 1, 2, 3].map(i => ({key, frame: `${d}-${i}`})), frameRate: 8, repeat: -1});
    });
  }
  asset("tree", 64, 85, r => {
    shadow(r, 13, 77, 40);
    r(26, 40, 13, 37, ink); r(28, 45, 9, 32, wood);
    r(29, 51, 3, 24, lightWood); r(21, 76, 23, 3, wood);
    cluster(r, 2, 26, 60, 34, ink);
    cluster(r, 5, 23, 54, 32, "#365d3e");
    cluster(r, 10, 10, 45, 36, leaf); cluster(r, 18, 1, 31, 26, "#6f934f");
    cluster(r, 5, 28, 28, 21, "#6f934f");
    for (const [x,y,w] of [[23,6,12],[17,15,12],[37,22,10],[9,33,12],[30,40,14]]) {
      r(x,y,w,2,leafLight); r(x+2,y+2,w-4,2,"#6f934f");
    }
    r(15,51,10,2,ink); r(40,48,13,2,ink);
  });
  asset("rock", 32, 22, r => {
    shadow(r, 1, 18, 30); cluster(r, 2, 3, 28, 18, ink);
    cluster(r, 4, 4, 24, 14, "#7f9080"); r(9,5,12,3,"#b5bba0");
    r(7,10,4,3,"#a2ad94"); r(22,12,5,5,"#56695c"); r(17,8,2,6,"#56695c");
  });
  asset("bush", 38, 27, r => {
    shadow(r,3,22,32); cluster(r,1,5,36,19,ink);
    cluster(r,3,3,32,18,leaf); r(7,5,9,3,leafLight); r(23,9,8,3,leafLight);
    r(9,17,3,3,"#c7774d"); r(28,16,3,3,"#c7774d");
  });
  asset("crystal", 18, 25, r => {
    for (let y=0;y<22;y++) {
      const w = Math.min(7,Math.floor(Math.min(y,22-y)/2));
      r(9-w,y,2*w+1,1,ink); if(w>1) r(10-w,y+1,w-1,1,"#bce1bf");
      if(w>1) r(9,y+1,w-1,1,"#60aaa5");
    }
    r(5,6,2,5,cream);
  });
  for(let f=0;f<3;f++) asset(`slime${f || ""}`, 26, 20, r => {
    shadow(r,2,16,22); cluster(r,1,3+f,24,15-f,ink);
    cluster(r,3,4+f,20,12-f,leaf); r(7,5+f,10,3,leafLight);
    r(7,11+f,2,2,ink); r(17,11+f,2,2,ink);
  });
  asset("sign",28,34,r=>{r(12,12,5,22,ink); r(13,14,3,19,wood);r(1,3,26,16,ink);r(2,4,24,13,lightWood);r(5,7,18,1,cream);r(8,11,12,2,wood);r(16,9,2,6,wood);});
  for (const open of [false,true]) asset(open ? "chestOpen" : "chest",32,32,r=>{
    shadow(r,1,27,30);r(2,10,28,18,ink);r(3,11,26,15,wood);r(4,12,24,4,lightWood);
    r(2,open ? 1 : 6,28,8,ink);r(3,open ? 2 : 7,26,5,lightWood);
    if(open)r(4,10,24,4,ink);r(7,14,3,13,cream);r(23,14,3,13,cream);r(14,16,5,5,cream);r(16,17,1,2,ink);
  });
  for(let f=0;f<4;f++) asset(`campfire${f || ""}`,34,37,r=>{
    shadow(r,2,32,30);r(4,29,26,5,wood);r(7,28,4,7,lightWood);r(22,28,4,7,lightWood);
    cluster(r,6,14,22,17,"#ae513d");r(11,5+(f%2)*3,5,22,"#d78445");r(21,11-f,4,16,"#d78445");
    r(12,20,10,9,"#e7b86a");r(15,14+f,4,14,cream);
  });
  asset("door",44,22,r=>{r(2,6,40,14,ink);r(4,7,36,11,wood);r(6,8,32,2,lightWood);r(8,14,28,2,lightWood);});
  asset("chicken",26,26,r=>{
    shadow(r,3,22,22);r(8,19,2,5,"#d8a052");r(17,19,2,5,"#d8a052");
    cluster(r,4,9,18,12,cream);r(2,8,6,6,"#f4eac8");r(15,5,8,12,"#f4eac8");
    r(17,2,3,5,"#b95045");r(21,3,3,4,"#b95045");r(23,10,3,3,"#d8a052");r(20,8,2,2,ink);r(10,13,6,5,"#c8b888");
  });
  asset("nest",36,25,r=>{cluster(r,1,8,34,16,wood);r(4,12,28,8,lightWood);r(7,15,23,2,cream);r(9,6,7,10,"#f4eac8");r(21,7,7,10,"#f4eac8");});
  asset("fountain",88,82,r=>{
    cluster(r,1,40,86,38,ink);cluster(r,5,42,78,30,"#839b95");cluster(r,11,44,66,21,"#467f91");
    r(17,50,20,2,"#99d8d1");r(51,57,18,2,"#99d8d1");r(38,20,12,42,"#c0c8aa");
    r(23,24,42,9,"#839b95");r(27,22,34,5,"#99d8d1");r(41,5,6,18,"#99d8d1");
    r(32,10,9,3,"#99d8d1");r(47,10,9,3,"#99d8d1");r(29,13,3,10,"#99d8d1");r(56,13,3,10,"#99d8d1");
  });
  asset("bed",68,70,r=>{r(2,2,64,66,ink);r(4,3,60,62,wood);r(7,9,54,48,cream);r(7,32,54,29,"#ad6253");r(10,35,48,2,"#d48d68");r(12,12,43,15,"#f3e5bd");r(13,26,42,2,"#c3aa79");r(8,62,5,7,wood);r(54,62,5,7,wood);});
  asset("books",55,58,r=>{r(1,1,53,56,ink);r(3,3,49,52,wood);for(let y=16;y<55;y+=17){r(5,y,45,3,lightWood);for(let i=0;i<6;i++){r(7+i*7,y-11,5,11,["#ad6253","#547783",cream][i%3]);r(8+i*7,y-8,3,1,lightWood);}}});
  asset("anvil",52,39,r=>{shadow(r,3,33,46);r(12,28,30,7,ink);r(19,17,16,13,"#56695c");r(7,9,39,10,ink);r(2,5,48,6,"#b5bba0");r(6,11,37,5,"#7f9080");r(14,29,25,3,"#7f9080");});
  asset("stove",48,55,r=>{r(5,20,38,33,ink);r(7,23,34,27,wood);cluster(r,1,10,46,18,ink);cluster(r,4,11,40,12,lightWood);r(9,15,30,6,leaf);r(16,7,4,12,leafLight);r(29,3,3,14,leafLight);r(16,36,17,12,ink);r(20,40,9,7,"#d78445");r(24,38,3,8,cream);});
  for(let f=0;f<3;f++)asset(`plot${f}`,42,32,r=>{
    r(1,9,40,22,ink);r(2,10,38,20,wood);
    for(let y=14;y<30;y+=6)r(4,y,34,2,lightWood);
    if(f)for(let x=7;x<38;x+=10){r(x,7,2,17,leaf);r(x-3,10,4,2,leafLight);r(x+2,7,3,2,leafLight);if(f===2){r(x-2,3,6,7,cream);r(x,1,2,3,"#e7b86a");}}
  });
  for(let f=0;f<4;f++)asset(`fishing${f || ""}`,46,20,r=>{
    const inset=f*2;r(2+inset,8,12,1,"#9bbfad");r(27-inset,14,12,1,"#9bbfad");
    r(7+inset,10,6,1,"#72a7a0");r(24,7+(f%2),3,4,"#ad6253");
  });
  for(const wet of [false,true]) for(const crop of ["empty","turnip","carrot","pumpkin"]) for(let stage=0;stage<4;stage++) asset(`farm-${crop}-${stage}-${wet}`,42,32,r=>{
    r(1,9,40,22,ink);r(2,10,38,20,wet?"#493c35":"#966445");
    for(let y=14;y<30;y+=6)r(4,y,34,2,wet?"#665343":"#bb8b59");
    if(wet){r(6,25,5,1,"#779591");r(28,13,4,1,"#779591");}
    if(crop!=="empty")for(let x=9;x<38;x+=12){const h=3+stage*4;r(x,23-h,2,h,leafLight);r(x-3,24-h,3,2,leaf);if(stage>0)r(x+2,20-h,4,3,leafLight);if(stage===3){r(x-3,18,8,7,crop==="turnip"?cream:crop==="carrot"?"#e2a050":"#cd753f");r(x,16,2,3,leaf);}}
  });
  asset("cabin",76,80,r=>{r(7,31,62,46,ink);r(10,35,56,39,lightWood);for(let y=40;y<74;y+=8)r(10,y,56,2,wood);for(let i=0;i<6;i++)r(4+i*4,27-i*4,68-i*8,6,"#597b74");r(30,51,18,26,ink);r(33,54,12,22,wood);r(14,43,10,12,cream);r(53,43,10,12,cream);r(43,64,2,2,cream);});
  asset("stall",80,64,r=>{r(8,12,4,48,wood);r(68,12,4,48,wood);r(3,41,74,21,ink);r(6,44,68,15,lightWood);for(let i=0;i<8;i++)r(i*10,8,10,17,i%2?cream:"#9c6557");r(0,24,80,4,wood);r(15,35,9,6,leafLight);r(31,33,9,8,"#d89143");r(52,34,10,7,cream);});
  asset("board",48,48,r=>{r(9,28,5,20,wood);r(34,28,5,20,wood);r(1,3,46,31,ink);r(4,6,40,25,lightWood);for(let x=8;x<40;x+=12){r(x,10,9,15,cream);r(x+2,13,5,1,wood);r(x+2,17,4,1,wood);}});
  for(let f=0;f<3;f++){
    asset("bat"+(f||""),32,24,r=>{r(12,8,9,10,"#867397");r(14,5,2,5,"#867397");r(19,5,2,5,"#867397");r(2,5+f*3,10,5,"#675376");r(21,5+f*3,10,5,"#675376");r(13,11,2,2,cream);r(18,11,2,2,cream);});
    asset("guardian"+(f||""),32,32,r=>{r(6,6,22,23,ink);r(8,7,18,20,"#7d8d78");r(4,23,9,7,wood);r(22,23,8,7,wood);r(9,11,4,3,"#dca16b");r(21,11,4,3,"#dca16b");r(16,3+f,4,5,leafLight);r(9,20,16,2,"#56695c");});
  }
  // Tool poses are separate raster frames: no runtime arbitrary-angle sprite rotation.
  const toolTips = {
    down: [[33,16],[40,25],[31,40]],
    up: [[36,7],[42,17],[29,0]],
    left: [[4,12],[2,24],[14,7]],
    right: [[44,12],[46,24],[34,7]],
  } as const;
  for (const tool of ["axe","pickaxe","sickle","hoe","rod","sword","water"]) {
    for(const d of directions) for(let f=0;f<3;f++)asset(`${tool}-${d}-${f}`,48,48,r=>{
      const vx=d==="left"?-1:d==="right"?1:0, vy=d==="up"?-1:d==="down"?1:0;
      const hx=24+vx*7,hy=24+vy*5;
      const [tipX,tipY]=toolTips[d][f];
      const dx=tipX-hx, dy=tipY-hy, distance=Math.hypot(dx,dy);
      const ux=dx/distance, uy=dy/distance;
      const length=tool==="rod"?19:tool==="sword"?16:13;
      // Rasterize along the shaft and across it: blade, guard and head rotate together.
      const pixel=(along:number,across:number,color:string)=>r(hx+ux*along-uy*across,hy+uy*along+ux*across,1,1,color);
      for(let i=-3;i<=length;i++)for(let w=-1;w<=1;w++)pixel(i,w,w===-1?ink:lightWood);
      if(tool==="sword") {
        for(let i=4;i<=length;i++)for(let w=-1;w<=1;w++)pixel(i,w,w===-1?"#7f9080":cream);
        pixel(length+1,0,cream);
        for(let w=-4;w<=4;w++)pixel(3,w,wood);
      } else if(tool==="axe") {
        for(let i=length-4;i<=length;i++)for(let w=-4;w<=3;w++)pixel(i,w,w===-4||i===length?ink:"#b5bba0");
      } else if(tool==="pickaxe") {
        for(let w=-6;w<=6;w++)pixel(length-Math.floor(Math.abs(w)/3),w,"#b5bba0");
      } else if(tool==="hoe") {
        for(let i=length-2;i<=length+1;i++)for(let w=0;w<=5;w++)pixel(i,w,"#7f9080");
      } else if(tool==="sickle") {
        for(let w=-5;w<=4;w++)pixel(length-Math.floor(w*w/10),w,"#b5bba0");
      } else if(tool==="water") {
        for(let i=2;i<=9;i++)for(let w=-4;w<=3;w++)pixel(i,w,w===-4?ink:"#72a7a0");
        for(let i=9;i<=13;i++)pixel(i,1,cream);
        if(f)for(let i=15;i<=19;i+=2)pixel(i,2,"#9bcddd");
      }
      // The palm covers the handle, rather than an extra floating hand beside it.
      r(hx-1,hy-1,3,3,"#dca16b");
    });
  }
  // A compact authored 5x7 font; lower-case labels use the matching capital glyph.
  const glyphs: Record<string,string> = {
    A:"01110/10001/10001/11111/10001/10001/10001",B:"11110/10001/10001/11110/10001/10001/11110",C:"01111/10000/10000/10000/10000/10000/01111",D:"11110/10001/10001/10001/10001/10001/11110",E:"11111/10000/10000/11110/10000/10000/11111",F:"11111/10000/10000/11110/10000/10000/10000",G:"01111/10000/10000/10111/10001/10001/01111",H:"10001/10001/10001/11111/10001/10001/10001",I:"111/010/010/010/010/010/111",J:"00111/00010/00010/00010/10010/10010/01100",K:"10001/10010/10100/11000/10100/10010/10001",L:"10000/10000/10000/10000/10000/10000/11111",M:"10001/11011/10101/10101/10001/10001/10001",N:"10001/11001/10101/10011/10001/10001/10001",O:"01110/10001/10001/10001/10001/10001/01110",P:"11110/10001/10001/11110/10000/10000/10000",Q:"01110/10001/10001/10001/10101/10010/01101",R:"11110/10001/10001/11110/10100/10010/10001",S:"01111/10000/10000/01110/00001/00001/11110",T:"11111/00100/00100/00100/00100/00100/00100",U:"10001/10001/10001/10001/10001/10001/01110",V:"10001/10001/10001/10001/10001/01010/00100",W:"10001/10001/10001/10101/10101/11011/10001",X:"10001/10001/01010/00100/01010/10001/10001",Y:"10001/10001/01010/00100/00100/00100/00100",Z:"11111/00001/00010/00100/01000/10000/11111",
    "0":"01110/10001/10011/10101/11001/10001/01110","1":"00100/01100/00100/00100/00100/00100/01110","2":"01110/10001/00001/00010/00100/01000/11111","3":"11110/00001/00001/01110/00001/00001/11110","4":"00010/00110/01010/10010/11111/00010/00010","5":"11111/10000/10000/11110/00001/00001/11110","6":"01110/10000/10000/11110/10001/10001/01110","7":"11111/00001/00010/00100/01000/01000/01000","8":"01110/10001/10001/01110/10001/10001/01110","9":"01110/10001/10001/01111/00001/00001/01110",
    " ":"0", ".":"0/0/0/0/0/0/00100", "·":"0/0/0/00100", "!":"00100/00100/00100/00100/00100/0/00100", "-":"0/0/0/11111", ":":"0/00100/0/0/00100", "/":"00001/00001/00010/00100/01000/10000/10000", "→":"0/00100/00010/11111/00010/00100", "←":"0/00100/01000/11111/01000/00100",
  };
  const chars=Object.keys(glyphs).join("")+"abcdefghijklmnopqrstuvwxyz";
  asset("pixel-font",chars.length*6,8,r=>{
    [...chars].forEach((char,i)=>glyphs[char.toUpperCase()].split("/").forEach((row,y)=>[...row].forEach((bit,x)=>{if(bit==="1")r(i*6+x,y,1,1,"#ffffff");})));
  });
  scene.cache.bitmapFont.add("pixel-font",Phaser.GameObjects.RetroFont.Parse(scene,{image:"pixel-font",width:6,height:8,chars,charsPerRow:chars.length,"offset.x":0,"offset.y":0,"spacing.x":0,"spacing.y":0,lineSpacing:0}));
}
