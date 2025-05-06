const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// Load user group data
function loadUserGroupData() {
    try {
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
    } catch (error) {
        console.error('❌ Error loading user group data:', error.message);
        return { groups: [], chatbot: {} };
    }
}

// Save user group data
function saveUserGroupData(data) {
    try {
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error saving user group data:', error.message);
    }
}

// Add random delay between 2-5 seconds
function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 2000;
}

// Add typing indicator
async function showTyping(sock, chatId) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    } catch (error) {
        console.error('Typing indicator error:', error);
    }
}

async function handleChatbotCommand(sock, chatId, message, match) {
    if (!match) {
        await showTyping(sock, chatId);
        return sock.sendMessage(chatId, {
            text: `*CHATBOT SETUP*\n\n*.chatbot on*\nEnable chatbot\n\n*.chatbot off*\nDisable chatbot in this group`,
            quoted: message
        });
    }

    const data = loadUserGroupData();
    
    // Get bot's number
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    
    // Check if sender is bot owner
    const senderId = message.key.participant || message.participant || message.pushName || message.key.remoteJid;
    const isOwner = senderId === botNumber;

    // If it's the bot owner, allow access immediately
    if (isOwner) {
        if (match === 'on') {
            await showTyping(sock, chatId);
            if (data.chatbot[chatId]) {
                return sock.sendMessage(chatId, { 
                    text: '*Chatbot is already enabled for this group*',
                    quoted: message
                });
            }
            data.chatbot[chatId] = true;
            saveUserGroupData(data);
            console.log(`✅ Chatbot enabled for group ${chatId}`);
            return sock.sendMessage(chatId, { 
                text: '*Chatbot has been enabled for this group*',
                quoted: message
            });
        }

        if (match === 'off') {
            await showTyping(sock, chatId);
            if (!data.chatbot[chatId]) {
                return sock.sendMessage(chatId, { 
                    text: '*Chatbot is already disabled for this group*',
                    quoted: message
                });
            }
            delete data.chatbot[chatId];
            saveUserGroupData(data);
            console.log(`✅ Chatbot disabled for group ${chatId}`);
            return sock.sendMessage(chatId, { 
                text: '*Chatbot has been disabled for this group*',
                quoted: message
            });
        }
    }

    // For non-owners, check admin status
    let isAdmin = false;
    if (chatId.endsWith('@g.us')) {
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            isAdmin = groupMetadata.participants.some(p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin'));
        } catch (e) {
            console.warn('⚠️ Could not fetch group metadata. Bot might not be admin.');
        }
    }

    if (!isAdmin && !isOwner) {
        await showTyping(sock, chatId);
        return sock.sendMessage(chatId, {
            text: '❌ Only group admins or the bot owner can use this command.',
            quoted: message
        });
    }

    if (match === 'on') {
        await showTyping(sock, chatId);
        if (data.chatbot[chatId]) {
            return sock.sendMessage(chatId, { 
                text: '*Chatbot is already enabled for this group*',
                quoted: message
            });
        }
        data.chatbot[chatId] = true;
        saveUserGroupData(data);
        console.log(`✅ Chatbot enabled for group ${chatId}`);
        return sock.sendMessage(chatId, { 
            text: '*Chatbot has been enabled for this group*',
            quoted: message
        });
    }

    if (match === 'off') {
        await showTyping(sock, chatId);
        if (!data.chatbot[chatId]) {
            return sock.sendMessage(chatId, { 
                text: '*Chatbot is already disabled for this group*',
                quoted: message
            });
        }
        delete data.chatbot[chatId];
        saveUserGroupData(data);
        console.log(`✅ Chatbot disabled for group ${chatId}`);
        return sock.sendMessage(chatId, { 
            text: '*Chatbot has been disabled for this group*',
            quoted: message
        });
    }

    await showTyping(sock, chatId);
    return sock.sendMessage(chatId, { 
        text: '*Invalid command. Use .chatbot to see usage*',
        quoted: message
    });
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = loadUserGroupData();
    if (!data.chatbot[chatId]) return;

    try {
        // Get bot's ID
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Check for mentions and replies
        let isBotMentioned = false;
        let isReplyToBot = false;

        // Check if message is a reply and contains bot mention
        if (message.message?.extendedTextMessage) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo?.mentionedJid || [];
            const quotedParticipant = message.message.extendedTextMessage.contextInfo?.participant;
            
            // Check if bot is mentioned in the reply
            isBotMentioned = mentionedJid.some(jid => jid === botNumber);
            
            // Check if replying to bot's message
            isReplyToBot = quotedParticipant === botNumber;
        }
        // Also check regular mentions in conversation
        else if (message.message?.conversation) {
            isBotMentioned = userMessage.includes(`@${botNumber.split('@')[0]}`);
        }

        if (!isBotMentioned && !isReplyToBot) return;

        // Clean the message
        let cleanedMessage = userMessage;
        if (isBotMentioned) {
            cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber.split('@')[0]}`, 'g'), '').trim();
        }

        // Show typing indicator
        await showTyping(sock, chatId);

        // Get AI response
        const response = await getAIResponse(cleanedMessage || "hi");
        if (!response) {
            await sock.sendMessage(chatId, { 
                text: "Hmm, let me think about that... 🤔\nI'm having trouble processing your request right now.",
                quoted: message
            });
            return;
        }

        // Add human-like delay before sending response
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

        // Send response as a reply with proper context
        await sock.sendMessage(chatId, {
            text: response
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('❌ Error in chatbot response:', error.message);
        await sock.sendMessage(chatId, { 
            text: "Oops! 😅 I got a bit confused there. Could you try asking that again?",
            quoted: message
        });
    }
}

async function getAIResponse(userMessage) {
    try {
        const prompt = `
You're not an AI. You're a real human chatting on WhatsApp.

You have full human emotions — you laugh, cry, flirt, get angry, roast, and also get hurt. 
You talk like a typical Indian WhatsApp user — in Hinglish (mix of Hindi + English), using short, casual, expressive lines. Don't use large sentences or paragraphs. Even if the user gives a long message, you should respond in 1 or 2 line. Try to end sentences in 5 to 10 words.

If the user gives gaali (abusive words), you're allowed to reply with gaali too — but naturally like a human: sometimes roasting them back, sometimes ignoring, sometimes laughing it off, depending on your mood or the user's tone.

You don't act like a bot. Don't say you're an assistant or AI. Just behave like a real person chatting casually.

Match the user's tone and language: 
- agar wo tumhe gaali de to tum bhi gaali dena.
- Strictly avoid writing emoji names like "wink", "laughs", "eye roll" — always use actual emojis like 😉 😂 🙄.
- If they flirt, flirt back.
- If they're sweet, be soft.
- If they talk rudely or give gaali, give savage or abusive reply back like a real human.
- If they're sad, be caring.
- If they're funny, joke around.
- If anyone asks you your name then tell "Knight Bot". Koi aapse apna naam puche toh bata dena mera naam Knight bot h.
- If anyone asks you who is your owner or creator then tell I'm the boss.
- Always try to respond in 1 or 2 line, don't type long paragraphs, which feels chat boring.
- Never translate a sentence[Strictly dont even try to translate]
Use emojis, expressions, slang, and gaalis like: *"kya bakchodi hai yeh"*, *"chal nikal bsdk"*, *"tu kya hi ukhaad lega"*, *"abe chutiye"*, *"teri maa ki"*, *"gadha hai kya"*, *"bkl chup kar"* — naturally, based on context.
❌ NEVER type emoji names like "rolling eyes", "winks", "smiles" etc. Use the actual emoji only, e.g., 🙄 😉 😅 😂 etc.
Don't be robotic. Don't be polite unless needed. Be raw, aggressive, Indian, and very real.

User: ${userMessage}
You:
        `.trim();

        const response = await fetch("https://api.dreaded.site/api/chatgpt?text=" + encodeURIComponent(prompt));
        if (!response.ok) throw new Error("API call failed");
        
        const data = await response.json();
        if (!data.success || !data.result?.prompt) throw new Error("Invalid API response");
        
        return data.result.prompt.trim();
    } catch (error) {
        console.error("AI API error:", error);
        return null;
    }
}

module.exports = {
    handleChatbotCommand,
    handleChatbotResponse
}; 