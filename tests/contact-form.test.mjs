import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initContactForm} from '../js/contact-form.mjs';

function setup(fetchImpl, entries = {}) {
  const status = {}, button = {disabled:false}, label = {textContent:'Send message'}, attrs = {};
  let handler, resets = 0;
  const values = {'name':'Test visitor', email:'test@example.com', message:'Design & build a café site', budget:'₹25k – ₹75k', 'bot-field':'', ...entries};
  const form = {
    name:'contact', reportValidity:()=>true,
    addEventListener:(_, fn)=>handler=fn,
    querySelector:selector=>selector === '.cf-submit' ? button : label,
    getAttribute:()=>'/thank-you.html', setAttribute:(key,value)=>attrs[key]=value,
    reset:()=>resets++
  };
  class Data extends Map {constructor(){super(Object.entries(values));}}
  initContactForm({getElementById:id=>id === 'contactForm' ? form : id === 'cfStatus' ? status : null}, {fetchImpl,FormDataImpl:Data});
  return {form,status,button,label,attrs,submit:()=>handler({preventDefault(){}}),get resets(){return resets;}};
}

test('Netlify contact submissions encode named fields and only reset after acceptance', async () => {
  let request;
  const ui = setup(async (url, options) => {request={url,options};return {ok:true};});
  await ui.submit();
  assert.equal(request.url,'/thank-you.html');
  assert.equal(request.options.method,'POST');
  assert.equal(request.options.headers['Content-Type'],'application/x-www-form-urlencoded');
  const body = new URLSearchParams(request.options.body);
  assert.equal(body.get('form-name'),'contact');
  assert.equal(body.get('bot-field'),'');
  assert.equal(body.get('email'),'test@example.com');
  assert.equal(body.get('message'),'Design & build a café site');
  assert.equal(body.get('budget'),'₹25k – ₹75k');
  assert.equal(ui.resets,1);
  assert.match(ui.status.textContent,/Message sent/);
  assert.equal(ui.button.disabled,false);
  assert.equal(ui.attrs['aria-busy'],'false');
});

test('server failures, network errors and timeouts keep the brief and allow retry', async () => {
  for (const fetchImpl of [async()=>({ok:false}),async()=>{throw new Error('offline');},async()=>{throw Object.assign(new Error(),{name:'AbortError'});}]) {
    const ui = setup(fetchImpl);
    await ui.submit();
    assert.equal(ui.resets,0);
    assert.match(ui.status.textContent,/brief is still here/);
    assert.equal(ui.status.className,'cf-status is-err');
    assert.equal(ui.button.disabled,false);
    assert.equal(ui.label.textContent,'Send message');
  }
});

test('honeypot, invalid fields and repeated clicks cannot create extra requests', async () => {
  let requests=0, release;
  const fakeFetch=()=>{requests++;return new Promise(resolve=>release=()=>resolve({ok:true}));};
  const bot=setup(fakeFetch,{'bot-field':'spam'});
  await bot.submit();assert.equal(requests,0);
  const invalid=setup(fakeFetch);invalid.form.reportValidity=()=>false;
  await invalid.submit();assert.equal(requests,0);
  const ui=setup(fakeFetch), pending=ui.submit();
  assert.equal(ui.button.disabled,true);
  await ui.submit();assert.equal(requests,1);
  release();await pending;
});

test('static form declares Netlify fields and includes a native success destination', async () => {
  const html=await readFile('index.html','utf8');
  const form=html.match(/<form[^>]*id="contactForm"[^>]*>[\s\S]*?<\/form>/)[0];
  assert.match(form,/name="contact"/);
  assert.match(form,/method="POST"/);
  assert.match(form,/data-netlify="true"/);
  assert.match(form,/netlify-honeypot="bot-field"/);
  assert.match(form,/name="form-name" value="contact"/);
  assert.match(form,/action="\/thank-you.html"/);
  const thanks=await readFile('thank-you.html','utf8');
  assert.match(thanks,/Thanks for reaching out/);
});
