import { test } from "node:test";
import assert from "node:assert/strict";
import { villageActivity, capacity, inventorySize } from "./state.ts";
import { timePhase, daylight, fishPrice, fresh, parseSave, farmAction, advanceTime, sleep, buy, sellHarvest, upgrade, acceptJob, finishJob, maxStamina } from "./state.ts";
test("save round trip and rejection of corrupt progression", () => {
  assert.deepEqual(parseSave(JSON.stringify(fresh())), fresh());
  for (const input of [
    "bad",
    null,
    JSON.stringify({ ...fresh(), health: 0 }),
    JSON.stringify({ ...fresh(), crystals: 3 }),
    JSON.stringify({ ...fresh(), quest: 2 }),
    JSON.stringify({ ...fresh(), x: 99999 }),
    JSON.stringify({ ...fresh(), potions: 10 }),
    JSON.stringify({ ...fresh(), opened: [0, 0] }),
    JSON.stringify({ ...fresh(), sharp: "yes" }),
    JSON.stringify({ ...fresh(), cleared: [1, 1] }),
    JSON.stringify({ ...fresh(), materials: [0, 0, 0] }),
    JSON.stringify({ ...fresh(), plots: [0, -1, 0] }),
    JSON.stringify({ ...fresh(), fish: [51] }),
    JSON.stringify({ ...fresh(), coins: -1 }),
    JSON.stringify({ ...fresh(), stamina: 101 }),
    JSON.stringify({ ...fresh(), minute: 1440 }),
    JSON.stringify({ ...fresh(), seeds: {turnip:-1,carrot:0,pumpkin:0} }),
    JSON.stringify({ ...fresh(), farm: [] }),
    JSON.stringify({ ...fresh(), upgrades: {tools:4,weapon:0,bag:0,stamina:0} }),
    JSON.stringify({ ...fresh(), jobs: [{id:8,baseline:0}] }),
  ])
    assert.equal(parseSave(input), null);
  const completed = { ...fresh(), quest: 2, crystals: 3, collected: [0, 1, 2] };
  assert.deepEqual(parseSave(JSON.stringify(completed)), completed);
  const oldSave = { ...fresh() } as Record<string, unknown>;
  delete oldSave.potions;
  delete oldSave.opened;
  delete oldSave.sharp;
  delete oldSave.cleared;
  delete oldSave.materials;
  delete oldSave.plots;
  delete oldSave.fish;
  delete oldSave.trash;
  delete oldSave.coins;
  assert.deepEqual(parseSave(JSON.stringify(oldSave)), {...fresh(),coins:0});
  assert.ok(fishPrice(50) > fishPrice(20));
  assert.ok(fishPrice(20) > fishPrice(5));
});
test("farm, economy, daily reset and upgrades preserve progression",()=>{
  const s=fresh();
  farmAction(s,0,"hoe","turnip"); farmAction(s,0,"hoe","turnip");
  advanceTime(s,150); assert.equal(s.farm[0].growth,0);
  farmAction(s,0,"water","turnip"); advanceTime(s,150);
  farmAction(s,0,"hoe","turnip"); assert.equal(s.produce.turnip,1);
  assert.equal(sellHarvest(s),12); assert.equal(s.coins,42);
  buy(s,"pumpkin"); assert.equal(s.seeds.pumpkin,1);assert.equal(s.coins,30);
  s.coins=0; buy(s,"carrot");assert.equal(s.seeds.carrot,0);
  assert.ok(acceptJob(s,0));s.materials[0]=3;
  assert.equal(finishJob(s,0),false);assert.ok(finishJob(s,0,"Raka"));assert.equal(s.coins,24);
  assert.equal(finishJob(s,0,"Raka"),false);
  s.coins=100;s.materials[0]=3;s.materials[1]=3;upgrade(s,"stamina");
  assert.equal(maxStamina(s),120);assert.equal(s.coins,60);
  s.health=1;s.stamina=0;s.defeated=[1];sleep(s);
  assert.equal(s.day,2);assert.equal(s.minute,360);assert.equal(s.health,5);assert.equal(s.stamina,120);
  assert.deepEqual(s.defeated,[]);assert.deepEqual(s.completedJobs,[]);
  assert.deepEqual(parseSave(JSON.stringify(s)),s);
});

test("time phases and continuous light cover a full day",()=>{
  assert.deepEqual([0,360,720,1020,1140,1439].map(timePhase),["Malam","Pagi","Siang","Senja","Malam","Malam"]);
  assert.equal(daylight(0),daylight(1440));
  assert.equal(daylight(720),0);
  assert.ok(daylight(1260)>0.5);
  for(let minute=1;minute<=1440;minute++) {
    assert.ok(daylight(minute)>=0 && daylight(minute)<=0.56);
    assert.ok(Math.abs(daylight(minute)-daylight(minute-1))<0.01);
  }
  const s=fresh();s.minute=1439;s.collected=[0];s.crystals=1;
  advanceTime(s,1);
  assert.equal(s.day,2);assert.equal(s.minute,0);assert.deepEqual(s.collected,[0]);
});

test("village activities survive saves, pay once, and respect inventory and daily limits",()=>{
  const s=fresh();const legacy={...s} as Record<string,unknown>;delete legacy.homestead;
  assert.deepEqual(parseSave(JSON.stringify(legacy)),s);
  for(const area of ["town","market","kitchen","clinic","ranch","hall","carpenter"] as const)
    assert.equal(parseSave(JSON.stringify({...s,area}))?.area,area);
  assert.equal(parseSave(JSON.stringify({...s,homestead:{...s.homestead,feed:-1}})),null);
  assert.equal(parseSave(JSON.stringify({...s,homestead:null})),null);
  villageActivity(s,"feed");villageActivity(s,"feed");assert.equal(s.homestead.feed,2);
  villageActivity(s,"pet");villageActivity(s,"pet");assert.equal(s.homestead.affection,1);
  sleep(s);assert.equal(s.homestead.nest,1);assert.equal(s.homestead.fed,false);
  villageActivity(s,"eggs");villageActivity(s,"eggs");assert.equal(s.homestead.eggs,1);
  villageActivity(s,"omelet");assert.equal(s.homestead.meals,1);assert.equal(s.homestead.eggs,0);
  s.stamina=30;villageActivity(s,"eat");assert.equal(s.stamina,75);assert.equal(s.homestead.meals,0);
  s.produce.turnip=2;s.homestead.eggs=1;s.fish=[10];const total=24+15+fishPrice(10);
  villageActivity(s,"ship");villageActivity(s,"ship");assert.equal(s.homestead.shipping,total);assert.equal(s.coins,30);
  sleep(s);assert.equal(s.coins,30+total);assert.equal(s.homestead.shipping,0);assert.equal(s.homestead.nest,0);
  sleep(s);assert.equal(s.coins,30+total);
  s.homestead.affection=5;villageActivity(s,"feed");sleep(s);assert.equal(s.homestead.nest,2);
  s.materials[0]=capacity(s)-inventorySize(s);villageActivity(s,"eggs");assert.equal(s.homestead.nest,2);
  const coins=s.coins;villageActivity(s,"buyFeed");assert.equal(s.coins,coins);
  s.health=2;s.stamina=1;s.coins=14;villageActivity(s,"heal");assert.equal(s.health,2);
  s.coins=15;villageActivity(s,"heal");assert.equal(s.health,5);assert.equal(s.coins,0);
  assert.deepEqual(parseSave(JSON.stringify(s)),s);
});
