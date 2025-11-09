# voctrainer.github.io

## Шаблон файла партитуры

```markdown
---
layout: partiture
nav: true
---

<!-- Партитура автоматически определит название из ABC-нотации -->

<div class="abc-source">
X:1
T:День прешед
C:Соловецкое
M:4/4
L:1/4
K:F
V:3 clef=bass+8 octave=-1
%%MIDI program 40
V:4 clef=bass-8 octave=-2
%%MIDI program 40
%%score [(3 4)]
%%tempo { 140, 160, *180, 200, 220, 240 }
%%player_top
%%text Первый лик:
[V:3]F2G2 (A3G)F2F2F2G2G2(DEF)GF4 |
[V:4]f2g2(a3g)f2f2f2g2g2(def)gf4
w: День пре-шед* бла-го-да-рю Тя, Го---по-ди,
[V:3](A3G)F2F2G2(DCD)EF4 | F2G2(AG)
[V:4](a3g)f2f2g2(dcd)ef4 | f2g2(fc)
w: ве--чер, про-шу, с~но---щи-ю без гре-ха*
[V:3](AB)c3BAAGFG4F4 ||
[V:4](fg)a3gffcdc4f4 ||
w: по--даждь ми Спа-се, и спа-си мя.
</div>
```

## Шаблон файла партитуры с несколькими партитурами на странице

```markdown
---
layout: partiture
nav: true
---

<!-- Первая партитура - название автоматически из T:Величание -->
<div class="abc-source">
X:1
T:Величание
C:Знаменный распев
M:3/4
L:1/4
K:G
V:1 clef=treble
V:2 clef=treble
%%score [1 2]

[V:1]G A B | c2 B2 |
[V:2]E F G | A2 G2 |
w: Ве-ли-ча-ем Тя
</div>

<!-- Вторая партитура - будет использовано первое найденное название -->
<div class="abc-source">
X:2
T:Тропарь
C:Византийский распев
M:4/4
L:1/4
K:D
V:1 clef=treble
V:2 clef=treble

[V:1]D E F G | A2 G2 |
[V:2]B, C D E | F2 E2 |
w: Спа-си, Гос-по-ди, лю-ди Тво-я
</div>
```
