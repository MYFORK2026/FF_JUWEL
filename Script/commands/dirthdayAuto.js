const fs = require("fs-extra");
const path = __dirname + "/birthdaySettings.json";
const logFile = __dirname + "/birthday.log";

module.exports.config = {
  name: "birthdayAuto",
  version: "3.0.1",
  hasPermssion: 2,
  credits: "MR JUWEL",
  description: "Fixed auto birthday system",
  commandCategory: "system",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  // ======= DEFAULT SETTINGS =======
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({
      day: 24,
      month: 4,
      year: 2004,
      ignore: [],
      lastSent: ""
    }, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(path));

  const today = new Date().toLocaleDateString("en-CA"); // BD Time OK


  // ======= COMMAND PART =======

  if (args[0] === "set") {
    if (!args[1] || !args[2] || !args[3])
      return api.sendMessage("Usage:\nbirthdayAuto set <day> <month> <year>", event.threadID);

    data.day = Number(args[1]);
    data.month = Number(args[2]);
    data.year = Number(args[3]);

    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    return api.sendMessage(`🎉 জন্মদিন সেট করা হয়েছে:\n📅 ${data.day}-${data.month}-${data.year}`, event.threadID);
  }

  if (args[0] === "ignore") {
    const id = args[1];
    if (!id) return api.sendMessage("Usage:\nbirthdayAuto ignore <threadID>", event.threadID);

    if (!data.ignore.includes(id)) data.ignore.push(id);

    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    return api.sendMessage(`⚠️ এই গ্রুপটি Ignore করা হয়েছে:\n${id}`, event.threadID);
  }


  // ======= AUTO MESSAGE PART =======

  if (data.lastSent === today) return; // Already sent today

  const threads = await api.getThreadList(100, null, ["INBOX"]);
  if (!threads) return;

  const now = new Date();
  const year = now.getFullYear();

  // FIXED MONTH (month - 1)
  let birthday = new Date(year, data.month - 1, data.day);

  // If passed → next year
  if (now > birthday)
    birthday = new Date(year + 1, data.month - 1, data.day);

  // Calculate difference
  const diff = Math.floor((birthday - now) / (1000 * 60 * 60 * 24));

  let msg = "";
  let attachment = null;
  const link = "fb.com/mrjuwel2025";


  // 1–12 days before birthday
  if (diff >= 1 && diff <= 12) {
    msg = `📢 𝑴𝑹 𝑱𝑼𝑾𝑬𝑳 এর জন্মদিন আসতে আর বাকি *${diff} দিন*!\n🎁 উইশ করার জন্য রেডি থাকেন! 🥳\n${link}`;
  }

  // Birthday today
  else if (diff === 0) {
    msg =
      `🎉 আজ 𝑴𝑹 𝑱𝑼𝑾𝑬𝑳 এর জন্মদিন! 🎂\n\n` +
      `🎂ღHappy Birthday To You Juwel 🥳\n\n` +
      `অনেক শুভেচ্ছা ও ভালোবাসা ❤️\n${link}`;

    // FIXED MULTI-SEND IMAGE
    if (fs.existsSync(__dirname + "/birthday.jpg")) {
      attachment = fs.readFileSync(__dirname + "/birthday.jpg");
    }
  }

  // No message today
  else return;

  // ======= SEND TO ALL THREADS =======

  for (const t of threads) {
    if (data.ignore.includes(t.threadID)) continue;

    api.sendMessage(
      attachment
        ? { body: msg, attachment: attachment }
        : msg,
      t.threadID
    );
  }

  data.lastSent = today;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  fs.appendFileSync(logFile, `[${today}] Birthday message sent.\n`);

  console.log("Birthday message sent successfully.");
};
