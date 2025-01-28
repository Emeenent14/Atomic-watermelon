const flirtLines = [
    "Are you a magician? Because whenever I look at you, everyone else disappears.",
    "Do you have a map? I keep getting lost in your eyes.",
    "Is your name Google? Because you have everything I'm searching for.",
    "Do you believe in love at first sight, or should I walk by again?",
    "If you were a vegetable, you'd be a cute-cumber!",
    "Are you a parking ticket? Because you've got FINE written all over you.",
    "Is your dad a baker? Because you're a cutie pie!",
    "Do you have a Band-Aid? Because I just scraped my knee falling for you.",
    "If beauty were time, you'd be an eternity.",
    "Are you Wi-Fi? Because I'm really feeling a connection.",

    // Additional flirt lines
    "Are you French? Because Eiffel for you.",
    "Can you lend me a kiss? I promise I'll give it back.",
    "Do you believe in fate? Because I think we've just met ours.",
    "Are you a campfire? Because you're hot and I want s'more.",
    "If I could rearrange the alphabet, I’d put U and I together.",
    "Are you a snowstorm? Because you've just made my heart race.",
    "Is your name Chapstick? Because you're da balm!",
    "Excuse me, but I think you dropped something: MY JAW!",
    "Are you a time traveler? Because I see you in my future.",
    "Your hand looks heavy—can I hold it for you?",
    "Are you a bank loan? Because you have my interest.",
    "Do you have a sunburn, or are you always this hot?",
    "Are you an angel? Because heaven is missing one.",
    "You must be made of copper and tellurium because you're Cu-Te!",
    "Are you tired? Because you've been running through my mind all day.",
    "Do you have a mirror in your pocket? Because I can see myself in your pants.",
    "You're like a fine wine; I just can't stop staring at you.",
    "Can you take a picture with me? I want to prove to my friends that angels exist.",
    "Did it hurt when you fell from heaven?",
    "Are you a camera? Because every time I look at you, I smile.",
    "Are you a parking spot? Because I’ve been looking for you all my life.",
    "Is your dad an artist? Because you're a masterpiece.",
    "You must be exhausted because you've been running through my dreams all night.",
    "Are you a light bulb? Because you brighten up my day.",
    "I must be a snowflake because I've fallen for you.",
    "You're so sweet, you're giving me a toothache.",
    "Do you have a name, or can I call you mine?",
    "Are you gravity? Because you're pulling me in."
];


async function flirtCommand(sock, chatId) {
    const randomFlirt = flirtLines[Math.floor(Math.random() * flirtLines.length)];
    await sock.sendMessage(chatId, { text: `${randomFlirt}` });
}

module.exports = { flirtCommand }; 