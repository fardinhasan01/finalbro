export interface Question {
  id: number;
  category: "math" | "english" | "science" | "bangladesh";
  difficulty: 1 | 2 | 3;
  question: string;
  options: string[];
  correctIndex: number;
}

export const QUESTIONS: Question[] = [
  // গণিত (MATH)
  { id: 1, category: "math", difficulty: 1, question: "৭ × ৮ = কত?", options: ["৫৪", "৫৬", "৬৩", "৬৪"], correctIndex: 1 },
  { id: 2, category: "math", difficulty: 1, question: "১৪৪ ÷ ১২ = কত?", options: ["১০", "১১", "১২", "১৩"], correctIndex: 2 },
  { id: 3, category: "math", difficulty: 1, question: "৮০ এর ২৫% কত?", options: ["১৫", "২০", "২৫", "৩০"], correctIndex: 1 },
  { id: 4, category: "math", difficulty: 2, question: "১৬৯ এর বর্গমূল কত?", options: ["১১", "১২", "১৩", "১৪"], correctIndex: 2 },
  { id: 5, category: "math", difficulty: 2, question: "একটি ত্রিভুজের দুটি কোণ ৬০° ও ৭০° হলে তৃতীয় কোণ কত?", options: ["৪০°", "৫০°", "৬০°", "৭০°"], correctIndex: 1 },
  { id: 6, category: "math", difficulty: 2, question: "২³ + ৩² = কত?", options: ["১৫", "১৭", "১৯", "২১"], correctIndex: 1 },
  { id: 7, category: "math", difficulty: 1, question: "৭ সেমি বাহুবিশিষ্ট বর্গক্ষেত্রের পরিসীমা কত?", options: ["১৪ সেমি", "২১ সেমি", "২৮ সেমি", "৪৯ সেমি"], correctIndex: 2 },
  { id: 8, category: "math", difficulty: 2, question: "সমাধান করো: ৩x + ৬ = ২১। x = কত?", options: ["৩", "৪", "৫", "৬"], correctIndex: 2 },
  { id: 9, category: "math", difficulty: 3, question: "π এর মান দশমিকের দুই ঘর পর্যন্ত কত?", options: ["৩.১২", "৩.১৪", "৩.১৬", "৩.১৮"], correctIndex: 1 },
  { id: 10, category: "math", difficulty: 3, question: "একটি ট্রেন ৩ ঘণ্টায় ২৪০ কিমি যায়। গতিবেগ কত?", options: ["৬০ কিমি/ঘ", "৭০ কিমি/ঘ", "৮০ কিমি/ঘ", "৯০ কিমি/ঘ"], correctIndex: 2 },
  { id: 11, category: "math", difficulty: 1, question: "১৫² = কত?", options: ["১৭৫", "২১৫", "২২৫", "২৩৫"], correctIndex: 2 },
  { id: 12, category: "math", difficulty: 2, question: "০.৭৫ এর সমতুল্য ভগ্নাংশ কোনটি?", options: ["১/২", "২/৩", "৩/৪", "৪/৫"], correctIndex: 2 },
  { id: 13, category: "math", difficulty: 3, question: "একটি বৃত্তের ব্যাসার্ধ ৭ সেমি। ক্ষেত্রফল কত? (π≈২২/৭)", options: ["৪৪ বর্গসেমি", "৮৮ বর্গসেমি", "১৫৪ বর্গসেমি", "১৯৬ বর্গসেমি"], correctIndex: 2 },
  { id: 14, category: "math", difficulty: 1, question: "পরবর্তী সংখ্যাটি কী: ২, ৪, ৮, ১৬, ___?", options: ["২৪", "২৮", "৩২", "৩৬"], correctIndex: 2 },
  { id: 15, category: "math", difficulty: 2, question: "একটি সমকোণে কত ডিগ্রি?", options: ["৪৫°", "৯০°", "১৩৫°", "১৮০°"], correctIndex: 1 },

  // ইংরেজি (ENGLISH)
  { id: 16, category: "english", difficulty: 1, question: "কোন শব্দটি বিশেষ্য (Noun)?", options: ["Run", "Beautiful", "Quickly", "Book"], correctIndex: 3 },
  { id: 17, category: "english", difficulty: 1, question: "সঠিক বানানটি বেছে নাও:", options: ["Recieve", "Receive", "Receve", "Receeve"], correctIndex: 1 },
  { id: 18, category: "english", difficulty: 1, question: "'child' এর বহুবচন কী?", options: ["Childs", "Childes", "Children", "Childrens"], correctIndex: 2 },
  { id: 19, category: "english", difficulty: 2, question: "কোন বাক্যটি সঠিক?", options: ["He don't like fish", "He doesn't likes fish", "He doesn't like fish", "He not like fish"], correctIndex: 2 },
  { id: 20, category: "english", difficulty: 2, question: "'Benevolent' শব্দের অর্থ কী?", options: ["নিষ্ঠুর", "সদয়", "বুদ্ধিমান", "অলস"], correctIndex: 1 },
  { id: 21, category: "english", difficulty: 1, question: "'go' এর past tense কী?", options: ["Goed", "Gone", "Went", "Going"], correctIndex: 2 },
  { id: 22, category: "english", difficulty: 2, question: "'Happy' এর সমার্থক শব্দ কোনটি?", options: ["Sad", "Angry", "Joyful", "Tired"], correctIndex: 2 },
  { id: 23, category: "english", difficulty: 3, question: "'The wind whispered secrets' — এ কোন অলঙ্কার ব্যবহৃত হয়েছে?", options: ["Simile", "Metaphor", "Personification", "Alliteration"], correctIndex: 2 },
  { id: 24, category: "english", difficulty: 1, question: "মাছের দলকে ইংরেজিতে কী বলে?", options: ["Pack", "School", "Pride", "Flock"], correctIndex: 1 },
  { id: 25, category: "english", difficulty: 2, question: "'Ancient' এর বিপরীত শব্দ কোনটি?", options: ["Old", "Historic", "Modern", "Classic"], correctIndex: 2 },
  { id: 26, category: "english", difficulty: 1, question: "কোন শব্দটি ক্রিয়া (Verb)?", options: ["Happy", "Run", "Blue", "Quickly"], correctIndex: 1 },
  { id: 27, category: "english", difficulty: 3, question: "সঠিক বাক্যটি চিহ্নিত করো:", options: ["Neither he nor she are wrong", "Neither he nor she is wrong", "Neither he or she are wrong", "Neither he or she is wrong"], correctIndex: 1 },
  { id: 28, category: "english", difficulty: 2, question: "'Very fast' বাক্যে 'very' কোন পদ (Part of Speech)?", options: ["Adjective", "Adverb", "Noun", "Pronoun"], correctIndex: 1 },

  // বিজ্ঞান (SCIENCE)
  { id: 29, category: "science", difficulty: 1, question: "উদ্ভিদ বায়ু থেকে কোন গ্যাস শোষণ করে?", options: ["অক্সিজেন", "নাইট্রোজেন", "কার্বন ডাই-অক্সাইড", "হাইড্রোজেন"], correctIndex: 2 },
  { id: 30, category: "science", difficulty: 1, question: "পূর্ণবয়স্ক মানবদেহে কতটি হাড় আছে?", options: ["১৮৬", "২০৬", "২২৬", "২৪৬"], correctIndex: 1 },
  { id: 31, category: "science", difficulty: 1, question: "পানির রাসায়নিক সংকেত কী?", options: ["HO", "H₂O", "H₃O", "OH₂"], correctIndex: 1 },
  { id: 32, category: "science", difficulty: 2, question: "আলোর গতিবেগ (আনুমানিক) কত?", options: ["৩×১০⁶ মি/সে", "৩×১০⁷ মি/সে", "৩×১০⁸ মি/সে", "৩×১০⁹ মি/সে"], correctIndex: 2 },
  { id: 33, category: "science", difficulty: 2, question: "কোন অঙ্গ ইনসুলিন তৈরি করে?", options: ["যকৃত", "কিডনি", "অগ্ন্যাশয়", "হৃদপিণ্ড"], correctIndex: 2 },
  { id: 34, category: "science", difficulty: 1, question: "সূর্যের সবচেয়ে নিকটবর্তী গ্রহ কোনটি?", options: ["শুক্র", "পৃথিবী", "মঙ্গল", "বুধ"], correctIndex: 3 },
  { id: 35, category: "science", difficulty: 2, question: "কার্বনের পারমাণবিক সংখ্যা কত?", options: ["৪", "৬", "৮", "১২"], correctIndex: 1 },
  { id: 36, category: "science", difficulty: 3, question: "উদ্ভিদ কোন প্রক্রিয়ায় খাদ্য তৈরি করে?", options: ["শ্বসন", "বাষ্পমোচন", "সালোকসংশ্লেষণ", "অঙ্কুরোদগম"], correctIndex: 2 },
  { id: 37, category: "science", difficulty: 2, question: "কোন রক্তের গ্রুপ সার্বজনীন দাতা?", options: ["A", "B", "AB", "O"], correctIndex: 3 },
  { id: 38, category: "science", difficulty: 1, question: "শব্দ সবচেয়ে দ্রুত কোন মাধ্যমে চলে?", options: ["বায়ু", "পানি", "শূন্যস্থান", "ইস্পাত"], correctIndex: 3 },
  { id: 39, category: "science", difficulty: 3, question: "নিউটনের তৃতীয় সূত্রটি কী?", options: ["F=ma", "প্রতিটি ক্রিয়ার সমান ও বিপরীত প্রতিক্রিয়া আছে", "গতিশীল বস্তু গতিশীল থাকে", "শক্তির সৃষ্টি বা ধ্বংস নেই"], correctIndex: 1 },
  { id: 40, category: "science", difficulty: 2, question: "মানব হৃদপিণ্ডে কয়টি প্রকোষ্ঠ আছে?", options: ["২টি", "৩টি", "৪টি", "৫টি"], correctIndex: 2 },
  { id: 41, category: "science", difficulty: 1, question: "কোষের শক্তিঘর কোনটি?", options: ["নিউক্লিয়াস", "রাইবোসোম", "মাইটোকন্ড্রিয়া", "ভ্যাকুওল"], correctIndex: 2 },
  { id: 42, category: "science", difficulty: 2, question: "সূর্যালোকে ত্বকে কোন ভিটামিন তৈরি হয়?", options: ["ভিটামিন A", "ভিটামিন B", "ভিটামিন C", "ভিটামিন D"], correctIndex: 3 },

  // বাংলাদেশ (BANGLADESH)
  { id: 43, category: "bangladesh", difficulty: 1, question: "বাংলাদেশের রাজধানীর নাম কী?", options: ["চট্টগ্রাম", "ঢাকা", "রাজশাহী", "সিলেট"], correctIndex: 1 },
  { id: 44, category: "bangladesh", difficulty: 1, question: "বাংলাদেশের রাষ্ট্রভাষা কী?", options: ["আরবি", "বাংলা", "উর্দু", "হিন্দি"], correctIndex: 1 },
  { id: 45, category: "bangladesh", difficulty: 1, question: "বাংলাদেশ কত সালে স্বাধীনতা লাভ করে?", options: ["১৯৪৭", "১৯৫২", "১৯৭১", "১৯৭৫"], correctIndex: 2 },
  { id: 46, category: "bangladesh", difficulty: 1, question: "বাংলাদেশের জাতীয় ফুল কোনটি?", options: ["গোলাপ", "পদ্ম", "সাদা শাপলা", "গাঁদা"], correctIndex: 2 },
  { id: 47, category: "bangladesh", difficulty: 2, question: "পদ্মা সেতু কোন দুটি স্থানকে সংযুক্ত করেছে?", options: ["মাওয়া-জাজিরা", "ঢাকা-চট্টগ্রাম", "সিলেট-কুমিল্লা", "রাজশাহী-পাবনা"], correctIndex: 0 },
  { id: 48, category: "bangladesh", difficulty: 2, question: "বিশ্বের বৃহত্তম নদী-বদ্বীপ কোনটি?", options: ["আমাজন ডেল্টা", "নীল ডেল্টা", "মেকং ডেল্টা", "সুন্দরবন ডেল্টা"], correctIndex: 3 },
  { id: 49, category: "bangladesh", difficulty: 1, question: "বাংলাদেশের জাতীয় পাখির নাম কী?", options: ["ঈগল", "দোয়েল", "টিয়া", "ময়ূর"], correctIndex: 1 },
  { id: 50, category: "bangladesh", difficulty: 2, question: "বাংলাদেশের দীর্ঘতম নদী কোনটি?", options: ["পদ্মা", "যমুনা", "মেঘনা", "সুরমা"], correctIndex: 1 },
  { id: 51, category: "bangladesh", difficulty: 3, question: "বাংলাদেশের জাতীয় সংগীত কে রচনা করেছেন?", options: ["কাজী নজরুল ইসলাম", "রবীন্দ্রনাথ ঠাকুর", "জসীমউদ্‌দীন", "মাইকেল মধুসূদন দত্ত"], correctIndex: 1 },
  { id: 52, category: "bangladesh", difficulty: 1, question: "বাংলাদেশের মুদ্রার নাম কী?", options: ["রুপি", "দিনার", "টাকা", "বাট"], correctIndex: 2 },
  { id: 53, category: "bangladesh", difficulty: 1, question: "সুন্দরবন কোন প্রাণীর জন্য বিখ্যাত?", options: ["সিংহ", "হাতি", "রয়েল বেঙ্গল টাইগার", "চিতাবাঘ"], correctIndex: 2 },
  { id: 54, category: "bangladesh", difficulty: 2, question: "কোন দিনটি ভাষা শহীদ দিবস হিসেবে পালিত হয়?", options: ["১৬ ডিসেম্বর", "২৬ মার্চ", "২১ ফেব্রুয়ারি", "১৪ এপ্রিল"], correctIndex: 2 },
  { id: 55, category: "bangladesh", difficulty: 3, question: "কক্সবাজারে বিশ্বের দীর্ঘতম কী রয়েছে?", options: ["নদী", "সেতু", "সমুদ্র সৈকত", "রাস্তা"], correctIndex: 2 },
  { id: 56, category: "bangladesh", difficulty: 2, question: "বাংলাদেশের জাতীয় ফলের নাম কী?", options: ["আম", "কাঁঠাল", "কলা", "পেয়ারা"], correctIndex: 1 },
  { id: 57, category: "bangladesh", difficulty: 1, question: "বাংলাদেশের পতাকায় কোন রঙের সমন্বয় রয়েছে?", options: ["লাল ও সাদা", "সবুজ ও লাল", "নীল ও সাদা", "সবুজ ও হলুদ"], correctIndex: 1 },
];

export function getQuestionByDifficulty(
  difficulty: 1 | 2 | 3,
  usedIds: Set<number>
): Question {
  const pool = QUESTIONS.filter(
    (q) => q.difficulty <= difficulty && !usedIds.has(q.id)
  );
  if (pool.length === 0) {
    const fallback = QUESTIONS.filter((q) => !usedIds.has(q.id));
    if (fallback.length === 0) {
      usedIds.clear();
      return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    }
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export const CATEGORY_COLORS: Record<Question["category"], string> = {
  math: "#e74c3c",
  english: "#9b59b6",
  science: "#2980b9",
  bangladesh: "#27ae60",
};

export const CATEGORY_LABELS: Record<Question["category"], string> = {
  math: "📐 গণিত",
  english: "📖 ইংরেজি",
  science: "🔬 বিজ্ঞান",
  bangladesh: "🇧🇩 বাংলাদেশ",
};
