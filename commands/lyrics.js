const fetch = require('node-fetch');

async function lyricsCommand(sock, chatId, songTitle) {
    if (!songTitle) {
        await sock.sendMessage(chatId, { 
            text: '🔍 Please enter the song name to get the lyrics! Usage: *lyrics <song name>*',
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
        return;
    }

    try {
        // Fetch song lyrics using the API
        let res = await fetch(`https://some-random-api.com/lyrics?title=${encodeURIComponent(songTitle)}`);
        if (!res.ok) throw await res.text();
        
        let json = await res.json();
        
        if (!json.thumbnail.genius) {
            await sock.sendMessage(chatId, { 
                text: '❌ Sorry, I couldn\'t find any lyrics for this song!',
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
            return;
        }
        
        // Sending the formatted result to the user
        await sock.sendMessage(chatId, {
            image: { url: json.thumbnail.genius },
            caption: `🎵 *Song Lyrics* 🎶\n\n▢ *Title:* ${json.title}\n*Artist:* ${json.author}\n\n📜 *Lyrics:*\n${json.lyrics}\n\nHope you enjoy the music! 🎧 🎶`,
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
            text: '❌ Sorry, I couldn\'t fetch the lyrics. Please try again later!',
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
    }
}

module.exports = { lyricsCommand };
