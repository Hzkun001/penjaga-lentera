export type Area =
  | "village"
  | "forest"
  | "town" | "market" | "kitchen" | "ranch" | "clinic" | "hall" | "carpenter"
  | "sari"
  | "workshop"
  | "archive"
  | "herbalist"
  | "home"
  | "shop";
export type Crop = "turnip" | "carrot" | "pumpkin";
export const crops = {
  turnip: { name: "Lobak", seed: 4, growth: 150, sell: 12 },
  carrot: { name: "Wortel", seed: 7, growth: 270, sell: 23 },
  pumpkin: { name: "Labu", seed: 12, growth: 480, sell: 42 },
} as const;
export type FarmPlot = { tilled: boolean; crop: Crop | null; watered: boolean; growth: number };
export const boardQuests = [
  { name: "Kayu untuk pagar", kind: "wood", count: 3, reward: 24, person: "Raka" },
  { name: "Jalan hutan aman", kind: "monster", count: 2, reward: 32, person: "" },
  { name: "Panen pertama", kind: "harvest", count: 3, reward: 30, person: "" },
  { name: "Daun untuk ramuan", kind: "herb", count: 2, reward: 20, person: "Nenek Sari" },
] as const;
export type Upgrade = "tools" | "weapon" | "bag" | "stamina";
export type Save = {
  version: 1;
  area: Area;
  x: number;
  y: number;
  health: number;
  crystals: number;
  quest: 0 | 1 | 2;
  collected: number[];
  defeated: number[];
  potions: number;
  opened: number[];
  sharp: boolean;
  cleared: number[];
  materials: [number, number, number, number];
  plots: [number, number, number];
  fish: number[];
  trash: number;
  coins: number;
  day: number;
  minute: number;
  stamina: number;
  farm: FarmPlot[];
  seeds: Record<Crop, number>;
  produce: Record<Crop, number>;
  upgrades: Record<Upgrade, number>;
  monsterDrops: number;
  stats: { wood: number; monster: number; harvest: number; herb: number };
  jobs: { id: number; baseline: number }[];
  completedJobs: number[];
  homestead: { feed: number; eggs: number; meals: number; fed: boolean; petted: boolean; affection: number; nest: number; shipping: number; lastPayment: number };
};
export const fresh = (): Save => ({
  version: 1,
  area: "village",
  x: 430,
  y: 365,
  health: 5,
  crystals: 0,
  quest: 0,
  collected: [],
  defeated: [],
  potions: 0,
  opened: [],
  sharp: false,
  cleared: [],
  materials: [0, 0, 0, 0],
  plots: [0, 0, 0],
  fish: [],
  trash: 0,
  coins: 30,
  day: 1, minute: 360, stamina: 100,
  farm: Array.from({length: 6}, () => ({tilled:false,crop:null,watered:false,growth:0})),
  seeds: {turnip: 6, carrot: 0, pumpkin: 0},
  produce: {turnip: 0, carrot: 0, pumpkin: 0},
  upgrades: {tools: 0, weapon: 0, bag: 0, stamina: 0},
  monsterDrops: 0,
  stats: {wood: 0, monster: 0, harvest: 0, herb: 0},
  jobs: [], completedJobs: [],
  homestead: {feed:3,eggs:0,meals:0,fed:false,petted:false,affection:0,nest:0,shipping:0,lastPayment:0},
});
export const fishPrice = (weightTenths: number) =>
  Math.round((weightTenths / 10) * (5 + weightTenths / 12));
export function parseSave(raw: string | null): Save | null {
  try {
    const s = JSON.parse(raw || "null");
    s.potions ??= 0;
    s.opened ??= [];
    s.sharp ??= false;
    s.cleared ??= [];
    s.materials ??= [0, 0, 0, 0];
    s.plots ??= [0, 0, 0];
    s.fish ??= [];
    s.trash ??= 0;
    s.coins ??= 0;
    const defaults = fresh();
    for (const field of ["day","minute","stamina","seeds","produce","upgrades","monsterDrops","stats","jobs","completedJobs","homestead"] as const)
      if (s[field] === undefined) s[field] = defaults[field];
    if (s.farm === undefined) {
      s.farm = defaults.farm;
      if (Array.isArray(s.plots)) s.plots.forEach((time: number, i: number) => {
        if (i < 3 && Number.isFinite(time) && time > 0) s.farm[i] = {tilled:true,crop:"turnip",watered:false,growth:150};
      });
    }
    if (
      !s ||
      s.version !== 1 ||
      ![
        "village",
        "forest",
        "town", "market", "kitchen", "ranch", "clinic", "hall", "carpenter",
        "sari",
        "workshop",
        "archive",
        "herbalist",
        "home", "shop",
      ].includes(s.area) ||
      !Number.isFinite(s.x) ||
      !Number.isFinite(s.y) ||
      s.x < 32 ||
      s.x > 928 ||
      s.y < 32 ||
      s.y > 608 ||
      !Number.isInteger(s.health) ||
      s.health < 1 ||
      s.health > 5 ||
      ![0, 1, 2].includes(s.quest) ||
      !Array.isArray(s.collected) ||
      !Array.isArray(s.defeated)
    )
      return null;
    if (
      s.collected.some(
        (n: unknown) => !Number.isInteger(n) || Number(n) < 0 || Number(n) > 2,
      ) ||
      new Set(s.collected).size !== s.collected.length ||
      s.crystals !== s.collected.length ||
      s.defeated.some(
        (n: unknown) => !Number.isInteger(n) || Number(n) < 0 || Number(n) > 7,
      ) ||
      new Set(s.defeated).size !== s.defeated.length ||
      !Number.isInteger(s.potions) ||
      s.potions < 0 ||
      s.potions > 9 ||
      !Array.isArray(s.opened) ||
      s.opened.some(
        (n: unknown) => !Number.isInteger(n) || Number(n) < 0 || Number(n) > 3,
      ) ||
      new Set(s.opened).size !== s.opened.length ||
      typeof s.sharp !== "boolean" ||
      !Array.isArray(s.cleared) ||
      s.cleared.some(
        (n: unknown) => !Number.isInteger(n) || Number(n) < 0 || Number(n) > 99,
      ) ||
      new Set(s.cleared).size !== s.cleared.length ||
      !Array.isArray(s.materials) ||
      s.materials.length !== 4 ||
      s.materials.some(
        (n: unknown) => !Number.isInteger(n) || Number(n) < 0 || Number(n) > 9999,
      ) ||
      !Array.isArray(s.plots) ||
      s.plots.length !== 3 ||
      s.plots.some(
        (n: unknown) => !Number.isFinite(n) || Number(n) < 0,
      ) ||
      !Array.isArray(s.fish) ||
      s.fish.length > 100 ||
      s.fish.some(
        (n: unknown) => !Number.isInteger(n) || Number(n) < 2 || Number(n) > 50,
      ) ||
      !Number.isInteger(s.trash) ||
      s.trash < 0 ||
      s.trash > 999 ||
      !Number.isInteger(s.coins) ||
      s.coins < 0 ||
      s.coins > 999999 ||
      (s.quest === 2 && s.crystals !== 3)
    )
      return null;
    const integer = (n: unknown, max: number) => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= max;
    const record = (o: unknown, keys: string[], max: number) => !!o && typeof o === "object" && keys.every(k => integer((o as Record<string,unknown>)[k],max));
    if (!record(s.homestead,["feed","eggs","meals","nest"],9999) ||
      !record(s.homestead,["shipping","lastPayment"],999999) || !integer(s.homestead.affection,10) ||
      typeof s.homestead.fed !== "boolean" || typeof s.homestead.petted !== "boolean") return null;
    if (!integer(s.day,99999) || s.day < 1 || !Number.isFinite(s.minute) || s.minute < 0 || s.minute >= 1440 ||
      !record(s.upgrades,["tools","weapon","bag","stamina"],3) || !Number.isFinite(s.stamina) || s.stamina < 0 || s.stamina > 100+s.upgrades.stamina*20 ||
      !record(s.seeds,Object.keys(crops),9999) || !record(s.produce,Object.keys(crops),9999) ||
      !integer(s.monsterDrops,9999) || !record(s.stats,["wood","monster","harvest","herb"],999999) ||
      !Array.isArray(s.farm) || s.farm.length !== 6 || s.farm.some((p: FarmPlot) => !p || typeof p.tilled !== "boolean" || typeof p.watered !== "boolean" ||
        (p.crop !== null && !Object.hasOwn(crops,p.crop)) || !Number.isFinite(p.growth) || p.growth < 0 || p.growth > 480 || (p.crop && !p.tilled)) ||
      !Array.isArray(s.jobs) || s.jobs.length > 4 || s.jobs.some((j: {id:number;baseline:number})=>!j || !integer(j.id,3) || !integer(j.baseline,999999) || j.baseline > s.stats[boardQuests[j.id].kind]) ||
      new Set(s.jobs.map((j: {id:number})=>j.id)).size !== s.jobs.length ||
      !Array.isArray(s.completedJobs) || s.completedJobs.some((id:number)=>!integer(id,3)) || new Set(s.completedJobs).size!==s.completedJobs.length ||
      s.jobs.some((j:{id:number})=>s.completedJobs.includes(j.id))) return null;
    return s;
  } catch {
    return null;
  }
}

export const maxStamina = (s: Save) => 100 + s.upgrades.stamina * 20;
export const capacity = (s: Save) => 30 + s.upgrades.bag * 20;
export const inventorySize = (s: Save) => s.homestead.feed+s.homestead.eggs+s.homestead.meals+s.materials.reduce((a,b)=>a+b,0) + s.fish.length + s.trash + s.monsterDrops + s.potions + Object.values(s.seeds).reduce((a,b)=>a+b,0) + Object.values(s.produce).reduce((a,b)=>a+b,0);
export const canCarry = (s: Save, count = 1) => inventorySize(s)+count <= capacity(s);
export const cropStage = (p: FarmPlot) => !p.crop ? 0 : Math.min(3,Math.floor(p.growth / crops[p.crop].growth * 3));
export function spendStamina(s: Save, cost: number) {
  if (s.stamina < cost) return false;
  s.stamina -= cost; return true;
}
export function advanceTime(s: Save, minutes: number) {
  if (!Number.isFinite(minutes) || minutes < 0) return;
  while (minutes > 0) {
    const step = Math.min(minutes,1440-s.minute);
    for (const p of s.farm) if (p.crop && p.watered) p.growth = Math.min(crops[p.crop].growth,p.growth+step);
    s.minute += step; minutes -= step;
    if (s.minute >= 1440) {
      s.minute = 0; s.day++;
      const h=s.homestead;
      if(h.fed) h.nest=Math.min(9999,h.nest+(h.affection>=5?2:1));
      h.fed=false; h.petted=false;
      h.lastPayment=Math.min(h.shipping,999999-s.coins);s.coins+=h.lastPayment;h.shipping-=h.lastPayment;
      for (const p of s.farm) p.watered = false;
      s.cleared = []; s.defeated = []; s.opened = [];
      s.completedJobs = [];
    }
  }
}
export function sleep(s: Save) {
  advanceTime(s,1440-s.minute+360);
  s.health = 5; s.stamina = maxStamina(s);
}
export type VillageActivity = "feed" | "pet" | "eggs" | "buyFeed" | "soup" | "omelet" | "eat" | "heal" | "ship";
export function villageActivity(s: Save, action: VillageActivity): string {
  const h=s.homestead;
  if(action==="feed") {
    if(h.fed)return "Ayam sudah makan hari ini";
    if(!h.feed)return "Pakan habis · beli di kandang";
    h.feed--;h.fed=true;return "Ayam kenyang · telur tersedia besok di sarang";
  }
  if(action==="pet") {
    if(h.petted)return "Ayam sudah disapa hari ini";
    h.petted=true;h.affection=Math.min(10,h.affection+1);return "Ayam senang! Keakraban 5 memberi dua telur per hari";
  }
  if(action==="eggs") {
    if(!h.nest)return "Sarang kosong · beri pakan lalu kembali besok";
    if(!canCarry(s))return "Tas penuh";
    h.nest--;h.eggs++;return "Satu telur masuk tas";
  }
  if(action==="buyFeed") {
    if(s.coins<3)return "Butuh 3 koin";
    if(!canCarry(s))return "Tas penuh";
    s.coins-=3;h.feed++;return "Pakan dibeli";
  }
  if(action==="soup" || action==="omelet") {
    const crop=(Object.keys(crops) as Crop[]).find(c=>s.produce[c]>0);
    if(action==="soup"?!crop:h.eggs<1)return action==="soup"?"Butuh satu sayuran hasil panen":"Butuh satu telur";
    if(!spendStamina(s,3))return "Butuh 3 tenaga untuk memasak";
    if(action==="soup")s.produce[crop!]--;else h.eggs--;
    h.meals++;return "Masakan siap · makan untuk memulihkan 45 tenaga";
  }
  if(action==="eat") {
    if(!h.meals)return "Belum ada masakan";
    if(s.stamina===maxStamina(s))return "Tenaga masih penuh";
    h.meals--;s.stamina=Math.min(maxStamina(s),s.stamina+45);return "Masakan dimakan · tenaga pulih";
  }
  if(action==="heal") {
    if(s.health===5 && s.stamina===maxStamina(s))return "Kondisimu sudah sehat";
    if(s.coins<15)return "Perawatan membutuhkan 15 koin";
    s.coins-=15;s.health=5;s.stamina=maxStamina(s);return "Perawatan selesai · nyawa dan tenaga pulih";
  }
  const total=(Object.keys(crops) as Crop[]).reduce((n,c)=>n+s.produce[c]*crops[c].sell,0)+s.fish.reduce((n,w)=>n+fishPrice(w),0)+h.eggs*15;
  if(!total)return "Kotak menerima panen, ikan, dan telur dari tas";
  if(h.shipping+total>999999)return "Kotak penuh · tunggu pembayaran besok";
  h.shipping+=total;h.eggs=0;s.fish=[];for(const c of Object.keys(crops) as Crop[])s.produce[c]=0;
  return `${total} koin akan dibayar saat hari berganti`;
}
export function farmAction(s: Save, index: number, tool: "hoe" | "water", seed: Crop) {
  const p=s.farm[index]; if(!p) return "Ladang tidak ditemukan";
  if (p.crop && cropStage(p)===3) {
    if (!canCarry(s)) return "Tas penuh · jual atau simpan hasil dahulu";
    if (!spendStamina(s,2)) return "Tenaga habis · tidur atau makan bekal";
    s.produce[p.crop]++; s.stats.harvest++; p.crop=null; p.growth=0;
    return "Panen masuk ke tas";
  }
  if (tool === "water") {
    if (!p.tilled) return "Cangkul tanah sebelum menyiram";
    if (p.watered) return "Tanah sudah basah hari ini";
    if (!spendStamina(s,Math.max(1,3-s.upgrades.tools))) return "Tenaga habis · tidur atau makan bekal";
    p.watered=true; return "Tanah disiram · tanaman mulai tumbuh";
  }
  if(p.crop) return p.watered ? "Tanaman sedang tumbuh" : "Tanaman haus · pilih penyiram [6]";
  if (!p.tilled) {
    if(!spendStamina(s,Math.max(1,4-s.upgrades.tools)))return "Tenaga habis · tidur atau makan bekal";
    p.tilled=true; return "Tanah gembur · gunakan lagi untuk menanam";
  }
  if(!s.seeds[seed]) return "Benih habis · beli di toko Lila";
  if(!spendStamina(s,2)) return "Tenaga habis · tidur atau makan bekal";
  s.seeds[seed]--; p.crop=seed; p.growth=0; return `${crops[seed].name} ditanam · siram dengan [6]`;
}
export function buy(s: Save, item: Crop | "potion" | "snack") {
  const price=item==="potion"?18:item==="snack"?10:crops[item].seed;
  if(s.coins < price) return "Koin belum cukup";
  if(item!=="snack" && !canCarry(s)) return "Tas penuh";
  if(item==="potion" && s.potions>=9) return "Ramuan sudah penuh";
  if(item==="snack" && s.stamina===maxStamina(s)) return "Tenagamu sudah penuh";
  s.coins-=price;
  if(item==="snack") s.stamina=Math.min(maxStamina(s),s.stamina+35);
  else if(item==="potion")s.potions++; else s.seeds[item]++;
  return "Pembelian berhasil";
}
export function sellHarvest(s: Save) {
  let total=s.materials[3]*12;
  s.materials[3]=0;
  for(const crop of Object.keys(crops) as Crop[]) {total+=s.produce[crop]*crops[crop].sell; s.produce[crop]=0;}
  s.coins=Math.min(999999,s.coins+total); return total;
}
export function upgrade(s: Save, type: Upgrade) {
  const level=s.upgrades[type]; if(level>=3)return "Peningkatan sudah maksimal";
  const price=40*(level+1), resources=3*(level+1);
  if(s.coins<price || s.materials[0]<resources || s.materials[1]<resources) return "Perlu koin, kayu, dan batu sesuai biaya";
  s.coins-=price; s.materials[0]-=resources; s.materials[1]-=resources; s.upgrades[type]++;
  if(type==="stamina")s.stamina=Math.min(maxStamina(s),s.stamina+20);
  return "Peningkatan berhasil";
}
export function acceptJob(s: Save,id: number) {
  if(!boardQuests[id] || s.jobs.some(j=>j.id===id) || s.completedJobs.includes(id)) return false;
  s.jobs.push({id,baseline:s.stats[boardQuests[id].kind]}); return true;
}
export function jobProgress(s: Save,id: number) {
  const q=boardQuests[id],job=s.jobs.find(j=>j.id===id); if(!q || !job)return 0;
  return Math.min(q.count,q.kind==="wood"?s.materials[0]:q.kind==="herb"?s.materials[2]:s.stats[q.kind]-job.baseline);
}
export function finishJob(s: Save,id: number,person="") {
  const q=boardQuests[id]; if(!q || !s.jobs.some(j=>j.id===id) || jobProgress(s,id)<q.count || q.person!==person) return false;
  if(q.kind==="wood")s.materials[0]-=q.count;
  if(q.kind==="herb")s.materials[2]-=q.count;
  s.jobs=s.jobs.filter(j=>j.id!==id);s.completedJobs.push(id);s.coins=Math.min(999999,s.coins+q.reward);
  return true;
}

export function timePhase(minute: number) {
  return minute < 360 ? "Malam" : minute < 720 ? "Pagi" : minute < 1020 ? "Siang" : minute < 1140 ? "Senja" : "Malam";
}
export function daylight(minute: number) {
  const stops = [[0,0.56],[300,0.56],[360,0.28],[480,0],[1020,0],[1140,0.44],[1200,0.56],[1440,0.56]];
  for (let i=1;i<stops.length;i++) if(minute<=stops[i][0]) {
    const [start,a]=stops[i-1], [end,b]=stops[i];
    return a+(b-a)*(minute-start)/(end-start);
  }
  return 0.56;
}
