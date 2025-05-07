export default `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uZoom;
uniform float uColorShift;

// Function to convert HSV to RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 c = (gl_FragCoord.xy - uResolution / 2.0) / uZoom + uCenter;
    vec2 z = vec2(0.0, 0.0);
    const int maxIterations = 200;
    int iterations = 0;

    for (int i = 0; i < maxIterations; i++) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iterations = i;
    }

    // float color = float(iterations) / float(maxIterations);
    // gl_FragColor = vec4(vec3(color), 1.0);

    vec3 color;
    if (iterations == maxIterations - 1) {
        color = vec3(0.0, 0.0, 0.0);
    } else {
        // Use the color shift uniform to adjust the hue
        float hue = mod(float(iterations) * 0.01 + uColorShift, 1.0);
        color = hsv2rgb(vec3(hue, 0.8, 0.9));
    }
    
    gl_FragColor = vec4(color, 1.0);
}
`;