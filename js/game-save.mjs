/* Private, origin-scoped saves. This module never makes a network request. */
export const GAME_IDS=['pens','chess','cards','rps','cricket','ultimate'];
export const SAVE_VERSION=1;
export function validSave(data){
 if(!data||data.version!==SAVE_VERSION||!GAME_IDS.includes(data.active)||!Number.isInteger(data.tokens)||data.tokens<0||data.tokens>999999||!data.games||!data.paid)return null;
 return data;
}
export function createGameStore(factory=globalThis.indexedDB){
 let connection;
 function database(){if(!factory)return Promise.reject(new Error('Browser database unavailable'));return connection||=(new Promise((resolve,reject)=>{const request=factory.open('shri-private-playroom',1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('saves'))request.result.createObjectStore('saves');};request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();connection=null;};resolve(db);};request.onerror=()=>{connection=null;reject(request.error);};request.onblocked=()=>reject(new Error('Browser database busy'));}));}
 return {
  async read(){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('saves','readonly'),r=tx.objectStore('saves').get('player');r.onsuccess=()=>resolve(validSave(r.result));r.onerror=()=>reject(r.error);});},
  async write(data){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(data,'player');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Save interrupted'));});}
 };
}
