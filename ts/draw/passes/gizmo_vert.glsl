// exports
#pragma global v_TexCoord       // varying highp vec2
#pragma global v_ScreenCoord    // varying highp vec4
#pragma global v_Color          // varying mediump vec4

#pragma global a_Position       // attribute highp vec4
#pragma global a_TexCoord       // attribute highp vec2
#pragma global a_Color          // attribute mediump vec4

varying highp vec2 v_TexCoord;
varying highp vec4 v_ScreenCoord;
varying mediump vec4 v_Color;

attribute highp vec4 a_Position;
attribute highp vec2 a_TexCoord;
attribute highp vec4 a_Color;

void main() {
    gl_Position = a_Position;

    v_TexCoord = a_TexCoord;
    v_ScreenCoord = a_Position;
    v_Color = a_Color;

    // `v_ScreenCoord.xy` is UV coordinates
    v_ScreenCoord.xy = v_ScreenCoord.xy * 0.5 + v_ScreenCoord.w * 0.5;

    // Degenerate the Z coordinate
    gl_Position.z = 0.0;
}