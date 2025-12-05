const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
  name: "protect",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "MOHAMMAD AKASH x Mirai Converted by ChatGPT",
  description: "Lock group avatar, name, nickname, emoji, theme",
  commandCategory: "group",
  usages: "protect on / off",
  cooldowns: 5
};

// =======================
// RUN COMMAND
// =======================
module.exports.run = async ({ api, event, args }) => {
  const threadID = event.threadID;

  if (!["on", "off"].includes(args[0])) {
    return api.sendMessage("Use: protect on | protect off", threadID, event.messageID);
  }

  const path = __dirname + `/cache/protect_${threadID}.json`;

  // ================
  // PROTECT ON
  // ================
  if (args[0] === "on") {

    const threadInfo = await api.getThreadInfo(threadID);

    const save = {
      avatar: threadInfo.imageSrc || "REMOVE",
      name: threadInfo.threadName,
      nickname: threadInfo.userInfo
        .map(u => ({ [u.id]: u.nickname }))
        .reduce((a, b) => ({ ...a, ...b }), {}),
      theme: threadInfo.threadThemeID,
      emoji: threadInfo.emoji
    };

    fs.writeFileSync(path, JSON.stringify(save, null, 2));

    return api.sendMessage(
      "🛡 PROTECT MODE: ON\n" +
      "✔ Avatar Locked\n✔ Name Locked\n✔ Nickname Locked\n✔ Theme Locked\n✔ Emoji Locked",
      threadID,
      event.messageID
    );
  }

  // ================
  // PROTECT OFF
  // ================
  if (args[0] === "off") {
    if (fs.existsSync(path)) fs.unlinkSync(path);

    return api.sendMessage(
      "🔓 PROTECT MODE: OFF\nAll locks disabled.",
      threadID,
      event.messageID
    );
  }
};


// ================================
// AUTO RESTORE — HANDLE EVENT
// ================================
module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, logMessageType, logMessageData, author } = event;

  const botID = api.getCurrentUserID();
  const path = __dirname + `/cache/protect_${threadID}.json`;

  if (!fs.existsSync(path)) return;

  const data = JSON.parse(fs.readFileSync(path));

  // =====================
  // AVATAR PROTECT
  // =====================
  if (logMessageType === "log:thread-image") {
    if (botID !== author) {
      api.sendMessage("⚠ Avatar change locked!", threadID);

      if (data.avatar === "REMOVE") {
        api.changeGroupImage("", threadID);
      } else {
        const img = (await axios.get(data.avatar, { responseType: "stream" })).data;
        api.changeGroupImage(img, threadID);
      }
    }
  }

  // =====================
  // NAME PROTECT
  // =====================
  if (logMessageType === "log:thread-name") {
    if (botID !== author) {
      api.sendMessage("⚠ Name change locked!", threadID);
      api.setTitle(data.name, threadID);
    }
  }

  // =====================
  // NICKNAME PROTECT
  // =====================
  if (logMessageType === "log:user-nickname") {
    const { participant_id } = logMessageData;

    if (botID !== author) {
      api.sendMessage("⚠ Nickname locked!", threadID);

      api.changeNickname(
        data.nickname[participant_id] || "",
        threadID,
        participant_id
      );
    }
  }

  // =====================
  // THEME PROTECT
  // =====================
  if (logMessageType === "log:thread-color") {
    if (botID !== author) {
      api.sendMessage("⚠ Theme locked!", threadID);
      api.changeThreadColor(data.theme, threadID);
    }
  }

  // =====================
  // EMOJI PROTECT
  // =====================
  if (logMessageType === "log:thread-icon") {
    if (botID !== author) {
      api.sendMessage("⚠ Emoji locked!", threadID);
      api.changeThreadEmoji(data.emoji, threadID);
    }
  }
};
