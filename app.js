


/* ======================
   ELEMENTS
====================== */

const homeScreen =
document.getElementById("homeScreen");

const editorScreen =
document.getElementById("editorScreen");

const readScreen =
document.getElementById("readScreen");

const coverScreen =
document.getElementById("coverScreen");

const pinScreen =
document.getElementById("pinScreen");

const diaryList =
document.getElementById("diaryList");

const searchInput =
document.getElementById("searchInput");

const searchCount =
document.getElementById("searchCount");
const statsBox =
document.getElementById(
"statsBox"
);
const newDiaryBtn =
document.getElementById("newDiaryBtn");

const backBtn =
document.getElementById("backBtn");

const deleteBtn =
document.getElementById("deleteBtn");

const exportBtn =
document.getElementById("exportBtn");

const importBtn =
document.getElementById("importBtn");

const importFile =
document.getElementById("importFile");

const themeBtn =
document.getElementById(
"themeBtn"
);
const passwordBtn =
document.getElementById(
"passwordBtn"
);
const cloudBtn =
document.getElementById(
"cloudBtn"
);
const dateInput =
document.getElementById("date");

const moodInput =
document.getElementById("mood");

const titleInput =
document.getElementById("title");

const contentInput =
document.getElementById("content");

const wordStats =
document.getElementById("wordStats");

const startBtn =
document.getElementById("startBtn");

const unlockBtn =
document.getElementById("unlockBtn");

const pinInput =
document.getElementById("pinInput");

const readBtn =
document.getElementById("readBtn");
const favoriteBtn =
document.getElementById(
"favoriteBtn"
);
const closeReadBtn =
document.getElementById("closeReadBtn");

const bookPage =
document.getElementById("bookPage");

const toolbar =
document.getElementById("toolbar");

const toggleToolbarBtn =
document.getElementById(
"toggleToolbarBtn"
);
/* WHAT'S NEW */

const APP_VERSION = "1.3";

const firebaseConfig = {
  apiKey: "AIzaSyCK-QCumbV2ojrey397si0VPoe33GVbR7g",
  authDomain: "diary-19eb6.firebaseapp.com",
  projectId: "diary-19eb6",
  storageBucket: "diary-19eb6.firebasestorage.app",
  messagingSenderId: "586066910431",
  appId: "1:586066910431:web:684c4a8335055c70bb9d6a"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

const dbCloud = firebase.firestore();

auth.getRedirectResult()
.then((result) => {

if(result.user){

alert(
"Connected:\n" +
result.user.email
);

}

})
.catch((err) => {

alert(
err.code + "\n\n" +
err.message
);

console.error(err);

});
async function uploadAllDiariesToCloud(){

if(!auth.currentUser) return;

for(const diary of diaries){

await dbCloud
.collection("users")
.doc(auth.currentUser.uid)
.collection("diaries")
.doc(String(diary.id))
.set(diary);

}

console.log(
"All Diaries Uploaded"
);

}

auth.onAuthStateChanged(async user => {

if(user){

if(
!localStorage.getItem(
"first_cloud_sync"
)
){
removeDuplicateDiaries();
await restoreFromCloud();

localStorage.setItem(
"first_cloud_sync",
"yes"
);

}



const btn =
document.getElementById(
"cloudBtn"
);

if(btn){

btn.innerText =
"☁️ Synced";

}

}

});

/* ======================
   INDEXED DB
====================== */

let db;

function openDB() {

  return new Promise((resolve, reject) => {

    const request =
    indexedDB.open(
      "DiaryDB",
      1
    );

    request.onupgradeneeded =
    e => {

      db =
      e.target.result;

      if(
        !db.objectStoreNames.contains(
          "diaries"
        )
      ){

        db.createObjectStore(
          "diaries",
          {
            keyPath:"id"
          }
        );

      }

    };

    request.onsuccess =
    e => {

      db =
      e.target.result;

      resolve(db);

    };

    request.onerror =
    e => {

      console.error(
        "DB Error",
        e
      );

      reject(e);

    };

  });

}

function loadDiaries(){

  return new Promise(
    (resolve,reject) => {

      const tx =
      db.transaction(
        "diaries",
        "readonly"
      );

      const store =
      tx.objectStore(
        "diaries"
      );

      const req =
      store.getAll();

      req.onsuccess =
      () => {

        resolve(
          req.result || []
        );

      };

      req.onerror =
      reject;

    }
  );

}

function saveDiaryToDB(
  diary
){

  return new Promise(
    (resolve,reject)=>{

      const tx =
      db.transaction(
        "diaries",
        "readwrite"
      );

      const store =
      tx.objectStore(
        "diaries"
      );

      const req =
      store.put(diary);

      req.onsuccess =
      () => resolve();

      req.onerror =
      reject;

    }
  );

}

function deleteDiaryFromDB(
  id
){

  return new Promise(
    (resolve,reject)=>{

      const tx =
      db.transaction(
        "diaries",
        "readwrite"
      );

      const store =
      tx.objectStore(
        "diaries"
      );

      const req =
      store.delete(id);

      req.onsuccess =
      () => resolve();

      req.onerror =
      reject;

    }
  );

}

function clearDiariesDB(){

  return new Promise(
    (resolve,reject)=>{

      const tx =
      db.transaction(
        "diaries",
        "readwrite"
      );

      const store =
      tx.objectStore(
        "diaries"
      );

      const req =
      store.clear();

      req.onsuccess =
      () => resolve();

      req.onerror =
      reject;

    }
  );

}

/* ======================
   DATA
====================== */

let diaries = [];

let trash =
JSON.parse(
localStorage.getItem(
"trash"
)
) || [];

let favoriteIds =
JSON.parse(
localStorage.getItem(
"favoriteIds"
)
) || [];

let currentId =
null;

let saveTimer =
null;
let cloudSyncPromise =
Promise.resolve();
function removeDuplicateDiaries(){

diaries = diaries.filter(
(d,index,self)=>

index ===
self.findIndex(
x => x.id === d.id
)

);

}

/* ======================
   PIN SYSTEM
====================== */

let APP_PIN =
localStorage.getItem(
"diary_pin"
);

let failedAttempts = 0;

let lockUntil =
Number(
localStorage.getItem(
"lock_until"
)
) || 0;

/* HASH PIN */

async function hashPin(pin){

const encoder =
new TextEncoder();

const data =
encoder.encode(pin);

const hashBuffer =
await crypto.subtle.digest(
"SHA-256",
data
);

const hashArray =
Array.from(
new Uint8Array(hashBuffer)
);

return hashArray
.map(
b => b.toString(16)
.padStart(2,"0")
)
.join("");

}

/* SETUP PIN */
async function setupPin(){

if(APP_PIN){

pinScreen.style.display =
"none";

}else{

pinScreen.style.display =
"none";

}

coverScreen.style.display =
"flex";


}
/* WAIT FOR PIN SETUP */

window.addEventListener(
"load",
async () => {

await setupPin();

if(APP_PIN){

passwordBtn.innerText =
"🔑 Password";

}else{

passwordBtn.innerText =
"🔐 Create Password";

}

}
);

/* ======================
   UNLOCK
====================== */

unlockBtn.onclick = async () => {

if(Date.now() < lockUntil){

const seconds = Math.ceil(
(lockUntil - Date.now()) / 1000
);

alert(
`Too many attempts.\nTry again in ${seconds}s`
);

return;

}

const pin =
pinInput.value.trim();

if(
!/^\d{4}$/.test(pin)
){

alert(
"Enter 4 Digit PIN"
);

return;

}

const hashedInput =
await hashPin(pin);

if(
hashedInput === APP_PIN
){

failedAttempts = 0;

lockUntil = 0;

localStorage.removeItem(
"lock_until"
);

pinScreen.style.display =
"none";

homeScreen.style.display =
"block";

pinInput.value = "";

}
else{

failedAttempts++;

if(failedAttempts >= 5){

lockUntil =
Date.now() +
(5 * 60 * 1000);

localStorage.setItem(
"lock_until",
lockUntil
);

failedAttempts = 0;

alert(
"Too many wrong PINs.\nLocked for 5 minutes."
);

}
else{

alert(
`Wrong PIN\nRemaining: ${
5 - failedAttempts
}`
);

}

pinInput.value = "";

}

};

/* ======================
   PASSWORD BUTTON
====================== */

async function changePin(){

if(!APP_PIN){

const newPin =
prompt(
"Create New 4 Digit PIN"
);

if(
!newPin ||
!/^\d{4}$/.test(newPin)
){
alert(
"PIN Must Be Exactly 4 Digits"
);
return;
}

const newHash =
await hashPin(newPin);

localStorage.setItem(
"diary_pin",
newHash
);

APP_PIN = newHash;

passwordBtn.innerText =
"🔑 Password";

alert(
"Password Created Successfully"
);

return;

}
const action =
prompt(

`Password Menu

1 = Change Password
2 = Remove Password`

);

if(!action){
return;
}

if(action === "2"){

const currentPin =
prompt(
"Enter Current PIN"
);

if(!currentPin){
return;
}

const currentHash =
await hashPin(
currentPin
);

if(currentHash !== APP_PIN){

alert(
"Wrong Current PIN"
);

return;
}

localStorage.removeItem(
"diary_pin"
);

APP_PIN = null;

passwordBtn.innerText =
"🔐 Create Password";

alert(
"Password Removed Successfully"
);

return;

}
const oldPin =
prompt(
"Enter Current PIN"
);

if(!oldPin) return;

const oldHash =
await hashPin(oldPin);

if(oldHash !== APP_PIN){

alert(
"Wrong Current PIN"
);

return;

}

const newPin =
prompt(
"Enter New 4 Digit PIN"
);

if(
!newPin ||
!/^\d{4}$/.test(newPin)
){
alert(
"PIN Must Be Exactly 4 Digits"
);
return;
}

const newHash =
await hashPin(newPin);

localStorage.setItem(
"diary_pin",
newHash
);

APP_PIN = newHash;

alert(
"PIN Updated Successfully"
);

}

passwordBtn.onclick = () => {

changePin();

};

cloudBtn.onclick = async () => {

if(auth.currentUser){

alert(
"Connected:\n" +
auth.currentUser.email
);

return;

}

try{

const provider =
new firebase.auth.GoogleAuthProvider();

const result =
await auth.signInWithPopup(
provider
);

alert(
"Connected:\n" +
result.user.email
);

}
catch(err){

alert(
"ERROR:\n" +
err.code +
"\n\n" +
err.message
);

console.error(err);

}

};
/* ======================
   COVER PAGE
====================== */

startBtn.onclick = () => {

coverScreen.style.display =
"none";

if(APP_PIN){

pinScreen.style.display =
"flex";

pinInput.focus();

return;

}

homeScreen.style.display =
"block";

const lastSeenVersion =
localStorage.getItem(
"lastSeenVersion"
);

if(lastSeenVersion !== APP_VERSION){

document.getElementById(
"whatsNewPopup"
).style.display =
"flex";

}

};

/* ======================
   NEW DIARY
====================== */

newDiaryBtn.onclick = () => {

currentId = null;
favoriteBtn.innerText =
"⭐ Favorite";

dateInput.value =
new Date()
.toISOString()
.split("T")[0];

moodInput.value = "";

titleInput.value = "";

contentInput.innerHTML = "";
contentInput.scrollTop = 0;
updateWordStats();

homeScreen.style.display =
"none";

editorScreen.style.display =
"block";

};


/* ======================
   OPEN DIARY
====================== */

function openDiary(id){

const diary =
diaries.find(
d => d.id === id
);

if(!diary) return;

currentId = id;

favoriteBtn.innerText =

favoriteIds.includes(id)

? "💛 Favorited"

: "⭐ Favorite";

dateInput.value =
diary.date || "";

moodInput.value =
diary.mood || "";

titleInput.value =
diary.title || "";

contentInput.innerHTML =
DOMPurify.sanitize(
diary.content || ""
);

updateWordStats();

homeScreen.style.display =
"none";

editorScreen.style.display =
"block";

}


/* ======================
   AUTO SAVE
====================== */



let statsTimer;

contentInput.addEventListener(
"input",
() => {

clearTimeout(statsTimer);

statsTimer =
setTimeout(
updateWordStats,
200
);

}
);

/* ======================
   SAVE DIARY
====================== */

async function saveDiary(){

if(!db){
return;
}

removeDuplicateDiaries();

const title =
titleInput.value.trim();

const content =
contentInput.innerHTML.trim();

const mood =
moodInput.value.trim();

if(
title === "" &&
content === "" &&
mood === ""
){
return;
}

const safeContent =
DOMPurify.sanitize(
contentInput.innerHTML
);

const plainText =
stripHtml(safeContent);

const totalWords =
(
plainText.match(/\S+/g)
|| []
).length;

/* ======================
   UPDATE EXISTING DIARY
====================== */

if(currentId){

const index =
diaries.findIndex(
d => d.id === currentId
);

if(index > -1){

diaries[index] = {

...diaries[index],

date:
dateInput.value,

searchText:
(
dateInput.value +
" " +
moodInput.value +
" " +
titleInput.value +
" " +
plainText
).toLowerCase(),

mood:
moodInput.value,

title:
titleInput.value,

content:
safeContent,

plainText:
plainText,

wordCount:
totalWords,

updatedAt:
Date.now()

};

try{

await saveDiaryToDB(
diaries[index]
);

await syncDiaryToCloud(
diaries[index]
);

}catch(err){

console.error(
"Save Error:",
err
);

}

}

}

/* ======================
   CREATE NEW DIARY
====================== */

else{

const diary = {

id:
Date.now()
+
Math.floor(
Math.random()*1000
),

deleted:false,

date:
dateInput.value,

searchText:
(
dateInput.value +
" " +
moodInput.value +
" " +
titleInput.value +
" " +
plainText
).toLowerCase(),

mood:
moodInput.value,

title:
titleInput.value,

content:
safeContent,

plainText:
plainText,

wordCount:
totalWords,

updatedAt:
Date.now()

};

diaries.unshift(
diary
);

try{

await saveDiaryToDB(
diary
);

await syncDiaryToCloud(
diary
);

}catch(err){

console.error(
"Save Error:",
err
);

}

currentId =
diary.id;

}

updateDiaryStats();

}

function syncDiaryToCloud(diary){

if(!auth.currentUser){
return Promise.resolve();
}

cloudSyncPromise =
cloudSyncPromise
.then(() => {

return dbCloud
.collection("users")
.doc(auth.currentUser.uid)
.collection("diaries")
.doc(String(diary.id))
.set(diary);

})
.catch(err => {

console.error(
"Cloud Sync Error:",
err
);

});

return cloudSyncPromise;

}

async function restoreFromCloud(){

if(!auth.currentUser){

alert("Login First");
return;

}

const snap = await dbCloud
.collection("users")
.doc(auth.currentUser.uid)
.collection("diaries")
.get();

if(snap.empty){

alert("No Cloud Backup Found");
return;

}

let added = 0;
let updated = 0;

removeDuplicateDiaries();

for(const doc of snap.docs){

const cloudDiary = doc.data();

if(cloudDiary.deleted){
continue;
}

const index =
diaries.findIndex(
d => d.id === cloudDiary.id
);

if(index === -1){

const exists =
diaries.some(
d => d.id === cloudDiary.id
);

if(!exists){

diaries.push(
cloudDiary
);

await saveDiaryToDB(
cloudDiary
);

added++;

}

}else{

if(
(cloudDiary.updatedAt || 0)
>
(diaries[index].updatedAt || 0)
){

diaries[index] =
cloudDiary;

await saveDiaryToDB(
cloudDiary
);

updated++;

}

}

}

removeDuplicateDiaries();

renderDiaries();

updateDiaryStats();

alert(
`Added: ${added}
Updated: ${updated}`
);

}
/* ======================
   BACK
====================== */

function goBackHome() {

    saveDiary();

    editorScreen.style.display = "none";
    readScreen.style.display = "none";
    homeScreen.style.display = "block";

    renderDiaries();
}

backBtn.onclick = goBackHome;

window.addEventListener("popstate", goBackHome);

/* ======================
   FAVORITE
====================== */

favoriteBtn.onclick = () => {

if(!currentId){

alert(
"No diary selected"
);

return;

}

if(
favoriteIds.includes(
currentId
)
){

favoriteIds =
favoriteIds.filter(
id => id !== currentId
);

favoriteBtn.innerText =
"⭐ Favorite";

}
else{

favoriteIds = [

...new Set([
...favoriteIds,
currentId
])

];

favoriteBtn.innerText =
"💛 Favorited";

}

localStorage.setItem(
"favoriteIds",
JSON.stringify(
favoriteIds
)
);

};
/* ======================
   DELETE DIARY
====================== */

deleteBtn.onclick = () => {

if(!currentId){

alert(
"No diary selected"
);

return;

}

if(
!confirm(
"Move this diary to Trash?"
)
){
return;
}

const diary =
diaries.find(
d => d.id === currentId
);

if(diary){

trash.unshift({

...diary,

deletedAt:
Date.now()

});

localStorage.setItem(

"trash",

JSON.stringify(
trash
)

);

}

diaries =
diaries.filter(
d => d.id !== currentId
);

favoriteIds =
favoriteIds.filter(
id => id !== currentId
);

localStorage.setItem(

"favoriteIds",

JSON.stringify(
favoriteIds
)

);

deleteDiaryFromDB(
currentId
);

if(auth.currentUser && diary){

dbCloud
.collection("users")
.doc(auth.currentUser.uid)
.collection("diaries")
.doc(String(currentId))
.update({

deleted:true,
deletedAt:Date.now()

})
.catch(console.error);

}
currentId = null;

editorScreen.style.display =
"none";

homeScreen.style.display =
"block";

updateDiaryStats();

renderDiaries();

alert(
"Moved to Trash"
);

};
/* ======================
   HTML REMOVE
====================== */

function stripHtml(html){

const temp =
document.createElement(
"div"
);

temp.innerHTML =
html;

return (
temp.textContent ||
temp.innerText ||
""
);

}

function escapeHtml(text){

const div =
document.createElement("div");

div.textContent =
text || "";

return div.innerHTML;

}

/* ======================
   TIME AGO
====================== */

function timeAgo(timestamp){

if(!timestamp){
return "";
}

const seconds =
Math.floor(
(Date.now() - timestamp)
/ 1000
);

if(seconds < 60){
return "Just now";
}

if(seconds < 3600){

const minutes =
Math.floor(
seconds / 60
);

return minutes === 1

? "1 min ago"

: `${minutes} min ago`;

}

if(seconds < 86400){

const hours =
Math.floor(
seconds / 3600
);

return hours === 1

? "1 hour ago"

: `${hours} hours ago`;

}

const days =
Math.floor(
seconds / 86400
);

return days === 1

? "1 day ago"

: `${days} days ago`;

}
/* ======================
   SAFE SEARCH
====================== */

function safeText(value){

return (
value || ""
)
.toString()
.toLowerCase();

}

/* ======================
   PAGINATION
====================== */

const PAGE_SIZE = 500;

let currentPage = 1;
/* ======================
   RENDER DIARIES
====================== */

function renderDiaries(){

const keyword =
safeText(
searchInput.value.trim()
);

diaryList.innerHTML = "";

const fragment =
document.createDocumentFragment();

let filtered =
diaries.filter(
diary => {

const searchText =
(
diary.searchText ||

(
(diary.date || "") +
" " +
(diary.mood || "") +
" " +
(diary.title || "") +
" " +
(diary.plainText || "")
).toLowerCase()

);

return (
!keyword ||
searchText.includes(keyword)
);
}
);
/* FAVORITES FIRST */

filtered.sort(
(a,b) => {

const favA =
favoriteIds.includes(a.id);

const favB =
favoriteIds.includes(b.id);

return Number(favB) -
Number(favA);

}
);

const totalResults =
filtered.length;

filtered =
filtered.slice(
0,
PAGE_SIZE * currentPage
);

searchCount.innerText =
totalResults === 1
? "1 diary found"
: `${totalResults} diaries found`;

if(filtered.length === 0){

diaryList.innerHTML =

`
<div class="card">

<div class="dateBox jan">

<div class="month">
INFO
</div>

<div class="day">
0
</div>

<div class="year">
----
</div>

</div>

<div class="diaryInfo">

<h3>
📭 No Diaries
</h3>

<p class="preview">
Create your first diary
</p>

</div>

</div>
`;

return;

}

filtered.forEach(
diary => {

const card =
document.createElement(
"div"
);

card.className =
"card";

let preview =
(diary.plainText || "")
.trim()
.substring(0,80);

if(!preview){
  preview = "No content";
}
const wordCount =
diary.wordCount || 0;

if(keyword){

const regex =
new RegExp(
`(${keyword})`,
"gi"
);

preview =
preview.replace(
regex,
"<mark>$1</mark>"
);

}
const editedText =
diary.updatedAt
? new Date(diary.updatedAt)
    .toLocaleString("en-US",{
      day:"2-digit",
      month:"short",
      year:"numeric",
      hour:"numeric",
      minute:"2-digit",
      hour12:true
    })
    .replace(",", " •")
: "";

let titleText =
diary.title || "Untitled";

if(keyword){

const regex =
new RegExp(
`(${keyword})`,
"gi"
);

titleText =
titleText.replace(
regex,
"<mark>$1</mark>"
);

}

const d = diary.date
? new Date(diary.date)
: new Date();

const day =
String(
d.getDate()
).padStart(2,"0");

const year =
d.getFullYear();

const month =
d.toLocaleString(
"en-US",
{
month:"short"
}
).toUpperCase();

let monthClass = "";

switch(month){

case "JAN":
monthClass = "jan";
break;

case "FEB":
monthClass = "feb";
break;

case "MAR":
monthClass = "mar";
break;

case "APR":
monthClass = "apr";
break;

case "MAY":
monthClass = "may";
break;

case "JUN":
monthClass = "jun";
break;

case "JUL":
monthClass = "jul";
break;

case "AUG":
monthClass = "aug";
break;

case "SEP":
monthClass = "sep";
break;

case "OCT":
monthClass = "oct";
break;

case "NOV":
monthClass = "nov";
break;

case "DEC":
monthClass = "dec";
break;

default:
monthClass = "jan";

}

card.innerHTML =

`
<div class="dateBox ${monthClass}">

<div class="month">
${month}
</div>

<div class="day">
${day}
</div>

<div class="year">
${year}
</div>

</div>

<div class="diaryInfo">

<h3>
${
favoriteIds.includes(
diary.id
)
? "⭐ "
: ""
}
${titleText}
</h3>

<p class="preview">
${preview}
</p>

<p class="wordCount">
✍️ ${wordCount.toLocaleString()} Words
</p>

<small class="editedTime">
🕒 ${editedText}
</small>

</div>
`;

card.onclick = () => {

openDiary(
diary.id
);

};

fragment.appendChild(
card
);

}
);

diaryList.appendChild(
fragment
);
}
/* ======================
   HOME SEARCH
====================== */

let searchTimer = null;

searchInput.addEventListener(
"input",
() => {

clearTimeout(
searchTimer
);

searchTimer =
setTimeout(
() => {

currentPage = 1;

requestAnimationFrame(
renderDiaries
);

},
300
);

}
);
/* ======================
   DIARY STATS
====================== */

function updateDiaryStats(){

if(!statsBox) return;

const totalDiaries =
diaries.length;

const totalWords =
diaries.reduce(
(sum, diary) => {

return (
sum +
(diary.wordCount || 0)
);

},
0
);

statsBox.innerHTML =

`📚 Total Diaries: ${totalDiaries}<br>
✍️ Total Words: ${totalWords.toLocaleString()}`;

}

/* ======================
   WORD STATS
====================== */

function updateWordStats(){

const text =
stripHtml(
contentInput.innerHTML
);

const words =
(
text.match(/\S+/g)
|| []
).length;

const charsWithSpace =
text.length;

const charsWithoutSpace =
text.replace(/\s/g,"").length;

wordStats.innerText =
`Words: ${words} | Chars(with space): ${charsWithSpace} | Chars(no space): ${charsWithoutSpace}`;

}

/* ======================
READ MODE
====================== */

let readingTimer = null;

readBtn.onclick = () => {

  saveDiary();

  const safeContent =
  DOMPurify.sanitize(
    contentInput.innerHTML
  );

  const plainText =
  stripHtml(safeContent);

  const totalWords =
(
plainText.match(/\S+/g)
|| []
).length;

  bookPage.innerHTML = `
<div class="fixedActionBar readActionBar">

  <div class="readTopRow">

    <button id="closeReadBtn">
      ← Back
    </button>

    <input
      type="text"
      id="readSearchInput"
      placeholder="🔍 Search">

  </div>

  <div class="readStatsRow">

    <span id="progressCounter">
      📊 0%
    </span>

    <span id="readingCounter">
      📖 0s
    </span>

<span id="wordCounter">
  ✍️ ${totalWords.toLocaleString()}
</span>

  </div>

</div>



  <div class="readHeader">
    <span>📅 ${dateInput.value || ""}</span>
    <span>😊 ${moodInput.value || ""}</span>
  </div>

  <h2 class="readTitle">
    ${titleInput.value || "Untitled"}
  </h2>

  <div class="readContent">
    ${safeContent}
  </div>

  `;

  editorScreen.style.display = "none";
  readScreen.style.display = "block";

  const closeBtn =
  document.getElementById(
    "closeReadBtn"
  );

  closeBtn.onclick = () => {

    localStorage.setItem(
      "readingScroll",
      bookPage.scrollTop
    );

    clearInterval(
      readingTimer
    );

    readScreen.style.display =
    "none";

    editorScreen.style.display =
    "block";

  };

  const savedScroll =
  parseInt(
    localStorage.getItem(
      "readingScroll"
    ) || "0"
  );

  bookPage.scrollTop =
  savedScroll;

  const updateProgress = () => {

    const scrollTop =
    bookPage.scrollTop;

    const maxScroll =
    bookPage.scrollHeight -
    bookPage.clientHeight;

    const percent =
    maxScroll > 0
    ? Math.round(
      (scrollTop / maxScroll) * 100
    )
    : 100;


    const fill =
    document.getElementById(
      "readingProgressFill"
    );

    if(fill){
      fill.style.width =
      percent + "%";
    }

    const progress =
    document.getElementById(
      "progressCounter"
    );

    if(progress){
      progress.innerText =
      `📊 ${percent}%`;
    }


  };

  updateProgress();

  bookPage.onscroll =
  updateProgress;
const readSearchInput =
document.getElementById(
"readSearchInput"
);
let readSearchTimer;
readSearchInput?.addEventListener(
"input",
e => {

clearTimeout(
readSearchTimer
);

readSearchTimer =
setTimeout(() => {

const keyword =
e.target.value.trim();
const words =
keyword
.split(/\s+/)
.filter(Boolean);
const readContent =
document.querySelector(
".readContent"
);

if(!readContent) return;

readContent.innerHTML =
safeContent;
const plainText =
readContent.innerText;
if(!keyword) return;

let highlighted =
plainText;

words.forEach(word => {

const regex =
new RegExp(
`(${word})`,
"gi"
);

highlighted =
highlighted.replace(
regex,
"<mark>$1</mark>"
);

});

readContent.innerHTML =
highlighted;

},300);

}
);
  let seconds = 0;

  clearInterval(
    readingTimer
  );

  readingTimer =
  setInterval(() => {

    seconds++;

    const counter =
    document.getElementById(
      "readingCounter"
    );

    if(counter){
      counter.innerText =
      `📖 ${seconds}s`;
    }

  }, 1000);

};


/* ======================
   FORMAT HELPER
====================== */

function applyCommand(
command,
value = null
){

contentInput.focus();

document.execCommand(
command,
false,
value
);

}



/* ======================
   BUTTON REFERENCES
====================== */

const boldBtn =
document.getElementById(
"boldBtn"
);

const underlineBtn =
document.getElementById(
"underlineBtn"
);

const yellowBtn =
document.getElementById(
"yellowBtn"
);

const greenBtn =
document.getElementById(
"greenBtn"
);

const blueBtn =
document.getElementById(
"blueBtn"
);

const pinkBtn =
document.getElementById(
"pinkBtn"
);

const redBtn =
document.getElementById(
"redBtn"
);

const blueColorBtn =
document.getElementById(
"blueColorBtn"
);

const greenColorBtn =
document.getElementById(
"greenColorBtn"
);

const blackBtn =
document.getElementById(
"blackBtn"
);

const normalBtn =
document.getElementById(
"normalBtn"
);

const fontPlus =
document.getElementById(
"fontPlus"
);

const fontMinus =
document.getElementById(
"fontMinus"
);

const leftBtn =
document.getElementById(
"leftBtn"
);

const centerBtn =
document.getElementById(
"centerBtn"
);

const rightBtn =
document.getElementById(
"rightBtn"
);


/* ======================
   BOLD
====================== */

boldBtn.onclick = () => {

applyCommand(
"bold"
);

};


/* ======================
   UNDERLINE
====================== */

underlineBtn.onclick = () => {

applyCommand(
"underline"
);

};


/* ======================
   HIGHLIGHT COLORS
====================== */

yellowBtn.onclick = () => {

applyCommand(
"hiliteColor",
"#fff176"
);

};

greenBtn.onclick = () => {

applyCommand(
"hiliteColor",
"#b9f6ca"
);

};

blueBtn.onclick = () => {

applyCommand(
"hiliteColor",
"#81d4fa"
);

};

pinkBtn.onclick = () => {

applyCommand(
"hiliteColor",
"#f8bbd0"
);

};


/* ======================
   TEXT COLORS
====================== */

redBtn.onclick = () => {

applyCommand(
"foreColor",
"red"
);

};

blueColorBtn.onclick = () => {

applyCommand(
"foreColor",
"blue"
);

};

greenColorBtn.onclick = () => {

applyCommand(
"foreColor",
"green"
);

};

blackBtn.onclick = () => {

applyCommand(
"foreColor",
"black"
);

};


/* ======================
   NORMAL
====================== */

normalBtn.onclick = () => {

applyCommand(
"removeFormat"
);

};


/* ======================
   FONT SIZE
====================== */

fontPlus.onclick = () => {

applyCommand(
"fontSize",
"5"
);

};

fontMinus.onclick = () => {

applyCommand(
"fontSize",
"3"
);

};


/* ======================
   ALIGNMENT
====================== */

leftBtn.onclick = () => {

applyCommand(
"justifyLeft"
);

};

centerBtn.onclick = () => {

applyCommand(
"justifyCenter"
);

};

rightBtn.onclick = () => {

applyCommand(
"justifyRight"
);

};


/* ======================
   TOOLBAR STATE
====================== */

const savedToolbarState =
localStorage.getItem(
"toolbar_open"
);

if(
savedToolbarState === "yes"
){
toolbar.classList.add(
"show"
);
}

toggleToolbarBtn.onclick = () => {

toolbar.classList.toggle(
"show"
);

localStorage.setItem(
"toolbar_open",

toolbar.classList.contains(
"show"
)
? "yes"
: "no"
);

};

/* ======================
   EXPORT MENU
====================== */

exportBtn.onclick = () => {

const action =
prompt(

`Backup Menu

1 = Export JSON
2 = Export DOCX`

);

if(action === "1"){
exportJSON();
}
else if(action === "2"){
exportDOCX();
}

};
/* ======================
   IMPORT JSON
====================== */

importBtn.onclick = () => {

const action =
prompt(

`Restore Menu

1 = Restore from JSON
2 = Trash
3 = Cloud Trash`

);

if(action === "1"){

importFile.click();

}

else if(action === "2"){

const trashAction =
prompt(

`Trash Menu

1 = Open Trash
2 = Reset Trash`

);

if(trashAction === "1"){

openTrash();

}
else if(trashAction === "2"){

resetTrash();

}

}

else if(action === "3"){

const cloudAction =
prompt(

`Cloud Trash Menu

1 = Open Cloud Trash
2 = Reset Cloud Trash`

);

if(cloudAction === "1"){

openCloudTrash();

}
else if(cloudAction === "2"){

resetCloudTrash();

}

}

};
importFile.addEventListener(
"change",
event => {

const file =
event.target.files[0];

if(!file) return;

const reader =
new FileReader();

reader.onload = async e => {

try{

const data =
JSON.parse(
e.target.result
);

if(
!Array.isArray(data)
){

throw new Error();

}

/* SANITIZE + REBUILD CACHE */

data.forEach(item => {

item.content =
DOMPurify.sanitize(
item.content || ""
);

const plainText =
stripHtml(
item.content
);

item.plainText =
plainText;

item.wordCount =
(
plainText.match(/\S+/g)
|| []
).length;

item.preview =
plainText
.substring(0,160);
item.searchText =
(
(item.date || "") +
" " +
(item.mood || "") +
" " +
(item.title || "") +
" " +
plainText
).toLowerCase();
item.updatedAt =
item.updatedAt ||
Date.now();

});

/* VALIDATE */

const valid =
data.every(
item => {

return (

typeof item ===
"object"

&&

"id" in item

&&

"title" in item

&&

"content" in item

);

}
);

if(!valid){

throw new Error();

}

/* ======================
   MERGE OR REPLACE
====================== */

const mergeMode =
confirm(

"OK = Merge Backup\n\nCancel = Replace All Diaries"

);

if(mergeMode){

diaries = [
...diaries,
...data
];

}
else{

await clearDiariesDB();

diaries = data;

}

/* ======================
   REMOVE DUPLICATES
====================== */

diaries = diaries.filter(
(d,index,self) =>

index ===
self.findIndex(
x => x.id === d.id
)

);

/* SAVE TO INDEXEDDB */

for(
const diary of diaries
){

await saveDiaryToDB(
diary
);

}

/* REFRESH UI */

renderDiaries();

updateDiaryStats();

updateWordStats();

alert(
"Backup Restored Successfully"
);

}catch(error){

console.error(
error
);

alert(
"Invalid Backup File"
);

}

importFile.value = "";

};

reader.readAsText(
file
);

}
);


/* ======================
   TRASH BIN
====================== */

function openTrash(){

if(
trash.length === 0
){

alert(
"Trash is empty"
);

return;

}

const items =
trash.map(
(d,index) =>

`${index + 1}. ${d.title || "Untitled"}`
)
.join("\n");

const choice =
prompt(

`Trash Bin\n\n${items}\n\nEnter Number To Restore`

);

if(!choice) return;

const index =
parseInt(choice) - 1;

if(
isNaN(index) ||
!trash[index]
){
return;
}

const diary =
trash[index];

if(
diaries.some(
d => d.id === diary.id
)
){

alert(
"Diary already exists"
);

return;

}

const {
deletedAt,
...cleanDiary
} = diary;

diaries.unshift(
cleanDiary
);
removeDuplicateDiaries();
saveDiaryToDB(
cleanDiary
);

syncDiaryToCloud(
cleanDiary
);

trash.splice(
index,
1
);

localStorage.setItem(
"trash",
JSON.stringify(trash)
);

diaries = diaries.filter(
(d,index,self)=>

index ===
self.findIndex(
x => x.id === d.id
)

);

renderDiaries();

updateDiaryStats();

alert(
"Diary Restored"
);

}
function resetTrash(){

if(trash.length === 0){

alert(
"Trash is already empty"
);

return;

}

if(
!confirm(
"Delete all Trash items permanently?"
)
){
return;
}

trash = [];

localStorage.setItem(
"trash",
JSON.stringify([])
);

alert(
"Trash Reset Complete"
);

}
async function openCloudTrash(){

if(!auth.currentUser){

alert("Login First");
return;

}

const snap = await dbCloud
.collection("users")
.doc(auth.currentUser.uid)
.collection("diaries")
.get();

const trashItems =
snap.docs
.map(doc => doc.data())
.filter(
d => d.deleted === true
);

if(trashItems.length === 0){

alert("Cloud Trash Empty");
return;

}

const items =
trashItems.map(
(d,index)=>

`${index+1}. ${d.title || "Untitled"}`
).join("\n");

const choice =
prompt(

`Cloud Trash\n\n${items}\n\nEnter Number To Restore`

);

if(!choice) return;

const index =
parseInt(choice)-1;

if(
isNaN(index) ||
!trashItems[index]
){
return;
}

const diary =
trashItems[index];

diary.deleted = false;

delete diary.deletedAt;

await dbCloud
.collection("users")
.doc(auth.currentUser.uid)
.collection("diaries")
.doc(String(diary.id))
.set(diary);

if(
!diaries.some(
d => d.id === diary.id
)
){

diaries.unshift(diary);

await saveDiaryToDB(diary);

renderDiaries();

updateDiaryStats();

}

alert(
"Diary Restored From Cloud Trash"
);

}

async function resetCloudTrash(){

if(!auth.currentUser){

alert("Login First");
return;

}

if(
!confirm(
"Delete all Cloud Trash items?"
)
){
return;
}

const snap = await dbCloud
.collection("users")
.doc(auth.currentUser.uid)
.collection("diaries")
.get();

const trashItems =
snap.docs.filter(
doc => doc.data().deleted === true
);

for(const doc of trashItems){

await doc.ref.delete();

}

alert(
`Deleted ${trashItems.length} Cloud Trash items`
);

}
/* ======================
   EXPORT JSON
====================== */

function exportJSON(){

saveDiary();

const blob =
new Blob(
[
JSON.stringify(
diaries,
null,
2
)
],
{
type:"application/json"
}
);

const url =
URL.createObjectURL(
blob
);

const a =
document.createElement(
"a"
);

a.href = url;

a.download =
"DiaryBackup.json";

document.body.appendChild(
a
);

a.click();

document.body.removeChild(
a
);

URL.revokeObjectURL(
url
);

}
/* ======================
   EXPORT DOCX
====================== */

async function exportDOCX(){

saveDiary();

const children = [];

diaries.forEach(
(d,index) => {

const temp =
document.createElement(
"div"
);

temp.innerHTML =
d.content || "";

/* DATE */

children.push(

new docx.Paragraph({

text:
`Date : ${d.date || ""}`,

spacing:{
after:200
}

})

);

/* TITLE */

children.push(

new docx.Paragraph({

text:
`Title : ${d.title || "Untitled"}`,

heading:
docx.HeadingLevel.HEADING_1,

spacing:{
after:200
}

})

);

/* MOOD */

children.push(

new docx.Paragraph({

text:
`Mood : ${d.mood || ""}`,

spacing:{
after:300
}

})

);

/* DIVIDER */

children.push(

new docx.Paragraph({

text:
"────────────────────────",

spacing:{
after:300
}

})

);

/* CONTENT */

children.push(

new docx.Paragraph({

text:
temp.innerText,

spacing:{
after:400
}

})

);

/* PAGE BREAK */

if(
index <
diaries.length - 1
){

children.push(

new docx.Paragraph({

pageBreakBefore:true

})

);

}

}
);

const doc =
new docx.Document({

sections:[
{
children
}
]

});

const blob =
await docx.Packer.toBlob(
doc
);

const url =
URL.createObjectURL(
blob
);

const a =
document.createElement(
"a"
);

a.href = url;

a.download =
"Diary.docx";

a.click();

URL.revokeObjectURL(
url
);

}

/* ======================
   SERVICE WORKER
====================== */

if(
"serviceWorker"
in navigator
){

window.addEventListener(
"load",
() => {

navigator
.serviceWorker
.register(
"./service-worker.js"
)
.catch(
console.error
);

}
);

}

window.onerror = function(msg, src, line, col, err){

console.error(
"APP ERROR:",
msg,
"Line:",
line
);

};

trash = trash.filter(
item =>

Date.now() -
(item.deletedAt || 0)

<

30 * 24 * 60 * 60 * 1000
);

localStorage.setItem(
"trash",
JSON.stringify(trash)
);

/* ======================
   THEME
====================== */

const savedTheme =

localStorage.getItem(
"theme"
) || "light";

document.documentElement
.setAttribute(
"data-theme",
savedTheme
);

themeBtn.innerText =

savedTheme === "dark"

? "☀️ Light"

: "🌙 Dark";

themeBtn.onclick = () => {

const current =

document.documentElement
.getAttribute(
"data-theme"
);

const next =

current === "dark"

? "light"

: "dark";

document.documentElement
.setAttribute(
"data-theme",
next
);

localStorage.setItem(
"theme",
next
);

themeBtn.innerText =

next === "dark"

? "☀️ Light"

: "🌙 Dark";

};

/* ======================
   FINAL INIT
====================== */

(async () => {

  await openDB();

  diaries =
  await loadDiaries();
diaries.forEach(d => {

if(!d.searchText){

d.searchText =
(
(d.date || "") +
" " +
(d.mood || "") +
" " +
(d.title || "") +
" " +
(d.plainText || "")
).toLowerCase();

saveDiaryToDB(d);

}

});
  diaries.sort(
    (a,b) =>
    (b.updatedAt || 0)
    -
    (a.updatedAt || 0)
  );

  favoriteIds =
  favoriteIds.filter(
    id =>
    diaries.some(
      d => d.id === id
    )
  );

  localStorage.setItem(
    "favoriteIds",
    JSON.stringify(
      favoriteIds
    )
  );

  renderDiaries();

  updateDiaryStats();

  updateWordStats();

})();
window.addEventListener(
"online",
async ()=>{

console.log(
"Internet Connected"
);

if(
auth.currentUser &&
diaries.length > 0
){

await uploadAllDiariesToCloud();

}

}
);

document.addEventListener(
"click",
e => {

if(
e.target.id ===
"closeWhatsNew"
){

localStorage.setItem(
"lastSeenVersion",
APP_VERSION
);

document.getElementById(
"whatsNewPopup"
).style.display =
"none";

}

}
);