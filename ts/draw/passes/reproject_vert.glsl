/*
 * Copyright (c) 2017 ARcane Developers
 *
 * This file is a part of ARcane. Please read the license text that
 * comes with the source code for use conditions.
 */

// exports
#pragma global a_Position
#pragma global u_ReprojectionMatrix
#pragma global u_TSOffset

// varyings
#pragma global v_TexCoord1
#pragma global v_TexCoord2
#pragma global v_CS2Base

attribute highp vec2 a_Position;

uniform highp mat4 u_ReprojectionMatrix;
uniform highp vec2 u_TSOffset;

varying highp vec2 v_TexCoord1;
varying highp vec4 v_TexCoord2;
varying highp vec4 v_CS2Base;

void main() {
    gl_Position = vec4(a_Position, 0.0, 1.0);

    v_TexCoord1 = a_Position * 0.5 + 0.5;
    v_TexCoord2 = v_TexCoord1.xyxy + vec4(u_TSOffset, -u_TSOffset);

    v_CS2Base = u_ReprojectionMatrix * vec4(a_Position, 0.0, 1.0);
}
