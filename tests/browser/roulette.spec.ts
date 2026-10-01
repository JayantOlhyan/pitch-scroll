import { test, expect, Page } from '@playwright/test';
import { initialState } from '../../lib/storage';
import { challenges } from '../../data/challenges';
import { dailyChallenge, dateKey } from '../../lib/engine';

async function filters(page:Page) {
 await page.getByRole('button',{name:'Toggle roulette filters'}).click();
 await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('AI');
}
async function seen(page:Page):Promise<string[]> {
 return page.evaluate(()=>JSON.parse(localStorage.getItem('thirty-minute:v1')!).seen);
}

test('daily topic stays deterministic across keyboard actions and reload',async({page})=>{
 await page.goto('/daily');
 const title=page.locator('.reveal-topic-title');
 const today=await page.evaluate(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;});
 expect(dateKey(new Date(today+'T12:00:00'))).toBe(today);
 const expected=dailyChallenge(challenges,today).title;
 await expect(title).toHaveText(expected);
 await expect(page.getByRole('button',{name:'Spin Again'})).toHaveCount(0);
 await page.locator('body').click({position:{x:5,y:200}});
 await page.keyboard.press('Space');
 await page.keyboard.press('Enter');
 await expect(title).toHaveText(expected);
 await page.reload();
 await expect(title).toHaveText(expected);
});

test('empty filters block button and keyboard selection',async({page})=>{
 await page.goto('/challenge');
 await filters(page);
 await page.getByRole('combobox',{name:'Type',exact:true}).selectOption('Failure');
 await expect(page.getByRole('button',{name:/SPIN TOPIC ROULETTE/})).toBeDisabled();
 await expect(page.getByRole('status')).toHaveText(/No topics match/);
 await page.locator('body').click({position:{x:5,y:200}});
 await page.keyboard.press('Space');
 await page.keyboard.press('Enter');
 await expect(page.locator('.cinematic-reveal-panel')).toHaveCount(0);
 expect(await seen(page)).toEqual([]);
 await expect(page.getByRole('combobox',{name:'Category',exact:true})).toHaveValue('AI');
});

test('normal animated spin obeys filters and reveals only once',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/challenge');
 await filters(page);
 await page.getByRole('button',{name:/SPIN TOPIC ROULETTE/}).click();
 await expect(page.getByRole('heading',{name:'SELECTING TOPIC…'})).toBeVisible();
 await expect(page.getByRole('button',{name:/SPIN TOPIC ROULETTE/})).toHaveCount(0);
 await page.keyboard.press('Space');
 await expect(page.locator('.reveal-topic-title')).toBeVisible();
 const ids=await seen(page);
 expect(ids).toHaveLength(1);
 expect(challenges.find(c=>c.id===ids[0])?.category).toBe('AI');
});

test('reduced motion reveals immediately without scheduling reel animation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/challenge');
 await filters(page);
 await page.evaluate(()=>{
  const original=window.requestAnimationFrame;
  window.requestAnimationFrame=(callback)=>{throw new Error('Unexpected reel animation: '+String(callback));};
  (window as unknown as {restoreAnimation:()=>void}).restoreAnimation=()=>{window.requestAnimationFrame=original;};
 });
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.getByRole('button',{name:/SPIN TOPIC ROULETTE/}).click();
 await expect(page.locator('.reveal-topic-title')).toBeVisible({timeout:1000});
 expect(await seen(page)).toHaveLength(1);
 expect(errors).toEqual([]);
 await page.evaluate(()=>(window as unknown as {restoreAnimation:()=>void}).restoreAnimation());
});

test('enabling reduced motion during a spin finishes the selected winner',async({page})=>{
 await page.goto('/challenge');
 await page.getByRole('button',{name:/SPIN TOPIC ROULETTE/}).click();
 await expect(page.getByRole('heading',{name:'SELECTING TOPIC…'})).toBeVisible();
 const selected=await page.locator('.reel-card').nth(49).locator('.reel-title').textContent();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.reveal-topic-title')).toHaveText(selected!,{timeout:1000});
 expect(await seen(page)).toHaveLength(1);
});

test('keyboard activation of filter controls does not trigger a spin',async({page})=>{
 await page.goto('/challenge');
 const filter=page.getByRole('button',{name:'Toggle roulette filters'});
 await filter.focus();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('combobox',{name:'Category',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'WHAT WILL YOU STUDY?'})).toBeVisible();
 expect(await seen(page)).toEqual([]);
});

test('legacy browser storage upgrades and stays migrated after reload',async({page})=>{
 const state={...initialState(),catalogRevision:undefined,challenges:challenges.map((c,i)=>({...c,id:`topic-${i+1}`})),seen:['topic-1']};
 await page.addInitScript(value=>{if(!localStorage.getItem('thirty-minute:v1'))localStorage.setItem('thirty-minute:v1',JSON.stringify(value));},state);
 await page.goto('/challenge');
 await expect(page.getByRole('heading',{name:'WHAT WILL YOU STUDY?'})).toBeVisible();
 expect(await seen(page)).toEqual(['builtin:openai']);
 await page.reload();
 await expect(page.getByRole('heading',{name:'WHAT WILL YOU STUDY?'})).toBeVisible();
 expect(await seen(page)).toEqual(['builtin:openai']);
});
