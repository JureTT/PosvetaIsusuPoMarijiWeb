'use strict';
/* Teme: [id, naziv, pozadina, ploha, tekst, sekundarni, primarna, na-primarnoj, naglasak, rub, ploha-gore-1, ploha-gore-2, plamen, tekst-na-plohi] */
const PALETTES = [
  ['light','Svjetlost','#FFFFFF','#F2F3F7','#171923','#686B78','#4053B8','#FFFFFF','#4053B8','#D9DCE7','#2250b5','#0c1f55','#FFFFFF','#FFFFFF'],
  ['parchment','Pergament','#F8F0DF','#F1E4C8','#392D24','#796B5B','#922F2D','#FFFFFF','#A33A35','#E3D2B2','#a33a35','#4a1514','#F8F0DF','#F8F0DF'],
  ['sky','Nebo','#DCEFFA','#EFF7FC','#173653','#58738D','#1768B9','#FFFFFF','#2479C8','#BBD9EF','#1f78cf','#0b3a6e','#FFFFFF','#FFFFFF'],
  ['dark','Tišina','#08090D','#191B22','#F5F5F7','#A7A9B4','#83B2FF','#10131A','#83B2FF','#30333D','#F5F5F7','#A7A9B4','#08090D','#08090D'],
  ['tt_classic','TT Klasično','#102D50','#1A3D64','#FFFFFF','#C5D7E9','#FFFFFF','#102D50','#8FC5F5','#315779','#FFFFFF','#C5D7E9','#102D50','#102D50'],
  ['tt_blue','Klasično plavo','#17358A','#2347A3','#FFFFFF','#C9D6F5','#FFFFFF','#17358A','#C9D6F5','#3F66BD','#FFFFFF','#C9D6F5','#17358A','#17358A'],
  ['getsemani','Getsemani','#E9EBDD','#DDE3CD','#303A29','#68745D','#536B3E','#FFFFFF','#71864F','#C9D2B6','#617d49','#2c3b20','#FFFFFF','#FFFFFF'],
  ['kalvarija','Kalvarija','#7A1F2B','#922D3A','#FFF7F2','#E8C9C9','#F0B8BC','#4A1119','#D98A91','#A94A55','#FFF7F2','#E8C9C9','#7A1F2B','#7A1F2B'],
  ['korizma_l','Korizma svijetla','#F8E5A0','#FFF1BF','#2E1646','#6B5A80','#5B2A86','#FFFFFF','#5B2A86','#E2C766','#6D38A0','#34154F','#FFE9A3','#FFF0B8'],
  ['korizma_d','Korizma tamna','#34154F','#44205F','#F0D27A','#D8C08A','#F0D27A','#2E1646','#F0D27A','#5D3A7C','#FFF3C4','#F2D982','#34154F','#34154F']
].map(a => ({id:a[0], name:a[1], bg:a[2], surface:a[3], text:a[4], sec:a[5], primary:a[6], onprimary:a[7], accent:a[8], border:a[9], top1:a[10], top2:a[11], flame:a[12], hdr:a[13]}));

function applyPalette(id) {
  const p = PALETTES.find(x => x.id === id) || PALETTES[0];
  const r = document.documentElement.style;
  r.setProperty('--bg', p.bg); r.setProperty('--surface', p.surface); r.setProperty('--text', p.text);
  r.setProperty('--sec', p.sec); r.setProperty('--primary', p.primary); r.setProperty('--onprimary', p.onprimary);
  r.setProperty('--accent', p.accent); r.setProperty('--border', p.border);
  r.setProperty('--top1', p.top1); r.setProperty('--top2', p.top2); r.setProperty('--flame', p.flame); r.setProperty('--hdr', p.hdr);
  return p;
}
