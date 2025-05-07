import { initBuffers } from "./modules/init-buffers.js";
import { drawScene } from "./modules/draw-scene.js";
import { initShaderProgram } from "./modules/shader-utils.js";

// Import source of shaders
import vertexShaderSource from "./shaders/vertex-shader.js";
import mandelbrotFragmentShaderSource from "./shaders/mandelbrot-fragment-shader.js";

main();

//
// start here
//
function main() {
    const canvas = document.querySelector("#gl-canvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert(
            "Unable to initialize WebGL. Your browser or machine may not support it.",
        );
        return;
    }

    // Initial resize and add event listener for window resizing
    resizeCanvas(canvas, gl);
    window.addEventListener('resize', () => resizeCanvas(canvas, gl));

    // Initialize a shader program with the vertex and fragment shaders
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, mandelbrotFragmentShaderSource);

    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition, aVertexColor and also
    // look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
        },
        uniformLocations: {
            resolution: gl.getUniformLocation(shaderProgram, "uResolution"),
            center: gl.getUniformLocation(shaderProgram, "uCenter"),
            zoom: gl.getUniformLocation(shaderProgram, "uZoom"),
            colorShift: gl.getUniformLocation(shaderProgram, "uColorShift"),
            maxIterations: gl.getUniformLocation(shaderProgram, "uMaxIterations"),
        },
    };

    // Initialize the full-screen buffer where we will draw the fractal
    const buffers = initBuffers(gl);

    // Initialize camera state
    const state = {
        gl: gl,
        programInfo: programInfo,
        buffers: buffers,
        center: { x: -0.5, y: 0.0 },
        zoom: 450.0,
        moveStep: 3.0,
        zoomFactor: 1.5,
        colorShift: 0.7,
        colorAnimation: {
            enabled: true,
            speed: 0.15,
        },
        maxIterations: 200,
    };

    // Configure controls
    setupUIControls(state);
    setupKeyboardControls(state);
    setupMouseControls(canvas, state);

    // Initial display of values
    updateInfoDisplay(state);

    // For FPS calculation
    let lastTime = 0;
    const fpsElement = document.querySelector("#fps");
    const frameTimes = [];
    let frameCursor = 0;
    let numFrames = 0;
    const maxFrames = 20;
    let totalFPS = 0.0;
    const avgFpsElement = document.querySelector("#avg");

    // Draw the scene repeatedly
    function render(now) {

        const timeInSeconds = now * 0.001;

        // FPS calculation
        if (fpsElement && avgFpsElement) {
            // FPS
            const deltaTime = timeInSeconds - lastTime; // Time since last frame
            lastTime = timeInSeconds; // Update last time for next frame
            const fps = 1.0 / deltaTime; // Calculate FPS
            fpsElement.textContent = fps.toFixed(1); // Display current FPS
            // Average FPS
            totalFPS += fps - (frameTimes[frameCursor] || 0); // Add the current fps and the remove the oldest
            frameTimes[frameCursor++] = fps; // Store the latest fps
            numFrames = Math.max(numFrames, frameCursor);
            frameCursor %= maxFrames; // Wrap around the cursor
            const avgFPS = totalFPS / numFrames; // Calculate average FPS
            avgFpsElement.textContent = avgFPS.toFixed(1); // Display average FPS
        }

        // Animate color shift if enabled
        if (state.colorAnimation.enabled) {
            state.colorShift = (timeInSeconds * state.colorAnimation.speed) % 1.0;
        }

        // Set the shader program to use
        gl.useProgram(programInfo.program);

        // Set attributes for drawing
        gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);
        gl.uniform2f(programInfo.uniformLocations.center, state.center.x, state.center.y);
        gl.uniform1f(programInfo.uniformLocations.zoom, state.zoom);
        gl.uniform1f(programInfo.uniformLocations.colorShift, state.colorShift);
        gl.uniform1i(programInfo.uniformLocations.maxIterations, state.maxIterations);

        // Draw the scene and queue the next frame
        drawScene(gl, programInfo, buffers);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

/**
 * Resizes the canvas to match its display size and updates the WebGL viewport
 * @param {HTMLCanvasElement} canvas - The canvas to resize
 * @param {WebGLRenderingContext} gl - The WebGL context
 */
function resizeCanvas(canvas, gl) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

/**
 * Updates the UI display with current state values
 * @param {Object} state - The application state containing center, zoom, and animation info
 */
function updateInfoDisplay(state) {
    document.getElementById('center-value').textContent = `(${state.center.x.toFixed(6)}, ${state.center.y.toFixed(6)})`;
    document.getElementById('zoom-value').textContent = state.zoom.toFixed(1);
    if (document.getElementById('animation-status')) {
        document.getElementById('animation-status').textContent =
            state.colorAnimation.enabled ? `Animated (${state.colorAnimation.speed.toFixed(2)}×)` : 'Static';
    }
    if (document.getElementById('iterations-value')) {
        document.getElementById('iterations-value').textContent = state.maxIterations;
    }
}

/**
 * Sets up UI controls for the application
 * @param {Object} state - The application state containing center, zoom, and animation info
 */
function setupUIControls(state) {
    document.getElementById('up').addEventListener('click', () => {
        state.center.y += state.moveStep / state.zoom;
        updateInfoDisplay(state);
    });

    document.getElementById('down').addEventListener('click', () => {
        state.center.y -= state.moveStep / state.zoom;
        updateInfoDisplay(state);
    });

    document.getElementById('left').addEventListener('click', () => {
        state.center.x -= state.moveStep / state.zoom;
        updateInfoDisplay(state);
    });

    document.getElementById('right').addEventListener('click', () => {
        state.center.x += state.moveStep / state.zoom;
        updateInfoDisplay(state);
    });

    document.getElementById('zoom-in').addEventListener('click', () => {
        state.zoom *= state.zoomFactor;
        updateInfoDisplay(state);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        state.zoom /= state.zoomFactor;
        updateInfoDisplay(state);
    });

    document.getElementById('screenshot').addEventListener('click', () => {
        const canvas = document.querySelector("#gl-canvas");
        drawScene(state.gl, state.programInfo, state.buffers); // Ensure the latest frame is drawn
        canvas.toBlob((blob) => {
            saveBlob(blob, `mandelbrot-capture-${canvas.width}x${canvas.height}-${new Date().toISOString().replace(/:/g, '-')}.png`);
        });
    });

    const iterationsSlider = document.getElementById('iterations-slider');
    const iterationsValue = document.getElementById('iterations-value');

    if (iterationsSlider && iterationsValue) {
        iterationsSlider.value = state.maxIterations;
        iterationsValue.textContent = state.maxIterations;

        iterationsSlider.addEventListener('input', () => {
            state.maxIterations = parseInt(iterationsSlider.value);
            iterationsValue.textContent = state.maxIterations;
        });
    }
}

const saveBlob = (function () {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    return function (blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        // Clean up by revoking the object URL
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 0);
    };
})();

/**
 * Sets up keyboard controls for the application
 * @param {Object} state - The application state containing center, zoom, and animation info
 */
function setupKeyboardControls(state) {
    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp': // Move camera up
                state.center.y += state.moveStep / state.zoom;
                break;
            case 'ArrowDown': // Move camera down
                state.center.y -= state.moveStep / state.zoom;
                break;
            case 'ArrowLeft': // Move camera left
                state.center.x -= state.moveStep / state.zoom;
                break;
            case 'ArrowRight': // Move camera right
                state.center.x += state.moveStep / state.zoom;
                break;
            case '+': // Zoom in
            case '=':
                state.zoom *= state.zoomFactor;
                break;
            case '-': // Zoom out
            case '_':
                state.zoom /= state.zoomFactor;
                break;
            case 'r': // Reset camera
            case 'R':
                state.center.x = -0.5;
                state.center.y = 0.0;
                state.zoom = 450.0;
                state.colorShift = 0.7;
                state.colorAnimation.enabled = true;
                state.colorAnimation.speed = 0.15;
                state.maxIterations = 200;
                break;
            case 'c': // Change color
            case 'C':
                state.colorShift = (state.colorShift + 0.1) % 1.0;
                break;
            case 'a': // Toggle color animation
            case 'A':
                state.colorAnimation.enabled = !state.colorAnimation.enabled;
                break;
            case '<': // Decrease color animation speed
            case ',':
                state.colorAnimation.speed = Math.max(0.05, state.colorAnimation.speed - 0.05);
                break;
            case '>': // Increase color animation speed
            case '.':
                state.colorAnimation.speed = Math.min(2.0, state.colorAnimation.speed + 0.05);
                break;
            case '[': // Decrease iterations
                state.maxIterations = Math.max(10, state.maxIterations - 10);
                if (document.getElementById('iterations-slider')) {
                    document.getElementById('iterations-slider').value = state.maxIterations;
                }
                break;
            case ']': // Increase iterations
                state.maxIterations = Math.min(5000, state.maxIterations + 10);
                if (document.getElementById('iterations-slider')) {
                    document.getElementById('iterations-slider').value = state.maxIterations;
                }
                break;
        }

        updateInfoDisplay(state);
    });
}

/**
 * Sets up mouse controls for the application
 * @param {HTMLCanvasElement} canvas - The canvas to resize
 * @param {Object} state - The application state containing center, zoom, and animation info
 */
function setupMouseControls(canvas, state) {

    // Add mouse drag support
    let isDragging = false;
    let lastMouseX, lastMouseY;

    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    window.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - lastMouseX;
            const deltaY = event.clientY - lastMouseY;

            state.center.x -= deltaX / state.zoom;
            state.center.y -= deltaY / state.zoom * -1; // Invert Y for natural drag direction

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;

            updateInfoDisplay(state);
        }
    });

    // Add mouse wheel zoom
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();

        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Convert to complex plane coordinates
        const complexX = (mouseX - canvas.width / 2) / state.zoom + state.center.x;
        const complexY = (mouseY - canvas.height / 2) / state.zoom * -1 + state.center.y;

        // Determine zoom direction and factor
        const zoomFactor = event.deltaY < 0 ? state.zoomFactor : 1 / state.zoomFactor;

        // Apply zoom
        state.zoom *= zoomFactor;

        // Adjust center to zoom toward mouse position
        state.center.x = complexX - (complexX - state.center.x) / zoomFactor;
        state.center.y = complexY - (complexY - state.center.y) / zoomFactor;

        updateInfoDisplay(state);
    });
}