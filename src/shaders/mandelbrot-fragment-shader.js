export default `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uZoom;
uniform float uColorShift;
uniform int uMaxIterations;

// Function to convert HSV to RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 c = (gl_FragCoord.xy - uResolution / 2.0) / uZoom + uCenter;
    vec2 z = vec2(0.0, 0.0);
    const int MAX_ITERATIONS = 9999; // An arbitrarily large number of iterations to make the for loop happy (GLSL requires a constant loop count)
    const int DEFAULT_MAX_ITERATIONS = 200; // Default value if uniform is not set or is 0

    // Use the user-provided max iterations or default if not set or 0
    int effectiveMaxIterations = uMaxIterations <= 0 ? DEFAULT_MAX_ITERATIONS : uMaxIterations;

    int iterations = 0;

    for (int i = 0; i < MAX_ITERATIONS; i++) {
        if (i >= effectiveMaxIterations) break; // Break early at the variable value for max iterations provided by the user
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iterations = i;
    }

    vec3 color;
    if (iterations == effectiveMaxIterations - 1) {
        color = vec3(0.0, 0.0, 0.0);
    } else {
        // Use the color shift uniform to adjust the hue
        float hue = mod(float(iterations) * 0.01 + uColorShift, 1.0);
        color = hsv2rgb(vec3(hue, 0.8, 0.9));
    }
    
    gl_FragColor = vec4(color, 1.0);
}
`;