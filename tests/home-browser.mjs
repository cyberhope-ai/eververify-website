// Built-site smoke test with synthetic public records; no real account or writes.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('dist');
const server=createServer((req,res)=>{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox']});
let reads=0,fail=false,empty=false;
const row={receipt_id:'public-test',owner:'Public creator',title:'Public landscape',thumb_url:'/asset/public.png',created_at:'2026-10-29T12:00:00Z'};
try{
  const page=await browser.newPage({viewport:{width:1400,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://geniemade-engine.cyberhopeai.workers.dev/**',async route=>{
    const p=new URL(route.request().url()).pathname;
    if(p.startsWith('/asset/'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#285f62"/><text x="130" y="300" fill="white" font-size="34">Public image test fixture</text></svg>'});
    let body={ok:true};
    if(p.endsWith('/picture-of-day'))body={ok:true,day:'2026-10-30',registration:empty?null:row};
    if(p.endsWith('/stats'))body={ok:true,total_public:1,creators:1};
    if(p.endsWith('/feed')){reads++;body=fail?{ok:false}:{ok:true,registrations:[row],next_cursor:null};}
    return route.fulfill({contentType:'application/json',body:JSON.stringify(body),status:fail&&p.endsWith('/feed')?503:200});
  });
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.locator('.daily-caption h3').filter({hasText:'Public landscape'}).waitFor();
  assert.equal(await page.locator('.daily-caption a').getAttribute('href'),'/r/public-test');
  await page.locator('.feed .tile').waitFor();
  const before=reads;await page.getByRole('button',{name:'Refresh newest creations'}).click();
  await page.waitForFunction(()=>!document.querySelector('#registry button').disabled);assert.ok(reads>before);
  fail=true;await page.getByRole('button',{name:'Refresh newest creations'}).click();await page.getByRole('alert').waitFor();assert.equal(await page.locator('.feed .tile').count(),1);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  empty=true;fail=false;await page.reload();await page.getByText("No eligible public images for today's selection yet.").waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: daily public card, record link, feed refresh, outage retains gallery, mobile layout, empty selection.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
