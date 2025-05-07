/**
 * Renders a full-screen quad using the provided shader program and buffers.
 * 
 * @param {!WebGLRenderingContext} gl The WebGL context.
 * @param {Object} programInfo Object containing shader program information
 * @param {{position: !WebGLBuffer}} buffers Object containing vertex buffers
 */
function drawScene(gl, programInfo, buffers) {

    // Tell WebGL how to pull out the positions from the position buffer
    setPositionAttribute(gl, programInfo, buffers);

    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
}

function setPositionAttribute(gl, programInfo, buffers) {

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    const numComponents = 2; // pull out 2 values per iteration (2D)
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next (0 = use type and numComponents above)
    const offset = 0; // how many bytes inside the buffer to start from (0 = start at beginning)
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

export { drawScene };
