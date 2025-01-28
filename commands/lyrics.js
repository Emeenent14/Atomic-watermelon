const fetch = require('node-fetch');
require('../config.js');

async function lyricsCommand(sock, chatId, songTitle) {
    if (!songTitle) {
        await sock.sendMessage(chatId, { 
            text: '❌ Please provide a song title!' 
        });
        return;
    }

    try {
        // Using xteam API instead of lolhuman
        const apiUrl = `${global.APIs.xteam}/api/lirik?q=${encodeURIComponent(songTitle)}&apikey=${global.APIKeys['https://api.xteam.xyz']}`;
        
        const res = await fetch(apiUrl);
        const json = await res.json();
        
        if (!json.result) {
            await sock.sendMessage(chatId, { 
                text: '❌ Lyrics not found for this song!' 
            });
            return;
        }

        const lyricsText = `*🎵 ${songTitle}*

${json.result}

_Powered by XTeam API_`;

        await sock.sendMessage(chatId, {
            text: lyricsText,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        });

    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ The lyrics service is currently unavailable. Please try again later.' 
        });
    }
}

module.exports = { lyricsCommand };
