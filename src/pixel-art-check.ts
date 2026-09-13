import Phaser from "phaser";
import { addVillageHouseFrames, createPixelArt, directionOf, directions } from "./pixel-art";

// A standalone browser check: it never loads or changes the player's save.
new Phaser.Game({
  type: Phaser.CANVAS, width: 720, height: 400, parent: "preview",
  pixelArt: true, scale: {zoom: 2}, audio: {noAudio: true},
  scene: {preload() {
    this.load.image("serene-village", "/assets/serene-village-16x16.png");
  }, create() {
    try {
      createPixelArt(this);
      addVillageHouseFrames(this);
      let frames = 0, pixels = 0;
      const check = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };
      const people = ["hero", "npc-sari", "npc-bima", "npc-lila", "npc-raka", "npc-mira", "npc-ratih", "npc-damar", "npc-nina"];
      for (const key of people) {
        for (const d of directions) for (let f = 0; f < 4; f++) {
          const frame = this.textures.getFrame(key, `${d}-${f}`);
          check(frame.width === 24 && frame.height === 32, `Ukuran frame ${key}/${d}/${f}`);
          frames++;
        }
      }
      for (const key of this.textures.getTextureKeys()) {
        const canvas = this.textures.get(key).getSourceImage();
        if (!(canvas instanceof HTMLCanvasElement)) continue;
        const data = canvas.getContext("2d")!.getImageData(0,0,canvas.width,canvas.height).data;
        for (let p=3;p<data.length;p+=4) {
          check(data[p] === 0 || data[p] === 255, `Pixel antialias pada ${key}`); pixels++;
        }
      }
      for(const key of people.filter(key=>key!=="hero")) {
        const source=this.textures.get(key).getSourceImage() as HTMLCanvasElement;
        const ctx=source.getContext("2d")!;
        for(let f=0;f<4;f++) {
          const widthAt=(row:number)=>{
            const pixels=ctx.getImageData(f*24,row*32+16+f%2,24,1).data;
            return Array.from({length:24},(_,x)=>pixels[x*4+3]).filter(Boolean).length;
          };
          check(widthAt(1)<widthAt(0)&&widthAt(2)<widthAt(0),`Siluet samping ${key}/${f} lebih ramping daripada depan`);
        }
      }
      check(directionOf(-1,0)==="left" && directionOf(1,0)==="right" && directionOf(0,-1)==="up" && directionOf(0,1)==="down", "Arah karakter");
      check(this.textures.getFrame("terrain").width === 14*16, "Lebar tileset");
      check(Array.from({length:11},(_,i)=>this.textures.getFrame("serene-village",`house-${i}`).width>0).every(Boolean),"Sebelas fasad LimeZu tersedia");
      people.forEach((key,i) => {
        this.add.bitmapText(18+i*76,8,"pixel-font",key.replace("npc-",""),6).setTint(0xead4a0);
        directions.forEach((d,row)=>this.add.sprite(28+i*76,38+row*37,key,"down-0").play(`${key}-${d}`));
      });
      for(let i=0;i<11;i++) this.add.image(12+(i%6)*76,176+Math.floor(i/6)*64,"serene-village",`house-${i}`).setOrigin(0).setScale(0.75);
      ["tree","rock","bush","bed","books","stove"].forEach((key,i)=>this.add.image(80+i%3*160,318+Math.floor(i/3)*38,key).setOrigin(0.5).setScale(0.5));
      document.getElementById("result")!.textContent = `LULUS · ${frames} frame karakter · ${pixels} pixel tanpa antialias · 14 tile · 11 fasad · 4 arah.\nPratinjau karakter, sebelas rumah, dan perabot.`;
    } catch (error) {
      document.getElementById("result")!.textContent = `GAGAL · ${error}`;
      throw error;
    }
  }},
});
