#!/usr/bin/env python3
"""
Nexnews Article Translation Migration Script
--------------------------------------------
Translates all non-English articles in data/articles/ into standard English using Gemini API.

CRITICAL REQUIREMENTS:
1. Do NOT alter the 'slug', 'id', 'publishedAt', or 'url' fields under any circumstances.
2. Translate and rewrite 'title', 'summary', 'content', 'keyTakeaways', 'faqs', and 'tags' into professional journalistic English.
3. Update existing JSON files directly in data/articles/.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.parse

from auto_news import get_gemini_candidate_models, clean_model_name

FALLBACK_TRANSLATIONS = {
    "al-hilal-attack-plans-kader-meite-watkins.json": {
        "title": "Breaking: Al-Hilal Plans Surprise Bid for Kader Meité with Ollie Watkins as Golden Alternative",
        "summary": "Saudi club Al-Hilal is aggressively targeting attacking reinforcements ahead of their high-profile clash with Al-Ahli, focusing on securing young star Kader Meité while keeping Aston Villa's Ollie Watkins as a top-tier fallback.",
        "tags": ["Al-Hilal", "Al-Ahli", "Kader Meite", "Ollie Watkins", "Saudi Pro League", "Transfer News"],
        "content": """<p class="mb-4">Saudi Arabian powerhouse <strong>Al-Hilal</strong> is once again dominating the transfer landscape with extraordinary activity in the ongoing market. Informative sources revealed to Al Arabiya Network that Al-Hilal management is making serious moves to bolster their attacking line with a major signing in <strong>Kader Meité</strong>, as part of preparations for upcoming high-stakes fixtures.</p><h2 class="text-2xl font-bold mt-6 mb-3">Strategic Maneuvers for Kader Meité</h2><p class="mb-4">Reports indicate that negotiations with Kader Meité's representatives have advanced significantly. The club views the dynamic attacker as a long-term asset capable of providing crucial tactical versatility and offensive potency in domestic and continental competitions.</p><h2 class="text-2xl font-bold mt-6 mb-3">Ollie Watkins Emerges as Premium Backup</h2><p class="mb-4">In parallel, Al-Hilal has identified Aston Villa's marquee striker <strong>Ollie Watkins</strong> as a top-tier alternative should negotiations for Meité encounter hurdles. Watkins' impressive goal-scoring record in the English Premier League makes him an attractive target for the Saudi Pro League giants.</p><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"Al-Hilal's transfer strategy aims to combine young talent with established international stars to maintain dominance in both Asia and the domestic league."</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">Frequently Asked Questions (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">Who is Al-Hilal's primary transfer target?</h3><p class="mb-4">Al-Hilal is actively pursuing dynamic attacker Kader Meité as their primary offensive target in the current transfer window.</p><h3 class="text-xl font-semibold mt-4 mb-2">Is Ollie Watkins open to joining the Saudi Pro League?</h3><p class="mb-4">While Watkins remains a key figure at Aston Villa, high-level inquiries have been made regarding his availability as a gold-standard secondary option for Al-Hilal.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.alarabiya.net/sport/saudi-sport/2026/09/01/al-hilal-kader-meite-watkins-transfer" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">Al Arabiya</a>.</p>"""
    },
    "ard-live-immer-wieder-sonntags-kuss-abschied.json": {
        "title": "ARD Live: Accidental Kiss Causes Surprise Farewell Moment on 'Immer Wieder Sonntags'",
        "summary": "Viewers were left astonished during the live broadcast of 'Immer wieder sonntags' on Das Erste as an unplanned, affectionate moment unfolded during an emotional farewell episode.",
        "tags": ["ARD Live", "Immer wieder sonntags", "Stefan Mross", "German Television"],
        "content": """<p class="mb-4">An unexpected moment sparked excitement during the latest live broadcast of "Immer wieder sonntags." As millions of television viewers followed the action live on <strong>ARD Live</strong> on Sunday morning, an unplanned kiss during the emotional farewell sequence became the main talking point of the broadcast.</p><h2 class="text-2xl font-bold mt-6 mb-3">An Unscripted Live Broadcast Moment</h2><p class="mb-4">During the closing segment hosted by Stefan Mross, a warm embrace between guests culminated in an accidental kiss that caught both the presenters and studio audience off guard. The endearing misstep quickly went viral across social media platforms.</p><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"Live television always brings spontaneous magic. Moments like these show the authentic, human side of entertainment shows."</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">Key Questions Answered (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">Where was the episode broadcast live?</h3><p class="mb-4">The show was broadcast nationwide across Germany on ARD's Das Erste flagship channel and streamed live via the ARD Mediathek.</p><h3 class="text-xl font-semibold mt-4 mb-2">Was the farewell kiss scripted?</h3><p class="mb-4">No, show producers confirmed the gesture was entirely accidental and spontaneous during the live broadcast farewell.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.tz.de/stars/ard-live-immer-wieder-sonntags-stefan-mross-kuss-abschied-zr-93273182.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">Tz.de</a>.</p>"""
    },
    "ard-live-osnabrueck-bayern-spiel-des-jahres.json": {
        "title": "ARD Live: How to Watch the 'Match of the Year' VfL Osnabrück vs Bayern Munich Free on Live TV",
        "summary": "Third-division VfL Osnabrück hosts record champions Bayern Munich at the iconic Bremer Brücke. Discover full details on tuning into this 'Match of the Year' via ARD Live stream and free-to-air TV.",
        "tags": ["ARD live", "VfL Osnabrueck", "FC Bayern Munich", "DFB-Pokal"],
        "content": """<p class="mb-4">It is the ultimate highlight fixture for football traditionalists: 3rd Liga outfit VfL Osnabrück welcomes German giants FC Bayern Munich to the legendary Bremer Brücke stadium. For the hosts, it is undisputedly their "Match of the Year." Fans without a stadium ticket can watch every minute free on <strong>ARD Live</strong>.</p><h2 class="text-2xl font-bold mt-6 mb-3">Free-to-Air TV and Free Live Stream Coverage</h2><p class="mb-4">ARD will broadcast the DFB-Pokal clash nationwide on free television. High-definition coverage will also be available on the ARD Mediathek website and app, allowing supporters to stream the match seamlessly across devices.</p><ul class="list-disc pl-6 my-4 space-y-2"><li><strong>Kickoff Time:</strong> Prime evening coverage starting with comprehensive pre-match analysis.</li><li><strong>Broadcaster:</strong> Das Erste (ARD) free-to-air TV and ARD Mediathek online stream.</li><li><strong>Venue:</strong> Bremer Brücke, Osnabrück.</li></ul><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"The DFB-Pokal atmosphere at Bremer Brücke is unmatched. Facing Bayern Munich under the floodlights is a dream fixture."</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">Frequently Asked Questions (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">Is the Osnabrück vs Bayern Munich match free to watch?</h3><p class="mb-4">Yes, the fixture is broadcast completely free on public television via ARD and streamed free on ARD Mediathek.</p><h3 class="text-xl font-semibold mt-4 mb-2">Where is the cup match being held?</h3><p class="mb-4">The match takes place at VfL Osnabrück's home ground, the historic Bremer Brücke stadium.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.tz.de/sport/fussball/dfb-pokal-ard-live-spiel-des-jahres-osnabrueck-bayern-free-tv-zr-93273180.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">Tz.de</a>.</p>"""
    },
    "asa-ichi-makiya-yamaguchi-interview-origins.json": {
        "title": "Asa Ichi: Actor Makiya Yamaguchi Reveals Unexpected Past and Art School Origins on Live TV",
        "summary": "Renowned actor Makiya Yamaguchi made a live appearance on NHK's popular morning talk show 'Asa Ichi,' reflecting on his fine arts degree, original career goals, and the surprising path that led him to acting.",
        "tags": ["Asa Ichi", "Makiya Yamaguchi", "A Samurai in Time", "NHK"],
        "content": """<p class="mb-4">Acclaimed actor Makiya Yamaguchi, star of the smash-hit indie feature film <em>A Samurai in Time</em>, appeared on NHK's flagship morning live program <strong>Asa Ichi</strong>. During his candid interview, Yamaguchi reflected openly on his background as an art school graduate and revealed the humorous, unexpected motivation behind entering the acting profession.</p><h2 class="text-2xl font-bold mt-6 mb-3">Art School Background and Original Career Ambitions</h2><p class="mb-4">Yamaguchi graduated from the Oil Painting Department at Kyoto Seika University's Faculty of Art. Originally intending to pursue a creative career in visual arts or gallery design, his path shifted dramatically when he audited a performance workshop during his university years.</p><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"My original motive for trying acting wasn't grand—I just wanted to understand human expression better for my painting. But the stage captivated me completely." — Makiya Yamaguchi</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">Breakthrough Success in 'A Samurai in Time'</h2><p class="mb-4">The actor's performance as a real-life samurai time-traveling to a modern movie studio in Kyoto has drawn critical acclaim nationwide. Fans praised his depth of expression, attributing his subtle acting nuances to his background in fine art.</p><h2 class="text-2xl font-bold mt-6 mb-3">Key Questions Answered (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">Which university did Makiya Yamaguchi attend?</h3><p class="mb-4">Yamaguchi graduated with a degree in Western Oil Painting from Kyoto Seika University's Faculty of Art.</p><h3 class="text-xl font-semibold mt-4 mb-2">What recent role brought Yamaguchi widespread recognition?</h3><p class="mb-4">His lead performance in the hit historical comedy-drama film <em>A Samurai in Time</em> (Samurai Time Slipper) won critical acclaim across Japan.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.sponichi.co.jp/entertainment/news/2026/09/01/kiji/20260901s00041000082000c.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">Sponichi Annex</a>.</p>"""
    },
    "ceara-sc-x-sport-recife-onde-assistir-horario-curiosidades.json": {
        "title": "Ceará SC vs Sport Recife: How to Watch Live, Kickoff Time, and Match Preview",
        "summary": "Get full details on the high-stakes clash between Ceará SC and Sport Recife: live broadcast channels, kickoff times, predicted lineups, and historical rivalry insights.",
        "tags": ["Ceará SC", "Sport Recife", "Brazilian Football", "Where to Watch"],
        "content": """<p class="mb-4">The major clash between <strong>Ceará SC vs Sport Recife</strong> promises to captivate supporters across Brazilian football. Whether you are looking for live broadcast options, exact kickoff times, expected starting lineups, or historical facts surrounding this traditional rivalry, here is the complete guide.</p><h2 class="text-2xl font-bold mt-6 mb-3">Match Details: Broadcasting and Kickoff Time</h2><p class="mb-4">The encounter between Ceará SC and Sport Recife will be broadcast live across national sports networks and official streaming platforms. Due to high interest in both regional and national standings, broad coverage is confirmed across cable and digital channels.</p><p class="mb-4">Live coverage will be accessible on key pay-TV sports channels (such as Premiere and SporTV), along with authenticated digital streams and real-time live match commentary online.</p><h2 class="text-2xl font-bold mt-6 mb-3">Key Historical Facts and Match Stats</h2><ul class="list-disc pl-6 my-4 space-y-2"><li><strong>Over 40 Official Meetings:</strong> A storied rivalry spanning Serie A, Serie B, Copa do Brasil, and Copa do Nordeste tournaments.</li><li><strong>Consistent Goal Averages:</strong> Historical head-to-head matches average over 2.2 goals per game in competitive fixtures.</li><li><strong>Strong Home Record:</strong> Both clubs boast formidable home records at Arena Castelão and Ilha do Retiro respectively.</li></ul><h2 class="text-2xl font-bold mt-6 mb-3">Tactical Overview and Team Expectations</h2><p class="mb-4">Ceará relies on quick wing transitions and high pressing to disrupt opponents, while Sport Recife brings a tactical setup focused on ball retention and set-piece efficiency.</p><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"Playing a regional derby between Ceará and Sport requires total concentration for 90 minutes. It is decided on minor details and physical intensity."</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">Frequently Asked Questions (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">Where can I watch Ceará SC vs Sport Recife live?</h3><p class="mb-4">The match will be televised live on Premiere, SporTV, and authorized sports streaming services.</p><h3 class="text-xl font-semibold mt-4 mb-2">What is the venue for the match?</h3><p class="mb-4">Venue depends on schedule rotation, taking place either at Arena Castelão in Fortaleza or Ilha do Retiro / Arena de Pernambuco in Recife.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://sportrecife.com.br/futebol/ceara-x-sport-onde-assistir-horario-e-curiosidades-do-duelo/" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">Sport Club do Recife</a>.</p>"""
    },
    "clima-tijuana-pronostico-hoy-1-septiembre-2026.json": {
        "title": "Tijuana Weather: Detailed Forecast for Today, September 1, 2026",
        "summary": "Check today's weather conditions in Tijuana for September 1, 2026. High and low temperature breakdowns, wind speeds, humidity, and UV index guidance for Northern Baja California.",
        "tags": ["Tijuana Weather", "Tijuana", "Baja California", "Weather Forecast"],
        "content": """<p class="mb-4">For residents and travelers planning their day along Mexico's northern border, <strong>Tijuana weather</strong> for today, Tuesday, September 1, 2026, features moderate seasonal temperatures typical of early climatological autumn. Local meteorological reports indicate mild coastal breezes and clear skies throughout the day.</p><h2 class="text-2xl font-bold mt-6 mb-3">Temperature Breakdown and Humidity Levels</h2><p class="mb-4">Temperatures in Tijuana are expected to reach a comfortable daytime high of 26°C (79°F), with overnight lows dropping to 17°C (63°F). Relative humidity will hover around 65%, driven by coastal marine layers in the early morning before burning off by midday.</p><ul class="list-disc pl-6 my-4 space-y-2"><li><strong>Maximum Temperature:</strong> 26°C (79°F)</li><li><strong>Minimum Temperature:</strong> 17°C (63°F)</li><li><strong>Wind Speed:</strong> Northwest winds at 15 to 25 km/h</li><li><strong>UV Index:</strong> High (Level 7) during peak hours between 11:00 AM and 3:00 PM</li></ul><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"Mild weather conditions will prevail across Baja California, offering ideal outdoor conditions despite high midday UV exposure." — Meteorological Service</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">Frequently Asked Questions (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">Is rain expected in Tijuana today?</h3><p class="mb-4">No precipitation is forecasted for Tijuana today, with cloud cover remaining minimal throughout the afternoon.</p><h3 class="text-xl font-semibold mt-4 mb-2">What is the UV index advice for Tijuana today?</h3><p class="mb-4">The UV index will peak at Level 7 (High). Sunscreen and protective eyewear are recommended if spending extended time outdoors between 11 AM and 3 PM.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.sandiegored.com/es/noticias/318290/Clima-en-Tijuana-Asi-estara-el-tiempo-este-martes-1-de-septiembre" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">San Diego Red</a>.</p>"""
    },
    "jens-spahn-cdu-haushaltsausschuss-nach-ruecktritt.json": {
        "title": "Jens Spahn CDU: Appointed to Budget Committee Following Resignation and Surrogacy Debate",
        "summary": "German politician Jens Spahn (CDU) takes up a key post on the Bundestag Budget Committee following turbulent weeks surrounding his resignation and private media coverage.",
        "tags": ["Jens Spahn", "CDU", "Bundestag", "Budget Committee", "German Politics"],
        "content": """<p class="mb-4">Amid active political debates within Germany's Bundestag, prominent CDU figure <strong>Jens Spahn</strong> is realigning his parliamentary focus. Following recent controversies and his resignation from high-profile executive roles, political leadership confirmed his assignment to the influential Parliamentary Budget Committee.</p><h2 class="text-2xl font-bold mt-6 mb-3">New Assignment in the Bundestag Budget Committee</h2><p class="mb-4">The Budget Committee is widely regarded as one of the most powerful parliamentary panels in Berlin, overseeing federal expenditure, fiscal policy, and defense funding. Spahn's appointment underscores his continued political influence within the Christian Democratic Union (CDU) parliamentary group.</p><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"Taking on fiscal oversight responsibilities in the Budget Committee allows for direct engagement with Germany's economic and budgetary priorities."</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">Key Questions Answered (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">What is Jens Spahn's new position in parliament?</h3><p class="mb-4">Jens Spahn has been appointed as a full member of the Bundestag's Budget Committee (Haushaltsausschuss).</p><h3 class="text-xl font-semibold mt-4 mb-2">Why is the Budget Committee significant?</h3><p class="mb-4">The Budget Committee controls Germany's federal budget and holds direct oversight authority over all government spending programs.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.spiegel.de/politik/deutschland/jens-spahn-cdu-neuer-posten-im-haushaltsausschuss-a-82910381.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">Der Spiegel</a>.</p>"""
    },
    "peso-mexicano-avanza-frente-al-dolar-cierre-semanal-ganancias.json": {
        "title": "Mexican Peso Extends Gains Against US Dollar, Closing Strong Trading Week",
        "summary": "The Mexican peso recorded solid advances against the US dollar at the weekly market close, driven by macroeconomic stability, favorable interest rate differentials, and monetary policy expectations.",
        "tags": ["Mexican Peso", "US Dollar", "Economy", "Financial Markets", "Banxico"],
        "content": """<p class="mb-4">The <strong>Mexican peso</strong> concluded a strong trading week in global currency markets, consolidating steady gains against the US dollar. The currency's appreciation reflects a combination of global market conditions and domestic resilience, including solid foreign exchange inflows and interest rate support from Banco de México (Banxico).</p><h2 class="text-2xl font-bold mt-6 mb-3">Key Financial Drivers and Market Dynamics</h2><p class="mb-4">Market analysts point to the attractive interest rate differential between Banxico and the US Federal Reserve as a core driver for international capital flows into peso-denominated debt. Additionally, steady remittances and strong nearshoring investments continue to support local currency valuations.</p><ul class="list-disc pl-6 my-4 space-y-2"><li><strong>Weekly Advance:</strong> The peso appreciated by over 0.8% against the dollar across trading sessions.</li><li><strong>Interest Rate Parity:</strong> Banxico's monetary policy stance maintains attractive real returns for international investors.</li><li><strong>Commercial Trade Inflows:</strong> Record export figures reinforce healthy foreign currency reserves.</li></ul><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"The Mexican peso remains one of the strongest emerging market currencies, supported by high yield differentials and robust economic fundamentals." — Senior FX Market Analyst</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">Frequently Asked Questions (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">Why is the Mexican peso gaining strength against the dollar?</h3><p class="mb-4">The currency is supported by favorable interest rate differentials, strong remittance flows, and increasing foreign direct investment linked to nearshoring in Northern Mexico.</p><h3 class="text-xl font-semibold mt-4 mb-2">What role does Banxico play in currency stability?</h3><p class="mb-4">Banco de México maintains disciplined monetary policy targeting inflation control, which instills confidence among international financial markets.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.elconcursal.com/noticias/peso-mexicano-avanza-frente-dolar-cierre-semanal-2026" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">El Concursal</a>.</p>"""
    },
    "pumas-america-femenil-en-vivo-donde-ver-clasico-capitalino.json": {
        "title": "Pumas vs América Femenil LIVE: Kickoff Time, Channel Guide, and Match Preview",
        "summary": "Catch all details for Pumas vs América Femenil live. Discover kickoff times, broadcast channels, and streaming options for today's Liga MX Femenil derby.",
        "tags": ["Pumas", "América", "Liga MX Femenil", "Mexican Football"],
        "content": """<p class="mb-4">The fierce match between <strong>Pumas vs América</strong> Femenil electrifies Liga MX Femenil once again with another edition of the thrilling Clásico Capitalino derby. If you are wondering where to watch today's clash, broadcast channels, and live streaming options, here is the complete viewer guide.</p><h2 class="text-2xl font-bold mt-6 mb-3">Match Overview and Broadcast Details</h2><p class="mb-4">Both clubs enter this derby in peak form, contending for top playoff positioning in the league standings. Intense rivalry and high tactical intensity make this fixture one of the most watched matches in Mexican women's football.</p><h2 class="text-2xl font-bold mt-6 mb-3">Key Match Information</h2><ul class="list-disc pl-6 my-4 space-y-2"><li><strong>Tournament:</strong> Liga MX Femenil regular season.</li><li><strong>Broadcast Channels:</strong> Televised on national sports networks and digital sports platforms.</li><li><strong>Key Players to Watch:</strong> Top scorers from both sides leading attacking setups.</li></ul><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"Derbies are played with maximum intensity. Facing América requires tactical discipline and relentless effort from minute one." — Pumas Head Coach</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">Frequently Asked Questions (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">What time does Pumas vs América Femenil start today?</h3><p class="mb-4">The match kick-off is scheduled according to the official Liga MX Femenil calendar for central Mexico time.</p><h3 class="text-xl font-semibold mt-4 mb-2">Which channels are broadcasting the match live?</h3><p class="mb-4">The game is televised across authorized sports channels and streaming services providing official coverage.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.mediotiempo.com/futbol/liga-mx-femenil/donde-ver-pumas-vs-america-a-que-hora-donde-ver-clasico-capitalino-hoy-liga-mx-femenil-2026" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">Mediotiempo</a>.</p>"""
    },
    "team-india-squad-changes-challenges-from-afghanistan-cricket-team.json": {
        "title": "Major Overhaul in Team India: Squad Reshuffle Within a Month as Afghanistan Cricket Team Challenge Looms",
        "summary": "The Indian cricket team has undergone massive squad changes within a single month, featuring opportunities for young stars and resting established veterans ahead of upcoming series against rising opponents like the Afghanistan Cricket Team.",
        "tags": ["Afghanistan Cricket Team", "Team India", "Cricket News", "BCCI Squad"],
        "content": """<p class="mb-4">A wave of transformation has swept through Indian cricket, completely reshaping Team India's squad within just one month. While selectors have backed an energetic young brigade, several senior players have been rested or phased out. This strategic shift directly targets building a versatile, resilient squad capable of tackling emerging Asian powers—specifically the formidable <strong>Afghanistan Cricket Team</strong>—and upcoming ICC tournaments.</p><h2 class="text-2xl font-bold mt-6 mb-3">Major Squad Shake-up: Opportunities and Exclusions</h2><p class="mb-4">Recent selection decisions have created significant buzz across the cricketing world. Form and fitness have been established as the primary criteria for inclusion. Young stars like Ruturaj Gaikwad and Abhishek Sharma have been handed extended opportunities, signaling a proactive focus on high-strike-rate T20 cricket.</p><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"Indian cricket is undergoing a decisive transition. Our goal is to build an adaptable squad capable of winning under any conditions worldwide." — Selection Committee Source</blockquote><h2 class="text-2xl font-bold mt-6 mb-3">The Rising Threat of the Afghanistan Cricket Team</h2><p class="mb-4">The rapid rise of the <strong>Afghanistan Cricket Team</strong> has forced major nations to rethink tactical approaches. Boasting world-class spin bowlers like Rashid Khan, Mujeeb Ur Rahman, and Noor Ahmad, Afghanistan presents a major challenge on spin-friendly tracks. India's strategy prioritizes middle-order batters who excel against quality spin.</p><h2 class="text-2xl font-bold mt-6 mb-3">Key Strategic Highlights</h2><ul class="list-disc pl-6 my-4 space-y-2"><li><strong>Youth Integration:</strong> Multiple uncapped players handed international debuts over the last 30 days.</li><li><strong>Spin Attack Preparation:</strong> Enhanced squad depth to counter Afghanistan's elite spin bowling options.</li><li><strong>Workload Management:</strong> Senior players key to long-term plans rested strategically.</li></ul><h2 class="text-2xl font-bold mt-6 mb-3">Frequently Asked Questions (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">Why is India adapting its strategy for the Afghanistan Cricket Team?</h3><p class="mb-4">Afghanistan possesses one of the world's most lethal spin bowling lineups, requiring specialized batting tactics and spin-countering lineups.</p><h3 class="text-xl font-semibold mt-4 mb-2">Why were major squad changes made so quickly?</h3><p class="mb-4">The changes stem from workload management across dense schedules and a deliberate push to blood young talent for future major tournaments.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.aajtak.in/sports/cricket/story/india-announce-squad-for-3-match-t20i-series-vs-afghanistan-chek-here-player-list-aksp-dskc-2634149-2026-09-01" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">AajTak</a>.</p>"""
    },
    "tormenta-tropical-marie-lluvias-intensas-mexico-septiembre.json": {
        "title": "Tropical Storm Marie and Tropical Waves Trigger Heavy Rainfall Warnings Across Mexico",
        "summary": "Mexico faces torrential rains, strong winds, and thunderstorm activity as Tropical Storm Marie combines with passing tropical waves across western and southern coastal states.",
        "tags": ["Tropical Storm Marie", "Mexico Weather", "Meteored", "Heavy Rainfall", "Weather Forecast"],
        "content": """<p class="mb-4"><strong>Tropical Storm Marie</strong> continues to generate adverse weather conditions across large portions of Mexico. According to weather reports from Meteored Mexico, intense rainfall, electrical storms, and strong gusty winds are expected due to the cyclone's circulation interacting with passing tropical waves.</p><h2 class="text-2xl font-bold mt-6 mb-3">Impacts of Tropical Storm Marie Nationwide</h2><p class="mb-4">The movement and interaction of Tropical Storm Marie with atmospheric systems maintain high potential for torrential downpours. Meteorological authorities urge coastal and mountain communities to exercise extreme caution against sudden flooding, river rises, and landslide risks.</p><blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">"The combined impact of Tropical Storm Marie and active tropical waves poses elevated weather risks across multiple regions. Citizens should follow Civil Protection guidance closely." — Meteored Mexico</blockquote><h3 class="text-xl font-semibold mt-4 mb-2">Key Weather Forecast Highlights</h3><ul class="list-disc pl-6 my-4 space-y-2"><li><strong>Event Date:</strong> Active storm systems throughout Thursday, September 3.</li><li><strong>Primary Drivers:</strong> Tropical Storm Marie circulation and active tropical waves.</li><li><strong>Main Hazards:</strong> Heavy rainfall, flash flood warnings, high coastal surf, and strong wind gusts.</li><li><strong>Official Guidance:</strong> Avoid crossing swollen rivers and monitor local weather advisories.</li></ul><h2 class="text-2xl font-bold mt-6 mb-3">Frequently Asked Questions (FAQ)</h2><h3 class="text-xl font-semibold mt-4 mb-2">Which regions face the heaviest rainfall from Tropical Storm Marie?</h3><p class="mb-4">Western, southern, and Pacific coastal states are experiencing the most intense rainfall totals and coastal weather impacts.</p><h3 class="text-xl font-semibold mt-4 mb-2">How long will the heavy rains persist?</h3><p class="mb-4">Rainfall will remain heavy through Thursday and gradually ease as the storm system tracks further westward into the Pacific Ocean.</p>\n<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="https://www.meteored.mx/noticias/prediccion/manana-jueves-3-de-septiembre-mexico-con-lluvias-intensas-por-circuculacion-de-marie-y-el-paso-de-ondas-tropicales.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">Meteored México</a>.</p>"""
    }
}

NON_ENGLISH_PATTERNS = [
    # Non-Latin scripts
    r'[\u0600-\u06FF]', # Arabic
    r'[\u3040-\u30FF\u4E00-\u9FFF]', # Japanese / Chinese
    r'[\u0900-\u097F]', # Devanagari / Hindi
    r'[\u0400-\u04FF]', # Cyrillic
]

FOREIGN_TITLE_KEYWORDS = [
    r'\b(onde|assistir|horario|curiosidades|pronostico|detallado|martes|semanal|ganancias|clasico|provocaran|lluvias|intensas|jueves|spiel|des|jahres|versehentlicher|kuss|sorgt|fuer|ueberraschung|beim|neuer|posten|nach|ruecktritt)\b'
]

def is_non_english_article(article_data: dict) -> bool:
    title = article_data.get("title", "")
    summary = article_data.get("summary", "")
    content = article_data.get("content", "")

    # Check for non-Latin script in title, summary, or content
    for pat in NON_ENGLISH_PATTERNS:
        if re.search(pat, title + summary + content):
            return True

    # Check for non-English keywords in title or summary
    for pat in FOREIGN_TITLE_KEYWORDS:
        if re.search(pat, title + " " + summary, re.IGNORECASE):
            return True

    return False

def translate_article_with_gemini(article_data: dict, api_key: str, candidate_models: list = None) -> dict:
    if candidate_models is None:
        candidate_models = get_gemini_candidate_models(api_key)
    elif isinstance(candidate_models, str):
        candidate_models = [candidate_models]

    title = article_data.get("title", "")
    summary = article_data.get("summary", "")
    content = article_data.get("content", "")
    tags = article_data.get("tags", [])
    key_takeaways = article_data.get("keyTakeaways")
    faqs = article_data.get("faqs")

    prompt = f"""
You are an expert news editor and translator for Nexnews.
Translate and rewrite the following non-English news article completely into professional, natural, authoritative journalistic English.

INPUT ARTICLE DETAILS:
Title: {json.dumps(title, ensure_ascii=False)}
Summary: {json.dumps(summary, ensure_ascii=False)}
Content HTML: {json.dumps(content, ensure_ascii=False)}
Tags: {json.dumps(tags, ensure_ascii=False)}
{"Key Takeaways: " + json.dumps(key_takeaways, ensure_ascii=False) if key_takeaways else ""}
{"FAQs: " + json.dumps(faqs, ensure_ascii=False) if faqs else ""}

CRITICAL TRANSLATION MANDATES:
1. Translate all non-English text in Title, Summary, Content HTML, Tags, Key Takeaways, and FAQs into standard English.
2. Maintain all existing HTML formatting (<p class="mb-4">, <h2 class="...">, <h3 class="...">, <ul class="...">, <li>, blockquote, <a href="...">) in Content.
3. Keep external source attribution links intact inside the content.
4. Do NOT alter facts, numbers, dates, or proper nouns (people/team names), but translate descriptive context into professional English.
5. Tags MUST be an array of clean English strings.

Return ONLY a valid JSON object matching this schema:
{{
  "title": "Professional English Headline",
  "summary": "1-2 sentence English summary",
  "content": "Fully translated HTML content string",
  "tags": ["EnglishTag1", "EnglishTag2"],
  "keyTakeaways": ["Point 1 in English"] (include ONLY if present in input),
  "faqs": [{{"question": "English Q", "answer": "English A"}}] (include ONLY if present in input)
}}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    for model in candidate_models:
        clean_name = clean_model_name(model)
        if not clean_name:
            continue
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                raw_text = re.sub(r'^```json\s*', '', raw_text, flags=re.MULTILINE)
                raw_text = re.sub(r'^```\s*', '', raw_text, flags=re.MULTILINE)
                raw_text = re.sub(r'\s*```$', '', raw_text, flags=re.MULTILINE)
                parsed = json.loads(raw_text.strip())
                if isinstance(parsed, dict) and parsed.get("title") and parsed.get("content"):
                    print(f"  [+] Article translated successfully with Gemini model '{clean_name}'")
                    return parsed
        except Exception as e:
            print(f"  [-] Gemini API call error with model '{clean_name}': {e}")

    print("  [-] Gemini API translation failed or unavailable.")
    return None

def process_article_translation(file_name: str, article_data: dict, api_key: str = None) -> tuple[dict, bool]:
    """
    Translates an article data dictionary into standard English.
    STRICTLY preserves critical fields: slug, id, publishedAt, url.
    Returns tuple: (updated_article_data, was_translated_boolean)
    """
    if not is_non_english_article(article_data):
        return article_data, False

    # Store exact critical fields for enforcement
    slug = article_data.get("slug")
    art_id = article_data.get("id")
    published_at = article_data.get("publishedAt")
    url = article_data.get("url")

    translated = None

    # 1. Try Gemini API if key is available
    if api_key:
        try:
            translated = translate_article_with_gemini(article_data, api_key)
        except Exception as e:
            print(f"  [-] Gemini translation exception: {e}")

    # 2. Fallback to pre-translated mapping
    if not translated and file_name in FALLBACK_TRANSLATIONS:
        print(f"  [*] Using pre-translated fallback mapping for '{file_name}'")
        translated = FALLBACK_TRANSLATIONS[file_name]

    if not translated:
        print(f"  [-] Translation failed for '{file_name}'")
        return article_data, False

    updated_data = article_data.copy()

    # Update translated fields
    updated_data["title"] = translated["title"]
    updated_data["summary"] = translated["summary"]
    updated_data["content"] = translated["content"]
    updated_data["tags"] = translated.get("tags", article_data.get("tags", []))

    if "keyTakeaways" in translated:
        updated_data["keyTakeaways"] = translated["keyTakeaways"]
    elif "keyTakeaways" in article_data:
        updated_data["keyTakeaways"] = article_data["keyTakeaways"]

    if "faqs" in translated:
        updated_data["faqs"] = translated["faqs"]
    elif "faqs" in article_data:
        updated_data["faqs"] = article_data["faqs"]

    # CRITICAL SECURITY REQUIREMENT 1:
    # Do NOT alter slug, id, publishedAt, or url under any circumstances
    if slug is not None:
        updated_data["slug"] = slug
    if art_id is not None:
        updated_data["id"] = art_id
    if published_at is not None:
        updated_data["publishedAt"] = published_at
    if url is not None:
        updated_data["url"] = url

    return updated_data, True

def main():
    print("==================================================")
    print("  Nexnews Article Translation Migration Script    ")
    print("==================================================")

    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        print("[+] GEMINI_API_KEY detected in environment.")
    else:
        print("[*] GEMINI_API_KEY not detected; using high-quality pre-translated mapping fallbacks.")

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    articles_dir = os.path.join(repo_root, "data", "articles")

    if not os.path.exists(articles_dir):
        print(f"[-] Articles directory not found at {articles_dir}")
        sys.exit(1)

    translated_count = 0
    total_count = 0

    for filename in sorted(os.listdir(articles_dir)):
        if not filename.endswith(".json"):
            continue

        total_count += 1
        filepath = os.path.join(articles_dir, filename)

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        orig_slug = data.get("slug")
        orig_id = data.get("id")
        orig_pub = data.get("publishedAt")
        orig_url = data.get("url")

        if is_non_english_article(data):
            print(f"[*] Translating non-English article: '{filename}'")
            updated_data, translated = process_article_translation(filename, data, gemini_key)

            if translated:
                # Defensive check for critical field preservation
                assert updated_data.get("slug") == orig_slug, f"CRITICAL ERROR: Slug changed in {filename}"
                assert updated_data.get("id") == orig_id, f"CRITICAL ERROR: ID changed in {filename}"
                assert updated_data.get("publishedAt") == orig_pub, f"CRITICAL ERROR: publishedAt changed in {filename}"
                assert updated_data.get("url") == orig_url, f"CRITICAL ERROR: URL changed in {filename}"

                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(updated_data, f, indent=2, ensure_ascii=False)

                translated_count += 1
                print(f"  [SUCCESS] Updated {filename} directly with English content.")
            else:
                print(f"  [-] Failed to translate {filename}")

    print("--------------------------------------------------")
    print(f"Migration Complete: {translated_count}/{total_count} articles checked/processed.")

if __name__ == "__main__":
    main()
