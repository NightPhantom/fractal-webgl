/**
 * Initializes a buffer for the WebGL context containing a full-screen quad.
 * 
 * @param {!WebGLRenderingContext} gl The WebGL context.
 * @returns {{position: !WebGLBuffer}} An object containing the position buffer.
 */
function initBuffers(gl) {
    const positionBuffer = initPositionBuffer(gl);

    return {
        position: positionBuffer,
    };

}

function initPositionBuffer(gl) {

    // Create a new buffer
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Define a quad covering the full screen
    const positions = [
        -1.0, 1.0, // top left
        -1.0, -1.0, // bottom left
        1.0, 1.0, // top right
        1.0, -1.0, // bottom right
    ]

    // Now pass the list of positions into WebGL to build the quad.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Return the initialized buffer
    return positionBuffer;
}

export { initBuffers };
