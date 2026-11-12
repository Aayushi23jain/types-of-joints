# Voice-over script - Types of Joints

Written for: the voice artist (or whoever runs the text-to-speech tool) and the person who adds the files to the game.

## How to deliver

- One file per row, named exactly as in the **File** column, in the language folder: `assets/audio/<lang>/<file>`.
- Format: mono, 48 kHz, Ogg Opus (`.opus`) ~32 kbps **and** an AAC copy (`.m4a`, 48 kbps) with the same name. (Or send WAV and we convert: `ffmpeg -i x.wav -c:a libopus -b:a 32k x.opus` and `ffmpeg -i x.wav -c:a aac -b:a 48k x.m4a`.)
- Trim silence to max 150 ms at the start and 300 ms at the end. Peak about -3 dBFS, loudness about -16 LUFS, the same as the existing clips.
- Then add the key to `assets/audio/manifest.json` under the language, e.g. `"quiz-4": "hi/quiz-4.opus"`. Nothing else in the code needs to change.

## Voice direction

Same voice as the existing recordings. Warm, clear, friendly teacher talking to a 10-12 year old; unhurried (about 140 words per minute in English), smile in the voice on "Correct!", gentle (never disappointed) on hints. Read the text exactly as written: it is shown on screen at the same time. Joint names are said the same way every time.

9 clips per language are needed; 17 more are nice to have (until they exist, the game uses the device's text-to-speech voice where one is installed).

## English (en)

| Priority | File | Text to read | Note |
|---|---|---|---|
| **Must** | `en/quiz-3-v2.opus` | You bend your elbow to lift a water bottle up to your mouth. Which type of joint lets your elbow bend? | Replaces the old gym question. |
| **Must** | `en/quiz-4.opus` | You shake your head from side to side to say "no". Which joint lets your head turn? | New question. |
| **Must** | `en/quiz-5.opus` | Your knee can bend and straighten, but it cannot swing round in a circle like your hip. What does this tell you? | New question. |
| **Must** | `en/quiz-4-explain.opus` | The answer is the pivotal joint. The joint where the head meets the neck lets the head turn from side to side. | Plays after "Correct!" / "Incorrect!". |
| **Must** | `en/quiz-5-explain.opus` | The knee is a hinge joint, so it moves only back and forth. The hip is a ball and socket joint, so it can move in all directions. | Plays after "Correct!" / "Incorrect!". |
| **Must** | `en/pivotal.opus` | A pivotal joint allows a part of the body to rotate around an axis, like a wheel turning on its axle. An example of a pivotal joint is the joint between the first and second neck vertebrae, which helps you turn your head. | Re-record: now says "around an axis". |
| **Must** | `en/predict.opus` | Predict first: how do you think this joint moves? | Activity: before each joint moves. |
| **Must** | `en/intro.opus` | A joint is a part of the body where two or more bones meet, allowing movement. We can bend or move our body only where two bones meet. Types of joints: Joints are classified based on the amount of movement they allow. The three main types are: Immovable joints: The bones are tightly connected, so no movement can happen, like the bones in the skull. Slightly movable joints: The bones are held tightly but allow a little movement, like the bones in the spine. Freely movable joints: The bones are held loosely, which allows them to move freely, like in the arms and legs. Freely movable joints come in different types, depending on how they move: hinge joints (elbow, knee), pivotal joints (head on the neck) and ball and socket joints (shoulder, hip). The joints of the skull are fixed (immovable) joints. You will explore these four next. | Re-record: adds the last sentence. |
| **Must** | `en/student-flow-1.opus` | Riya is playing on the swing. She bends her elbow to hold the rope, turns her head to wave at her friend, and kicks her leg in a big circle. But the bones of her skull do not move at all! Why can some parts of the body move while others cannot? | Re-record only if the old clip also read the answer options. |
| Nice | `en/hint-q1-1.opus` | A fixed joint does not allow any movement, but your shoulder moves a lot. | Hint after a wrong first try (q1, option 1). |
| Nice | `en/hint-q1-2.opus` | A hinge joint moves only back and forth, like a door. Your arm can also swing out to the side and in circles. | Hint after a wrong first try (q1, option 2). |
| Nice | `en/hint-q1-3.opus` | A pivotal joint only lets a part rotate, like your head turning. Your arm can move in every direction. | Hint after a wrong first try (q1, option 3). |
| Nice | `en/hint-q2-1.opus` | Your shoulder moves in many directions. It has a ball and socket joint. | Hint after a wrong first try (q2, option 1). |
| Nice | `en/hint-q2-2.opus` | Your knee bends back and forth. It is a hinge joint. | Hint after a wrong first try (q2, option 2). |
| Nice | `en/hint-q2-4.opus` | Your lower jaw moves when you talk and chew, so this joint is movable. | Hint after a wrong first try (q2, option 4). |
| Nice | `en/hint-q3-1.opus` | A pivotal joint lets a part rotate, like your head turning. Your elbow does not twist round like that. | Hint after a wrong first try (q3, option 1). |
| Nice | `en/hint-q3-2.opus` | A ball and socket joint moves in all directions, like your shoulder. Your elbow bends only one way. | Hint after a wrong first try (q3, option 2). |
| Nice | `en/hint-q3-4.opus` | A fixed joint does not move at all, but your elbow bends. | Hint after a wrong first try (q3, option 4). |
| Nice | `en/hint-q4-1.opus` | A hinge joint only bends back and forth, like your elbow. Turning your head is a rotation. | Hint after a wrong first try (q4, option 1). |
| Nice | `en/hint-q4-3.opus` | A fixed joint does not move at all, but your head can turn. | Hint after a wrong first try (q4, option 3). |
| Nice | `en/hint-q4-4.opus` | A ball and socket joint moves in all directions, like your shoulder. Your head only turns around the neck. | Hint after a wrong first try (q4, option 4). |
| Nice | `en/hint-q5-2.opus` | A fixed joint cannot move at all, but your knee bends. And your hip moves in more than one direction. | Hint after a wrong first try (q5, option 2). |
| Nice | `en/hint-q5-3.opus` | A pivotal joint only rotates. The knee bends instead, and the hip moves in many directions. | Hint after a wrong first try (q5, option 3). |
| Nice | `en/hint-q5-4.opus` | A ball and socket joint can swing round in a circle. Can your knee do that? | Hint after a wrong first try (q5, option 4). |
| Nice | `en/labels.opus` | Tap any label to zoom in and read about it. | Optional: touch-screen wording ("Tap"). |
| Nice | `en/activity.opus` | Tap the highlighted points to see each joint move. | Optional: touch-screen wording ("Tap"). |

## ગુજરાતી (gu)

| Priority | File | Text to read | Note |
|---|---|---|---|
| **Must** | `gu/quiz-3-v2.opus` | પાણીની બોટલ મોં સુધી લાવવા તમે કોણી વાળો છો. કયા પ્રકારનો સાંધો તમારી કોણીને વળવા દે છે? | Replaces the old gym question. |
| **Must** | `gu/quiz-4.opus` | "ના" કહેવા તમે માથું આમતેમ હલાવો છો. કયો સાંધો તમારા માથાને ફરવા દે છે? | New question. |
| **Must** | `gu/quiz-5.opus` | તમારો ઘૂંટણ વળી અને સીધો થઈ શકે છે, પણ થાપાની જેમ ગોળ ફરી શકતો નથી. આ પરથી શું સમજાય છે? | New question. |
| **Must** | `gu/quiz-4-explain.opus` | સાચો જવાબ ધરી સાંધો છે. માથું અને ગરદન જ્યાં મળે છે ત્યાંનો સાંધો માથાને આમતેમ ફરવા દે છે. | Plays after "Correct!" / "Incorrect!". |
| **Must** | `gu/quiz-5-explain.opus` | ઘૂંટણ મિજાગરા સાંધો છે, તેથી તે ફક્ત આગળ-પાછળ હલે છે. થાપો ખલ્લ-દસ્તો સાંધો છે, તેથી તે બધી દિશામાં હલી શકે છે. | Plays after "Correct!" / "Incorrect!". |
| **Must** | `gu/pivotal.opus` | ધરી સાંધો શરીરના ભાગને એક ધરીની આસપાસ ફરવા દે છે, જેમ પૈડું તેની ધરી પર ફરે છે. ગરદનના પહેલા અને બીજા મણકા વચ્ચેનો સાંધો ધરી સાંધાનું ઉદાહરણ છે, જે તમને તમારું માથું ફેરવવામાં મદદ કરે છે. | Re-record: now says "around an axis". |
| **Must** | `gu/predict.opus` | પહેલાં અનુમાન કરો: આ સાંધો કેવી રીતે હલે છે? | Activity: before each joint moves. |
| **Must** | `gu/intro.opus` | સાંધો એ શરીરનો એવો ભાગ છે જ્યાં બે અથવા વધારે હાડકાં ભેગાં થાય છે અને હલનચલન શક્ય બને છે. આપણે શરીરને ત્યારે જ વાળી કે હલાવી શકીએ છીએ જ્યારે બે હાડકાં ભેગાં થાય. સાંધાના પ્રકારો: સાંધાઓ કેટલું હલનચલન કરવા દે છે તેના આધારે તેમનું વર્ગીકરણ થાય છે. મુખ્ય ત્રણ પ્રકાર છે: અચલ સાંધા: હાડકાં મજબૂતીથી જોડાયેલાં હોય છે, તેથી ખોપરીનાં હાડકાંની જેમ કોઈ હલનચલન થઈ શકતું નથી. અંશતઃ હલનચલન કરી શકે તેવા સાંધા: હાડકાં મજબૂતીથી જોડાયેલાં હોય છે પરંતુ કરોડસ્તંભનાં હાડકાંની જેમ થોડું હલનચલન થાય છે. મુક્ત રીતે હલનચલન કરી શકે તેવા સાંધા: હાડકાં ઢીલી રીતે જોડાયેલાં હોય છે, જેથી હાથ અને પગની જેમ તે મુક્ત રીતે હલનચલન કરી શકે છે. મુક્ત રીતે હલનચલન કરી શકે તેવા સાંધાના જુદા જુદા પ્રકાર છે, તે કેવી રીતે હલે છે તેના આધારે: મિજાગરા સાંધો (કોણી, ઘૂંટણ), ધરી સાંધો (ગરદન પર માથું) અને ખલ્લ-દસ્તો સાંધો (ખભો, થાપો). ખોપરીના સાંધા અચલ સાંધા છે. હવે તમે આ ચાર સાંધા જોશો. | Re-record: adds the last sentence. |
| **Must** | `gu/student-flow-1.opus` | રિયા ઝૂલા પર રમી રહી છે. તે દોરડું પકડવા કોણી વાળે છે, મિત્રને હાથ હલાવવા માથું ફેરવે છે અને પગને મોટા ગોળામાં ફેરવે છે. પરંતુ તેની ખોપરીના હાડકાં બિલકુલ હલતા નથી! શરીરના કેટલાક ભાગ કેમ હલી શકે છે અને કેટલાક કેમ નથી હલતા? | Re-record only if the old clip also read the answer options. |
| Nice | `gu/hint-q1-1.opus` | અચલ સાંધો કોઈ હલનચલન કરવા દેતો નથી, પણ તમારો ખભો ઘણો હલે છે. | Hint after a wrong first try (q1, option 1). |
| Nice | `gu/hint-q1-2.opus` | મિજાગરા સાંધો બારણાની જેમ ફક્ત આગળ-પાછળ હલે છે. તમારો હાથ બાજુમાં અને ગોળ પણ ફરી શકે છે. | Hint after a wrong first try (q1, option 2). |
| Nice | `gu/hint-q1-3.opus` | ધરી સાંધો ફક્ત ફરવા દે છે, જેમ માથું ફરે છે. તમારો હાથ બધી દિશામાં હલી શકે છે. | Hint after a wrong first try (q1, option 3). |
| Nice | `gu/hint-q2-1.opus` | તમારો ખભો ઘણી દિશામાં હલે છે. તેમાં ખલ્લ-દસ્તો સાંધો છે. | Hint after a wrong first try (q2, option 1). |
| Nice | `gu/hint-q2-2.opus` | તમારો ઘૂંટણ આગળ-પાછળ વળે છે. તે મિજાગરા સાંધો છે. | Hint after a wrong first try (q2, option 2). |
| Nice | `gu/hint-q2-4.opus` | બોલતી અને ચાવતી વખતે તમારું નીચલું જડબું હલે છે, તેથી આ સાંધો હલનચલનશીલ છે. | Hint after a wrong first try (q2, option 4). |
| Nice | `gu/hint-q3-1.opus` | ધરી સાંધો ભાગને ફરવા દે છે, જેમ માથું ફરે છે. તમારી કોણી એ રીતે ફરતી નથી. | Hint after a wrong first try (q3, option 1). |
| Nice | `gu/hint-q3-2.opus` | ખલ્લ-દસ્તો સાંધો ખભાની જેમ બધી દિશામાં હલે છે. તમારી કોણી ફક્ત એક જ રીતે વળે છે. | Hint after a wrong first try (q3, option 2). |
| Nice | `gu/hint-q3-4.opus` | અચલ સાંધો બિલકુલ હલતો નથી, પણ તમારી કોણી વળે છે. | Hint after a wrong first try (q3, option 4). |
| Nice | `gu/hint-q4-1.opus` | મિજાગરા સાંધો કોણીની જેમ ફક્ત આગળ-પાછળ વળે છે. માથું ફેરવવું એ ફરવાની ગતિ છે. | Hint after a wrong first try (q4, option 1). |
| Nice | `gu/hint-q4-3.opus` | અચલ સાંધો બિલકુલ હલતો નથી, પણ તમારું માથું ફરી શકે છે. | Hint after a wrong first try (q4, option 3). |
| Nice | `gu/hint-q4-4.opus` | ખલ્લ-દસ્તો સાંધો ખભાની જેમ બધી દિશામાં હલે છે. તમારું માથું ફક્ત ગરદનની આસપાસ ફરે છે. | Hint after a wrong first try (q4, option 4). |
| Nice | `gu/hint-q5-2.opus` | અચલ સાંધો બિલકુલ હલતો નથી, પણ તમારો ઘૂંટણ વળે છે. અને થાપો એકથી વધુ દિશામાં હલે છે. | Hint after a wrong first try (q5, option 2). |
| Nice | `gu/hint-q5-3.opus` | ધરી સાંધો ફક્ત ફરે છે. ઘૂંટણ વળે છે, અને થાપો ઘણી દિશામાં હલે છે. | Hint after a wrong first try (q5, option 3). |
| Nice | `gu/hint-q5-4.opus` | ખલ્લ-દસ્તો સાંધો ગોળ ફરી શકે છે. શું તમારો ઘૂંટણ એવું કરી શકે છે? | Hint after a wrong first try (q5, option 4). |
| Nice | `gu/labels.opus` | ઝૂમ કરીને વાંચવા માટે કોઈપણ લેબલ પર ટેપ કરો. | Optional: touch-screen wording ("Tap"). |
| Nice | `gu/activity.opus` | દરેક સાંધાને હલતો જોવા માટે હાઇલાઇટ કરેલા બિંદુઓ પર ટેપ કરો. | Optional: touch-screen wording ("Tap"). |

## हिंदी (hi)

| Priority | File | Text to read | Note |
|---|---|---|---|
| **Must** | `hi/quiz-3-v2.opus` | पानी की बोतल मुँह तक लाने के लिए आप कोहनी मोड़ते हैं। कौन-सा जोड़ आपकी कोहनी को मुड़ने देता है? | Replaces the old gym question. |
| **Must** | `hi/quiz-4.opus` | "नहीं" कहने के लिए आप सिर दाएँ-बाएँ हिलाते हैं। कौन-सा जोड़ आपके सिर को घूमने देता है? | New question. |
| **Must** | `hi/quiz-5.opus` | आपका घुटना मुड़ और सीधा हो सकता है, लेकिन कूल्हे की तरह गोल नहीं घूम सकता। इससे क्या पता चलता है? | New question. |
| **Must** | `hi/quiz-4-explain.opus` | सही उत्तर पिवट जोड़ है। जहाँ सिर गर्दन से मिलता है, वहाँ का जोड़ सिर को दाएँ-बाएँ घूमने देता है। | Plays after "Correct!" / "Incorrect!". |
| **Must** | `hi/quiz-5-explain.opus` | घुटना कब्जा जोड़ है, इसलिए वह केवल आगे-पीछे हिलता है। कूल्हा गेंद-और-सॉकेट जोड़ है, इसलिए वह हर दिशा में हिल सकता है। | Plays after "Correct!" / "Incorrect!". |
| **Must** | `hi/pivotal.opus` | पिवट जोड़ शरीर के किसी भाग को एक अक्ष के चारों ओर घूमने देता है, जैसे पहिया अपनी धुरी पर घूमता है। गर्दन की पहली और दूसरी कशेरुका के बीच का जोड़ पिवट जोड़ का उदाहरण है, जो आपको सिर घुमाने में मदद करता है। | Re-record: now says "around an axis". |
| **Must** | `hi/predict.opus` | पहले अनुमान लगाएँ: यह जोड़ कैसे हिलता है? | Activity: before each joint moves. |
| **Must** | `hi/intro.opus` | जोड़ शरीर का वह भाग है जहाँ दो या अधिक हड्डियाँ मिलती हैं और गति संभव होती है। हम अपने शरीर को केवल वहीं मोड़ या हिला सकते हैं जहाँ दो हड्डियाँ मिलती हैं। जोड़ों के प्रकार: जोड़ों को इस आधार पर बाँटा जाता है कि वे कितनी गति की अनुमति देते हैं। तीन मुख्य प्रकार हैं: अचल जोड़: हड्डियाँ कसकर जुड़ी होती हैं, इसलिए खोपड़ी की हड्डियों की तरह कोई गति नहीं हो सकती। अल्प चल जोड़: हड्डियाँ कसकर जुड़ी होती हैं लेकिन रीढ़ की हड्डियों की तरह थोड़ी गति होती है। पूर्ण चल जोड़: हड्डियाँ ढीले रूप से जुड़ी होती हैं, जिससे वे हाथों और पैरों की तरह स्वतंत्र रूप से हिल सकती हैं। पूर्ण चल जोड़ कई प्रकार के होते हैं, इस आधार पर कि वे कैसे हिलते हैं: कब्जा जोड़ (कोहनी, घुटना), पिवट जोड़ (गर्दन पर सिर) और गेंद-और-सॉकेट जोड़ (कंधा, कूल्हा)। खोपड़ी के जोड़ स्थिर (अचल) जोड़ हैं। अब आप इन चारों को देखेंगे। | Re-record: adds the last sentence. |
| **Must** | `hi/student-flow-1.opus` | रिया झूले पर खेल रही है। वह रस्सी पकड़ने के लिए कोहनी मोड़ती है, दोस्त को हाथ हिलाने के लिए सिर घुमाती है और पैर को बड़े घेरे में घुमाती है। लेकिन उसकी खोपड़ी की हड्डियाँ बिल्कुल नहीं हिलतीं! शरीर के कुछ हिस्से क्यों हिल सकते हैं और कुछ क्यों नहीं? | Re-record only if the old clip also read the answer options. |
| Nice | `hi/hint-q1-1.opus` | स्थिर जोड़ कोई गति नहीं होने देता, लेकिन आपका कंधा बहुत हिलता है। | Hint after a wrong first try (q1, option 1). |
| Nice | `hi/hint-q1-2.opus` | कब्जा जोड़ दरवाज़े की तरह केवल आगे-पीछे हिलता है। आपकी बाँह बगल में और गोल भी घूम सकती है। | Hint after a wrong first try (q1, option 2). |
| Nice | `hi/hint-q1-3.opus` | पिवट जोड़ केवल घूमने देता है, जैसे सिर घूमता है। आपकी बाँह हर दिशा में हिल सकती है। | Hint after a wrong first try (q1, option 3). |
| Nice | `hi/hint-q2-1.opus` | आपका कंधा कई दिशाओं में हिलता है। उसमें गेंद-और-सॉकेट जोड़ है। | Hint after a wrong first try (q2, option 1). |
| Nice | `hi/hint-q2-2.opus` | आपका घुटना आगे-पीछे मुड़ता है। यह कब्जा जोड़ है। | Hint after a wrong first try (q2, option 2). |
| Nice | `hi/hint-q2-4.opus` | बोलते और चबाते समय आपका निचला जबड़ा हिलता है, इसलिए यह जोड़ चल है। | Hint after a wrong first try (q2, option 4). |
| Nice | `hi/hint-q3-1.opus` | पिवट जोड़ किसी भाग को घूमने देता है, जैसे सिर घूमता है। आपकी कोहनी इस तरह नहीं घूमती। | Hint after a wrong first try (q3, option 1). |
| Nice | `hi/hint-q3-2.opus` | गेंद-और-सॉकेट जोड़ कंधे की तरह हर दिशा में हिलता है। आपकी कोहनी केवल एक ही तरफ़ मुड़ती है। | Hint after a wrong first try (q3, option 2). |
| Nice | `hi/hint-q3-4.opus` | स्थिर जोड़ बिल्कुल नहीं हिलता, लेकिन आपकी कोहनी मुड़ती है। | Hint after a wrong first try (q3, option 4). |
| Nice | `hi/hint-q4-1.opus` | कब्जा जोड़ कोहनी की तरह केवल आगे-पीछे मुड़ता है। सिर घुमाना घूमने की गति है। | Hint after a wrong first try (q4, option 1). |
| Nice | `hi/hint-q4-3.opus` | स्थिर जोड़ बिल्कुल नहीं हिलता, लेकिन आपका सिर घूम सकता है। | Hint after a wrong first try (q4, option 3). |
| Nice | `hi/hint-q4-4.opus` | गेंद-और-सॉकेट जोड़ कंधे की तरह हर दिशा में हिलता है। आपका सिर केवल गर्दन के चारों ओर घूमता है। | Hint after a wrong first try (q4, option 4). |
| Nice | `hi/hint-q5-2.opus` | स्थिर जोड़ बिल्कुल नहीं हिलता, लेकिन आपका घुटना मुड़ता है। और कूल्हा एक से अधिक दिशाओं में हिलता है। | Hint after a wrong first try (q5, option 2). |
| Nice | `hi/hint-q5-3.opus` | पिवट जोड़ केवल घूमता है। घुटना मुड़ता है, और कूल्हा कई दिशाओं में हिलता है। | Hint after a wrong first try (q5, option 3). |
| Nice | `hi/hint-q5-4.opus` | गेंद-और-सॉकेट जोड़ गोल घूम सकता है। क्या आपका घुटना ऐसा कर सकता है? | Hint after a wrong first try (q5, option 4). |
| Nice | `hi/labels.opus` | ज़ूम करके पढ़ने के लिए किसी भी लेबल पर टैप करें। | Optional: touch-screen wording ("Tap"). |
| Nice | `hi/activity.opus` | हर जोड़ को हिलते हुए देखने के लिए हाइलाइट किए गए बिंदुओं पर टैप करें। | Optional: touch-screen wording ("Tap"). |

## मराठी (mr)

| Priority | File | Text to read | Note |
|---|---|---|---|
| **Must** | `mr/quiz-3-v2.opus` | पाण्याची बाटली तोंडापर्यंत आणण्यासाठी तुम्ही कोपर वाकवता. कोणता सांधा तुमचे कोपर वाकू देतो? | Replaces the old gym question. |
| **Must** | `mr/quiz-4.opus` | "नाही" म्हणण्यासाठी तुम्ही डोके डावीकडे-उजवीकडे हलवता. कोणता सांधा तुमचे डोके फिरू देतो? | New question. |
| **Must** | `mr/quiz-5.opus` | तुमचा गुडघा वाकू आणि सरळ होऊ शकतो, पण खुब्याप्रमाणे गोल फिरू शकत नाही. यावरून काय समजते? | New question. |
| **Must** | `mr/quiz-4-explain.opus` | बरोबर उत्तर आस सांधा आहे. डोके आणि मान जिथे जुळतात तिथला सांधा डोके डावीकडे-उजवीकडे फिरू देतो. | Plays after "Correct!" / "Incorrect!". |
| **Must** | `mr/quiz-5-explain.opus` | गुडघा बिजागरी सांधा आहे, म्हणून तो फक्त पुढे-मागे हलतो. खुबा उखळी सांधा आहे, म्हणून तो सर्व दिशांना हलू शकतो. | Plays after "Correct!" / "Incorrect!". |
| **Must** | `mr/pivotal.opus` | आस सांधा शरीराच्या भागाला एका अक्षाभोवती फिरू देतो, जसे चाक आपल्या आसावर फिरते. मानेच्या पहिल्या आणि दुसऱ्या मणक्यांमधील सांधा हे आस सांध्याचे उदाहरण आहे, जो तुम्हाला मान वळवण्यास मदत करतो. | Re-record: now says "around an axis". |
| **Must** | `mr/predict.opus` | आधी अंदाज करा: हा सांधा कसा हलतो? | Activity: before each joint moves. |
| **Must** | `mr/intro.opus` | सांधा हा शरीराचा असा भाग आहे जिथे दोन किंवा अधिक हाडे एकत्र येतात आणि हालचाल शक्य होते. जिथे दोन हाडे एकत्र येतात तिथेच आपण शरीर वाकवू किंवा हलवू शकतो. सांध्यांचे प्रकार: सांधे किती हालचाल करू देतात यावर त्यांचे वर्गीकरण केले जाते. मुख्य तीन प्रकार आहेत: स्थिर सांधे: हाडे घट्ट जोडलेली असतात, त्यामुळे कवटीच्या हाडांप्रमाणे कोणतीही हालचाल होऊ शकत नाही. अल्प हालचाल करणारे सांधे: हाडे घट्ट जोडलेली असतात, पण पाठीच्या कण्यातील हाडांप्रमाणे थोडी हालचाल होते. मुक्त हालचाल करणारे सांधे: हाडे सैलपणे जोडलेली असतात, त्यामुळे हात आणि पायांप्रमाणे ती मुक्तपणे हलू शकतात. मुक्त हालचाल करणाऱ्या सांध्यांचे वेगवेगळे प्रकार आहेत, ते कसे हलतात यावरून: बिजागरी सांधा (कोपर, गुडघा), आस सांधा (मानेवरील डोके) आणि उखळी सांधा (खांदा, खुबा). कवटीतील सांधे स्थिर (अचल) सांधे आहेत. आता तुम्ही हे चार सांधे पाहाल. | Re-record: adds the last sentence. |
| **Must** | `mr/student-flow-1.opus` | रिया झोक्यावर खेळत आहे. दोरी धरण्यासाठी ती कोपर वाकवते, मैत्रिणीला हात दाखवण्यासाठी डोके फिरवते आणि पाय मोठ्या वर्तुळात फिरवते. पण तिच्या कवटीची हाडे मात्र अजिबात हलत नाहीत! शरीराचे काही भाग का हलतात आणि काही का हलत नाहीत? | Re-record only if the old clip also read the answer options. |
| Nice | `mr/hint-q1-1.opus` | स्थिर सांधा कोणतीही हालचाल होऊ देत नाही, पण तुमचा खांदा खूप हलतो. | Hint after a wrong first try (q1, option 1). |
| Nice | `mr/hint-q1-2.opus` | बिजागरी सांधा दरवाज्याप्रमाणे फक्त पुढे-मागे हलतो. तुमचा हात बाजूला आणि गोलही फिरू शकतो. | Hint after a wrong first try (q1, option 2). |
| Nice | `mr/hint-q1-3.opus` | आस सांधा फक्त फिरू देतो, जसे डोके फिरते. तुमचा हात सर्व दिशांना हलू शकतो. | Hint after a wrong first try (q1, option 3). |
| Nice | `mr/hint-q2-1.opus` | तुमचा खांदा अनेक दिशांना हलतो. त्यात उखळी सांधा आहे. | Hint after a wrong first try (q2, option 1). |
| Nice | `mr/hint-q2-2.opus` | तुमचा गुडघा पुढे-मागे वाकतो. तो बिजागरी सांधा आहे. | Hint after a wrong first try (q2, option 2). |
| Nice | `mr/hint-q2-4.opus` | बोलताना आणि चावताना तुमचा खालचा जबडा हलतो, म्हणून हा सांधा हलणारा आहे. | Hint after a wrong first try (q2, option 4). |
| Nice | `mr/hint-q3-1.opus` | आस सांधा भागाला फिरू देतो, जसे डोके फिरते. तुमचे कोपर तसे फिरत नाही. | Hint after a wrong first try (q3, option 1). |
| Nice | `mr/hint-q3-2.opus` | उखळी सांधा खांद्याप्रमाणे सर्व दिशांना हलतो. तुमचे कोपर फक्त एकाच दिशेने वाकते. | Hint after a wrong first try (q3, option 2). |
| Nice | `mr/hint-q3-4.opus` | स्थिर सांधा अजिबात हलत नाही, पण तुमचे कोपर वाकते. | Hint after a wrong first try (q3, option 4). |
| Nice | `mr/hint-q4-1.opus` | बिजागरी सांधा कोपराप्रमाणे फक्त पुढे-मागे वाकतो. डोके वळवणे ही फिरण्याची हालचाल आहे. | Hint after a wrong first try (q4, option 1). |
| Nice | `mr/hint-q4-3.opus` | स्थिर सांधा अजिबात हलत नाही, पण तुमचे डोके फिरू शकते. | Hint after a wrong first try (q4, option 3). |
| Nice | `mr/hint-q4-4.opus` | उखळी सांधा खांद्याप्रमाणे सर्व दिशांना हलतो. तुमचे डोके फक्त मानेभोवती फिरते. | Hint after a wrong first try (q4, option 4). |
| Nice | `mr/hint-q5-2.opus` | स्थिर सांधा अजिबात हलत नाही, पण तुमचा गुडघा वाकतो. आणि खुबा एकापेक्षा जास्त दिशांना हलतो. | Hint after a wrong first try (q5, option 2). |
| Nice | `mr/hint-q5-3.opus` | आस सांधा फक्त फिरतो. गुडघा वाकतो, आणि खुबा अनेक दिशांना हलतो. | Hint after a wrong first try (q5, option 3). |
| Nice | `mr/hint-q5-4.opus` | उखळी सांधा गोल फिरू शकतो. तुमचा गुडघा असे करू शकतो का? | Hint after a wrong first try (q5, option 4). |
| Nice | `mr/labels.opus` | मोठे करून वाचण्यासाठी कोणत्याही लेबलवर टॅप करा. | Optional: touch-screen wording ("Tap"). |
| Nice | `mr/activity.opus` | प्रत्येक सांधा हलताना पाहण्यासाठी ठळक केलेल्या बिंदूंवर टॅप करा. | Optional: touch-screen wording ("Tap"). |

## Before recording gu / hi / mr

The Gujarati, Hindi and Marathi texts above are first drafts. Have a subject teacher check them against the state-board textbook (Hindi: "जोड़" vs NCERT "संधि"), and update `js/i18n.js` first, so that screen and voice match.
