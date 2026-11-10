# (start, end, [lines]) ; {g}...{/g} = destaque dourado
C=[
(0.08, 2.74, ["Fala, meu povo, como estamos?"]),
(2.84, 5.40, ["Estou passando aqui primeiro","para fazer um agradecimento"]),
(5.40, 8.30, ["muito especial à galera","que acreditou nessa aventura"]),
(8.30,10.30, ["da {g}QIMO{/g} para {g}Bordeaux{/g}."]),
(10.34,12.24,["Fizemos uma viagem incrível"]),
(12.24,13.72,["e, devido ao grande sucesso,"]),
(13.72,16.20,["a gente está lançando","nosso próximo destino,"]),
(16.20,18.80,["destino espetacular,","que é o {g}Douro{/g},"]),
(18.80,20.66,["em {g}novembro de 2027{/g}."]),
(20.72,22.50,["Então, fica ligado:"]),
(22.50,26.86,["um barco único e exclusivo,","{g}100% QIMO{/g}."]),
(27.10,28.42,["Novembro de 2027:"]),
(28.42,30.76,["a gente tem mais uma","aventura marcada"]),
(30.76,33.24,["e a gente conta com a presença","dos amigos mais uma vez."]),
(33.28,35.62,["Beijo, e a gente se vê","no {g}Douro{/g}!"]),
]
import re
def ts_srt(t): h=int(t//3600); m=int(t%3600//60); s=t%60; return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s-int(s))*1000)):03d}"
def ts_ass(t): h=int(t//3600); m=int(t%3600//60); s=t%60; return f"{h}:{m:02d}:{s:05.2f}"
strip=lambda s: re.sub(r"\{/?g\}","",s)
with open("out/Thierry-QIMO.srt","w",encoding="utf-8") as f:
    for i,(a,b,L) in enumerate(C,1):
        f.write(f"{i}\n{ts_srt(a)} --> {ts_srt(b)}\n"+"\n".join(map(strip,L))+"\n\n")
GOLD="&H85BBD4&"  # #D4BB85 (BGR)
WHITE="&HF3F8FB&" # #FBF8F3
head=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sh,Inter Medium,56,&H00000000,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0.4,0,1,3,0,2,70,70,372,1
Style: Tx,Inter Medium,56,{WHITE[:-1].replace('&H','&H00')},&H00000000,&H50000000,&H78000000,0,0,0,0,100,100,0.4,0,1,0.8,1.5,2,70,70,372,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open("work/subs.ass","w",encoding="utf-8") as f:
    f.write(head)
    for a,b,L in C:
        plain="\\N".join(map(strip,L))
        col="\\N".join(L).replace("{g}","{\\c"+GOLD+"}").replace("{/g}","{\\c"+WHITE+"}")
        fad="{\\fad(140,140)}"
        # soft halo layer (blurred dark) for legibility over bright pavement, then crisp text
        f.write(f"Dialogue: 0,{ts_ass(a)},{ts_ass(b)},Sh,,0,0,0,,{fad}{{\\blur9\\1a&HFF&\\3a&H9C&}}{plain}\n")
        f.write(f"Dialogue: 1,{ts_ass(a)},{ts_ass(b)},Tx,,0,0,0,,{fad}{{\\blur0.6}}{col}\n")
print(max(len(strip(l)) for _,_,L in C for l in L))
