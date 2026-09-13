import Phaser from "phaser";
import { villageActivity, type VillageActivity } from "./state";
import { timePhase, daylight, fishPrice, fresh, parseSave, crops, cropStage, farmAction, advanceTime, sleep, buy, sellHarvest, upgrade, boardQuests, acceptJob, jobProgress, finishJob, capacity, inventorySize, canCarry, maxStamina, spendStamina, type Crop, type Upgrade, type Area, type Save } from "./state";
import "./style.css";
import { addVillageHouseFrames, createPixelArt, directionOf, type Direction } from "./pixel-art";
import { audio } from "./audio";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<header><div class="brand"><span>♜</span> LENTERA <span class="tag">A LITTLE ADVENTURE</span></div><div class="header-right"><span class="live">Single-player adventure</span><button class="ghost" id="sound" aria-label="Matikan suara" aria-pressed="true">♫ Suara on</button></div></header>
<main><div class="intro"><div><div class="eyebrow">✦ &nbsp; SEBUAH PETUALANGAN PIXEL</div><h1>Penjaga Lentera<span class="title-star" aria-hidden="true">✧</span></h1><p>Di antara pepohonan dan cerita, ada cahaya yang menantimu.</p></div><div class="chapter"><span>01</span><div>BAB PERTAMA<strong>Cahaya yang hilang</strong></div></div></div>
<div class="layout"><section class="game-shell" aria-label="Area permainan"><div class="game-top"><div class="location"><b>⌖</b><span id="location">Desa Embun</span></div><span id="hearts" aria-label="5 nyawa">♥♥♥♥♥</span></div><div id="game" tabindex="0" aria-label="Game. WASD bergerak, 1 sampai 5 memilih alat, F menggunakan alat, E interaksi, Space serang, Esc jeda."></div><div class="game-bottom"><span id="hint">✦ Sebuah perjalanan menantimu</span><span>☀ Pagi · Hari 01</span></div><div id="toast" role="status"></div><div class="overlay" id="overlay"><div class="overlay-inner"><div class="seal">✧</div><div class="eyebrow">SELAMAT DATANG DI DESA EMBUN</div><h2>Setiap cahaya<br>punya penjaganya.</h2><p>Lentera desa mulai padam. Jelajahi hutan, temukan kristal embun, dan pulangkan cahaya.</p><button class="primary" id="start">Mulai petualangan →</button><br><button class="ghost" id="continue">Lanjutkan perjalanan</button></div></div><div id="dialog" hidden role="dialog" aria-label="Percakapan"><div id="dialog-name"></div><div id="dialog-text"></div><button id="next-dialog">Lanjutkan ↵</button><div style="clear:both"></div></div></section>
<aside class="side"><section class="card"><div class="card-label">JURNAL PETUALANGAN <span>⚑</span></div><h2 id="quest-title">Cahaya yang hilang</h2><p class="quest-desc" id="quest-desc">Temui Nenek Sari di dekat lentera desa. Ia sedang menunggumu.</p><div class="objective"><span class="check" id="check"> </span><span id="objective">Bicara dengan Nenek Sari</span></div><div class="reward">✧ Hadiah &nbsp; · &nbsp; Lencana Penjaga</div></section><section class="card" id="inventory"><div class="card-label">BEKAL PERJALANAN <kbd>I</kbd></div><div class="inventory-head"><h2>Tas kecilmu</h2><span class="tag" id="item-count">6 / 9</span></div><div class="slots"><div class="slot" id="sword-slot" title="Pedang kayu — tekan Space">⚔</div><div class="slot" title="Kristal embun" id="crystal-slot">◇<small id="crystal-count">0</small></div><div class="slot depleted" title="Ramuan daun — tekan H" id="potion-slot">◆<small id="potion-count">0</small></div><div class="slot empty" id="medal-slot"></div><button class="slot tool selected" id="tool-axe" title="1 · Kapak untuk menebang">🪓<small>1</small></button><button class="slot tool" id="tool-pickaxe" title="2 · Beliung untuk batu">⛏<small>2</small></button><button class="slot tool" id="tool-sickle" title="3 · Sabit untuk semak">☾<small>3</small></button><button class="slot tool" id="tool-hoe" title="4 · Cangkul untuk ladang">⌗<small>4</small></button><button class="slot tool" id="tool-rod" title="5 · Pancing untuk kolam">⚓<small>5</small></button></div><p id="inventory-note" style="font-size:10px;margin-top:12px">Kapak dipilih · tekan F dekat sumber daya.</p></section><section class="card"><div class="card-label">PANDUAN KECIL <span>⌘</span></div><div class="controls"><span>Bergerak</span><span><kbd>W A S D</kbd> / <kbd>↑↓←→</kbd></span><span>Pilih alat</span><kbd>1 2 3 4 5</kbd><span>Gunakan alat</span><kbd>F</kbd><span>Interaksi / ambil</span><kbd>E / Enter</kbd><span>Serang</span><kbd>Space</kbd><span>Ramuan</span><kbd>H</kbd><span>Jeda & simpan</span><kbd>Esc</kbd></div></section></aside></div><div class="footnote"><span><strong>✦</strong> &nbsp; Tidak semua yang berharga ada di ujung perjalanan.</span><span id="save-status">Progres tersimpan di perangkat ini</span></div></main><footer><span>LENTERA &nbsp; / &nbsp; Crafted for the curious.</span><span>PIXEL RPG · VOL. 01</span></footer>`;
const el = (id: string) => document.getElementById(id)!;
document.querySelector(".brand > span")!.innerHTML =
  '<svg width="25" height="31" viewBox="0 0 25 31" fill="none" aria-hidden="true"><path d="M9 6V4a3.5 3.5 0 0 1 7 0v2M5 9h15M5 25h15M8 9v16m9-16v16M7 6h11l3 3H4l3-3Zm-2 20h15l2 4H3l2-4Z" stroke="currentColor" stroke-width="1.5"/><path d="m12.5 12 3 7-3 3-3-3 3-7Z" fill="currentColor"/></svg>';
document.querySelector("#inventory .card-label kbd")!.textContent="J / I";
document.querySelector(".controls")!.insertAdjacentHTML("afterbegin",'<span>Jurnal & bekal</span><kbd>J / I</kbd>');
document.querySelectorAll<HTMLElement>(".controls > kbd")[1].textContent="1 2 3 4 5 6";
// Reuse the existing panels and controls; these additions only present progress.
el("quest-title").insertAdjacentHTML(
  "beforebegin",
  '<div class="quest-tag">QUEST UTAMA <span id="quest-stage">BELUM DIMULAI</span></div>',
);
el("objective").parentElement!.insertAdjacentHTML(
  "afterend",
  '<div class="quest-progress" role="progressbar" aria-label="Kristal embun terkumpul" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0"><span></span><span></span><span></span></div>',
);
el("game").insertAdjacentHTML(
  "afterend",
  '<div class="world-caption" aria-hidden="true"><span>WILAYAH 01</span><strong id="world-name">Desa Embun</strong><i id="world-mood">Rumah untuk setiap perjalanan.</i><em id="materials">Kayu 0 · Batu 0 · Serat 0 · Panen 0 · Ikan 0 · Koin 0</em></div>',
);
el("dialog-name").insertAdjacentHTML(
  "beforebegin",
  '<div id="dialog-portrait" aria-hidden="true">✦</div>',
);
document.querySelector(".game-bottom > span:last-child")!.id="clock";
el("hearts").insertAdjacentHTML("beforebegin",'<div class="vitality"><span id="energy"></span><meter id="stamina" min="0" max="100" value="100" aria-label="Stamina"></meter></div>');
document.querySelector(".slots")!.insertAdjacentHTML("beforeend",'<button class="slot tool" id="tool-water" title="6 · Penyiram">♒<small>6</small></button>');
el("inventory-note").insertAdjacentHTML("afterend",'<label>Benih aktif <select id="seed-choice"><option value="turnip">Lobak</option><option value="carrot">Wortel</option><option value="pumpkin">Labu</option></select></label><p id="crop-stock"></p>');
el("game").insertAdjacentHTML("afterend",'<section id="service" hidden role="dialog" aria-modal="true" aria-label="Layanan desa"><h2 id="service-title"></h2><div id="service-actions"></div><button id="service-close">Tutup · Esc</button></section>');
el("crop-stock").insertAdjacentHTML("afterend",'<button id="eat-meal">Makan masakan · +45 tenaga</button>');
el("eat-meal").onclick=()=>{toast(villageActivity(state,"eat"));hud();world.save();};
document.querySelector(".game-top")!.insertAdjacentHTML("beforeend",'<div class="hud-actions"><button id="board-toggle" aria-controls="board-panel" aria-expanded="false">▤ Jurnal <kbd>J</kbd></button><button id="screen-toggle" aria-label="Layar penuh">⛶</button></div>');
document.querySelector(".hud-actions")!.append(el("sound"));
const journal=document.createElement("details");journal.className="board-launcher";
journal.innerHTML='<summary id="board-toggle" aria-controls="board-panel">▤ Jurnal <kbd>J</kbd></summary>';
el("board-toggle").replaceWith(journal);
const board=document.querySelector<HTMLElement>(".side")!;
board.id="board-panel";board.setAttribute("role","dialog");board.setAttribute("aria-modal","true");board.setAttribute("aria-labelledby","board-title");board.tabIndex=-1;board.hidden=true;
board.insertAdjacentHTML("afterbegin",'<div class="board-heading"><h2 id="board-title">Jurnal & perlengkapan</h2><button id="board-close" aria-label="Tutup papan">Tutup ×</button></div>');
document.querySelector(".hud-actions")!.append(journal);
document.querySelector(".game-shell")!.append(board);
board.insertAdjacentHTML("beforeend",'<section class="card audio-settings"><div class="card-label">SUARA DESA <span>♫</span></div><h2>Pengaturan audio</h2><label class="audio-mute"><input id="audio-enabled" type="checkbox"><span>Audio aktif</span></label><div class="audio-levels"><label><span>Utama</span><input data-audio="master" type="range" min="0" max="100" aria-label="Volume utama"></label><label><span>Musik</span><input data-audio="music" type="range" min="0" max="100" aria-label="Volume musik"></label><label><span>Efek</span><input data-audio="sfx" type="range" min="0" max="100" aria-label="Volume efek"></label><label><span>Suasana</span><input data-audio="ambient" type="range" min="0" max="100" aria-label="Volume suasana"></label><label><span>Antarmuka</span><input data-audio="ui" type="range" min="0" max="100" aria-label="Volume antarmuka"></label></div></section>');
board.insertAdjacentHTML("beforeend",'<section class="card"><div class="card-label">KREDIT ASET <span>✦</span></div><p><a href="https://limezu.itch.io/serenevillagerevamped" target="_blank" rel="noopener noreferrer">Serene Village - revamped · LimeZu</a></p><p>Lisensi <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">Creative Commons Attribution 4.0 (CC BY 4.0)</a>. Fasad rumah dipotong dari atlas sumber dan dirender pada skala 2×.</p></section>');
function syncAudioControls(){
  (el("audio-enabled") as HTMLInputElement).checked=audio.settings.enabled;
  el("sound").textContent=audio.settings.enabled?"♫ Suara on":"♫ Suara off";
  el("sound").setAttribute("aria-label",audio.settings.enabled?"Matikan suara":"Aktifkan suara");
  el("sound").setAttribute("aria-pressed",String(audio.settings.enabled));
  document.querySelectorAll<HTMLInputElement>("[data-audio]").forEach(input=>{
    const bus=input.dataset.audio as "master"|"music"|"sfx"|"ambient"|"ui";
    input.value=String(Math.round(audio.settings[bus]*100));
  });
}
syncAudioControls();
el("sound").addEventListener("click",()=>{audio.setEnabled(!audio.settings.enabled);syncAudioControls();if(audio.settings.enabled)audio.play("ui.confirm");});
el("audio-enabled").addEventListener("change",()=>{audio.setEnabled((el("audio-enabled") as HTMLInputElement).checked);syncAudioControls();if(audio.settings.enabled)audio.play("ui.confirm");});
document.querySelectorAll<HTMLInputElement>("[data-audio]").forEach(input=>input.addEventListener("input",()=>audio.setVolume(input.dataset.audio as "master"|"music"|"sfx"|"ambient"|"ui",Number(input.value)/100)));
document.addEventListener("click",event=>{
  const control=(event.target instanceof Element?event.target:null)?.closest("button,summary,[role=button]");
  if(control?.matches("#next-dialog,#start,#continue,#explore,#sound"))return;
  if(control)audio.play("ui.click");
},true);
function toggleBoard(show=!journal.open){
  journal.open=show;
  board.hidden=!show;
  if(show)board.querySelector<HTMLElement>("#board-close")!.focus();else journal.querySelector<HTMLElement>("summary")!.focus();
}
toggleBoard(false);
journal.addEventListener("toggle",()=>{
  el("board-toggle").setAttribute("aria-expanded",String(journal.open));
  board.hidden=!journal.open;
  if(journal.open&&document.activeElement===journal.querySelector("summary"))board.querySelector<HTMLElement>("#board-close")!.focus();
});
el("board-close").addEventListener("click",()=>toggleBoard(false));
board.addEventListener("keydown",event=>{
  if(event.key==="Escape"){event.preventDefault();event.stopPropagation();toggleBoard(false);return;}
  if(event.key==="Tab"){
    const controls=Array.from(board.querySelectorAll<HTMLElement>('button,select,input,[tabindex="0"]')).filter(node=>!node.hasAttribute("disabled"));
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
});
el("screen-toggle").onclick=()=>{if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});else void document.documentElement.requestFullscreen?.().catch(()=>{});};
el("seed-choice").onchange=()=>{selectedSeed=(el("seed-choice") as HTMLSelectElement).value as Crop;};
el("service-close").onclick=()=>{el("service").hidden=true;el("game").focus();};
type Service = "shop" | "board" | "upgrade" | "ranch" | "kitchen" | "clinic" | "shipping";
function service(kind: Service) {
  el("service").hidden=false;
  el("service-title").textContent={shop:"Pasar & benih",board:"Papan permintaan desa",upgrade:"Bengkel & pertukangan",ranch:"Kandang ayam",kitchen:"Dapur bersama",clinic:"Klinik Embun",shipping:"Kotak pengiriman"}[kind];
  const actions=el("service-actions"); actions.replaceChildren();
  const button=(label:string,action:()=>unknown)=>{const b=document.createElement("button");b.textContent=label;b.onclick=()=>{const result=action();if(typeof result==="string")toast(result);hud();world.save();service(kind);};actions.append(b);};
  const h=state.homestead;
  const activity=(label:string,action:VillageActivity)=>button(label,()=>villageActivity(state,action));
  if(kind==="ranch") {
    const info=document.createElement("p");info.textContent=`Pakan ${h.feed} · telur di sarang ${h.nest} · keakraban ${h.affection}/10. Beri pakan setiap hari agar bertelur besok.`;actions.append(info);
    activity(h.fed?"Sudah diberi pakan hari ini":"Beri pakan ayam · 1 pakan","feed");
    activity(h.petted?"Sudah disapa hari ini":"Elus ayam · tambah keakraban","pet");
    activity(`Ambil telur dari sarang (${h.nest})`,"eggs");activity("Beli 1 pakan · 3 koin","buyFeed");
  }else if(kind==="kitchen") {
    activity("Masak sup · 1 sayuran + 3 tenaga","soup");activity("Masak telur dadar · 1 telur + 3 tenaga","omelet");
    activity(`Makan masakan (${h.meals}) · +45 tenaga`,"eat");
  }else if(kind==="clinic")activity("Perawatan · pulihkan nyawa & tenaga · 15 koin","heal");
  else if(kind==="shipping") {
    const info=document.createElement("p");info.textContent=`Menunggu pembayaran: ${h.shipping} koin. Pembayaran terakhir: ${h.lastPayment} koin. Hasil dikirim langsung dari tas dan dibayar saat hari berganti.`;actions.append(info);
    activity("Kirim semua panen, ikan & telur · telur 15 koin","ship");
  }else if(kind==="shop"){
    for(const c of Object.keys(crops) as Crop[])button(`${crops[c].name} · benih ${crops[c].seed}k · tumbuh ${crops[c].growth} menit · jual ${crops[c].sell}k`,()=>buy(state,c));
    button("Ramuan +2 nyawa · 18 koin",()=>buy(state,"potion"));
    button("Makan bekal +35 tenaga · 10 koin",()=>buy(state,"snack"));
    button("Jual semua panen",()=>`${sellHarvest(state)} koin diterima`);
    button("Jual ikan & hasil monster; daur ulang sampah",()=>{const total=state.fish.reduce((a,w)=>a+fishPrice(w),0)+state.monsterDrops*8+state.trash;state.coins=Math.min(999999,state.coins+total);state.fish=[];state.monsterDrops=0;state.trash=0;return `${total} koin diterima`;});
  }else if(kind==="upgrade"){
    for(const type of ["tools","weapon","bag","stamina"] as Upgrade[]){const level=state.upgrades[type];button(`${{tools:"Alat hemat tenaga",weapon:"Pedang +1 damage",bag:"Tas +20 ruang",stamina:"Tenaga +20"}[type]} Lv.${level} · ${40*(level+1)}k + ${3*(level+1)} kayu & batu`,()=>upgrade(state,type));}
  }else boardQuests.forEach((q,id)=>{
    const active=state.jobs.some(j=>j.id===id), done=state.completedJobs.includes(id);
    button(`${q.name} · ${q.reward}k · ${done?"Selesai hari ini":active?jobProgress(state,id)+"/"+q.count+(q.person?" → "+q.person:" · klaim"):"Terima"}`,()=>{
      if(done)return "Kembali besok untuk permintaan baru";
      if(!active){acceptJob(state,id);return "Permintaan diterima";}
      return finishJob(state,id)?"Hadiah diterima":q.person?"Antarkan langsung kepada "+q.person:"Tujuan belum selesai";
    });
  });
  (actions.querySelector("button") as HTMLButtonElement)?.focus();
}
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const areas: Record<Area, [string, string]> = {
  town:["Pusat Kampung Embun","Pasar, warga, dan kehidupan sehari-hari."],
  market:["Pasar Tani","Benih dan hasil ladang."], kitchen:["Dapur Bersama","Masak hasil kerja kerasmu."],
  ranch:["Peternakan Ayam","Rawat hari ini, ambil telur besok."], clinic:["Klinik Embun","Tempat memulihkan kondisi."],
  hall:["Balai Warga","Bantu tetangga melalui permintaan harian."], carpenter:["Rumah Tukang Kayu","Peralatan untuk kebun yang lebih baik."],
  home: ["Rumahmu", "Ladang kecil dan tempat pulang."],
  shop: ["Toko Lila", "Benih baru untuk cerita esok."],
  village: ["Desa Embun", "Rumah untuk setiap perjalanan."],
  forest: ["Hutan Bisik", "Ikuti cahaya di antara dedaunan."],
  sari: ["Rumah Nenek Sari", "Aroma teh dan kayu tua."],
  workshop: ["Bengkel Bima", "Besi, bara, dan bunyi palu."],
  archive: ["Rumah Arsip", "Cerita desa tersimpan di sini."],
  herbalist: ["Pondok Peramu", "Daun obat mengering di langit-langit."],
};
const houses = [
  { area: "home", name: "Rumahmu", door: [326, 311] },
  { area: "shop", name: "Toko Lila", door: [504, 453] },
  { area: "sari", name: "Rumah Nenek Sari", door: [219, 249] },
  { area: "workshop", name: "Bengkel Bima", door: [569, 212] },
  { area: "archive", name: "Rumah Arsip", door: [775, 257] },
  { area: "herbalist", name: "Pondok Peramu", door: [181, 567] },
] as const;
const townBuildings = [
  {area:"market",name:"PASAR TANI",x:190,y:240,service:"shop",furniture:"stall"},
  {area:"kitchen",name:"DAPUR BERSAMA",x:480,y:240,service:"kitchen",furniture:"stove"},
  {area:"clinic",name:"KLINIK EMBUN",x:770,y:240,service:"clinic",furniture:"bed"},
  {area:"ranch",name:"PETERNAKAN AYAM",x:190,y:550,service:"ranch",furniture:"chicken"},
  {area:"hall",name:"BALAI WARGA",x:480,y:550,service:"board",furniture:"books"},
  {area:"carpenter",name:"TUKANG KAYU",x:770,y:550,service:"upgrade",furniture:"anvil"},
] as const;
type Tool = "axe" | "pickaxe" | "sickle" | "hoe" | "rod" | "water";
const toolInfo: Record<Tool, string> = {
  axe: "Kapak",
  pickaxe: "Beliung",
  sickle: "Sabit",
  hoe: "Cangkul",
  rod: "Pancing",
  water: "Penyiram",
};
const workInfo = {
  treeNode: ["axe", "Tebang", 0],
  rockNode: ["pickaxe", "Pecahkan", 1],
  bushNode: ["sickle", "Bersihkan", 2],
  plot: ["hoe", "Bercocok tanam", 3],
  fishing: ["rod", "Memancing", 0],
} as const;
const key = "lentera-save-v1";
let saved: Save | null = null;
try {
  saved = parseSave(localStorage.getItem(key));
} catch {
  /* Storage can be disabled. */
}
let state = fresh();
let playing = false;
function startMusic() { audio.crossfadeMusic("village", "/audio/music/village.mp3"); }
window.addEventListener("pointerdown", startMusic);
window.addEventListener("keydown", startMusic);
let paused = false;
let pausedByBlur = false;
let inventory = false;
let selectedTool: Tool = "axe";
let selectedSeed: Crop = "turnip";
let toastTimer: ReturnType<typeof setTimeout>;
function toast(text: string) {
  el("toast").textContent = text;
  el("toast").style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el("toast").style.opacity = "0"), 2500);
}
function hud() {
  el("clock").textContent = ` ${timePhase(state.minute)==="Malam"?"☾":"☀"} ${timePhase(state.minute)} · Hari ${state.day} · ${String(Math.floor(state.minute/60)).padStart(2,"0")}:${String(Math.floor(state.minute%60)).padStart(2,"0")}`;
  el("energy").textContent = `Tenaga ${Math.floor(state.stamina)}/${maxStamina(state)} · Koin ${state.coins}`;
  (el("stamina") as HTMLMeterElement).max=maxStamina(state);
  (el("stamina") as HTMLMeterElement).value=state.stamina;
  el("crop-stock").textContent=(Object.keys(crops) as Crop[]).map(c=>`${crops[c].name}: ${state.seeds[c]} benih / ${state.produce[c]} panen`).join(" · ")+` · Pakan ${state.homestead.feed} · Telur ${state.homestead.eggs} · Masakan ${state.homestead.meals} · Kiriman ${state.homestead.shipping}k`;

  el("world-name").textContent = areas[state.area][0];
  el("world-mood").textContent = areas[state.area][1];
  el("quest-stage").textContent =
    state.quest === 2
      ? "SELESAI"
      : state.quest === 1
        ? "DALAM PERJALANAN"
        : "BELUM DIMULAI";
  const progress = document.querySelector(".quest-progress")!;
  progress.setAttribute("aria-valuenow", String(state.crystals));
  Array.from(progress.children).forEach((segment, index) =>
    segment.classList.toggle("filled", index < state.crystals),
  );
  el("location").textContent = areas[state.area][0];
  el("hearts").textContent =
    "♥".repeat(state.health) + "♡".repeat(5 - state.health);
  el("hearts").setAttribute("aria-label", `${state.health} dari 5 nyawa`);
  el("crystal-count").textContent = String(state.crystals);
  el("potion-count").textContent = String(state.potions);
  el("potion-slot").classList.toggle("depleted", state.potions === 0);
  el("materials").textContent =
    `Kayu ${state.materials[0]} · Batu ${state.materials[1]} · Serat ${state.materials[2]} · Panen ${state.materials[3]} · Ikan ${state.fish.length} · Koin ${state.coins}`;
  el("sword-slot").classList.toggle("upgraded", state.sharp);
  el("sword-slot").setAttribute(
    "title",
    state.sharp ? "Pedang tajam — mengalahkan slime sekali serang" : "Pedang kayu — tekan Space",
  );
  el("item-count").textContent =
    `${inventorySize(state)} / ${capacity(state)}`;
  el("objective").textContent =
    state.quest === 0
      ? "Bicara dengan Nenek Sari"
      : state.quest === 2
        ? "Lentera desa kembali menyala"
        : state.crystals === 3
          ? "Kembali kepada Nenek Sari"
          : `Temukan kristal embun (${state.crystals}/3)`;
  el("quest-desc").textContent =
    state.quest === 0
      ? "Temui Nenek Sari di dekat lentera desa. Ia sedang menunggumu."
      : state.quest === 2
        ? "Cahaya telah pulang. Desa Embun akan mengingat langkah kecilmu."
        : "Tiga kristal tersembunyi di Hutan Bisik, sebelah timur desa. Waspadai para slime.";
  el("check").textContent = state.quest === 2 ? "✓" : "";
  if (state.quest === 2) {
    const slots = document.querySelectorAll(".slot");
    slots[3].classList.remove("empty");
    slots[3].textContent = "✧";
    slots[3].setAttribute("title", "Lencana Penjaga");
  }
}
function selectTool(tool: Tool) {
  selectedTool = tool;
  (Object.keys(toolInfo) as Tool[]).forEach((name) =>
    el(`tool-${name}`).classList.toggle("selected", name === tool),
  );
  el("inventory-note").textContent =
    `${toolInfo[tool]} dipilih · tekan F ${tool === "rod" ? "di tepi kolam" : "dekat sumber daya"}.`;
}
(Object.keys(toolInfo) as Tool[]).forEach(
  (tool) => (el(`tool-${tool}`).onclick = () => selectTool(tool)),
);
let lines: string[] = [];
let afterDialog: (() => void) | undefined;
function dialog(
  name: string,
  text: string[],
  after?: () => void,
  portrait = "npc-sari",
) {
  portrait =
    portrait === "npc"
      ? world.npcs.find((npc) => npc.name === name)?.texture ?? portrait
      : portrait;
  el("dialog-portrait").style.backgroundImage =
    `url(${world.textures.getBase64(portrait, portrait.startsWith("npc-") ? "down-0" : undefined)})`;
  el("dialog-portrait").textContent = "";
  lines = [...text];
  afterDialog = after;
  el("dialog-name").textContent = name;
  el("dialog").hidden = false;
  nextLine();
}
function nextLine() {
  if (lines.length) {
    el("dialog-text").textContent = lines.shift()!;
    audio.play("dialogue.advance");
  } else {
    el("dialog").hidden = true;
    const done = afterDialog;
    afterDialog = undefined;
    done?.();
    el("game").focus();
  }
}
el("next-dialog").onclick = nextLine;

class World extends Phaser.Scene {
  pending = new Set<number>();
  lastFootstep = 0;
  transitioning = false;
  dayReveal = false;
  walkDirection: "down" | "up" | "left" | "right" = "down";
  pressed(key: Phaser.Input.Keyboard.Key) {
    const down = this.pending.has(key.keyCode);
    this.pending.delete(key.keyCode);
    return down;
  }
  player!: Phaser.Physics.Arcade.Sprite;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  npcs: {
    name: string;
    x: number;
    y: number;
    texture: string;
    image?: Phaser.GameObjects.Image;
    home?: number;
    morning?: [number,number];
    wander?: { x: number; y: number; until: number };
    greetings?: string[];
    talks: number;
  }[] = [];
  crystals: Phaser.GameObjects.Image[] = [];
  enemies: Phaser.Physics.Arcade.Sprite[] = [];
  objects: {
    kind:
      | "sign"
      | "service"
      | "chest"
      | "campfire"
      | "door"
      | "bed"
      | "books"
      | "anvil"
      | "stove"
      | "treeNode"
      | "rockNode"
      | "bushNode"
      | "plot"
      | "fishing";
    id: number;
    x: number;
    y: number;
    image: Phaser.GameObjects.Image;
    body?: Phaser.GameObjects.GameObject;
    service?: Service;
  }[] = [];
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  facing = new Phaser.Math.Vector2(0, 1);
  lastHit = 0;
  lastAttack = 0;
  lockTransition = 0;
  fishing = false;
  working = false;
  actionUntil = 0;
  heldTool!: Phaser.GameObjects.Image;
  lighting!: Phaser.GameObjects.Rectangle;
  prompt!: Phaser.GameObjects.BitmapText;
  promptBackground!: Phaser.GameObjects.Rectangle;
  constructor() {
    super("world");
  }
  init() {
    this.events.once("create", () => {
      this.pending.clear();
      for (const key of [...Object.values(this.keys), this.cursors.space]) {
        const onDown = () => this.pending.add(key.keyCode);
        key.on("down", onDown);
        this.events.once("shutdown", () => key.off("down", onDown));
      }
    });
  }
  preload() {
    this.load.image("serene-village", "/assets/serene-village-16x16.png");
  }
  create() {
    this.transitioning = false;
    this.walkDirection = "down";
    this.facing.set(0, 1);
    this.fishing = false;
    this.working = false;
    this.actionUntil = 0;
    this.npcs = [];
    this.crystals = [];
    this.enemies = [];
    this.objects = [];
    createPixelArt(this);
    addVillageHouseFrames(this);
    el("game").setAttribute("aria-label","Game. WASD bergerak, 1 sampai 6 memilih alat, F gunakan alat, E interaksi, Space serang, Esc jeda.");
    for(const tool of Object.keys(toolInfo)){
      const slot=el(`tool-${tool}`);slot.setAttribute("aria-label",toolInfo[tool as Tool]);
      for(const node of Array.from(slot.childNodes))if(node.nodeType===Node.TEXT_NODE)node.remove();
      slot.style.backgroundImage=`url(${this.textures.getBase64(tool+"-down-1")})`;
    }
    this.solids = this.physics.add.staticGroup();
    this.drawMap();
    this.player = this.physics.add.sprite(state.x, state.y, "hero", "down-0");
    this.player.setSize(12, 10).setOffset(6, 21).setCollideWorldBounds(true);
    this.player.on(Phaser.Animations.Events.ANIMATION_UPDATE,(_animation: Phaser.Animations.Animation,frame: Phaser.Animations.AnimationFrame)=>{
      const frameName=String(frame.frame.name);
      if(playing&&!paused&&!journal.open&&el("dialog").hidden&&el("service").hidden&&this.player.body?.velocity.length()&&(frameName.endsWith("-0")||frameName.endsWith("-2")))audio.playLocal("player.footstep",this.player,this.player);
    });
    this.heldTool = this.add.image(this.player.x, this.player.y, selectedTool + "-down-0");
    this.physics.world.setBounds(20, 20, 920, 600);
    this.physics.add.collider(this.player, this.solids);
    this.cameras.main.setBounds(0, 0, 960, 640);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(Math.max(1,game.scale.width/960,game.scale.height/640));
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,E,F,I,J,H,SHIFT,ESC,ENTER,ONE,TWO,THREE,FOUR,FIVE,SIX",
    ) as typeof this.keys;
    this.input.keyboard!.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT"]);
    this.promptBackground = this.add.rectangle(0, 0, 1, 15, 0x243b36).setDepth(1999).setVisible(false);
    this.prompt = this.add.bitmapText(0, 0, "pixel-font", "", 6)
      .setOrigin(0.5, 1).setTint(0xead4a0).setDepth(2000).setVisible(false);
    this.lighting=this.add.rectangle(0,0,960,640,0x111e38).setOrigin(0).setScrollFactor(0).setDepth(1500).setAlpha(0);
    this.refreshLighting();
    if (this.dayReveal) {
      this.dayReveal = false;
      this.transitioning = true;
      this.cameras.main.fadeIn(reducedMotion ? 1 : 800, 12, 19, 32);
      this.cameras.main.once("camerafadeincomplete", () => { this.transitioning = false; this.pending.clear(); });
      audio.crow();
      toast(`Hari ${state.day} · ${timePhase(state.minute)} — ${state.homestead.lastPayment ? `Kiriman dibayar ${state.homestead.lastPayment} koin` : state.minute < 360 ? "Hari baru dimulai" : "Selamat pagi, Penjaga"}`);
    }
    this.lockTransition = this.time.now + 700;
    hud();
  }
  refreshLighting() {
    this.lighting.setAlpha(daylight(state.minute)*(["village","forest","town"].includes(state.area)?1:0.35));
    this.lighting.setFillStyle(timePhase(state.minute)==="Senja" ? 0x713d39 : 0x111e38);
  }
  positionHeldTool(direction: Direction) {
    const frame = Number(String(this.player.frame.name).split("-").pop()) || 0;
    const step = [0, 1, 0, -1][frame], bob = frame % 2;
    // Match the palm pixels in the hero's 24×32 animation frame.
    const x = direction === "left" ? -2-step : direction === "right" ? 1+step : 8;
    const y = direction === "left" || direction === "right" ? 6+bob : 5+bob-step;
    const gripX = direction === "left" ? 17 : direction === "right" ? 31 : 24;
    const gripY = direction === "up" ? 19 : direction === "down" ? 29 : 24;
    return this.heldTool.setOrigin(gripX/48, gripY/48)
      .setPosition(Math.round(this.player.x+x),Math.round(this.player.y+y))
      .setDepth(this.player.y+(direction === "up" ? 13 : 15));
  }
  changeDay(rest = false) {
    if(this.transitioning) return;
    this.transitioning = true;
    this.pending.clear();
    this.player.setVelocity(0).stop();
    this.enemies.forEach(e=>e.setVelocity(0));
    if(rest) audio.play("world.sleep");
    this.cameras.main.fadeOut(reducedMotion ? 1 : 650,12,19,32);
    this.cameras.main.once("camerafadeoutcomplete",()=>{
      if(rest) sleep(state); else advanceTime(state,1440-state.minute);
      this.save();
      this.dayReveal = true;
      this.scene.restart();
    });
  }
  drawMap() {
    if(state.area==="town"){this.drawTown();return;}
    if (state.area !== "village" && state.area !== "forest") {
      this.drawInterior();
      return;
    }
    const forest = state.area === "forest";
    const g = this.add.graphics().setDepth(-100);
    const rand = new Phaser.Math.RandomDataGenerator(["lentera-" + state.area]);
    const data = Array.from({ length: 40 }, () =>
      Array.from({ length: 60 }, () => forest ? rand.between(4, 5) : rand.between(0, 3)));
    const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage("terrain", "terrain", 16, 16)!;
    const ground = map.createLayer(0, tiles, 0, 0)!.setDepth(-110);
    const path = (x: number, y: number, w: number, h: number) => {
      for (let ty = Math.floor(y / 16); ty < Math.ceil((y + h) / 16); ty++)
        for (let tx = Math.floor(x / 16); tx < Math.ceil((x + w) / 16); tx++)
          ground.putTileAt(6 + (tx + ty) % 2, tx, ty);
    };
    path(0, 355, 960, 62);
    path(366, 170, 65, 425);
    if (forest) {
      path(365, 175, 390, 45);
      path(720, 180, 46, 300);
    } else {
      path(220, 230, 540, 48);
      path(682, 230, 48, 160);
    }
    const block = (x: number, y: number, w: number, h: number) => {
      const body = this.add.rectangle(x, y, w, h, 0x000000, 0);
      this.physics.add.existing(body, true);
      this.solids.add(body);
      return body;
    };
    const tree = (x: number, y: number, id = -1) => {
      if (id >= 0 && state.cleared.includes(id)) return;
      const image = this.add.image(x, y, "tree").setOrigin(0.5, 1).setDepth(y);
      image.setFlipX(rand.frac() > 0.5);
      if (forest) image.setTint(0xa8c6b0);
      const body = block(x, y - 10, 20, 18);
      if (id >= 0)
        this.objects.push({ kind: "treeNode", id, x, y, image, body });
    };
    const decor = (key: string, x: number, y: number, solid = true) => {
      const image = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
      if (solid) block(x, y - 5, key === "bush" ? 24 : 20, 12);
      return image;
    };
    const object = (
      kind: "sign" | "chest" | "campfire" | "door",
      x: number,
      y: number,
      id: number,
    ) => {
      const key =
        kind === "chest" && state.opened.includes(id) ? "chestOpen" : kind;
      const image = decor(key, x, y, kind !== "door");
      this.objects.push({ kind, id, x, y, image });
      if (kind === "campfire") this.animatePixels(image, "campfire", 4, 140);
    };
    const resource = (
      kind: "rockNode" | "bushNode",
      key: "rock" | "bush",
      x: number,
      y: number,
      id: number,
    ) => {
      if (state.cleared.includes(id)) return;
      const image = decor(key, x, y, false);
      const body = block(x, y - 5, key === "bush" ? 24 : 28, 14);
      this.objects.push({ kind, id, x, y, image, body });
    };
    const plot = (x: number, y: number, id: number) => {
      const p=state.farm[id];
      const image = decor(p.tilled ? `farm-${p.crop||"empty"}-${cropStage(p)}-${p.watered}` : "plot0",x,y,false);
      this.objects.push({kind:"plot",id,x,y,image});
    };
    for (let x = 15; x < 960; x += 45) {
      tree(x, 85 + rand.between(-10, 15));
      tree(x, 645 + rand.between(-5, 15));
    }
    for (let y = 125; y < 640; y += 55) {
      if (y < 340 || y > 455) {
        tree(25, y);
        tree(940, y);
      }
    }
    if (!forest) {
      const house = (x: number, y: number, w: number, style: number) => {
        this.add.image(x + w / 2, y + 91, "serene-village", "house-" + style)
          .setOrigin(0.5, 1).setScale(2).setDepth(y + 95);
        block(x + w / 2, y + 65, w, 52);
      };
      this.add.image(326,311,"serene-village","house-10").setOrigin(.5,1).setScale(2).setDepth(307);
      block(326,277,62,48);
      this.add.image(464,389,"stall").setOrigin(0).setDepth(449);
      block(504,431,74,22);
      house(155, 142, 128, 0);
      house(505, 105, 128, 1);
      house(713, 150, 125, 2);
      house(120, 460, 123, 3);
      // Stepped shoreline and a separate animated tile layer.
      g.fillStyle(0xbda471).fillRect(544, 464, 240, 112).fillRect(560, 448, 208, 144);
      const waterData = Array.from({ length: 7 }, () => Array(14).fill(8));
      const waterMap = this.make.tilemap({ data: waterData, tileWidth: 16, tileHeight: 16 });
      const water = waterMap.createLayer(0, waterMap.addTilesetImage("terrain", "terrain", 16, 16)!, 560, 464)!.setDepth(-95);
      if (!reducedMotion) this.time.addEvent({delay: 240, loop: true, callback: () => {
        const frame = Math.floor(this.time.now / 240) % 4;
        water.forEachTile(tile => { tile.index = 8 + (frame + tile.x + tile.y) % 4; });
      }});
      block(670, 515, 220, 100);
      const lilies = this.add.graphics().setDepth(-94);
      for (const [x,y] of [[583,500],[728,536],[690,484]]) {
        lilies.fillStyle(0x537d47).fillRect(x - 7, y - 2, 14, 5).fillRect(x - 4, y - 4, 8, 8);
        lilies.fillStyle(0xead4a0).fillRect(x, y - 5, 3, 3);
      }
      const fence = (x: number, y: number, w: number) => {
        g.fillStyle(0x66583a)
          .fillRect(x, y + 4, w, 3)
          .fillRect(x, y + 13, w, 3);
        for (let xx = x; xx <= x + w; xx += 16) {
          g.fillStyle(0xb7a071).fillRect(xx, y, 5, 23);
          g.fillStyle(0xdac18b).fillRect(xx, y, 5, 3);
        }
      };
      fence(149, 267, 129);
      fence(508, 233, 120);
      fence(785, 440, 79);
      for (const [x, y] of [
        [85, 260],
        [102, 350],
        [305, 158],
        [880, 260],
        [838, 493],
        [307, 552],
        [492, 576],
        [828, 578],
      ])
        tree(x, y);
      g.fillStyle(0x7f9080).fillRect(363, 296, 72, 32).fillRect(355, 304, 88, 16);
      g.fillStyle(0xb5bba0).fillRect(371, 294, 56, 24).fillRect(363, 302, 72, 8);
      g.fillStyle(0x685a3c).fillRect(394, 258, 10, 48);
      g.fillStyle(state.quest === 2 ? 0xf5d585 : 0x999677).fillRect(
        387,
        244,
        25,
        22,
      );
      g.fillStyle(0x414e36).fillRect(384, 239, 31, 6).fillRect(386, 265, 27, 5);
      g.fillStyle(0xd2ad61).fillRect(390, 247, 3, 15).fillRect(406, 247, 3, 15);
      if (state.quest === 2) {
        for (let y = 225; y < 283; y += 4)
          for (let x = 371; x < 427; x += 4)
            if ((x + y) % 8 === 0 && Math.abs(x - 399) + Math.abs(y - 255) < 30)
              g.fillStyle(0xe7b86a).fillRect(x, y, 1, 1);
      }
      block(399, 301, 20, 20);
      this.npcs = [
        { name: "Nenek Sari", x: 449, y: 323, texture: "npc-sari", talks: 0 },
        { name: "Bima", x: 700, y: 309, texture: "npc-bima", talks: 0 },
        { name: "Lila", x: 320, y: 462, texture: "npc-lila", talks: 0 },
        {
          name: "Raka",
          x: 330,
          y: 415,
          texture: "npc-raka",
          talks: 0,
          greetings: [
            "Aku Raka. Ladang kecil di dekat sini tumbuh cepat setelah dicangkul.",
            "Pagi cocok untuk menanam. Tekan 4, dekati petak tanah, lalu gunakan F.",
            "Kalau hasil panenmu sudah matang, cangkul yang sama bisa dipakai untuk memanennya.",
          ],
        },
        {
          name: "Mira",
          x: 805,
          y: 405,
          texture: "npc-mira",
          talks: 0,
          greetings: [
            "Namaku Mira. Aku mencatat perubahan kecil yang sering dilewatkan orang.",
            "Setiap rumah menyimpan cerita berbeda. Masuklah dan periksa benda-benda di dalamnya.",
            "Konon kristal embun muncul saat hutan merasa aman, bukan saat ia ditaklukkan.",
          ],
        },
      ];
      this.npcs.forEach((n,index) => {
        n.morning=[n.x,n.y];n.home=[2,3,1,5,4][index];
        if(state.minute>=1200||state.minute<360){n.x=houses[n.home].door[0];n.y=houses[n.home].door[1];}
        n.image=this.add.image(n.x,n.y,n.texture,"down-0").setOrigin(0.5,1).setDepth(n.y);
      });
      this.label(610,339,"PAPAN QUEST");
      object("sign",610,325,-5);
      this.objects[this.objects.length-1].image.setTexture("board");
      this.label(859, 347, "HUTAN BISIK →");
      this.label(401, 205, "DESA EMBUN");
      object("sign", 830, 340, -1);
      object("chest", 353, 475, 0);
      object("campfire", 310, 520, -2);
      houses.forEach((house, id) => {
        object("door", house.door[0], house.door[1], id);
        this.label(house.door[0], house.door[1] + 12, house.name);
      });
      const fishingSpot = decor("fishing", 555, 520, false);
      this.objects.push({
        kind: "fishing",
        id: -1,
        x: 555,
        y: 520,
        image: fishingSpot,
      });
      this.animatePixels(fishingSpot, "fishing", 4, 240);
      [[202, 350], [246, 350], [290, 350], [202, 390], [246, 390], [290, 390]].forEach(([x, y], id) =>
        plot(x, y, id),
      );
      resource("rockNode", "rock", 90, 505, 10);
      resource("rockNode", "rock", 865, 540, 11);
      resource("bushNode", "bush", 335, 200, 20);
      resource("bushNode", "bush", 665, 205, 21);
      resource("bushNode", "bush", 500, 545, 22);
    } else {
      [
        [120, 180],
        [180, 240],
        [285, 150],
        [495, 170],
        [600, 290],
        [850, 185],
        [865, 340],
        [160, 535],
        [260, 560],
        [480, 520],
        [600, 555],
        [820, 566],
        [535, 440],
        [315, 310],
      ].forEach(([x, y], index) => tree(x, y, index < 3 ? index : -1));
      this.label(112, 345, "← DESA EMBUN");
      this.label(671, 127, "HUTAN BISIK");
      object("sign", 145, 342, -3);
      object("chest", 650, 305, 1);
      object("chest", 854, 235, 3);
      this.label(770,195,"RIMBA DALAM · BAHAYA");
      object("campfire", 590, 392, -4);
      resource("rockNode", "rock", 220, 300, 12);
      resource("rockNode", "rock", 688, 530, 13);
      resource("rockNode", "rock", 815, 275, 14);
      resource("bushNode", "bush", 375, 285, 23);
      resource("bushNode", "bush", 650, 465, 24);
      resource("bushNode", "bush", 275, 480, 25);
      resource("bushNode", "bush", 865, 500, 26);
      [
        [397, 205],
        [744, 350],
        [398, 500],
      ].forEach(([x, y], id) => {
        if (state.collected.includes(id)) return;
        const item = this.add
          .image(x, y, "crystal")
          .setScale(1.2)
          .setDepth(y)
          .setData("id", id);
        this.crystals.push(item);
        if (!reducedMotion) this.time.addEvent({delay: 240, loop: true, callback: () => {
          if (item.active) item.y = y + [0, -1, -2, -1][Math.floor(this.time.now / 240) % 4];
        }});

      });
      [
        [330, 260],
        [710, 450],
        [515, 485],
        [750, 245],
        [825, 420],
      ].forEach(([x, y], id) => {
        if (state.defeated.includes(id)) return;
        const enemy = this.physics.add
          .sprite(x, y, id===3?"bat":id===4?"guardian":"slime")
          .setData("id", id)
          .setData("type",id===3?"bat":id===4?"guardian":"slime")
          .setData("hp",id===4?6:id===3?3:2);
        enemy.setCollideWorldBounds(true);
        this.physics.add.collider(enemy, this.solids);
        this.enemies.push(enemy);
      });
    }
    for (let i = 0; i < 100; i++) {
      const x = rand.between(50, 905),
        y = rand.between(85, 588);
      if ((y > 335 && y < 425) || (x > 350 && x < 440)) continue;
      g.fillStyle(0x7b944f).fillRect(x, y, 2, 5);
      g.fillStyle(rand.pick([0xd9ba73, 0xc4c58d, 0x9daf77])).fillRect(
        x - 1,
        y - 2,
        4,
        3,
      );
    }
    for (let i = 0; i < (forest ? 28 : 12); i++) {
      const x = rand.between(55, 905),
        y = rand.between(100, 575);
      g.fillStyle(0xeee2c0).fillRect(x, y, 5, 3);
      g.fillStyle(rand.pick([0xc76f5b, 0xe7ba75, 0xa9c9a0])).fillRect(
        x + 1,
        y - 2,
        3,
        3,
      );
    }
  }
  animatePixels(image: Phaser.GameObjects.Image, key: string, frames: number, delay: number) {
    if (reducedMotion) return;
    let frame = 0;
    const timer = this.time.addEvent({delay, loop: true, callback: () => {
      if (!image.active) { timer.remove(); return; }
      frame = (frame + 1) % frames;
      image.setTexture(key + (frame || ""));
    }});
  }
  drawTown() {
    const data=Array.from({length:40},(_,y)=>Array.from({length:60},(_,x)=>{
      const road=(y>=21&&y<=25)||(x>=27&&x<=32)||(y>=15&&y<=18)||(y>=35&&y<=37)||([11,29,47].some(col=>x>=col&&x<=col+2)&&y>=14&&y<=36);
      return road?6+(x+y)%2:(x*7+y*3)%4;
    }));
    const map=this.make.tilemap({data,tileWidth:16,tileHeight:16});
    map.createLayer(0,map.addTilesetImage("terrain","terrain",16,16)!,0,0)!.setDepth(-110);
    const block=(x:number,y:number,w:number,h:number)=>{const body=this.add.rectangle(x,y,w,h,0,0);this.physics.add.existing(body,true);this.solids.add(body);};
    for(let x=32;x<950;x+=48)for(const y of [38,630]){this.add.image(x,y,"tree").setOrigin(.5,1).setDepth(y);block(x,y-8,24,16);}
    for(let y=90;y<620;y+=48)for(const x of [30,935])if(x===30||y<335||y>430){this.add.image(x,y,"tree").setOrigin(.5,1).setDepth(y);block(x,y-8,24,16);}
    townBuildings.forEach((b,id)=>{
      this.add.image(b.x,b.y,"serene-village","house-"+(id+4)).setOrigin(.5,1).setScale(2).setDepth(b.y-8);
      block(b.x,b.y-47,158,72);
      const image=this.add.image(b.x,b.y,"door").setOrigin(.5,1).setDepth(b.y);
      this.objects.push({kind:"door",id,x:b.x,y:b.y,image});
      this.label(b.x,b.y+14,b.name);
    });
    const fountain=this.add.image(480,365,"fountain").setOrigin(.5,1).setDepth(365);
    block(480,350,68,36);
    this.tweens.add({targets:fountain,alpha:.85,duration:1000,yoyo:true,repeat:-1});
    const shipping=this.add.image(665,322,"chest").setOrigin(.5,1).setDepth(322);
    this.objects.push({kind:"service",service:"shipping",id:0,x:665,y:322,image:shipping});block(665,312,30,20);
    this.label(665,337,"KOTAK PENGIRIMAN");this.label(840,375,"DESA & LADANG >");
    for(const [x,y] of [[90,300],[340,300],[610,285],[850,300],[90,580],[860,580]])this.add.image(x,y,"bush").setDepth(y);
    for(const [name,texture,x,y,greetings] of [
      ["Bu Ratih","npc-ratih",365,350,"Dapur bersama terbuka untukmu. Bawa sayuran atau telur untuk dimasak."],
      ["Pak Damar","npc-damar",580,405,"Kotak di dekat pasar membayar kirimanmu saat hari berganti. Telur laku 15 koin."],
      ["Nina","npc-nina",270,580,"Ayam di kandang milik bersama. Beri pakan setiap hari dan jangan lupa dielus!"],
    ] as const){const image=this.add.image(x,y,texture,"down-0").setOrigin(.5,1).setDepth(y);this.npcs.push({name,texture,x,y,image,morning:[x,y],talks:0,greetings:[greetings]});}
  }
  drawInterior() {
    const room = {
      home: [0x556854,0xc9ad78,0x5c887c],
      shop: [0x695347,0xc9ad78,0xa87552],
      sari: [0x765d46, 0xc9ad78, 0xb96f58],
      workshop: [0x4a5652, 0x88785e, 0x6b8585],
      archive: [0x5b4652, 0xa98c6b, 0x8e5b6b],
      herbalist: [0x536146, 0x9b8b61, 0x779459],
      market:[0x697754,0xc9ad78,0x8e9752],kitchen:[0x885647,0xc9ad78,0xc98b57],ranch:[0x846540,0xc9ad78,0x92964e],
      clinic:[0x577b80,0xc9ad78,0x83b9a4],hall:[0x686087,0xc9ad78,0x98779a],carpenter:[0x615a45,0xc9ad78,0xa08355],
    }[state.area as Exclude<Area, "village" | "forest" | "town">];
    let g = this.add.graphics().setDepth(-100);
    g.fillStyle(0x17251f).fillRect(0, 0, 960, 640);
    g.fillStyle(room[0]).fillRect(65, 55, 830, 545);
    g.fillStyle(room[1]).fillRect(82, 165, 796, 418);
    g.fillStyle(0x3d3329).fillRect(82, 75, 796, 90);
    for (let y = 170; y < 580; y += 24) {
      g.fillStyle(y % 48 ? 0xbca075 : 0xa98e68, 0.28).fillRect(82, y, 796, 3);
    }
    for (let x = 95; x < 870; x += 78) {
      g.fillStyle(0xe1c895, 0.12).fillRect(x, 166, 3, 416);
    }
    const floor = this.make.tilemap({data: Array.from({length:26}, (_, y) => Array.from({length:50}, (_, x) => 12 + (x + y) % 2)),tileWidth:16,tileHeight:16});
    floor.createLayer(0, floor.addTilesetImage("terrain","terrain",16,16)!,80,166)!.setDepth(-99);
    const rug = this.add.graphics().setDepth(-98);
    g = this.add.graphics().setDepth(-97);
    rug.fillStyle(room[2]).fillRect(350,340,260,144);
    rug.lineStyle(2,0xead4a0).strokeRect(358,348,244,128);
    for(let x=366;x<600;x+=12) rug.fillStyle(0xead4a0).fillRect(x,354,4,2).fillRect(x,466,4,2);
    g.fillStyle(0x9fd1c8).fillRect(185, 92, 95, 54).fillRect(680, 92, 95, 54);
    g.fillStyle(0x44372c)
      .fillRect(180, 88, 105, 7)
      .fillRect(180, 145, 105, 7)
      .fillRect(675, 88, 105, 7)
      .fillRect(675, 145, 105, 7);
    g.fillStyle(0xe8d38f).fillRect(468,100,24,24).fillRect(464,104,32,16);
    g.fillStyle(0x745a3e).fillRect(476, 127, 8, 33);
    const block = (x: number, y: number, w: number, h: number) => {
      const body = this.add.rectangle(x, y, w, h, 0x000000, 0);
      this.physics.add.existing(body, true);
      this.solids.add(body);
    };
    block(480, 66, 830, 22);
    block(73, 325, 22, 540);
    block(887, 325, 22, 540);
    block(255, 590, 365, 22);
    block(705, 590, 365, 22);
    const object = (
      kind: "door" | "bed" | "books" | "anvil" | "stove",
      key: string,
      x: number,
      y: number,
      id = -1,
    ) => {
      const image = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
      if (kind !== "door") block(x, y - 12, key === "bed" ? 62 : 48, 30);
      this.objects.push({ kind, id, x, y, image });
    };
    object("door", "door", 480, 600);
    const business=townBuildings.find(b=>b.area===state.area);
    if(business) {
      const image=this.add.image(480,315,business.furniture).setOrigin(.5,1).setDepth(315);
      this.objects.push({kind:"service",service:business.service,id:0,x:480,y:315,image});block(480,300,48,25);
      this.label(480,348,"E · "+business.name);
      if(state.area==="ranch") {
        this.add.image(230,295,"chicken").setScale(2).setDepth(295);
        this.add.image(720,300,"nest").setScale(2).setDepth(300);
        this.label(480,410,"PAKAN HARI INI · TELUR BESOK");
      }else if(state.area==="kitchen") {
        this.add.image(230,290,"stove").setOrigin(.5,1).setDepth(290);block(230,275,48,30);
        this.add.image(735,300,"stall").setOrigin(.5,1).setDepth(300);block(735,285,64,30);
      }else if(state.area==="clinic") {
        for(const x of [220,730]){this.add.image(x,340,"bed").setOrigin(.5,1).setDepth(340);block(x,320,62,30);}
      }else {
        for(const x of [220,735]){this.add.image(x,285,business.furniture).setOrigin(.5,1).setDepth(285);block(x,270,64,30);}
      }
    }else if(state.area==="shop") {
      object("books","stall",480,330);
      const lila=this.add.image(535,355,"npc-lila","down-0").setOrigin(0.5,1).setDepth(355);
      this.npcs.push({name:"Lila",x:535,y:355,texture:"npc-lila",image:lila,morning:[535,355],talks:0});
      this.label(480,385,"E · BELANJA DAN JUAL HASIL");
    } else if(state.area==="home") {
      object("bed","bed",420,410);object("books","books",700,280);
      this.label(420,320,"TIDUR · HARI BARU");
    } else if (state.area === "sari") {
      object("bed", "bed", 180, 300);
      object("books", "books", 790, 235);
      g.fillStyle(0x6a4d33).fillRect(420, 245, 120, 70);
      g.fillStyle(0xe6d6ad).fillRect(420,230,120,30);
      block(480, 275, 120, 65);
    } else if (state.area === "workshop") {
      object("anvil", "anvil", 480, 300);
      this.add.image(230, 285, "campfire").setDepth(285).setTint(0xffb171);
      this.add.image(760, 278, "chestOpen").setDepth(278);
      block(230, 270, 45, 35);
      block(760, 270, 40, 30);
      g.fillStyle(0x826c4d).fillRect(690, 182, 145, 24);
      for (let x = 705; x < 825; x += 28)
        g.fillStyle(0xb5bab0).fillRect(x, 170, 5, 20);
    } else if (state.area === "archive") {
      object("books", "books", 205, 250);
      this.add.image(755, 250, "books").setOrigin(0.5, 1).setDepth(250);
      block(755, 238, 48, 30);
      g.fillStyle(0x59402e).fillRect(350, 215, 260, 78);
      g.fillStyle(0xd8c89e).fillRect(367, 222, 105, 54).fillRect(488, 222, 105, 54);
      block(480, 255, 260, 70);
    } else {
      object("stove", "stove", 480, 280, 2);
      for (const [x, y] of [[190, 240], [770, 240], [220, 430], [740, 430]]) {
        this.add.image(x, y, "bush").setDepth(y).setTint(0xb5ca8c);
        block(x, y - 5, 28, 18);
      }
      g.fillStyle(0x7d5f3f).fillRect(160, 175, 180, 18).fillRect(620, 175, 180, 18);
      for (let x = 175; x < 790; x += 45)
        g.fillStyle(0x86a65f).fillRect(x, 164, 6, 25);
    }
    if(state.minute>=1080||state.minute<360){
      const residents: Partial<Record<Area,[string,string]>>={sari:["Nenek Sari","npc-sari"],workshop:["Bima","npc-bima"],archive:["Mira","npc-mira"],herbalist:["Raka","npc-raka"]};
      const resident=residents[state.area];
      if(resident){const [name,texture]=resident;const image=this.add.image(590,410,texture,"down-0").setOrigin(0.5,1).setDepth(410);this.npcs.push({name,texture,x:590,y:410,talks:0,image,morning:[590,410],greetings:name==="Raka"||name==="Mira"?["Malam sudah turun. Senang melihatmu pulang dengan selamat."]:undefined});}
    }
    this.label(480, 205, areas[state.area][0].toUpperCase());
  }
  label(x: number, y: number, text: string) {
    const label = this.add.bitmapText(Math.round(x), Math.round(y), "pixel-font", text, 6)
      .setOrigin(0.5).setTint(0xead4a0).setDepth(900);
    this.add.rectangle(Math.round(x), Math.round(y), Math.ceil(label.width) + 10, 16, 0x243b36).setDepth(899);
  }
  save() {
    state.x = this.player.x;
    state.y = this.player.y;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      saved = structuredClone(state);
      el("save-status").textContent = "✓ Progres tersimpan otomatis";
    } catch {
      el("save-status").textContent =
        "Penyimpanan tidak tersedia di browser ini";
    }
  }
  travel(area: Area, x?: number, y?: number) {
    this.save();
    state.area = area;
    state.x = x ?? (area === "forest" ? 70 : 875);
    state.y = y ?? 390;
    this.crystals = [];
    this.enemies = [];
    this.npcs = [];
    this.objects = [];
    this.scene.restart();
    audio.play("world.transition");
    this.saveNext();
  }
  saveNext() {
    this.time.delayedCall(100, () => this.save());
  }
  showTool(tool: Tool | "sword", target: {x: number; y: number}, duration: number) {
    this.actionUntil = this.time.now + duration;
    this.facing.set(target.x - this.player.x, target.y - this.player.y).normalize();
    audio.playLocal(tool === "sword" ? "combat.swing" : "tool.swing",target,this.player);
    const d = directionOf(this.facing.x, this.facing.y);
    this.walkDirection = d;
    this.player.stop().setVelocity(0).setFrame(d + "-0");
    this.heldTool.setTexture(tool + "-" + d + "-0");
    this.positionHeldTool(d);
    for (const frame of [1, 2]) this.time.delayedCall(duration * frame / 3, () => {
      this.heldTool.setTexture(tool + "-" + d + "-" + frame);
      this.player.setFrame(d + "-" + frame);
      this.positionHeldTool(d);
    });
    if (tool === "rod") {
      const line = this.add.graphics().setDepth(this.player.y + 15);
      const x = Math.round(this.player.x), y = Math.round(this.player.y);
      const length = Math.ceil(Math.max(Math.abs(target.x-x), Math.abs(target.y-y)));
      for (let i = 12; i <= length; i++) line.fillStyle(0xead4a0)
        .fillRect(Math.round(x+(target.x-x)*i/length),Math.round(y+(target.y-y)*i/length),1,1);
      line.fillStyle(0xad6253).fillRect(target.x-2,target.y-2,4,4);
      this.time.delayedCall(duration, () => line.destroy());
    }
  }
  work() {
    if (this.working || this.time.now < this.actionUntil) return;
    const target = this.objects.slice().sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y)).find(
      (object) =>
        object.kind in workInfo &&
        object.image.active &&
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          object.x,
          object.y,
        ) < 62,
    );
    if (!target) {
      toast("Tidak ada sumber daya dalam jangkauan");
      return;
    }
    const [needed, action, material] =
      workInfo[target.kind as keyof typeof workInfo];
    if (selectedTool !== needed && !(target.kind === "plot" && selectedTool === "water")) {
      toast(`${action} membutuhkan ${toolInfo[needed]}`);
      return;
    }
    if (target.kind === "plot") {
      toast(farmAction(state,target.id,selectedTool==="water"?"water":"hoe",selectedSeed));
      const p=state.farm[target.id];
      target.image.setTexture(p.tilled ? `farm-${p.crop||"empty"}-${cropStage(p)}-${p.watered}` : "plot0");
      this.showTool(selectedTool,target,300);audio.playLocal("tool.hit",target,this.player);hud();this.save();return;
    }
    if(!canCarry(state)){toast("Tas penuh · jual hasil di toko");return;}
    if(!spendStamina(state,Math.max(1,5-state.upgrades.tools))){toast("Tenaga habis · tidur atau makan bekal");return;}
    if (target.kind === "fishing") {
      if (this.fishing) return;
      this.fishing = true;
      this.player.setVelocity(0).stop();
      this.showTool("rod", target, 1500);
      toast("Pelampung dilempar... tunggu sebentar");
      this.time.delayedCall(1500, () => {
        this.fishing = false;
        this.player.clearTint();
        if (Math.random() < 0.28) {
          state.trash = Math.min(999, state.trash + 1);
          toast("Kamu mendapat sampah kolam · setidaknya air lebih bersih");
          audio.playLocal("fishing.trash",target,this.player);
        } else if (state.fish.length >= 20) {
          toast("Tas ikan penuh · jual ikanmu kepada Lila");
          return;
        } else {
          const weight = 2 + Math.floor(Math.random() * Math.random() * 49);
          const name = weight >= 35 ? "Ikan mas besar" : weight >= 18 ? "Ikan nila" : "Ikan kecil";
          state.fish.push(weight);
          toast(
            `${name} ${(weight / 10).toFixed(1)} kg · harga ${fishPrice(weight)} koin`,
          );
          audio.playLocal("fishing.catch",target,this.player);
        }
        hud();
        this.save();
      });
      return;
    }
    if (target.kind === "treeNode") {
      this.working = true;
      this.player.setVelocity(0);
      this.showTool("axe", target, 320);
      target.image.setTint(0xe7d7ad);
      this.time.delayedCall(320, () => {
        state.cleared.push(target.id);
        state.materials[material]++;
        state.stats.wood++;
        target.body?.destroy();
        target.image.destroy();
        this.objects = this.objects.filter((object) => object !== target);
        this.working = false;
        toast("Pohon ditebang · kayu diperoleh");
        audio.playLocal("tool.wood",target,this.player);
        hud();
        this.save();
      });
      return;
    }
    {
      state.cleared.push(target.id);
      state.materials[material]++;
      if(target.kind==="bushNode")state.stats.herb++;
      target.body?.destroy();
      target.image.destroy();
      this.objects = this.objects.filter((object) => object !== target);
      toast(
        target.kind === "rockNode"
            ? "Batu dipecahkan · batu diperoleh"
            : "Semak dibersihkan · serat diperoleh",
      );
    }
    this.showTool(needed, target, 300);
    audio.playLocal("tool.hit",target,this.player);
    hud();
    this.save();
  }
  interact() {
    const npc = this.npcs.find(
      (n) =>
        n.image?.visible !== false && Phaser.Math.Distance.Between(this.player.x, this.player.y, n.x, n.y) <
        58,
    );
    if (npc) {
      if(npc.image){npc.image.setTint(0xffe6b0).setFrame(directionOf(this.player.x-npc.x,this.player.y-npc.y)+"-0");this.time.delayedCall(400,()=>npc.image?.active&&npc.image.clearTint());}
      for(const job of [...state.jobs])if(finishJob(state,job.id,npc.name)){toast("Kiriman diterima · hadiah koin masuk");hud();this.save();}
      if(npc.name==="Lila"){service("shop");return;}
      if (npc.name === "Nenek Sari") {
        if (state.quest === 0)
          dialog(
            npc.name,
            [
              "Lentera ini menjaga Desa Embun sejak sebelum kamu lahir. Namun, cahayanya mulai redup.",
              "Bawakan tiga kristal embun dari Hutan Bisik di timur. Gunakan E untuk mengambilnya, dan Space untuk mengusir slime.",
              "Aku akan menunggumu di sini, penjaga kecil.",
            ],
            () => {
              state.quest = 1;
              hud();
              this.save();
              toast("Quest dimulai · Cahaya yang hilang");
            },
          );
        else if (state.crystals < 3)
          dialog(
            npc.name,
            [
              `Kamu telah menemukan ${state.crystals} dari 3 kristal. Ikuti jalan ke timur, lalu telusuri hutan.`,
              `Lelah? Beristirahatlah sebentar. Aku telah memulihkan nyawamu.`,
            ],
            () => {
              state.health = 5;
              hud();
              this.save();
            },
          );
        else if (state.quest === 1)
          dialog(
            npc.name,
            [
              "Kau kembali! Lihat, kristalnya menjawab panggilan lentera.",
              "Cahaya yang kecil pun mampu menunjukkan jalan pulang. Mulai hari ini, kamu adalah Penjaga Lentera.",
            ],
            () => {
              state.quest = 2;
              state.health = 5;
              hud();
              this.save();
              this.scene.restart();
              showEnding();
            },
          );
        else
          dialog(npc.name, [
            "Lentera menyala berkatmu. Desa ini selalu menjadi rumahmu.",
          ]);
      } else if (npc.name === "Bima")
        dialog(npc.name, [
          [
            "Hutan ada di sebelah timur. Aku lebih suka suara palu, tapi suara pepohonannya tidak buruk.",
            "Slime hanya perlu dua serangan. Hadap ke arahnya, tekan Space, lalu mundur.",
            "Bawa pedangmu ke landasan di bengkel. Alat yang terawat membuat pekerjaan lebih ringan.",
          ][npc.talks++ % 3],
        ]);
      else if (npc.greetings)
        dialog(npc.name, [npc.greetings[npc.talks++ % npc.greetings.length]]);
      else if (state.fish.length) {
        const total = state.fish.reduce((sum, weight) => sum + fishPrice(weight), 0);
        const weight = state.fish.reduce((sum, fish) => sum + fish, 0) / 10;
        dialog(
          npc.name,
          [
            `Kamu membawa ${state.fish.length} ikan dengan berat total ${weight.toFixed(1)} kg. Ikan yang lebih berat selalu lebih mahal.`,
            `Aku membeli semuanya seharga ${total} koin. Terima kasih sudah menjaga kolam desa.`,
          ],
          () => {
            state.coins = Math.min(999999, state.coins + total);
            state.fish = [];
            hud();
            this.save();
            audio.play("commerce.sell");
            toast(`${total} koin diterima dari Lila`);
          },
        );
      }
      else
        dialog(npc.name, [
          [
            "Pilih pancing dengan tombol 5, lalu tekan F di riak sebelah kiri kolam.",
            "Bawa ikanmu kemari. Semakin berat ikannya, semakin mahal aku membelinya.",
            "Sampah kadang ikut tersangkut. Tidak laku dijual, tetapi kolam jadi lebih bersih.",
          ][npc.talks++ % 3],
        ]);
      return;
    }
    const target = this.objects.slice().sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y)).find(
      (object) =>
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          object.x,
          object.y,
        ) < 52,
    );
    if (target) {
      if(target.kind==="service"){service(target.service!);return;}
      if(target.kind==="sign" && state.area==="village"){service("board");return;}
      if(target.kind==="books" && state.area==="shop"){service("shop");return;}
      if(target.kind==="anvil"){service("upgrade");return;}
      if (target.kind === "door") {
        const business=townBuildings.find(b=>b.area===state.area);
        if(state.area==="town")this.travel(townBuildings[target.id].area,480,535);
        else if(business)this.travel("town",business.x,business.y+35);
        else if (state.area === "village") {
          const house = houses[target.id];
          toast(`Masuk · ${house.name}`);
          this.travel(house.area, 480, 535);
        } else {
          const house = houses.find((house) => house.area === state.area)!;
          this.travel("village", house.door[0], house.door[1] + 32);
        }
      } else if (target.kind === "bed") {
        dialog(
          "Istirahat sampai besok",
          [
            state.health === 5
              ? "Tidur sampai pukul 06:00 besok? Lanjutkan untuk tidur; Esc untuk batal."
              : "Tidur akan memulihkan nyawa dan tenaga. Lanjutkan untuk tidur; Esc untuk batal.",
          ],
          () => {
            this.changeDay(true);
          },
          "bed",
        );
      } else if (target.kind === "books") {
        dialog(
          state.area === "archive" ? "Catatan penjaga" : "Buku resep lama",
          state.area === "archive"
            ? [
                "Penjaga pertama menulis: kristal embun muncul ketika hutan merasa aman.",
                "Tiga cahaya pernah dipakai untuk menuntun seluruh desa melewati malam terpanjang.",
              ]
            : [
                "Ramuan daun memulihkan dua nyawa. Daunnya tumbuh subur di pondok selatan.",
              ],
          undefined,
          "books",
        );
      } else if (target.kind === "stove") {
        if(state.potions>=9 || !canCarry(state)){toast("Tas atau slot ramuan penuh");return;}
        if (state.opened.includes(2))
          dialog(
            "Kuali ramuan",
            ["Kualinya masih hangat, tetapi ramuan hari ini sudah kamu ambil."],
            undefined,
            "stove",
          );
        else
          dialog(
            "Kuali ramuan",
            ["Satu botol ramuan daun sudah matang. Kamu memasukkannya ke tas."],
            () => {
              state.opened.push(2);
              state.potions++;
              hud();
              this.save();
              audio.play("loot.potion");
              toast("Ramuan daun masuk ke tas · H untuk menggunakan");
            },
            "stove",
          );
      } else if (
        target.kind === "treeNode" ||
        target.kind === "rockNode" ||
        target.kind === "bushNode" ||
        target.kind === "plot" ||
        target.kind === "fishing"
      ) {
        const needed = workInfo[target.kind][0];
        toast(`Pilih ${toolInfo[needed]}, lalu tekan F`);
      } else if (target.kind === "sign") {
        dialog(
          "Papan petunjuk",
          state.area === "village"
            ? [
                "← Desa Embun  ·  Hutan Bisik →",
                "Pelan-pelan di hutan. Api unggun dapat memulihkan tenagamu.",
              ]
            : [
                "← Desa Embun",
                "Kristal menyukai tempat sunyi. Periksa jalan utara dan sisi timur hutan.",
              ],
          undefined,
          "sign",
        );
      } else if (target.kind === "campfire") {
        dialog(
          "Api unggun",
          [
            state.health === 5
              ? "Nyala kecilnya hangat. Kamu sudah dalam kondisi terbaik."
              : "Kehangatannya memulihkan seluruh nyawamu.",
          ],
          () => {
            state.health = 5;
            hud();
            this.save();
            audio.play("healing");
          },
          "campfire",
        );
      } else if (state.opened.includes(target.id)) {
        dialog("Peti kayu", ["Peti ini sudah kosong."], undefined, "chestOpen");
      } else {
        if(!canCarry(state) || state.potions>=9){toast("Tas atau slot ramuan penuh");return;}
        dialog(
          "Peti kayu",
          [
            `Kamu menemukan ramuan daun dan ${target.id===3?55:12} koin. H memulihkan dua nyawa.`,
          ],
          () => {
            state.opened.push(target.id);
            state.potions++;
            state.coins=Math.min(999999,state.coins+(target.id===3?55:12));
            target.image.setTexture("chestOpen");
            hud();
            this.save();
            audio.play("loot.potion");
            toast("Ramuan daun masuk ke tas · H untuk menggunakan");
          },
          "chest",
        );
      }
      return;
    }
    const item = this.crystals.find(
      (c) =>
        c.active &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) <
          42,
    );
    if (item) {
      if (state.quest === 0) {
        toast("Temui Nenek Sari sebelum mengambil kristal");
        return;
      }
      state.collected.push(item.getData("id"));
      state.crystals = state.collected.length;
      item.destroy();
      audio.playLocal("loot.crystal",item,this.player);
      hud();
      this.save();
      toast(
        state.crystals === 3
          ? "Ketiga kristal ditemukan! Kembali ke Nenek Sari."
          : `Kristal embun ditemukan · ${state.crystals}/3`,
      );
    }
  }
  advanceWorld(time: number, delta: number) {
    for(const n of this.npcs){
      if(!n.image||!n.morning)continue;
      const evening=n.home!==undefined&&(state.minute>=1080||state.minute<360);
      const daytimeX=n.morning[0]+(n.home!==undefined&&state.minute>=720?24:0);
      const radiusX=n.home===undefined?10:28, radiusY=n.home===undefined?8:14;
      if(!evening&&(!n.wander||time>=n.wander.until)){
        const stroll=Math.random()<0.65;
        n.wander={x:daytimeX+(stroll?Phaser.Math.Between(-radiusX,radiusX):0),y:n.morning[1]+(stroll?Phaser.Math.Between(-radiusY,radiusY):0),until:time+Phaser.Math.Between(2400,5200)};
      }
      const door=n.home===undefined?undefined:houses[n.home].door;
      const targetX=evening?door![0]:n.wander!.x, targetY=evening?door![1]:n.wander!.y;
      const dx=targetX-n.x,dy=targetY-n.y,d=Math.hypot(dx,dy),step=Math.min(d,delta/1000*28);
      if(d>1){
        n.x+=dx/d*step;n.y+=dy/d*step;
        const walked=(n.image.getData("walked")||0)+step;
        n.image.setData("walked",walked);
        n.image.setFrame(directionOf(dx,dy)+"-"+(Math.floor(walked/5)%4));
      } else {
        const facing=String(n.image.frame.name).split("-")[0];
        n.image.setFrame(facing+"-0");
      }
      n.image.setPosition(Math.round(n.x),Math.round(n.y)).setDepth(n.y).setVisible(!(evening&&d<3));
    }
    const minutes=Math.min(delta,100)/1000*3;
    if(state.minute+minutes>=1440){this.changeDay();return false;}
    const phase=timePhase(state.minute);
    advanceTime(state,minutes);
    if(phase!==timePhase(state.minute)) {
      audio.crow();
      toast(`${timePhase(state.minute)} tiba · Hari ${state.day}`);
      this.save();
    }
    this.refreshLighting();
    for(const o of this.objects)if(o.kind==="plot"){
      const p=state.farm[o.id];
      o.image.setTexture(p.tilled ? `farm-${p.crop||"empty"}-${cropStage(p)}-${p.watered}` : "plot0");
    }
    hud();
    return true;
  }
  update(time: number, delta: number) {
    if (!this.player) return;
    if(this.transitioning) {
      this.player.setVelocity(0).stop();
      this.enemies.forEach(e=>e.setVelocity(0));
      this.pending.clear();
      return;
    }
    if (this.pressed(this.keys.ESC) && playing) {
      if(!el("service").hidden){el("service").hidden=true;return;}
      if(journal.open){toggleBoard(false);return;}
      if (!el("dialog").hidden) {
        afterDialog=undefined;
        lines = [];
        nextLine();
      } else togglePause();
    }
    const boardKey=this.pressed(this.keys.I);const journalKey=this.pressed(this.keys.J);
    if ((boardKey||journalKey) && playing && el("dialog").hidden && el("service").hidden && !paused){toggleBoard(!journal.open);return;}
    if(journal.open){this.player.setVelocity(0).stop();this.enemies.forEach(e=>e.setVelocity(0));return;}
    for (const [keyName, tool] of [
      ["ONE", "axe"],
      ["TWO", "pickaxe"],
      ["THREE", "sickle"],
      ["FOUR", "hoe"],
      ["FIVE", "rod"],
      ["SIX", "water"],
    ] as const)
      if (this.pressed(this.keys[keyName])) selectTool(tool);
    if (
      this.pressed(this.keys.H) &&
      playing &&
      el("dialog").hidden &&
      !paused
    ) {
      if (state.potions === 0) toast("Kamu belum memiliki ramuan daun");
      else if (state.health === 5) toast("Nyawamu masih penuh");
      else {
        state.potions--;
        state.health = Math.min(5, state.health + 2);
        hud();
        this.save();
        audio.play("potion.use");
        toast("Ramuan digunakan · 2 nyawa dipulihkan");
      }
    }
    const interact = this.pressed(this.keys.E) || this.pressed(this.keys.ENTER);
    const work = this.pressed(this.keys.F);
    const worldRuns = playing && el("service").hidden && !paused && !inventory && el("dialog").hidden;
    if(worldRuns && !this.advanceWorld(time,delta)) return;
    if (
      !playing ||
      !el("service").hidden ||
      paused ||
      inventory ||
      this.fishing ||
      this.working ||
      time < this.actionUntil ||
      !el("dialog").hidden
    ) {
      this.player.setVelocity(0).stop();
      this.enemies.forEach((e) => {if(e.active && (!e.getData("knocked") || time>=e.getData("knocked") || paused || inventory || !el("dialog").hidden || !el("service").hidden))e.setVelocity(0);});
      if (interact && !el("dialog").hidden) nextLine();
      return;
    }
    const dx =
        Number(this.cursors.right.isDown || this.keys.D.isDown) -
        Number(this.cursors.left.isDown || this.keys.A.isDown),
      dy =
        Number(this.cursors.down.isDown || this.keys.S.isDown) -
        Number(this.cursors.up.isDown || this.keys.W.isDown);
    const v = new Phaser.Math.Vector2(dx, dy).normalize();
    const running=this.keys.SHIFT.isDown && (dx!==0||dy!==0) && spendStamina(state,delta/1000*2);
    const speed = running ? 180 : 120;
    this.player.setVelocity(v.x * speed, v.y * speed);
    if (dx || dy) {
      this.facing.copy(v);
      // Keep a stable cardinal pose while travelling diagonally.
      if (!dx || !dy || !((this.walkDirection==="left"&&dx<0)||(this.walkDirection==="right"&&dx>0)||(this.walkDirection==="up"&&dy<0)||(this.walkDirection==="down"&&dy>0)))
        this.walkDirection = dx ? dx<0?"left":"right" : dy<0?"up":"down";
      this.player.play("hero-" + this.walkDirection, true);
      this.player.anims.timeScale = running ? 1.5 : 1;
    } else {
      this.player.stop().setFrame(this.walkDirection + "-0");
    }
    this.player.setDepth(this.player.y + 14);
    this.positionHeldTool(this.walkDirection)
      .setTexture(selectedTool + "-" + this.walkDirection + "-0");
    this.player.setAlpha(
      time - this.lastHit < 900 && Math.floor(time / 90) % 2 === 0 ? 0.45 : 1,
    );
    if (interact) this.interact();
    if (work) { this.work(); if (time < this.actionUntil) return; }
    if (this.pressed(this.cursors.space) && time - this.lastAttack > 300) {
      if(!spendStamina(state,2)){toast("Tenaga habis");return;}
      this.lastAttack = time;
      const x = this.player.x + this.facing.x * 24,
        y = this.player.y + this.facing.y * 24;
      this.showTool("sword", {x, y}, 180);
      this.enemies.forEach((e) => {
        if (!e.active) return;
        const diff = new Phaser.Math.Vector2(
          e.x - this.player.x,
          e.y - this.player.y,
        );
        if (diff.length() < 57 && diff.normalize().dot(this.facing) > 0) {
          const damage=(state.sharp ? 2 : 1)+state.upgrades.weapon;
          const hp = e.getData("hp") - damage;
          e.setData("knocked",time+180).setVelocity(diff.x*180,diff.y*180);
          const number=this.add.bitmapText(e.x,e.y-20,"pixel-font",String(damage),8).setDepth(1600);
          this.tweens.add({targets:number,y:number.y-15,alpha:0,duration:450,onComplete:()=>number.destroy()});
          e.setData("hp", hp);
          e.setTint(0xffeac2);
          this.time.delayedCall(180, () => e.active && e.clearTint());
          if (hp <= 0) {
            state.defeated.push(e.getData("id"));
            state.stats.monster++;
            state.coins=Math.min(999999,state.coins+(e.getData("id")>2?12:4));
            if(canCarry(state))state.monsterDrops++;
            e.disableBody(true,false).setActive(false);
            this.tweens.add({targets:e,alpha:0,y:e.y-8,duration:250,onComplete:()=>e.destroy()});
            hud();
            this.save();
            toast("Slime kembali ke tanah ✦");
          }
        }
      });
    }
    for (const e of this.enemies) {
      if (!e.active) continue;
      if(time<e.getData("knocked"))continue;
      e.setDepth(e.y);
      if (!reducedMotion) e.setTexture(e.getData("type") + (Math.floor(time / 200) % 3 || ""));
      const dist = Phaser.Math.Distance.Between(
        e.x,
        e.y,
        this.player.x,
        this.player.y,
      );
      if (dist < 140) {
        this.physics.moveToObject(e, this.player, e.getData("type")==="bat"?68:e.getData("type")==="guardian"?28:37);
      } else e.setVelocity(0);
      if (dist < 23 && time - this.lastHit > 1000) {
        this.lastHit = time;
        state.health-=e.getData("type")==="guardian"?2:1;
        audio.playLocal("combat.hurt",e,this.player);
        this.cameras.main.shake(100, 0.003);
        if (state.health <= 0) {
          state.health = 5;
          state.area = "village";
          state.x = 400;
          state.y = 410;
          this.enemies = [];
          this.crystals = [];
          this.npcs = [];
          this.scene.restart();
          toast("Nenek Sari menolongmu. Kristalmu tetap aman.");
          this.saveNext();
          return;
        }
        hud();
        this.save();
      }
    }
    const near = this.npcs.find(
      (n) =>
        n.image?.visible !== false && Phaser.Math.Distance.Between(this.player.x, this.player.y, n.x, n.y) <
        58,
    );
    const item = this.crystals.find(
      (c) =>
        c.active &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) <
          42,
    );
    const target = this.objects.slice().sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y)).find(
      (object) =>
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          object.x,
          object.y,
        ) < 52,
    );
    const action = target
      ? {
          sign: "E · Baca",
          service: "E · Aktivitas",
          chest: "E · Buka",
          campfire: "E · Istirahat",
          door: state.area === "village"||state.area==="town" ? "E · Masuk" : "E · Keluar",
          bed: "E · Tidur",
          books: "E · Baca",
          anvil: "E · Tempa",
          stove: "E · Racik",
          treeNode: selectedTool === "axe" ? "F · Tebang" : "1 · Pilih Kapak",
          rockNode:
            selectedTool === "pickaxe" ? "F · Pecahkan" : "2 · Pilih Beliung",
          bushNode:
            selectedTool === "sickle" ? "F · Bersihkan" : "3 · Pilih Sabit",
          plot: target.kind!=="plot" ? "" : cropStage(state.farm[target.id])===3 ? "F · Panen" : selectedTool==="water" ? "F · Siram" : !state.farm[target.id].tilled ? "4 + F · Cangkul" : !state.farm[target.id].crop ? "4 + F · Tanam" : !state.farm[target.id].watered ? "6 + F · Siram" : "Sedang tumbuh",
          fishing:
            selectedTool === "rod" ? "F · Memancing" : "5 · Pilih Pancing",
        }[target.kind]
      : "";
    this.prompt
      .setPosition(this.player.x, this.player.y - 24)
      .setVisible(Boolean(near || item || target))
      .setText(near ? "E · Bicara" : item ? "E · Ambil" : action);
    this.prompt.setPosition(Math.round(this.prompt.x), Math.round(this.prompt.y));
    this.promptBackground.setPosition(this.prompt.x, this.prompt.y - 4)
      .setSize(Math.ceil(this.prompt.width) + 10, 15).setVisible(this.prompt.visible);
    el("hint").textContent = near
      ? `E · Bicara dengan ${near.name}`
      : item
        ? "E · Ambil kristal embun"
        : target
          ? action
          : state.area === "village"
            ? "← Pusat kampung · Rumah & ladang · Hutan →"
            : state.area === "town" ? "✦ Masuk bangunan dengan E · Desa & ladang ke timur →"
            : state.area === "forest"
              ? "✦ Telusuri hutan · Space untuk menyerang"
              : "✦ Jelajahi ruangan · E untuk berinteraksi";
    if (
      time > this.lockTransition &&
      this.player.y > 345 &&
      this.player.y < 430
    ) {
      if (state.area === "village" && this.player.x > 915)
        this.travel("forest");
      else if (state.area === "forest" && this.player.x < 43)
        this.travel("village");
      else if(state.area==="village" && this.player.x<43)this.travel("town",875,390);
      else if(state.area==="town" && this.player.x>915)this.travel("village",70,390);
    }
  }
}
export const world = new World();
export const gameState = () => state;
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 480,
  height: 320,
  backgroundColor: "#56734a",
  pixelArt: true,
  roundPixels: true,
  physics: { default: "arcade", arcade: { debug: false } },
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [world],
  audio: { noAudio: true },
});
function fitPixelCanvas() {
  const width=Math.floor(el("game").clientWidth),height=Math.floor(el("game").clientHeight);
  if(!width||!height)return;
  if(game.scale.width!==width||game.scale.height!==height)game.scale.resize(width,height);
  game.scale.setZoom(1);
  if(world.cameras?.main)world.cameras.main.setZoom(Math.max(1,width/960,height/640));
}
game.events.once("ready",()=>{fitPixelCanvas();start(saved!==null);});
const viewportObserver = new ResizeObserver(fitPixelCanvas);
viewportObserver.observe(el("game"));
function start(restore: boolean) {
  state = restore && saved ? structuredClone(saved) : fresh();
  playing = true;
  paused = false;
  inventory = false;
  selectTool("axe");
  el("overlay").hidden = true;
  el("dialog").hidden = true;
  el("service").hidden = true;
  selectedSeed="turnip";(el("seed-choice") as HTMLSelectElement).value=selectedSeed;
  world.crystals = [];
  world.enemies = [];
  world.npcs = [];
  world.objects = [];
  document.querySelectorAll(".slot")[3].textContent = "";
  document.querySelectorAll(".slot")[3].classList.add("empty");
  world.scene.restart();
  el("game").focus();
  startMusic();
  audio.play("game.start");
}
el("start").onclick = () => start(false);
el("continue").onclick = () => start(true);
(el("continue") as HTMLButtonElement).disabled = !saved;
function togglePause() {
  paused = !paused;
  if (paused) {
    world.save();
    el("overlay").innerHTML =
      '<div class="overlay-inner"><div class="eyebrow">TARIK NAPAS SEJENAK</div><h2>Petualangan menunggu.</h2><p>Progresmu sudah disimpan. Siap melangkah lagi?</p><button class="primary" id="resume">Lanjutkan perjalanan →</button></div>';
    el("overlay").hidden = false;
    el("resume").onclick = togglePause;
    el("resume").focus();
  } else {
    el("overlay").hidden = true;
    el("game").focus();
  }
}
function showEnding() {
  paused = true;
  el("overlay").innerHTML =
    '<div class="overlay-inner"><div class="seal">✧</div><div class="eyebrow">CHAPTER 01 SELESAI</div><h2>Cahaya telah pulang.</h2><p>Kamu menjadi Penjaga Lentera. Terima kasih telah menjaga Desa Embun.</p><button class="primary" id="explore">Jelajahi desa lagi →</button></div>';
  el("overlay").hidden = false;
  el("explore").onclick = () => {
    paused = false;
    el("overlay").hidden = true;
    el("game").focus();
  };
  audio.play("game.complete");
}
window.addEventListener("blur", () => {
  world.input.keyboard?.resetKeys();
  if (playing && !paused && el("dialog").hidden) {
    world.save();
    paused = pausedByBlur = true;
  }
});
window.addEventListener("focus", () => {
  if (pausedByBlur) {
    pausedByBlur = paused = false;
    world.input.keyboard?.resetKeys();
    el("game").focus();
  }
});
window.addEventListener("pagehide", () => {
  if (playing) world.save();
});
