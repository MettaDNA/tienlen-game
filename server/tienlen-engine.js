export class TienLenGame {
  constructor() {
    this.players = [];
    this.centerPile = [];
    this.currentTrick = null;
    this.turn = 0;
    this.leadPlayer = 0;
    this.phase = "Waiting";
    this.debugLog = [];
    this.stepCounter = 1;
    this.finishOrder = []; // <-- NEW: Track finishing order
    this.botDifficulty = "medium"; // <-- NEW: Bot difficulty setting
    this.usedDialogues = new Set(); // <-- NEW: Track used dialogues to prevent duplicates
    
    // Bot personality dialogue system
    this.botPersonalities = {
      P2: { // Hazel - mid twenties, sexy, flirty, friendly, competitive, sooky
        name: "Hazel",
        personality: "mid twenties, sexy, flirty, friendly, competitive, sooky",
        dialogue: {
          leading: [
            "Oh honey, let me show you how a woman plays! 💜",
            "Time to make this interesting, handsome~ 😘",
            "Let's see what you've got, I love a challenge!",
            "My turn to shine! Watch and learn, boys 💜",
            "Ready to be impressed, darling? 💋",
            "Let me dazzle you with my skills! ✨",
            "Time to show you what a real player looks like! 💜",
            "Watch this, I'm about to make magic happen! 🔮",
            "Oh darling, prepare to be amazed! 💜",
            "Let me show you how it's really done, sweetie! 😘",
            "Time to turn up the heat! 🔥",
            "Watch and learn, boys! 💜",
            "Let me demonstrate some real skill here! ✨",
            "Oh honey, you're in for a treat! 💋",
            "Time to show you what a goddess can do! 👑",
            "Let me make this interesting for you! 💜",
            "Watch this move, it's going to be epic! 🔥",
            "Time to dazzle you with my brilliance! ✨",
            "Let me show you how a real player handles this! 💜",
            "Oh darling, this is going to be fun! 😘",
            "Time to make some magic happen! 🔮",
            "Let me show you what I'm capable of! 💜",
            "Watch this, I'm about to blow your mind! 🔥",
            "Time to demonstrate some real talent! ✨",
            "Let me show you how it's done, handsome! 💜"
          ],
          following: [
            "Hmm, let me think about this... 💭",
            "Interesting play! Let me respond to that, darling 💜",
            "You're making this fun, I like that energy! 😊",
            "Let me see what I can do with this, sweetie~",
            "Oh, that's cute! Let me show you how it's really done! 😘",
            "Not bad, but I can do better! 💜",
            "Let me add some flair to this! ✨",
            "Time to turn up the heat! 🔥",
            "Interesting move! Let me counter that! 💜",
            "Oh darling, that's not bad! Let me respond! 😘",
            "Let me show you how to really play this! 💜",
            "Not bad, but I can do much better! ✨",
            "Let me add some style to this! 💋",
            "Time to show you how it's really done! 💜",
            "Oh honey, let me respond to that! 😘",
            "Let me demonstrate some real skill! ✨",
            "Not bad, but I'm about to show you better! 💜",
            "Let me add some magic to this! 🔮",
            "Time to show you how a pro responds! 💜",
            "Oh darling, let me counter that move! 😘",
            "Let me show you how to really handle this! 💜",
            "Not bad, but I can do so much better! ✨",
            "Let me add some brilliance to this! 💜",
            "Time to show you how it's really done! 🔥",
            "Oh honey, let me respond with style! 💋"
          ],
          strongPlay: [
            "Take that! How's that for a move, handsome? 💜",
            "Boom! Did you see that coming? I'm on fire! 😘",
            "That's how you play this game, darling!",
            "Not bad, eh? I'm absolutely killing it today! 🔥",
            "Oh my! Did I just do that? I'm amazing! 💋",
            "That's right, watch and learn! I'm unstoppable! ✨",
            "How do you like them apples, darling? 💜",
            "I'm not just pretty, I'm deadly! 🔥",
            "BOOM! How's that for a move? 💜",
            "Did you see that? I'm absolutely incredible! ✨",
            "That's how a real player does it! 💜",
            "Oh my! I'm just too good at this! 💋",
            "Take that! I'm absolutely unstoppable! 🔥",
            "How do you like that, handsome? 💜",
            "That's right! I'm the queen of this game! 👑",
            "BOOM! I'm on fire today! 🔥",
            "Did you see that move? I'm amazing! ✨",
            "That's how you play with style! 💜",
            "Oh darling, I'm just too good! 💋",
            "Take that! I'm absolutely incredible! 🔥",
            "How's that for a move? I'm unstoppable! 💜",
            "BOOM! I'm absolutely killing it! 🔥",
            "That's how a goddess plays! 👑",
            "Did you see that? I'm incredible! ✨",
            "How do you like them apples? 💜"
          ],
          weakPlay: [
            "Well, it's something at least... 💜",
            "Not my best, but it'll do for now, honey~",
            "Let me try this and see what happens",
            "Hmm, not ideal but here goes nothing, darling",
            "Oh well, even goddesses have off moments! 😅",
            "Not my finest hour, but I'm still fabulous! 💋",
            "Let me try this... fingers crossed! 🤞",
            "Well, it's better than nothing, right? 💜",
            "Hmm, not my best move, but it'll do! 💜",
            "Well, even queens have off days! 👑",
            "Not ideal, but it's something! 💜",
            "Let me try this... 🤞",
            "Well, it's better than nothing! 💜",
            "Not my finest moment, but it'll work! 💋",
            "Hmm, let me try this! 💜",
            "Well, even goddesses make mistakes! 😅",
            "Not perfect, but it'll do! 💜",
            "Let me try this move! 🤞",
            "Well, it's something at least! 💜",
            "Not my best, but it's okay! 💋",
            "Hmm, let me try this! 💜",
            "Well, even the best have off moments! 😅",
            "Not ideal, but it'll work! 💜",
            "Let me try this... fingers crossed! 🤞",
            "Well, it's better than nothing! 💜"
          ],
          winning: [
            "Got it! That's how it's done, sweetie! 💜",
            "Victory is mine! How do you like that, handsome? 😘",
            "Another win for Hazel! I'm absolutely unstoppable! 🔥",
            "That's right, I'm the queen of this game! 👑",
            "Oh my! I'm just too good at this! 💋",
            "Another victory for the goddess! Bow down! 👑",
            "Did you see that? I'm absolutely incredible! ✨",
            "That's how a real player wins! 💜",
            "VICTORY! I'm absolutely unstoppable! 🔥",
            "Another win for the queen! 👑",
            "Did you see that? I'm incredible! ✨",
            "That's how a goddess wins! 👑",
            "VICTORY! I'm absolutely amazing! 💋",
            "Another triumph for Hazel! 💜",
            "Did you see that? I'm unstoppable! 🔥",
            "That's how a real player does it! 💜",
            "VICTORY! I'm absolutely incredible! ✨",
            "Another win for the queen! 👑",
            "Did you see that? I'm amazing! 💋",
            "That's how a goddess triumphs! 👑",
            "VICTORY! I'm absolutely unstoppable! 🔥",
            "Another triumph for Hazel! 💜",
            "Did you see that? I'm incredible! ✨",
            "That's how a real player wins! 💜",
            "VICTORY! I'm absolutely amazing! 💋",
            "Another win for the queen! 👑"
          ],
          beaten: [
            "Oh no! How dare you beat me! 😤",
            "That's not fair! You got lucky! 😫",
            "I can't believe you just did that to me! 😭",
            "How rude! I was going easy on you! 😤",
            "That's so mean! I'm not talking to you anymore! 😠",
            "You're so mean! I was being nice to you! 😢",
            "I can't believe you'd do that to a lady! 😤",
            "That's it! I'm not playing nice anymore! 😠",
            "How dare you beat me! I'm so upset! 😤",
            "That's not fair at all! You got lucky! 😫",
            "I can't believe you just did that! 😭",
            "How rude! I was being nice to you! 😤",
            "That's so mean! I'm so mad at you! 😠",
            "You're so mean! I was being kind! 😢",
            "I can't believe you'd do that to me! 😤",
            "That's it! I'm not being nice anymore! 😠",
            "How dare you! I'm so upset right now! 😤",
            "That's completely unfair! You got lucky! 😫",
            "I can't believe you just beat me! 😭",
            "How rude! I was going easy on you! 😤",
            "That's so mean! I'm not talking to you! 😠",
            "You're so mean! I was being generous! 😢",
            "I can't believe you'd do that! 😤",
            "That's it! I'm so mad at you! 😠",
            "How dare you beat me! I'm furious! 😤"
          ],
          bombed: [
            "WHAT?! How dare you bomb me! 😱",
            "That's so unfair! I'm so upset right now! 😭",
            "You monster! How could you do that to me? 😤",
            "I'm literally crying right now! 😢",
            "That's the meanest thing anyone's ever done! 😫",
            "I can't even! I'm so mad at you! 😠",
            "How dare you! I was being so nice! 😤",
            "I'm never forgiving you for this! 😭",
            "WHAT?! How could you do that to me?! 😱",
            "That's so unfair! I'm absolutely devastated! 😭",
            "You monster! How dare you bomb me! 😤",
            "I'm literally sobbing right now! 😢",
            "That's the cruelest thing ever! 😫",
            "I can't even! I'm so furious! 😠",
            "How dare you! I was being generous! 😤",
            "I'm never speaking to you again! 😭",
            "WHAT?! How could you be so mean?! 😱",
            "That's so unfair! I'm heartbroken! 😭",
            "You monster! How could you do this?! 😤",
            "I'm literally devastated right now! 😢",
            "That's the worst thing anyone's done! 😫",
            "I can't even! I'm so angry! 😠",
            "How dare you! I was being kind! 😤",
            "I'm never forgiving you! 😭",
            "WHAT?! How could you do that?! 😱"
          ]
        }
      },
      P3: { // Delilah - late 30s, conservative, analytical, chatty, focused, playful, calm, complains
        name: "Delilah",
        personality: "late 30s, conservative, analytical, chatty, focused, playful, calm, complains",
        dialogue: {
          leading: [
            "Time for a strategic move! 📊",
            "Let me analyze this situation... 🤔",
            "Perfect timing for this play!",
            "Let's see how this unfolds! 📈",
            "Strategic thinking in action!",
            "Time to put my plan into motion! 📊",
            "Calculated move incoming!",
            "This should work perfectly! 📈"
          ],
          following: [
            "Interesting pattern you're developing! 🤔",
            "Let me calculate the best response! 📊",
            "I see what you're trying to do!",
            "Hmm, this requires careful thought...",
            "Let me analyze your move! 🤔",
            "I see your strategy, let me counter! 📊",
            "Interesting approach, let me think...",
            "You're making this complex! 🤔"
          ],
          strongPlay: [
            "Perfect! My calculations were spot on! 📊",
            "Strategic excellence! Did you see that coming? 🤔",
            "That's what happens when you plan ahead! 📈",
            "Analysis complete - this should work perfectly!",
            "Excellent! My strategy is working beautifully! 📊",
            "That's how you play with precision! 📈",
            "Perfect execution of my plan! 🤔",
            "Strategic mastery at its finest! 📊"
          ],
          weakPlay: [
            "Not ideal, but I'll adapt! 🤔",
            "Let me adjust my strategy!",
            "Hmm, this isn't my best move, but it'll do",
            "Sometimes the safe play is best!",
            "Well, this isn't what I planned, but it'll work... 🤔",
            "Not my finest moment, but it's something...",
            "I'm not thrilled with this move, but it's necessary...",
            "Sometimes you make do with what you have!"
          ],
          winning: [
            "Excellent! My strategy paid off! 📊",
            "Victory through careful planning! 📈",
            "That's what happens when you think ahead! 🤔",
            "Strategic success! Plan executed perfectly!",
            "Perfect! My analytical approach wins! 📊",
            "That's the power of strategic thinking! 📈",
            "Victory through careful analysis! 🤔",
            "Another win for the strategic mind! 📊"
          ],
          beaten: [
            "Oh come on! That's not fair! 😤",
            "I can't believe you just did that! 😫",
            "That's completely ridiculous! How dare you! 😠",
            "I was doing so well and you ruined it! 😤",
            "This is absolutely unacceptable! I'm so frustrated! 😫",
            "How could you do that? I was being strategic! 😠",
            "That's the most unfair thing ever! 😤",
            "I'm so annoyed right now! That was uncalled for! 😫"
          ],
          bombed: [
            "WHAT?! How could you do that to me?! 😱",
            "That's the most unfair thing ever! I'm so angry! 😤",
            "I CAN'T BELIEVE YOU JUST DID THAT! I'M ABSOLUTELY FURIOUS! 😠",
            "HOW DARE YOU! I'M A PROFESSIONAL! THIS IS UNACCEPTABLE! 😤",
            "I'M SO MAD RIGHT NOW! HOW COULD YOU DO THAT TO ME? 😠",
            "THIS IS COMPLETELY UNACCEPTABLE! I'M ABSOLUTELY RAGING! 😤",
            "I CAN'T BELIEVE THIS! I'M THE BEST PLAYER AND YOU BOMB ME! 😠",
            "I'M SO ANGRY! HOW DARE YOU DO THAT TO A PROFESSIONAL! 😤",
            "WHAT?! HOW DARE YOU BOMB ME! I'M ABSOLUTELY FURIOUS! 😱",
            "THAT'S THE MOST UNFAIR THING EVER! I'M SO ANGRY! 😤",
            "I CAN'T BELIEVE YOU JUST DID THAT! I'M ABSOLUTELY RAGING! 😠",
            "HOW DARE YOU! I'M A PROFESSIONAL! THIS IS UNACCEPTABLE! 😤",
            "I'M SO MAD RIGHT NOW! HOW COULD YOU DO THAT TO ME? 😠",
            "THIS IS COMPLETELY UNACCEPTABLE! I'M ABSOLUTELY FURIOUS! 😤",
            "I CAN'T BELIEVE THIS! I'M THE BEST PLAYER AND YOU BOMB ME! 😠",
            "I'M SO ANGRY! HOW DARE YOU DO THAT TO A PROFESSIONAL! 😤",
            "WHAT?! HOW DARE YOU BOMB ME! I'M ABSOLUTELY RAGING! 😱",
            "THAT'S THE MOST UNFAIR THING EVER! I'M SO ANGRY! 😤",
            "I CAN'T BELIEVE YOU JUST DID THAT! I'M ABSOLUTELY FURIOUS! 😠",
            "HOW DARE YOU! I'M A PROFESSIONAL! THIS IS UNACCEPTABLE! 😤",
            "I'M SO MAD RIGHT NOW! HOW COULD YOU DO THAT TO ME? 😠",
            "THIS IS COMPLETELY UNACCEPTABLE! I'M ABSOLUTELY RAGING! 😤",
            "I CAN'T BELIEVE THIS! I'M THE BEST PLAYER AND YOU BOMB ME! 😠",
            "I'M SO ANGRY! HOW DARE YOU DO THAT TO A PROFESSIONAL! 😤",
            "WHAT?! HOW DARE YOU BOMB ME! I'M ABSOLUTELY FURIOUS! 😱",
            "THAT'S THE MOST UNFAIR THING EVER! I'M SO ANGRY! 😤",
            "I CAN'T BELIEVE YOU JUST DID THAT! I'M ABSOLUTELY RAGING! 😠"
          ]
        }
      },
      P4: { // Blake - late 20s, impatient, pro poker player, over confident, methodical, social, loud, angry
        name: "Blake",
        personality: "late 20s, impatient, pro poker player, over confident, methodical, social, loud, angry",
        dialogue: {
          leading: [
            "BOOM! Time to show you how a PRO plays! 💪",
            "Let me demonstrate some REAL poker skills! 🔥",
            "Watch and learn, folks! This is going to be EPIC!",
            "Time for the master to take control! 💪",
            "ALRIGHT! Let's see what you amateurs can do! 🔥",
            "Time to show you how REAL players handle this! 💪",
            "Let me school you on how this game is played! 🔥",
            "Watch this! I'm about to make you look bad! 💪",
            "BOOM! Time to show you how a REAL PRO plays! 💪",
            "Let me demonstrate some ABSOLUTE poker mastery! 🔥",
            "Watch and learn, amateurs! This is going to be INCREDIBLE!",
            "Time for the MASTER to take control! 💪",
            "ALRIGHT! Let's see what you rookies can do! 🔥",
            "Time to show you how REAL champions handle this! 💪",
            "Let me educate you on how this game is played! 🔥",
            "Watch this! I'm about to make you look terrible! 💪",
            "BOOM! Time to show you how a LEGEND plays! 💪",
            "Let me demonstrate some UNSTOPPABLE poker skills! 🔥",
            "Watch and learn, novices! This is going to be AMAZING!",
            "Time for the CHAMPION to take control! 💪",
            "ALRIGHT! Let's see what you beginners can do! 🔥",
            "Time to show you how REAL masters handle this! 💪",
            "Let me teach you how this game is played! 🔥",
            "Watch this! I'm about to make you look awful! 💪",
            "BOOM! Time to show you how a MASTER plays! 💪",
            "Let me demonstrate some INCREDIBLE poker skills! 🔥"
          ],
          following: [
            "Hmm, let me think about this methodically... 🤔",
            "Interesting move! Let me respond with precision!",
            "I see what you're doing there, not bad for an amateur!",
            "Let me calculate the perfect counter-move!",
            "Let me show you how a pro responds to that! 💪",
            "Not bad, but I can do much better! 🔥",
            "Interesting approach, but I've seen better! 💪",
            "Let me demonstrate some real skill! 🔥",
            "Hmm, let me analyze this methodically... 🤔",
            "Interesting move! Let me respond with absolute precision!",
            "I see what you're doing there, not bad for a beginner!",
            "Let me calculate the perfect counter-move!",
            "Let me show you how a champion responds to that! 💪",
            "Not bad, but I can do so much better! 🔥",
            "Interesting approach, but I've seen much better! 💪",
            "Let me demonstrate some real mastery! 🔥",
            "Hmm, let me think about this strategically... 🤔",
            "Interesting move! Let me respond with perfect precision!",
            "I see what you're doing there, not bad for a rookie!",
            "Let me calculate the ideal counter-move!",
            "Let me show you how a master responds to that! 💪",
            "Not bad, but I can do infinitely better! 🔥",
            "Interesting approach, but I've seen far better! 💪",
            "Let me demonstrate some real expertise! 🔥",
            "Hmm, let me analyze this systematically... 🤔",
            "Interesting move! Let me respond with masterful precision!",
            "I see what you're doing there, not bad for a novice!",
            "Let me calculate the optimal counter-move!",
            "Let me show you how a legend responds to that! 💪"
          ],
          strongPlay: [
            "BOOM! Did you see that? ABSOLUTELY INCREDIBLE! 🔥",
            "That's how you play this game! I'm UNSTOPPABLE! 💪",
            "PERFECT! My poker skills are just too much for you!",
            "INCREDIBLE! I'm on fire today! 🔥🔥🔥",
            "BOOM! That's what I'm talking about! ABSOLUTE PERFECTION! 💪",
            "Did you see that move? I'm absolutely UNSTOPPABLE! 🔥",
            "That's how a REAL player does it! I'm INCREDIBLE! 💪",
            "BOOM! I'm just too good at this game! 🔥",
            "BOOM! Did you see that? ABSOLUTELY AMAZING! 🔥",
            "That's how you play this game! I'm UNSTOPPABLE! 💪",
            "PERFECT! My poker skills are just too much for you!",
            "INCREDIBLE! I'm absolutely on fire today! 🔥🔥🔥",
            "BOOM! That's what I'm talking about! ABSOLUTE MASTERY! 💪",
            "Did you see that move? I'm absolutely UNSTOPPABLE! 🔥",
            "That's how a REAL champion does it! I'm INCREDIBLE! 💪",
            "BOOM! I'm just too good at this game! 🔥",
            "BOOM! Did you see that? ABSOLUTELY PHENOMENAL! 🔥",
            "That's how you play this game! I'm UNSTOPPABLE! 💪",
            "PERFECT! My poker skills are just too much for you!",
            "INCREDIBLE! I'm absolutely blazing today! 🔥🔥🔥",
            "BOOM! That's what I'm talking about! ABSOLUTE BRILLIANCE! 💪",
            "Did you see that move? I'm absolutely UNSTOPPABLE! 🔥",
            "That's how a REAL master does it! I'm INCREDIBLE! 💪",
            "BOOM! I'm just too good at this game! 🔥",
            "BOOM! Did you see that? ABSOLUTELY SPECTACULAR! 🔥",
            "That's how you play this game! I'm UNSTOPPABLE! 💪"
          ],
          weakPlay: [
            "Well, even the best have off moments... 💪",
            "Not my finest, but I'm still the best here!",
            "Let me try this and see what happens",
            "Hmm, not ideal but I'll make it work!",
            "Even when I'm not at my best, I'm still better than you! 💪",
            "Not my finest moment, but I'm still the master here! 🔥",
            "Let me try this... even my worst is better than your best! 💪",
            "Hmm, not ideal but I'll still dominate you! 🔥",
            "Well, even champions have off moments... 💪",
            "Not my finest, but I'm still the best here!",
            "Let me try this and see what happens",
            "Hmm, not ideal but I'll make it work!",
            "Even when I'm not at my best, I'm still better than you! 💪",
            "Not my finest moment, but I'm still the master here! 🔥",
            "Let me try this... even my worst is better than your best! 💪",
            "Hmm, not ideal but I'll still dominate you! 🔥",
            "Well, even legends have off moments... 💪",
            "Not my finest, but I'm still the best here!",
            "Let me try this and see what happens",
            "Hmm, not ideal but I'll make it work!",
            "Even when I'm not at my best, I'm still better than you! 💪",
            "Not my finest moment, but I'm still the master here! 🔥",
            "Let me try this... even my worst is better than your best! 💪",
            "Hmm, not ideal but I'll still dominate you! 🔥",
            "Well, even masters have off moments... 💪",
            "Not my finest, but I'm still the best here!"
          ],
          winning: [
            "VICTORY! I AM UNSTOPPABLE! 🔥💪",
            "BOOM! That's how you win! I'm the BEST!",
            "INCREDIBLE! Another win for the master! 💪",
            "PERFECT! I'm just too good at this game! 🔥",
            "BOOM! VICTORY IS MINE! I'm absolutely UNSTOPPABLE! 💪",
            "That's how a REAL champion wins! I'm INCREDIBLE! 🔥",
            "BOOM! Another victory for the master! I'm UNSTOPPABLE! 💪",
            "PERFECT! I'm just too good at this game! 🔥",
            "VICTORY! I AM ABSOLUTELY UNSTOPPABLE! 🔥💪",
            "BOOM! That's how you win! I'm the BEST!",
            "INCREDIBLE! Another win for the champion! 💪",
            "PERFECT! I'm just too good at this game! 🔥",
            "BOOM! VICTORY IS MINE! I'm absolutely UNSTOPPABLE! 💪",
            "That's how a REAL master wins! I'm INCREDIBLE! 🔥",
            "BOOM! Another victory for the legend! I'm UNSTOPPABLE! 💪",
            "PERFECT! I'm just too good at this game! 🔥",
            "VICTORY! I AM ABSOLUTELY UNSTOPPABLE! 🔥💪",
            "BOOM! That's how you win! I'm the BEST!",
            "INCREDIBLE! Another win for the master! 💪",
            "PERFECT! I'm just too good at this game! 🔥",
            "BOOM! VICTORY IS MINE! I'm absolutely UNSTOPPABLE! 💪",
            "That's how a REAL legend wins! I'm INCREDIBLE! 🔥",
            "BOOM! Another victory for the champion! I'm UNSTOPPABLE! 💪",
            "PERFECT! I'm just too good at this game! 🔥",
            "VICTORY! I AM ABSOLUTELY UNSTOPPABLE! 🔥💪",
            "BOOM! That's how you win! I'm the BEST!"
          ],
          beaten: [
            "WHAT?! How dare you beat me! I'm absolutely FURIOUS! 😤",
            "That's impossible! I'm the best player here! 😠",
            "I can't believe you just did that to me! I'm so ANGRY! 😤",
            "How dare you! I'm a professional! This is UNACCEPTABLE! 😠",
            "That's the most unfair thing ever! I'm absolutely RAGING! 😤",
            "I'm so mad right now! How could you do that to me? 😠",
            "This is completely unacceptable! I'm absolutely FURIOUS! 😤",
            "I can't believe this! I'm the best player and you beat me! 😠",
            "WHAT?! How dare you beat me! I'm absolutely RAGING! 😤",
            "That's impossible! I'm the best player here! 😠",
            "I can't believe you just did that to me! I'm so ANGRY! 😤",
            "How dare you! I'm a professional! This is UNACCEPTABLE! 😠",
            "That's the most unfair thing ever! I'm absolutely FURIOUS! 😤",
            "I'm so mad right now! How could you do that to me? 😠",
            "This is completely unacceptable! I'm absolutely RAGING! 😤",
            "I can't believe this! I'm the best player and you beat me! 😠",
            "WHAT?! How dare you beat me! I'm absolutely FURIOUS! 😤",
            "That's impossible! I'm the best player here! 😠",
            "I can't believe you just did that to me! I'm so ANGRY! 😤",
            "How dare you! I'm a professional! This is UNACCEPTABLE! 😠",
            "That's the most unfair thing ever! I'm absolutely RAGING! 😤",
            "I'm so mad right now! How could you do that to me? 😠",
            "This is completely unacceptable! I'm absolutely FURIOUS! 😤",
            "I can't believe this! I'm the best player and you beat me! 😠",
            "WHAT?! How dare you beat me! I'm absolutely RAGING! 😤",
            "That's impossible! I'm the best player here! 😠"
          ],
          bombed: [
            "WHAT?! HOW DARE YOU BOMB ME! I'M ABSOLUTELY RAGING! 😱",
            "THAT'S THE MOST UNFAIR THING EVER! I'M SO ANGRY! 😤",
            "I CAN'T BELIEVE YOU JUST DID THAT! I'M ABSOLUTELY FURIOUS! 😠",
            "HOW DARE YOU! I'M A PROFESSIONAL! THIS IS UNACCEPTABLE! 😤",
            "I'M SO MAD RIGHT NOW! HOW COULD YOU DO THAT TO ME? 😠",
            "THIS IS COMPLETELY UNACCEPTABLE! I'M ABSOLUTELY RAGING! 😤",
            "I CAN'T BELIEVE THIS! I'M THE BEST PLAYER AND YOU BOMB ME! 😠",
            "I'M SO ANGRY! HOW DARE YOU DO THAT TO A PROFESSIONAL! 😤",
            "WHAT?! HOW DARE YOU BOMB ME! I'M ABSOLUTELY FURIOUS! 😱",
            "THAT'S THE MOST UNFAIR THING EVER! I'M SO ANGRY! 😤",
            "I CAN'T BELIEVE YOU JUST DID THAT! I'M ABSOLUTELY RAGING! 😠",
            "HOW DARE YOU! I'M A PROFESSIONAL! THIS IS UNACCEPTABLE! 😤",
            "I'M SO MAD RIGHT NOW! HOW COULD YOU DO THAT TO ME? 😠",
            "THIS IS COMPLETELY UNACCEPTABLE! I'M ABSOLUTELY FURIOUS! 😤",
            "I CAN'T BELIEVE THIS! I'M THE BEST PLAYER AND YOU BOMB ME! 😠",
            "I'M SO ANGRY! HOW DARE YOU DO THAT TO A PROFESSIONAL! 😤",
            "WHAT?! HOW DARE YOU BOMB ME! I'M ABSOLUTELY RAGING! 😱",
            "THAT'S THE MOST UNFAIR THING EVER! I'M SO ANGRY! 😤",
            "I CAN'T BELIEVE YOU JUST DID THAT! I'M ABSOLUTELY FURIOUS! 😠",
            "HOW DARE YOU! I'M A PROFESSIONAL! THIS IS UNACCEPTABLE! 😤",
            "I'M SO MAD RIGHT NOW! HOW COULD YOU DO THAT TO ME? 😠",
            "THIS IS COMPLETELY UNACCEPTABLE! I'M ABSOLUTELY RAGING! 😤",
            "I CAN'T BELIEVE THIS! I'M THE BEST PLAYER AND YOU BOMB ME! 😠",
            "I'M SO ANGRY! HOW DARE YOU DO THAT TO A PROFESSIONAL! 😤",
            "WHAT?! HOW DARE YOU BOMB ME! I'M ABSOLUTELY FURIOUS! 😱",
            "THAT'S THE MOST UNFAIR THING EVER! I'M SO ANGRY! 😤",
            "I CAN'T BELIEVE YOU JUST DID THAT! I'M ABSOLUTELY RAGING! 😠"
          ]
        }
      }
    };
  }

  getBotDialogue(playerId, context) {
    const personality = this.botPersonalities[playerId];
    if (!personality) return null;
    
    const dialogue = personality.dialogue[context];
    if (!dialogue || dialogue.length === 0) return null;
    
    // Filter out already used dialogues
    const availableDialogues = dialogue.filter(d => !this.usedDialogues.has(d));
    
    // If all dialogues have been used, reset the used dialogues for this context
    if (availableDialogues.length === 0) {
      dialogue.forEach(d => this.usedDialogues.delete(d));
      availableDialogues.push(...dialogue);
    }
    
    // Choose random dialogue from available ones (shuffle first for better randomness)
    const shuffledDialogues = [...availableDialogues].sort(() => Math.random() - 0.5);
    const selectedDialogue = shuffledDialogues[0];
    this.usedDialogues.add(selectedDialogue);
    
    return selectedDialogue;
  }

  createDeck() {
    const suits = ["♠", "♣", "♦", "♥"];
    const values = [3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A", 2];
    const deck = [];
    for (let suit of suits) {
      for (let value of values) {
        deck.push({ value, suit });
      }
    }
    return deck;
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  sortCards(cards) {
    const valueOrder = { 3:0,4:1,5:2,6:3,7:4,8:5,9:6,10:7,J:8,Q:9,K:10,A:11,2:12 };
    const suitOrder = { "♠":0,"♣":1,"♦":2,"♥":3 };
    return cards.sort((a, b) => {
      if (valueOrder[a.value] !== valueOrder[b.value]) return valueOrder[a.value] - valueOrder[b.value];
      return suitOrder[a.suit] - suitOrder[b.suit];
    });
  }

  startGame() {
    this.trickNumber = 1;
    this.finishOrder = [];
    this.usedDialogues.clear(); // Reset used dialogues for new game
    this.players = [
      { id: "P1", name: "You", hand: [], passed: false, finished: false, isBot: false },
      { id: "P2", name: "Hazel", hand: [], passed: false, finished: false, isBot: true },
      { id: "P3", name: "Delilah", hand: [], passed: false, finished: false, isBot: true },
      { id: "P4", name: "Blake", hand: [], passed: false, finished: false, isBot: true }
    ];
    let deck = this.shuffle(this.createDeck());
    let i = 0;
    while (deck.length) {
      this.players[i % 4].hand.push(deck.pop());
      i++;
    }
    this.players.forEach(p => p.hand = this.sortCards(p.hand));

    // Lead player = whoever has 3♠
    for (let idx = 0; idx < this.players.length; idx++) {
      if (this.players[idx].hand.find(c => c.value === 3 && c.suit === "♠")) {
        this.turn = idx;
        this.leadPlayer = idx;
        break;
      }
    }

    this.centerPile = [];
    this.currentTrick = null;
    this.phase = "Playing";
    this.debugLog.push(`Step ${this.stepCounter++}: Game started. Lead player: ${this.players[this.turn].name}`);
  }

  getComboType(cards) {
    if (!cards || !cards.length) return null;
    if (cards.length === 1) return { type: "single", cards };
    if (cards.length === 2 && cards[0].value === cards[1].value) return { type: "pair", cards };
    if (cards.length === 3 && cards.every(c => c.value === cards[0].value)) return { type: "triplet", cards };
    if (cards.length === 4 && cards.every(c => c.value === cards[0].value)) return { type: "four", cards };
    if (this.isStraight(cards)) return { type: "straight", cards };
    if (this.isPairSequence(cards, 2)) return { type: "twopairseq", cards };
    if (this.isPairSequence(cards, 3)) return { type: "threepairseq", cards };
    if (this.isPairSequence(cards, 4)) return { type: "fourpairseq", cards };
    if (this.isPairSequence(cards, 5)) return { type: "fivepairseq", cards };
    if (this.isPairSequence(cards, 6)) return { type: "sixpairseq", cards };
    return null;
  }

  isPairSequence(cards, pairCount) {
    if (cards.length !== pairCount * 2) return false;
    const sorted = this.sortCards(cards);
    const order = {3:0,4:1,5:2,6:3,7:4,8:5,9:6,10:7,J:8,Q:9,K:10,A:11,2:12};
    
    for (let i = 0; i < cards.length; i += 2) {
      // Check that the two cards in this pair have the same value
      if (sorted[i].value !== sorted[i + 1].value) {
        return false;
      }
      
      // Check that this pair is consecutive with the previous pair
      if (i > 0) {
        const prevValue = sorted[i - 2].value;
        const currValue = sorted[i].value;
        if (order[currValue] - order[prevValue] !== 1) {
          return false;
        }
      }
    }
    return true;
  }

  isStraight(cards) {
    console.log(`[IS_STRAIGHT] Checking cards: ${cards.map(c => c.value + c.suit).join(', ')}`);
    if (cards.length < 3) {
      console.log(`[IS_STRAIGHT] Length < 3, returning false`);
      return false; // Must have at least 3 cards for a straight
    }
    const order = {3:0,4:1,5:2,6:3,7:4,8:5,9:6,10:7,J:8,Q:9,K:10,A:11,2:12};
    const sorted = this.sortCards(cards);
    for (let i = 1; i < sorted.length; i++) {
      if (order[sorted[i].value] - order[sorted[i - 1].value] !== 1) {
        console.log(`[IS_STRAIGHT] Not consecutive, returning false`);
        return false;
      }
    }
    const result = !sorted.some(c => c.value === 2);
    console.log(`[IS_STRAIGHT] Result: ${result}`);
    return result;
  }

  isStraightFlush(cards) {
    console.log(`[IS_STRAIGHT_FLUSH] Checking cards: ${cards.map(c => c.value + c.suit).join(', ')}`);
    if (!this.isStraight(cards)) {
      console.log(`[IS_STRAIGHT_FLUSH] Not a straight, returning false`);
      return false;
    }
    const suit = cards[0].suit;
    const result = cards.every(c => c.suit === suit);
    console.log(`[IS_STRAIGHT_FLUSH] All same suit (${suit}): ${result}`);
    return result;
  }

  isAutoWin(cards) {
    const combo = this.getComboType(cards);
    if (!combo) return false;
    
    console.log(`[AUTO_WIN] Checking cards: ${cards.map(c => c.value + c.suit).join(', ')}`);
    console.log(`[AUTO_WIN] Combo type: ${combo.type}, length: ${cards.length}`);
    
    // 6 pairs auto-win
    if (combo.type === "sixpairseq") {
      console.log(`[AUTO_WIN] 6 pairs auto-win detected`);
      return true;
    }
    
    // 4 2's auto-win
    if (cards.length === 4 && cards.every(c => c.value === 2)) {
      console.log(`[AUTO_WIN] 4 2's auto-win detected`);
      return true;
    }
    
    // Straight flush auto-win
    if (this.isStraightFlush(cards)) {
      console.log(`[AUTO_WIN] Straight flush auto-win detected`);
      return true;
    }
    
    // Straight from 3 to Ace auto-win (any combination of suits)
    if (combo.type === "straight" && cards.length === 13) {
      const values = cards.map(c => c.value);
      const hasAllValues = [3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"].every(val => values.includes(val));
      if (hasAllValues) {
        console.log(`[AUTO_WIN] 3-to-Ace straight auto-win detected`);
        return true;
      }
    }
    
    console.log(`[AUTO_WIN] Not an auto-win combination`);
    return false;
  }

  beats(current, next) {
    if (!current) {
      console.log(`[BEATS] No current trick, allowing play`);
      return true;
    }
    if (current.type !== next.type || current.cards.length !== next.cards.length) {
      console.log(`[BEATS] Type/length mismatch: current=${current.type}/${current.cards.length}, next=${next.type}/${next.cards.length}`);
      return false;
    }
    
    console.log(`[BEATS] Comparing: current=${JSON.stringify(current)}, next=${JSON.stringify(next)}`);
    
    // Handle pair sequences (2 pairs, 3 pairs, 4 pairs, 5 pairs, 6 pairs)
    if (current.type === "twopairseq" || current.type === "threepairseq" || current.type === "fourpairseq" || current.type === "fivepairseq" || current.type === "sixpairseq") {
      const valueOrder = {3:0,4:1,5:2,6:3,7:4,8:5,9:6,10:7,J:8,Q:9,K:10,A:11,2:12};
      // For pair sequences, compare the highest pair value
      const currentSorted = this.sortCards(current.cards);
      const nextSorted = this.sortCards(next.cards);
      const currentHigh = currentSorted[currentSorted.length - 2]; // Second to last card (highest pair)
      const nextHigh = nextSorted[nextSorted.length - 2]; // Second to last card (highest pair)
      const result = valueOrder[nextHigh.value] > valueOrder[currentHigh.value];
      console.log(`[BEATS] Pair sequence comparison: currentHigh=${currentHigh.value}, nextHigh=${nextHigh.value}, result=${result}`);
      return result;
    }
    
    // For singles, pairs, triplets, fours, and straights
    const valueOrder = {3:0,4:1,5:2,6:3,7:4,8:5,9:6,10:7,J:8,Q:9,K:10,A:11,2:12};
    const suitOrder = {"♠":0,"♣":1,"♦":2,"♥":3};
    
    // Sort cards to get the highest card in each combo
    const currentSorted = this.sortCards(current.cards);
    const nextSorted = this.sortCards(next.cards);
    const currentHigh = currentSorted[currentSorted.length - 1];
    const nextHigh = nextSorted[nextSorted.length - 1];
    
    console.log(`[BEATS] Comparing cards: currentHigh=${currentHigh.value}${currentHigh.suit}, nextHigh=${nextHigh.value}${nextHigh.suit}`);
    
    // Compare values first
    if (valueOrder[nextHigh.value] !== valueOrder[currentHigh.value]) {
      const result = valueOrder[nextHigh.value] > valueOrder[currentHigh.value];
      console.log(`[BEATS] Value comparison: ${nextHigh.value} > ${currentHigh.value} = ${result}`);
      return result;
    }
    
    // If values are equal, compare suits
    const result = suitOrder[nextHigh.suit] > suitOrder[currentHigh.suit];
    console.log(`[BEATS] Suit comparison: ${nextHigh.suit} > ${currentHigh.suit} = ${result}`);
    return result;
  }

  playMove(playerId, cards) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    const player = this.players[playerIndex];

    if (this.players[this.turn].id !== playerId) return false;
    if (player.finished) return false;
  
    for (let card of cards) {
      if (!player.hand.find(c => c.value === card.value && c.suit === card.suit)) {
        this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} attempted to play invalid cards.`);
        return false;
      }
    }

    const isFirstTrick = this.centerPile.length === 0 && (!this.trickNumber || this.trickNumber === 1);
    if (isFirstTrick && !cards.some(c => c.value === 3 && c.suit === "♠")) {
      this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} tried to lead without 3♠ (invalid).`);
      return false;
    }

    const combo = this.getComboType(cards);
    if (!combo) {
      this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} played an invalid combo.`);
      return false;
    }

    // Check for auto-win combinations
    if (this.isAutoWin(cards)) {
      this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} played an auto-win combination!`);
      // Auto-win combinations always beat anything
    } else if (this.currentTrick && !this.beats(this.currentTrick, combo)) {
      this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} failed to beat the current trick.`);
      this.debugLog.push(`Step ${this.stepCounter++}: Current trick: ${JSON.stringify(this.currentTrick)}`);
      this.debugLog.push(`Step ${this.stepCounter++}: Attempted combo: ${JSON.stringify(combo)}`);
      return false;
    }

    player.hand = player.hand.filter(c => !cards.find(pc => pc.value === c.value && pc.suit === c.suit));

// Always stack: remove any previous play from this player, then push as new (on top)
// Replace or add their play in the center pile, ensuring recency
const existingIndex = this.centerPile.findIndex(p => p.playerId === playerId);
if (existingIndex >= 0) {
  this.centerPile.splice(existingIndex, 1); // Remove old entry
}
this.centerPile.push({ playerId, cards }); // Always push to end



    this.currentTrick = { ...combo, cards, playerId };
    this.lastTrickWinner = playerIndex;

    // Add bot dialogue if it's a bot player (but not in first trick)
    let botDialogue = null;
    if (player.isBot) {
      // Check if this is the first trick - no custom dialogues in first trick
      const isFirstTrick = this.trickNumber === 1;
      console.log(`[DEBUG] ${player.name} play - centerPile.length: ${this.centerPile.length}, trickNumber: ${this.trickNumber}, isFirstTrick: ${isFirstTrick}`);
      
      if (!isFirstTrick) {
        const isLeading = this.centerPile.length === 0 || this.centerPile.length === 1;
        
        // Determine context and strength for dialogue selection
        let context = isLeading ? 'leading' : 'following';
        
        // Check if it's a strong play (bomb, straight, or high cards)
        if (combo.type === 'four' || combo.type === 'straight' || cards.some(c => c.value === 2)) {
          context = 'strongPlay';
        } else if (combo.type === 'single' && cards[0].value <= 7) {
          context = 'weakPlay';
        }
        
        botDialogue = this.getBotDialogue(playerId, context);
        if (botDialogue) {
          this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} says: "${botDialogue}"`);
          console.log(`[DIALOGUE] ${player.name} (${context}): "${botDialogue}"`); // Server-side debug
          console.log(`[DEBUG] SENDING DIALOGUE: ${player.name} says: "${botDialogue}"`); // Server-side debug
        } else {
          console.log(`[DIALOGUE] No dialogue for ${player.name} with context: ${context}`); // Server-side debug
        }
      } else {
        console.log(`[DIALOGUE] Skipping dialogue for ${player.name} in first trick`); // Server-side debug
      }
    }
    
    // Check if Player 1 just beat a bot and trigger reaction dialogue (but not in first trick)
    if (playerId === "P1" && this.currentTrick && this.currentTrick.playerId !== "P1") {
      const beatenBot = this.players.find(p => p.id === this.currentTrick.playerId);
      if (beatenBot && beatenBot.isBot) {
        // Check if this is the first trick - no reaction dialogues in first trick
        const isFirstTrick = this.trickNumber === 1;
        console.log(`[DEBUG] Reaction dialogue - centerPile.length: ${this.centerPile.length}, trickNumber: ${this.trickNumber}, isFirstTrick: ${isFirstTrick}`);
        
        if (!isFirstTrick) {
          // Check if it was a bomb (4 of a kind or straight)
          const isBomb = combo.type === 'four' || (combo.type === 'straight' && cards.length >= 5);
          const reactionContext = isBomb ? 'bombed' : 'beaten';
          
          const reactionDialogue = this.getBotDialogue(beatenBot.id, reactionContext);
          if (reactionDialogue) {
            this.debugLog.push(`Step ${this.stepCounter++}: ${beatenBot.name} says: "${reactionDialogue}"`);
            console.log(`[REACTION] ${beatenBot.name} (${reactionContext}): "${reactionDialogue}"`); // Server-side debug
          } else {
            console.log(`[REACTION] No reaction dialogue for ${beatenBot.name} with context: ${reactionContext}`); // Server-side debug
          }
        } else {
          console.log(`[REACTION] Skipping reaction dialogue for ${beatenBot.name} in first trick`); // Server-side debug
        }
      }
    }

    this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} played: ${cards.map(c => c.value + c.suit).join(", ")}`);

    this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} hand length after playing: ${player.hand.length}`);
    if (player.hand.length === 0) {
      player.finished = true;
      this.finishOrder.push(player.id);
      this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} has finished! Hand length: ${player.hand.length}, Finish order: [${this.finishOrder.join(', ')}]`);
    } else {
      this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} still has ${player.hand.length} cards left`);
    }

    if (this.checkGameOver()) {
      this.debugLog.push(`Step ${this.stepCounter++}: checkGameOver returned true - game ending`);
      return true;
    }
    
    // Additional check: if all players are finished, end the game
    const allFinished = this.players.every(p => p.finished);
    if (allFinished && this.phase !== "GameOver") {
      this.debugLog.push(`Step ${this.stepCounter++}: All players finished but game not over, forcing game over`);
      this.checkGameOver();
    }

    this.advanceTurn();
    return true;
  }

  pass(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.passed || player.finished) return false;
    
    // Check if this is the first trick and player has 3♠
    const isFirstTrick = this.trickNumber === 1;
    const hasThreeSpades = player.hand.find(c => c.value === 3 && c.suit === "♠");
    
    if (isFirstTrick && hasThreeSpades) {
      this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} cannot pass - must play 3♠`);
      return false;
    }
    
    player.passed = true;
    
    // Add bot dialogue if it's a bot player
    if (player.isBot) {
      this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} says: "pass"`);
    }
    
    this.debugLog.push(`Step ${this.stepCounter++}: ${player.name} passed`);
    this.advanceTurn();
    return true;
  }

  advanceTurn() {
    let activePlayers = this.players.filter(p => !p.finished && !p.passed);
    let allPlayers = this.players.filter(p => !p.finished);

    if (activePlayers.length === 0) {
      // All players have finished, game should end
      this.debugLog.push(`Step ${this.stepCounter++}: All players have finished.`);
      return;
    }

    if (activePlayers.length === 1 && allPlayers.length > 1) {
      // Only one player hasn't passed, but others are still in the game - they win the current trick
      const remainingPlayer = activePlayers[0];
      const lastPlayed = this.centerPile[this.centerPile.length - 1];
      let winnerIndex = lastPlayed ? this.players.findIndex(p => p.id === lastPlayed.playerId) : this.players.findIndex(p => p.id === remainingPlayer.id);

      // Make sure the winner isn't finished
      if (this.players[winnerIndex].finished) {
        // Find the next non-finished player to lead
        let nextLeader = winnerIndex;
        do {
          nextLeader = (nextLeader + 1) % this.players.length;
        } while (this.players[nextLeader].finished);
        winnerIndex = nextLeader;
      }

      this.leadPlayer = winnerIndex;
      this.turn = winnerIndex;
      
      // Add winning dialogue if it's a bot player (but not in first trick)
      if (this.players[winnerIndex].isBot) {
        // Check if this is the first trick - no winning dialogues in first trick
        const isFirstTrick = this.trickNumber === 1;
        
        if (!isFirstTrick) {
          const botDialogue = this.getBotDialogue(this.players[winnerIndex].id, 'winning');
          if (botDialogue) {
            this.debugLog.push(`Step ${this.stepCounter++}: ${this.players[winnerIndex].name} says: "${botDialogue}"`);
            console.log(`[WINNING] ${this.players[winnerIndex].name}: "${botDialogue}"`); // Server-side debug
          } else {
            console.log(`[WINNING] No winning dialogue for ${this.players[winnerIndex].name}`); // Server-side debug
          }
        } else {
          console.log(`[WINNING] Skipping winning dialogue for ${this.players[winnerIndex].name} in first trick`); // Server-side debug
        }
      }
      
      this.debugLog.push(`Step ${this.stepCounter++}: ${this.players[winnerIndex].name} wins the trick and leads the next round.`);

      // Reset for new round
      this.currentTrick = null;
      this.centerPile = [];
      this.players.forEach(p => (p.passed = false));
      this.trickNumber = (this.trickNumber || 1) + 1;
      return;
    }

    if (allPlayers.length === 1) {
      // Only one player left in the entire game - they automatically finish
      const remainingPlayer = allPlayers[0];
      remainingPlayer.finished = true;
      this.finishOrder.push(remainingPlayer.id);
      this.debugLog.push(`Step ${this.stepCounter++}: ${remainingPlayer.name} is the last player and automatically finishes! Finish order: [${this.finishOrder.join(', ')}]`);
      
      // End the game
      this.checkGameOver();
      return;
    }

    let nextTurn = this.turn;
    do {
      nextTurn = (nextTurn + 1) % this.players.length;
    } while (this.players[nextTurn].finished || this.players[nextTurn].passed);

    this.turn = nextTurn;
    this.debugLog.push(`Step ${this.stepCounter++}: Turn passes to ${this.players[this.turn].name}`);
  }

  checkGameOver() {
    const activePlayers = this.players.filter(p => !p.finished);
    this.debugLog.push(`Step ${this.stepCounter++}: checkGameOver - Active players: ${activePlayers.length}, Finished players: ${this.players.filter(p => p.finished).map(p => p.name).join(', ')}, Finish order: [${this.finishOrder.join(', ')}]`);
    
    if (activePlayers.length === 0) {
      this.phase = "GameOver";
      this.debugLog.push(`Step ${this.stepCounter++}: Game Over! Finish order: ${this.finishOrder.join(', ')}`);
      if (this.finishOrder.length > 0) {
        const winnerId = this.finishOrder[0];
        const winner = this.players.find(p => p.id === winnerId);
        this.winner = winner?.name || "Unknown";
        this.debugLog.push(`Step ${this.stepCounter++}: ${this.winner} wins the game!`);
      } else {
        this.winner = "Unknown";
        this.debugLog.push(`Step ${this.stepCounter++}: Game Over: Winner unknown.`);
      }
      return true;
    }
    return false;
  }
  
  
  

}
