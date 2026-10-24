/* ============================================================
   רשימת המדיה — מקור אחד לכל הקבצים שהמצגת מחכה להם.
   כל שקף מצביע על מזהה מכאן (data-m="id").
   אם הקובץ לא קיים — השקף מציג כרטיס "חסר" עם שם הקובץ ומה לשים בו.
   מקש M במצגת: טבלה של כל הקבצים, מה קיים ומה חסר.
   npm run media-guide  →  מייצר את MEDIA_GUIDE.md מהרשימה הזאת.

   kind:   image | video
   source: you      — צילום מסך / תמונה / וידאו שאתה מצלם או מייצר בעצמך
           commons  — תמונה ברישיון פתוח מ-Wikimedia Commons (לרשום ב-CREDITS.md)
           clip     — קטע מוגן בזכויות יוצרים. רק באישורך, רק להקרנה בכיתה, קצר
           ai-you   — תמונה שאתה מייצר בכלי AI (למשחק "אמת או AI?"), ומסמן ב-CREDITS
   ============================================================ */
window.MEDIA = {
  // ---------- פתיחה ----------
  me_photo: { file: 'img/me.jpg', kind: 'image', source: 'you', slide: 'כמה מילים עליי',
    what: 'תמונה שלך (אפשר במדים, אם מותר לפרסם, או בטבע / עם תחביב). לרוחב או ריבועית.' },
  dad_photo: { file: 'img/dad.jpg', kind: 'image', source: 'you', optional: true, slide: 'הבעיות שלי — קלף אישי',
    what: 'לא חובה. תמונה של אבא שלך לקלף האישי (מוצג רק כשלוחצים D). אם אין — הקלף מוצג רק עם טקסט.' },

  // ---------- ג׳ארוויס ----------
  jarvis_clip: { file: 'video/jarvis-ironman-2008.mp4', kind: 'video', source: 'clip', slide: 'ג׳ארוויס (Iron Man, 2008)',
    what: 'קטע של 30–60 שניות מ-Iron Man (2008) שבו טוני סטארק מדבר עם ג׳ארוויס במעבדה. MP4, H.264.',
    why: 'זכויות יוצרים של Marvel. אני לא מוריד את זה. אם אתה מחליט להקרין — קטע קצר, בכיתה בלבד.' },
  jarvis_still: { file: 'img/jarvis-ironman-2008.jpg', kind: 'image', source: 'clip', optional: true, slide: 'ג׳ארוויס (Iron Man, 2008)',
    what: 'גיבוי: פריים אחד מהסצנה (צילום מסך מהקטע). מוצג אם אין וידאו.' },
  zuck_jarvis: { file: 'img/zuckerberg-jarvis-2016.jpg', kind: 'image', source: 'you', slide: 'צוקרברג בונה ג׳ארוויס (2016)',
    what: 'צילום מסך מהסרטון/הפוסט של צוקרברג על Jarvis מדצמבר 2016 (פייסבוק), או תמונה של צוקרברג מ-Commons (חפש "Mark Zuckerberg" עם רישיון CC).' },
  zuck_clip: { file: 'video/zuckerberg-jarvis-2016.mp4', kind: 'video', source: 'clip', optional: true, slide: 'צוקרברג בונה ג׳ארוויס (2016)',
    what: 'לא חובה: 20–40 שניות מהסרטון "Jarvis" שצוקרברג פרסם ב-20.12.2016 (הקול של מורגן פרימן).' },
  today_voice: { file: 'img/today-voice.jpg', kind: 'image', source: 'you', slide: 'והיום? (2026)', what: 'צילום מסך של מצב שיחה קולית באפליקציית AI (גלי הקול על המסך).' },
  today_code: { file: 'img/today-code.jpg', kind: 'image', source: 'you', slide: 'והיום? (2026)', what: 'צילום מסך של AI שכותב קוד (למשל המסך הזה של Claude Code, או כל כלי קוד).' },
  today_image: { file: 'img/today-image.jpg', kind: 'image', source: 'ai-you', slide: 'והיום? (2026)', what: 'תמונה שיצרת בכלי AI (משהו מגניב, למשל "חתול אסטרונאוט בירושלים").' },
  today_video: { file: 'video/today-video.mp4', kind: 'video', source: 'ai-you', slide: 'והיום? (2026)', what: 'קליפ קצר (5–10 שניות) שיצרת בכלי וידאו AI, בלי סאונד. MP4.' },
  today_music: { file: 'img/today-music.jpg', kind: 'image', source: 'you', slide: 'והיום? (2026)', what: 'צילום מסך של שיר שיצרת בכלי מוזיקה AI (עם שם השיר). אם יש לך גם את קובץ השיר — שים ב-media/audio/song.mp3.' },

  // ---------- מה הוא באמת למד (זאב/האסקי) ----------
  wolf_snow: { file: 'img/wolf-snow.jpg', kind: 'image', source: 'commons', slide: 'מה הוא באמת למד?',
    what: 'זאב בשלג. ב-Commons: חפש "wolf snow".' },
  husky: { file: 'img/husky.jpg', kind: 'image', source: 'commons', slide: 'מה הוא באמת למד?',
    what: 'כלב האסקי — עדיף על דשא/בלי שלג (כדי שההבדל יבלוט). ב-Commons: חפש "Siberian husky".' },

  // ---------- היסטוריה ----------
  turing: { file: 'img/turing.jpg', kind: 'image', source: 'commons', slide: 'טיורינג 1950',
    what: 'תמונה של אלן טיורינג. ב-Commons: חפש "Alan Turing" — יש תמונות ברשות הציבור (Public domain).' },
  deepblue: { file: 'img/deep-blue.jpg', kind: 'image', source: 'commons', slide: 'Deep Blue 1997',
    what: 'המחשב Deep Blue (ארון המחשב, מוצג במוזיאון Computer History Museum). ב-Commons: חפש "Deep Blue".' },
  alphago: { file: 'img/alphago-lee-sedol.jpg', kind: 'image', source: 'commons', slide: 'AlphaGo 2016',
    what: 'לוח גו (Go) — או תמונה של לי סה-דול. ב-Commons: חפש "Go board" או "Lee Sedol".' },
  chatgpt_shot: { file: 'img/chatgpt-2022.jpg', kind: 'image', source: 'you', optional: true, slide: 'ChatGPT 2022',
    what: 'לא חובה: צילום מסך של חלון צ׳אט AI כלשהו (רקע לשקף המונה).' },
  nobel: { file: 'img/nobel-2024.jpg', kind: 'image', source: 'commons', slide: 'נובל 2024',
    what: 'מדליית פרס נובל, או תמונות של ג׳פרי הינטון / דמיס הסאביס. ב-Commons: חפש "Nobel medal" או "Geoffrey Hinton".' },
  protein: { file: 'img/protein.jpg', kind: 'image', source: 'commons', slide: 'נובל 2024 / מה אנשים בנו',
    what: 'מבנה תלת-ממדי צבעוני של חלבון (סרטים צבעוניים). ב-Commons: חפש "protein structure ribbon".' },

  // ---------- דוגמאות ויזואליות ----------
  spaghetti_2023: { file: 'video/will-smith-spaghetti-2023.mp4', kind: 'video', source: 'clip', slide: 'ויל סמית אוכל ספגטי',
    what: 'הסרטון המקורי מ-מרץ 2023 (ModelScope, פורסם ב-Reddit ע״י chaindrop). 10–20 שניות מספיקות.' },
  spaghetti_now: { file: 'video/will-smith-spaghetti-now.mp4', kind: 'video', source: 'clip', slide: 'ויל סמית אוכל ספגטי',
    what: 'גרסה עדכנית (2025–2026) של אותו "מבחן" — למשל גרסת Veo 3 שהסתובבה ברשת. 10–20 שניות.' },
  opera: { file: 'img/theatre-dopera-spatial.jpg', kind: 'image', source: 'commons', slide: 'Théâtre D’opéra Spatial (2022)',
    what: 'היצירה של ג׳ייסון אלן. היא מופיעה בוויקיפדיה; בדוק את הרישיון בעמוד הקובץ ב-Commons ורשום ב-CREDITS.' },
  built_car: { file: 'img/autonomous-car.jpg', kind: 'image', source: 'commons', slide: 'מה אנשים בנו', what: 'רכב אוטונומי (למשל Waymo). ב-Commons: חפש "Waymo".' },
  built_bemyeyes: { file: 'img/be-my-eyes.jpg', kind: 'image', source: 'you', slide: 'מה אנשים בנו', what: 'צילום מסך מהאתר/אפליקציה של Be My Eyes (תכונת Be My AI), או תמונה של מקל נחייה.' },
  built_song: { file: 'img/song.jpg', kind: 'image', source: 'you', slide: 'מה אנשים בנו', what: 'אפשר אותו צילום מסך כמו today-music.jpg (שיר מבקשה).' },
  built_game: { file: 'img/game-chat.jpg', kind: 'image', source: 'you', slide: 'מה אנשים בנו', what: 'צילום מסך של משחק שנבנה בשיחה (אפשר את המשחק שבסוף המצגת — שקף "וואו").' },
  built_robot: { file: 'img/robot.jpg', kind: 'image', source: 'commons', slide: 'מה אנשים בנו', what: 'רובוט (דמוי אדם או זרוע רובוטית). ב-Commons: חפש "humanoid robot".' },

  // ---------- הזיות ----------
  halluc_shot: { file: 'img/hallucination.jpg', kind: 'image', source: 'you', optional: true, slide: 'הוא טועה. בביטחון.',
    what: 'לא חובה: צילום מסך אמיתי של AI שטועה בביטחון (נסה: "תן לי 3 ציטוטים של X עם מספרי עמודים" או שאלה על אדם לא מוכר). רק אמיתי — לא לביים.' },

  // ---------- אמת או AI? (6 סבבים) ----------
  r1: { file: 'img/real-or-ai-1.jpg', kind: 'image', source: 'commons', slide: 'אמת או AI? סבב 1 (אמת)', what: 'צילום אמיתי מרשים שנראה "מושלם מדי" (למשל זוהר צפוני, או נוף). מ-Commons.' },
  r2: { file: 'img/real-or-ai-2.jpg', kind: 'image', source: 'ai-you', slide: 'אמת או AI? סבב 2 (AI)', what: 'תמונה שיצרת ב-AI שנראית כמו צילום רגיל (למשל "ילד מחזיק כלב בפארק, צילום טלפון").' },
  r3: { file: 'img/real-or-ai-3.jpg', kind: 'image', source: 'commons', slide: 'אמת או AI? סבב 3 (אמת)', what: 'צילום אמיתי מוזר (בעל חיים בצבע מפתיע, מבנה משונה). מ-Commons.' },
  r4: { file: 'img/real-or-ai-4.jpg', kind: 'image', source: 'ai-you', slide: 'אמת או AI? סבב 4 (AI)', what: 'תמונת AI של אוכל או חדר — משהו יומיומי.' },
  r5_pope: { file: 'img/pope-puffer-2023.jpg', kind: 'image', source: 'commons', slide: 'אמת או AI? סבב 5 (AI — האפיפיור)',
    what: 'תמונת האפיפיור פרנציסקוס במעיל הנפוח הלבן (Midjourney, מרץ 2023). בדוק אם קיימת ב-Commons עם רישיון; אחרת צילום מסך מכתבה חדשותית.' },
  r6: { file: 'img/real-or-ai-6.jpg', kind: 'image', source: 'ai-you', slide: 'אמת או AI? סבב 6 (AI)', what: 'תמונת AI של אדם/פנים — הכי קשה לזהות.' },

  // ---------- פרומפט ----------
  vague_result: { file: 'img/prompt-vague.jpg', kind: 'image', source: 'you', slide: 'מעורפל מול מפורט',
    what: 'צילום מסך של התוצאה מהפרומפט המעורפל "תבנה לי אתר" (מופיע ב-MEDIA_GUIDE).' },
  detailed_result: { file: 'img/prompt-detailed.jpg', kind: 'image', source: 'you', slide: 'מעורפל מול מפורט',
    what: 'צילום מסך של התוצאה מהפרומפט המפורט (מופיע ב-MEDIA_GUIDE). אותו כלי, אותו יום.' },

  // ---------- סכנות ----------
  tomcruise: { file: 'video/deeptomcruise-2021.mp4', kind: 'video', source: 'clip', slide: 'טום קרוז המזויף (2021)',
    what: 'קטע של 10–20 שניות מחשבון TikTok בשם deeptomcruise (2021).',
    why: 'זכויות יוצרים של היוצרים (Chris Umé / Miles Fisher). רק באישורך.' },
  arup_1: { file: 'img/arup-1.jpg', kind: 'image', source: 'you', slide: 'Arup — שיחת וידאו מזויפת', what: 'משבצת 1 ("סמנכ״ל כספים"). רעיון: תמונה שלך בחליפה/בתלבושת מצחיקה. ריבועית.' },
  arup_2: { file: 'img/arup-2.jpg', kind: 'image', source: 'you', slide: 'Arup — שיחת וידאו מזויפת', what: 'משבצת 2 ("עמיתה"). עוד תלבושת/פרצוף — או פנים שיצרת ב-AI.' },
  arup_3: { file: 'img/arup-3.jpg', kind: 'image', source: 'you', slide: 'Arup — שיחת וידאו מזויפת', what: 'משבצת 3 ("עמית").' },
  arup_4: { file: 'img/arup-4.jpg', kind: 'image', source: 'you', slide: 'Arup — שיחת וידאו מזויפת', what: 'משבצת 4 ("העובד — אמיתי"). תמונה רגילה שלך.' },
  tomcruise_still: { file: 'img/deeptomcruise-2021.jpg', kind: 'image', source: 'clip', optional: true, slide: 'טום קרוז המזויף (2021)', what: 'גיבוי: צילום מסך אחד מהסרטון.' },

  // ---------- וואו וסיום ----------
  me_nature: { file: 'img/me-nature.jpg', kind: 'image', source: 'you', slide: 'עזבו אתכם מהטלפון (סיום)',
    what: 'תמונה שלך מטיול בטבע. מופיעה על כל המסך אחרי לחיצה. לרוחב.' },
};
