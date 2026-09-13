/// <reference types="vite/client" />
import { world, gameState } from "./main";
import { advanceTime } from "./state";
import { audio } from "./audio";
const originalCrow=audio.crow.bind(audio);
let crows=0;
audio.crow=()=>{crows++;originalCrow();};

// Run only from pixel-game-check.html. Restore the original save after every run.
const original = localStorage.getItem("lentera-save-v1");
const restoreSave=()=>{if(original===null)localStorage.removeItem("lentera-save-v1");else localStorage.setItem("lentera-save-v1",original);};
window.addEventListener("pagehide",restoreSave);
if(import.meta.hot)import.meta.hot.dispose(restoreSave);
const result = document.createElement("pre");
result.id = "check-result";
Object.assign(result.style, {position:"fixed",left:"8px",top:"8px",zIndex:"9999",background:"#243b36",color:"#ead4a0",padding:"16px",whiteSpace:"pre-wrap"});
document.body.append(result);
const check = (value: boolean, label: string) => {
  if (!value) throw new Error(label);
  result.textContent += `LULUS · ${label}\n`;
};
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const settle = (ms: number) => new Promise(resolve => world.time.delayedCall(ms,()=>resolve(undefined)));
const restart = async (action: () => void) => {
  const ready = new Promise<void>(resolve => world.events.once("create", () => resolve()));
  action(); await ready; await wait(150);
};
async function run() {
  while (!world.player) await wait(30);
  await restart(() => document.getElementById("start")!.click());
  check(world.npcs.length === 5, "Lima warga dengan frame portrait");
  const canvas = document.querySelector<HTMLCanvasElement>("#game canvas")!;
  check(Number.isInteger(canvas.getBoundingClientRect().width / canvas.width), "Skala canvas bulat");
  check(world.cameras.main.zoom >= 1 && world.cameras.main.roundPixels, "Kamera responsif dengan pixel snapping");
  const textureKeys = world.npcs.map(n=>n.texture);
  check(new Set(textureKeys).size===5, "Kelima warga memiliki texture berbeda");
  await restart(()=>world.travel("village",38,390));
  await wait(1200);
  check(gameState().area==="town","Jalan barat desa menuju pusat kampung");
  check(world.textures.exists("serene-village") && Array.from({length:11},(_,i)=>world.textures.get("serene-village").has(`house-${i}`)).every(Boolean),"Sebelas fasad dari atlas rumah termuat");
  check(world.objects.filter(o=>o.kind==="door").length===6,"Enam bangunan pusat kampung memiliki pintu");
  for(const [id,area] of ["market","kitchen","clinic","ranch","hall","carpenter"].entries()) {
    const door=world.objects.find(o=>o.kind==="door"&&o.id===id)!;
    world.player.setPosition(door.x,door.y+25);
    await restart(()=>world.interact());
    check(gameState().area===area,`Pintu menuju ${area}`);
    const station=world.objects.find(o=>o.kind==="service")!;
    world.player.setPosition(station.x,station.y+30);world.interact();
    check(!document.getElementById("service")!.hidden&&document.querySelectorAll("#service-actions button").length>0,`Aktivitas ${area} tersedia`);
    document.getElementById("service-close")!.click();
    world.player.setPosition(480,575);await restart(()=>world.interact());
    check(gameState().area==="town",`Keluar ${area} kembali ke pusat kampung`);
  }
  const shipping=world.objects.find(o=>o.service==="shipping")!;
  world.player.setPosition(shipping.x,shipping.y+25);world.interact();
  check(document.getElementById("service-title")!.textContent==="Kotak pengiriman","Kotak pengiriman dapat diakses");
  document.getElementById("service-close")!.click();
  gameState().minute=1260;world.refreshLighting();check(world.lighting.alpha>0.5,"Pusat kampung mengikuti malam");gameState().minute=360;
  world.player.setPosition(920,390);await wait(1200);
  check(gameState().area==="village","Jalan timur pusat kampung kembali ke desa");
  for (const area of ["home","shop","sari","workshop","archive","herbalist"] as const) {
    await restart(() => world.travel(area,480,535));
    const exit = world.objects.find(o=>o.kind==="door")!;
    check(!!exit && world.objects.length > 1, `Interior ${area}: pintu dan perabot`);
    world.player.setPosition(exit.x,exit.y-25);
    await restart(() => world.interact());
    check(world.npcs.length === 5, `Keluar ${area} kembali ke desa`);
  }
  await restart(() => world.travel("forest",120,210));
  check(world.crystals.filter(c=>c.active).length===3,"Tiga kristal muncul di jalur hutan");
  gameState().quest=1;
  for(const [id,item] of world.crystals.entries()) {
    world.player.setPosition(item.x,item.y);
    world.interact();
    check(!item.active&&gameState().collected.includes(id),`Kristal ${id+1} dapat diambil`);
  }
  check(gameState().crystals===3,"Quest menerima ketiga kristal");
  const tree=world.objects.find(o=>o.kind==="treeNode")!;
  world.player.setPosition(tree.x,tree.y+25);
  document.getElementById("tool-axe")!.click();
  world.work();
  check(world.heldTool.texture.key.startsWith("axe-") && world.working, "Kapak muncul selama aksi");
  const axeMinute=gameState().minute;
  await settle(100);
  check(gameState().minute>axeMinute,"Waktu tetap berjalan selama memakai alat");
  for(const direction of ["down","up","left","right"] as const) for(let frame=0;frame<4;frame++) {
    world.player.setFrame(`${direction}-${frame}`);
    world.positionHeldTool(direction);
    const step=[0,1,0,-1][frame],bob=frame%2;
    const handX=direction==="left"?-2-step:direction==="right"?1+step:8;
    const handY=direction==="left"||direction==="right"?6+bob:5+bob-step;
    check(Math.abs(world.heldTool.x-world.player.x-handX)<=1 && Math.abs(world.heldTool.y-world.player.y-handY)<=1,`Genggaman ${direction}/${frame} mengikuti telapak`);
    check(direction==="up"?world.heldTool.depth<world.player.y+14:world.heldTool.depth>world.player.y+14,`Lapisan alat ${direction}/${frame}`);
  }
  world.positionHeldTool("up");
  await settle(430);
  check(!tree.image.active && !world.working, "Pohon hilang setelah ayunan selesai");
  await restart(() => world.travel("village",548,525));
  document.getElementById("tool-rod")!.click();
  world.work();
  check(world.fishing && world.heldTool.texture.key.startsWith("rod-"), "Pancing dan tali saat memancing");
  const fishingMinute=gameState().minute;
  await settle(100);
  check(gameState().minute>fishingMinute,"Waktu tetap berjalan selama memancing");
  await settle(1650);
  check(!world.fishing, "Memancing selesai dan kontrol kembali");
  const plot=world.objects.find(o=>o.kind==="plot")!;
  world.player.setPosition(plot.x,plot.y+8);
  document.getElementById("tool-hoe")!.click();world.work();await settle(350);
  check(gameState().farm[plot.id].tilled,"Cangkul menggemburkan tanah");
  world.work();await settle(350);
  check(gameState().farm[plot.id].crop==="turnip","Benih aktif ditanam");
  document.getElementById("tool-water")!.click();world.work();await settle(350);
  check(gameState().farm[plot.id].watered && plot.image.texture.key.endsWith("true"),"Penyiram membasahi tanah secara visual");
  advanceTime(gameState(),150);world.work();await settle(350);
  check(gameState().produce.turnip===1,"Tanaman matang dapat dipanen");
  await restart(()=>world.travel("shop",535,390));world.interact();
  check(!document.getElementById("service")!.hidden,"Toko menampilkan pembelian dan penjualan");
  const sell=Array.from(document.querySelectorAll<HTMLButtonElement>("#service-actions button")).find(b=>b.textContent==="Jual semua panen")!;
  const coins=gameState().coins;sell.click();check(gameState().coins===coins+12,"Penjualan panen memberi koin");
  document.getElementById("service-close")!.click();
  await restart(()=>world.travel("forest",70,390));
  check(new Set(world.enemies.map(e=>e.getData("type"))).size===3,"Tiga tipe musuh ada dalam hutan");
  check(world.objects.some(o=>o.kind==="chest"&&o.id===3),"Peti hadiah rimba dalam tersedia");
  const enemy=world.enemies[0];world.player.setPosition(400,380);enemy.setPosition(428,380);world.facing.set(1,0);
  const swordMinute=gameState().minute;
  world.cursors.space.emit("down");await settle(80);
  check(gameState().minute>swordMinute,"Waktu tetap berjalan selama serangan pedang");
  check(enemy.getData("hp")===1 && enemy.getData("knocked")>0,"Serangan memberi damage dan reaksi knockback");
  await settle(350);enemy.setPosition(world.player.x+25,world.player.y);world.cursors.space.emit("down");await settle(300);
  check(!enemy.active&&gameState().stats.monster===1,"Musuh mati dan progres perburuan bertambah");
  gameState().minute=1260;
  await restart(()=>world.travel("village",430,365));
  await settle(100);
  check(world.lighting.alpha>0.5,"Pencahayaan malam berubah");
  check(world.npcs.every(n=>n.home!==undefined),"Warga memiliki tujuan rumah saat malam");
  await restart(()=>world.travel("sari",590,445));
  check(world.npcs.some(n=>n.name==="Nenek Sari"),"Warga dapat ditemui di rumah pada malam hari");
  await restart(()=>world.travel("home",420,438));
  gameState().health=2;gameState().stamina=1;world.interact();
  await restart(()=>document.getElementById("next-dialog")!.click());
  check(gameState().day===2&&gameState().health===5&&gameState().stamina===100,"Tidur mengawali hari baru dan memulihkan kondisi");
  await settle(900);
  check(!world.transitioning,"Kontrol kembali setelah fade pagi");
  const before=crows;
  for(const minute of [719.99,1019.99,1139.99,359.99]) {
    gameState().minute=minute;
    await settle(50);
  }
  check(crows===before+4,"Satu kokok ayam pada setiap perubahan fase");
  const day=gameState().day;
  gameState().minute=1439.99;
  await settle(50);
  check(world.transitioning && gameState().day===day,"Tengah malam mengunci kontrol sebelum mengganti hari");
  await wait(1800);
  check(gameState().day===day+1 && !world.transitioning,"Fade tengah malam selesai tepat satu hari");
  world.keys.D.isDown=true;world.keys.W.isDown=true;
  await settle(100);
  const diagonalSpeed=world.player.body!.velocity.length();
  check(world.player.anims.currentAnim?.key==="hero-right","Diagonal memakai pose samping stabil");
  world.keys.D.isDown=false;world.keys.W.isDown=false;
  await settle(50);
  check(world.player.frame.name==="right-0","Berhenti diagonal mempertahankan arah terakhir");
  check(Math.abs(diagonalSpeed-120)<1,"Kecepatan diagonal sama dengan lurus");
  world.player.play("hero-left",true);
  check(world.player.anims.currentAnim?.key==="hero-left", "Animasi berjalan empat arah terhubung");
  check(world.player.angle === 0, "Karakter tidak memakai rotasi pecahan");
  result.textContent += "SELESAI · save awal dipulihkan.";
}
run().catch(error => {result.textContent += `GAGAL · ${error}`; console.error(error);}).finally(()=>{
  // Stop the test scene before restoring so pagehide cannot overwrite the old save.
  world.scene.stop();
  audio.crow=originalCrow;
  restoreSave();
});
