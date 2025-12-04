const fs = require('fs');
const path = __dirname + '/antigaliStatus.json';

let offenseTracker = {}; // threadID -> userID -> { count, uidSaved }
const badWords = [
"fuck", "fucking", "motherfucker", "mother fucker", "abal","fucker", "bitch", "bitch", "slut", "whore", "asshole", "bastard", "dick", "chdi","retard", "pussy", "cunt","gay", "lesbian", "xodi", "nigga", "nigger", "cock", "jerk", "wanker", "porn", "sucker", "bollocks", "bloodyhell", "xoda", "bullshit", "voda", "douche", "douchebag", "moron","hada", "scumbag", "Head", "prick", "fag", "faggot", "মাদারচোদ", "চুদি", "মাগি", "কার বাল", "সাউয়া বেডি", "নিছের বাল", "চোকাচোদা", "চুদবো", "চুদানির পোলা", "মাং", "সাউয়া", "তোর সাউয়া", "মাংগের বেডি", "মাংগের গুপ", "বালের গুপ", "গিটার বাজাও", "জাও গিটার বাজাও", "হাত মারবে", "হাত মারবো", "হাত মারো", "হাত মাড়ি", "হাত মারতে জাবে", "গিটার বাজাবো", "পুটকি", "রেন্ডির ছেলে", "রেন্ডি মেয়ে", "রেন্ডি", "এডমিন এর বাল","সাউয়ার গুপ", "মাংগের গুপ", "আবাল নাকি", "জুয়েল চোকাচোদা", "বোকাচোদা জুয়েল", "জুয়েল কে চুদি"
];

// 🔹 স্ট্যাটাস লোড
function loadStatus() {
if (!fs.existsSync(path)) return false;
try {
const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
return data.status || false;
} catch {
return false;
}
}

// 🔹 স্ট্যাটাস সেভ (এখন আর দরকার নেই, তবু রাখলাম)
function saveStatus(status) {
fs.writeFileSync(path, JSON.stringify({ status }), 'utf-8');
}

// রানটাইমে স্ট্যাটাস লোড
let antiGaliStatus = loadStatus();

// এখন থেকে সবসময় চালু থাকবে (অটো অন)
antiGaliStatus = true;

module.exports.config = {
name: "antigali",
version: "3.4.0",
hasPermssion: 0,
credits: "MR JUWEL",
description: "বাংলা Anti-Gali সিস্টেম (সতর্কবার্তা + কিক)",
commandCategory: "moderation",
usages: "",
cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event, Threads }) {
try {
if (!antiGaliStatus || !event.body) return;

const message = event.body.toLowerCase();  
const threadID = event.threadID;  
const userID = event.senderID;  
const botID = api.getCurrentUserID && api.getCurrentUserID();  

if (!offenseTracker[threadID]) offenseTracker[threadID] = {};  
if (!offenseTracker[threadID][userID]) offenseTracker[threadID][userID] = { count: 0, uidSaved: userID };  

if (!badWords.some(word => message.includes(word))) return;  

let userData = offenseTracker[threadID][userID];  
userData.count += 1;  
const count = userData.count;  

// ব্যবহারকারীর নাম বের করা  
let userInfo = {};  
try {  
  userInfo = await api.getUserInfo(userID);  
} catch {}  
const userName = userInfo[userID]?.name || "অজানা ব্যবহারকারী";  

// থ্রেড ইনফো (অ্যাডমিন চেক)  
let threadInfo = {};  
try {  
  if (Threads && typeof Threads.getData === "function") {  
    const tdata = await Threads.getData(threadID);  
    threadInfo = tdata.threadInfo || {};  
  } else if (typeof api.getThreadInfo === "function") {  
    threadInfo = await api.getThreadInfo(threadID) || {};  
  }  
} catch {}  

const isAdminInThread = (uid) => {  
  try {  
    if (!threadInfo || !threadInfo.adminIDs) return false;  
    return threadInfo.adminIDs.some(item => {  
      if (typeof item === "string") return item == String(uid);  
      if (item && item.id) return String(item.id) == String(uid);  
      return false;  
    });  
  } catch {  
    return false;  
  }  
};  

// 🔰 বাংলা সতর্কবার্তা ফ্রেম  
const frameBase = (n, extra = '') => (  
  `╔════════════════════════════════════╗

🚫 সতর্কবার্তা #${n}
👤 ব্যবহারকারী: ${userName} (UID: ${userID})
⚠️ আপনার মেসেজে অশালীন শব্দ পাওয়া গেছে।
🔁 অপরাধের সংখ্যা: ${n} বার
${extra}
╚════════════════════════════════════╝`
);

if (count === 1) {  
  const msg = frameBase(1, 'দয়া করে এখনই মেসেজটি আনসেন্ড করুন!');  
  await api.sendMessage(msg, threadID, event.messageID);  
} else if (count === 2) {  
  const msg = frameBase(2, '⚠️ পরেরবার একই ভুল করলে আপনাকে রিমুভ করা হবে!');  
  await api.sendMessage(msg, threadID, event.messageID);  
}  

if (event.messageID) {  
  setTimeout(() => {  
    api.unsendMessage(event.messageID).catch(() => {});  
  }, 60000);  
}  

if (count === 3) {  
  const botIsAdmin = botID ? isAdminInThread(botID) : false;  

  if (!botIsAdmin) {  
    userData.count = 2;  
    return api.sendMessage(  
      `╔════════════════════════════════════╗

⚠️ কাজটি বন্ধ করা হয়েছে
🤖 আমি (বট) অ্যাডমিন নই, তাই কাউকে রিমুভ করতে পারছি না।
অনুগ্রহ করে বটকে অ্যাডমিন করুন অথবা
গ্রুপের কোনো অ্যাডমিন ব্যবহারকারীকে রিমুভ করুন।
👤 ব্যবহারকারী: ${userName} (UID: ${userID})
╚════════════════════════════════════╝`,
threadID
);
}

if (isAdminInThread(userID)) {  
    userData.count = 2;  
    return api.sendMessage(  
      `╔════════════════════════════════════╗

⚠️ কাজটি বন্ধ করা হয়েছে
এই ব্যবহারকারী একজন গ্রুপ অ্যাডমিন, তাই বট তাকে সরাতে পারবে না।
যদি প্রয়োজন মনে করেন, গ্রুপের অন্য অ্যাডমিনরা তাকে ম্যানুয়ালি রিমুভ করতে পারেন।
👤 ব্যবহারকারী: ${userName} (UID: ${userID})
╚════════════════════════════════════╝`,
threadID
);
}

try {  
    await api.removeUserFromGroup(userID, threadID);  
    userData.count = 0;  
    return api.sendMessage(  
      `🚨 ব্যবহারকারী ${userName} (UID: ${userID})\n\nবারবার অশালীন শব্দ ব্যবহারের কারণে\nগ্রুপ থেকে সরিয়ে দেওয়া হয়েছে।`, threadID);  
} catch {  
    userData.count = 2;  
    return api.sendMessage(`⚠️ ${userName} (${userID})-কে কিক করতে ব্যর্থ। বটের পারমিশন চেক করুন।`, threadID);
}
}

} catch (error) {
console.error("AntiGali error:", error);
api.sendMessage("⚠️ Anti-Gali সিস্টেমে একটি ত্রুটি ঘটেছে।", event.threadID);
}
};

// এখানে run ফাংশন পুরোপুরি খালি রাখলাম (কোনো কমান্ড কাজ করবে না)
module.exports.run = async function ({ api, event, commandName }) {
  // কিছুই করবে না
};
