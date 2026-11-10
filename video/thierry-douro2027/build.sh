#!/bin/bash
# usage: build.sh <out.mp4> <subs:0|1> [preview_seconds]
set -e
S=/tmp/claude-0/-home-user-qimo-bordeaux/b5bcf846-6176-5476-9090-bbd4439cf784/scratchpad; cd $S
OUT=$1; SUBS=$2
G="eq=contrast=1.05:saturation=1.05:gamma=0.98,curves=all='0/0 0.25/0.238 0.5/0.5 0.78/0.775 1/0.988',colorbalance=rm=-0.015:bm=0.012,cas=0.22,vignette=PI/9"
Z="scale=w='2*trunc(540*(1+0.03*t/36))':h=-2:eval=frame:flags=lanczos,crop=1080:1920"
SUBF=""; [ "$SUBS" = "1" ] && SUBF=",ass=work/subs.ass:fontsdir=fonts"
AF=$(cat work/af.txt)
ffmpeg -v error -stats -y -i src/thierry.mp4 -loop 1 -framerate 60 -i work/watermark.png -framerate 60 -i card/c_%04d.png \
 -filter_complex "[0:v]trim=0:36.1,setpts=PTS-STARTPTS,fps=60,$G,$Z,setsar=1[v0];\
[1:v]format=rgba,fade=t=in:st=0.5:d=0.9:alpha=1,trim=0:36.1[wm];\
[v0][wm]overlay=0:0:shortest=1,fade=t=in:st=0:d=0.3$SUBF,format=yuv420p[main];\
[2:v]format=yuv420p,setsar=1[card];\
[main][card]xfade=transition=fade:duration=0.6:offset=35.5,format=yuv420p[v];\
[0:a]atrim=0:36.1,asetpts=PTS-STARTPTS,$AF,afade=t=out:st=35.45:d=0.65,apad=whole_dur=38.8[a]" \
 -map "[v]" -map "[a]" -t 38.8 -r 60 -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p \
 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
