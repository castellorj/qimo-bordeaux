#!/bin/bash
# usage: build2.sh <out.mp4> <subs:0|1>
set -e
S=/tmp/claude-0/-home-user-qimo-bordeaux/b5bcf846-6176-5476-9090-bbd4439cf784/scratchpad; cd $S
OUT=$1; SUBS=$2
G="eq=contrast=1.05:saturation=1.05:gamma=0.98,curves=all='0/0 0.25/0.238 0.5/0.5 0.78/0.775 1/0.988',colorbalance=rm=-0.015:bm=0.012,cas=0.22,vignette=PI/9"
Z="scale=w='2*trunc(540*(1+0.03*t/36))':h=-2:eval=frame:flags=lanczos,crop=1080:1920"
SUBF=""; [ "$SUBS" = "1" ] && SUBF=",ass=work/subs.ass:fontsdir=fonts"
AF=$(cat work/af.txt)
GR=""; [ "$SUBS" = "1" ] && GR="[4:v]overlay=0:0,"
F=0.22   # dissolve between Thierry and b-roll
clip(){ echo "[3:v]trim=$1:$(echo "$1+$2"|bc -l),setpts=PTS-STARTPTS,fps=60,scale=1080:1920,setsar=1,format=yuv420p[$3]"; }
# block <label> <start> <dur>  -> alpha fades + time shift
blk(){ echo "[$1]$GR format=yuva420p,fade=t=in:st=0:d=$F:alpha=1,fade=t=out:st=$(echo "$3-$F"|bc -l):d=$F:alpha=1,setpts=PTS+$2/TB[$1o]"; }
ffmpeg -v error -y -i src/thierry.mp4 -loop 1 -framerate 60 -i work/watermark.png -framerate 60 -i card/c_%04d.png -i douro/filme.mp4 -i work/grad.png \
 -filter_complex "[0:v]trim=0:36.1,setpts=PTS-STARTPTS,fps=60,$G,$Z,setsar=1[v0];\
$(clip 26.95 2.40 a1);$(clip 60.20 2.32 a2);[a1][a2]concat=n=2:v=1:a=0[A];$(blk A 16.09 4.72);\
$(clip 63.10 2.30 b1);$(clip 21.65 2.42 b2);[b1][b2]concat=n=2:v=1:a=0[B];$(blk B 22.39 4.72);\
$(clip 70.30 2.66 c1);$(blk c1 30.65 2.66);\
[v0][Ao]overlay=eof_action=pass[m1];[m1][Bo]overlay=eof_action=pass[m2];[m2][c1o]overlay=eof_action=pass[m3];\
[1:v]format=rgba,fade=t=in:st=0.5:d=0.9:alpha=1,trim=0:36.1[wm];\
[m3][wm]overlay=0:0:shortest=1,fade=t=in:st=0:d=0.3$SUBF,format=yuv420p[main];\
[2:v]format=yuv420p,setsar=1[card];\
[main][card]xfade=transition=fade:duration=0.6:offset=35.5,format=yuv420p[v];\
[0:a]atrim=0:36.1,asetpts=PTS-STARTPTS,$AF,afade=t=out:st=35.45:d=0.65,apad=whole_dur=38.8[a]" \
 -map "[v]" -map "[a]" -t 38.8 -r 60 -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p \
 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
