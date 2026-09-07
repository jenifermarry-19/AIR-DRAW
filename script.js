// =====================================================
// AIR DRAW - FUTURISTIC NEON MOVABLE OBJECT VERSION
// =====================================================
//
// ☝️ Index finger  = Draw
// ✋ Pause          = Finish drawing
// 🤏 Pinch object   = Grab object
// 🤏 Move hand      = Move object
// ✋ Release pinch  = Drop object
// ✊ Fist           = Delete nearest object
//
// FEATURES:
// ✨ Neon drawing
// 🖐️ Smooth hand tracking
// 🎯 Movable drawings
// 🔷 Movable shapes
// 🎨 Colors
// 🧽 Object eraser
// ↩️ Undo
// ↪️ Redo
// 💾 Save
// 🧹 Clear
// =====================================================


// =====================================================
// HTML ELEMENTS
// =====================================================

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const statusText = document.getElementById("status");

const fingerCursor = document.getElementById("fingerCursor");

const toolPalette = document.getElementById("toolPalette");
const toolShapes = document.getElementById("toolShapes");
const toolColors = document.querySelectorAll(".toolColor");
const toolEraser = document.getElementById("toolEraser");
const toolUndo = document.getElementById("toolUndo");

const shapePalette = document.getElementById("shapePalette");
const shapeTools = document.querySelectorAll(".shapeTool");
const shapeBack = document.getElementById("shapeBack");

const drawingContainer =
    document.querySelector(".drawing-container");
const saveBtn = document.getElementById("saveBtn");


// =====================================================
// CANVAS
// =====================================================

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;


// =====================================================
// CAMERA
// =====================================================

let camera = null;
let cameraStarted = false;


// =====================================================
// SMOOTH HAND TRACKING
// =====================================================

let smoothX = null;
let smoothY = null;

const SMOOTHING_FACTOR = 0.35;


// =====================================================
// CURRENT TOOL
// =====================================================

let selectedTool = "draw";
let selectedShape = null;


// =====================================================
// DRAWING STATE
// =====================================================

let isDrawing = false;

let activePoints = [];

let shapeStart = null;
let shapeEnd = null;


// =====================================================
// MOVABLE OBJECTS
// =====================================================

let objects = [];

let selectedObject = null;

let isDraggingObject = false;

let dragOffsetX = 0;
let dragOffsetY = 0;


// =====================================================
// MENU STATE
// =====================================================

let menuOpen = false;

let wasPinching = false;

let hoveredTool = null;


// =====================================================
// PINCH STABILITY
// =====================================================

let pinchFrames = 0;

const PINCH_REQUIRED_FRAMES = 3;


// =====================================================
// HISTORY
// =====================================================

let undoStack = [];
let redoStack = [];

const MAX_HISTORY = 30;


// =====================================================
// UTILITY
// =====================================================

function distance(x1, y1, x2, y2) {

    return Math.sqrt(

        Math.pow(x2 - x1, 2) +

        Math.pow(y2 - y1, 2)

    );

}


// =====================================================
// RESET SMOOTHING
// =====================================================

function resetDrawingPosition() {

    smoothX = null;
    smoothY = null;

}

saveBtn.addEventListener("click", () => {

    saveDrawing();

    statusText.textContent =
        "💾 Image Saved!";

});
// =====================================================
// SMOOTH POSITION
// =====================================================

function smoothPosition(x, y) {

    if (
        smoothX === null ||
        smoothY === null
    ) {

        smoothX = x;
        smoothY = y;

    } else {

        smoothX +=
            (x - smoothX) *
            SMOOTHING_FACTOR;

        smoothY +=
            (y - smoothY) *
            SMOOTHING_FACTOR;

    }

    return {

        x: smoothX,
        y: smoothY

    };

}


// =====================================================
// HISTORY
// =====================================================

function cloneObjects() {

    return JSON.parse(
        JSON.stringify(objects)
    );

}


function saveState() {

    undoStack.push(
        cloneObjects()
    );

    if (
        undoStack.length >
        MAX_HISTORY
    ) {

        undoStack.shift();

    }

    redoStack = [];

}


function undo() {

    if (
        undoStack.length === 0
    ) {

        return;

    }

    redoStack.push(
        cloneObjects()
    );

    objects =
        undoStack.pop();

    selectedObject = null;

    redrawCanvas();

    statusText.textContent =
        "↩️ Undo";

}


function redo() {

    if (
        redoStack.length === 0
    ) {

        return;

    }

    undoStack.push(
        cloneObjects()
    );

    objects =
        redoStack.pop();

    selectedObject = null;

    redrawCanvas();

    statusText.textContent =
        "↪️ Redo";

}


// =====================================================
// CLEAR
// =====================================================

clearBtn.addEventListener(
    "click",
    () => {

        if (
            objects.length === 0
        ) {

            return;

        }

        saveState();

        objects = [];

        selectedObject = null;

        redrawCanvas();

        statusText.textContent =
            "🧹 Canvas Cleared";

    }
);


// =====================================================
// SAVE IMAGE
// =====================================================

function saveDrawing() {

    selectedObject = null;

    redrawCanvas();

    const link =
        document.createElement("a");

    link.download =
        "air-drawing.png";

    link.href =
        canvas.toDataURL("image/png");

    link.click();

}


// =====================================================
// REDRAW EVERYTHING
// =====================================================

function redrawCanvas() {

    ctx.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );

    objects.forEach(
        (object) => {

            drawObject(
                object
            );

        }
    );

    if (selectedObject) {

        drawSelectionGlow(
            selectedObject
        );

    }

}


// =====================================================
// DRAW OBJECT
// =====================================================

function drawObject(object) {

    ctx.save();

    ctx.translate(

        object.offsetX || 0,

        object.offsetY || 0

    );


    if (
        object.type === "stroke"
    ) {

        drawStrokeObject(
            object
        );

    }

    else if (
        object.type === "shape"
    ) {

        drawShapeObject(
            object
        );

    }

    ctx.restore();

}


// =====================================================
// DRAW NEON STROKE
// =====================================================

function drawStrokeObject(object) {

    const points =
        object.points;

    if (
        points.length < 2
    ) {

        return;

    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";


    // OUTER GLOW

    ctx.strokeStyle =
        object.color;

    ctx.lineWidth =
        object.size;

    ctx.shadowColor =
        object.color;

    ctx.shadowBlur = 22;

    ctx.beginPath();

    ctx.moveTo(
        points[0].x,
        points[0].y
    );

    for (
        let i = 1;

        i < points.length;

        i++
    ) {

        ctx.lineTo(

            points[i].x,

            points[i].y

        );

    }

    ctx.stroke();


    // INNER LINE

    ctx.shadowBlur = 6;

    ctx.strokeStyle =
        "#ffffff";

    ctx.globalAlpha = 0.6;

    ctx.lineWidth =
        Math.max(
            1,
            object.size * 0.25
        );

    ctx.beginPath();

    ctx.moveTo(
        points[0].x,
        points[0].y
    );

    for (
        let i = 1;

        i < points.length;

        i++
    ) {

        ctx.lineTo(

            points[i].x,

            points[i].y

        );

    }

    ctx.stroke();

}


// =====================================================
// DRAW SHAPE OBJECT
// =====================================================

function drawShapeObject(object) {

    const start =
        object.start;

    const end =
        object.end;

    ctx.strokeStyle =
        object.color;

    ctx.lineWidth =
        object.size;

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";

    ctx.shadowColor =
        object.color;

    ctx.shadowBlur = 20;


    if (
        object.shape === "line"
    ) {

        ctx.beginPath();

        ctx.moveTo(
            start.x,
            start.y
        );

        ctx.lineTo(
            end.x,
            end.y
        );

        ctx.stroke();

    }


    else if (
        object.shape === "circle"
    ) {

        const centerX =
            (start.x + end.x) / 2;

        const centerY =
            (start.y + end.y) / 2;

        const radius =
            distance(

                start.x,
                start.y,

                end.x,
                end.y

            ) / 2;


        ctx.beginPath();

        ctx.arc(

            centerX,

            centerY,

            radius,

            0,

            Math.PI * 2

        );

        ctx.stroke();

    }


    else if (
        object.shape ===
        "rectangle"
    ) {

        ctx.beginPath();

        ctx.rect(

            Math.min(
                start.x,
                end.x
            ),

            Math.min(
                start.y,
                end.y
            ),

            Math.abs(
                end.x - start.x
            ),

            Math.abs(
                end.y - start.y
            )

        );

        ctx.stroke();

    }


    else if (
        object.shape ===
        "triangle"
    ) {

        const left =
            Math.min(
                start.x,
                end.x
            );

        const right =
            Math.max(
                start.x,
                end.x
            );

        const top =
            Math.min(
                start.y,
                end.y
            );

        const bottom =
            Math.max(
                start.y,
                end.y
            );

        const centerX =
            (left + right) / 2;


        ctx.beginPath();

        ctx.moveTo(
            centerX,
            top
        );

        ctx.lineTo(
            right,
            bottom
        );

        ctx.lineTo(
            left,
            bottom
        );

        ctx.closePath();

        ctx.stroke();

    }


    else if (
        object.shape ===
        "arrow"
    ) {

        drawArrowShape(
            start,
            end
        );

    }

}


// =====================================================
// ARROW
// =====================================================

function drawArrowShape(
    start,
    end
) {

    const headLength = 25;

    const angle =
        Math.atan2(

            end.y - start.y,

            end.x - start.x

        );


    ctx.beginPath();

    ctx.moveTo(
        start.x,
        start.y
    );

    ctx.lineTo(
        end.x,
        end.y
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        end.x,
        end.y
    );

    ctx.lineTo(

        end.x -

        headLength *

        Math.cos(
            angle - Math.PI / 6
        ),

        end.y -

        headLength *

        Math.sin(
            angle - Math.PI / 6
        )

    );

    ctx.moveTo(
        end.x,
        end.y
    );

    ctx.lineTo(

        end.x -

        headLength *

        Math.cos(
            angle + Math.PI / 6
        ),

        end.y -

        headLength *

        Math.sin(
            angle + Math.PI / 6
        )

    );

    ctx.stroke();

}


// =====================================================
// GET OBJECT BOUNDS
// =====================================================

function getObjectBounds(object) {

    let minX =
        Infinity;

    let minY =
        Infinity;

    let maxX =
        -Infinity;

    let maxY =
        -Infinity;


    if (
        object.type ===
        "stroke"
    ) {

        object.points.forEach(
            (point) => {

                minX =
                    Math.min(
                        minX,
                        point.x
                    );

                minY =
                    Math.min(
                        minY,
                        point.y
                    );

                maxX =
                    Math.max(
                        maxX,
                        point.x
                    );

                maxY =
                    Math.max(
                        maxY,
                        point.y
                    );

            }
        );

    }


    else {

        minX =
            Math.min(

                object.start.x,

                object.end.x

            );

        minY =
            Math.min(

                object.start.y,

                object.end.y

            );

        maxX =
            Math.max(

                object.start.x,

                object.end.x

            );

        maxY =
            Math.max(

                object.start.y,

                object.end.y

            );

    }


    const padding = 25;


    return {

        minX:
            minX +
            (object.offsetX || 0) -
            padding,

        minY:
            minY +
            (object.offsetY || 0) -
            padding,

        maxX:
            maxX +
            (object.offsetX || 0) +
            padding,

        maxY:
            maxY +
            (object.offsetY || 0) +
            padding

    };

}


// =====================================================
// DRAW SELECTION GLOW
// =====================================================

function drawSelectionGlow(object) {

    const bounds =
        getObjectBounds(object);

    ctx.save();

    ctx.strokeStyle =
        "#00f5ff";

    ctx.lineWidth = 3;

    ctx.shadowColor =
        "#00f5ff";

    ctx.shadowBlur = 20;

    ctx.setLineDash(
        [10, 8]
    );

    ctx.strokeRect(

        bounds.minX,

        bounds.minY,

        bounds.maxX -
        bounds.minX,

        bounds.maxY -
        bounds.minY

    );

    ctx.restore();

}


// =====================================================
// FIND OBJECT NEAR HAND
// =====================================================

function findObjectAt(x, y) {

    for (

        let i =
            objects.length - 1;

        i >= 0;

        i--

    ) {

        const object =
            objects[i];

        const bounds =
            getObjectBounds(
                object
            );


        if (

            x >= bounds.minX &&

            x <= bounds.maxX &&

            y >= bounds.minY &&

            y <= bounds.maxY

        ) {

            return object;

        }

    }

    return null;

}


// =====================================================
// DELETE OBJECT
// =====================================================

function eraseObjectAt(x, y) {

    const object =
        findObjectAt(
            x,
            y
        );

    if (!object) {

        return;

    }

    saveState();

    objects =
        objects.filter(

            (item) =>

                item !== object

        );

    selectedObject = null;

    redrawCanvas();

}


// =====================================================
// START STROKE
// =====================================================

function startStroke(x, y) {

    saveState();

    activePoints = [

        {
            x: x,
            y: y
        }

    ];

    isDrawing = true;

}


// =====================================================
// ADD STROKE POINT
// =====================================================

function addStrokePoint(x, y) {

    if (!isDrawing) {

        startStroke(
            x,
            y
        );

        return;

    }

    const last =
        activePoints[
            activePoints.length - 1
        ];

    if (

        distance(

            last.x,
            last.y,

            x,
            y

        ) < 3

    ) {

        return;

    }


    activePoints.push({

        x: x,

        y: y

    });

}


// =====================================================
// FINISH STROKE
// =====================================================

function finishStroke() {

    if (

        activePoints.length < 2

    ) {

        activePoints = [];

        isDrawing = false;

        return;

    }


    objects.push({

        type:
            "stroke",

        points:
            [...activePoints],

        color:
            colorPicker.value,

        size:
            Number(
                brushSize.value
            ),

        offsetX:
            0,

        offsetY:
            0

    });


    activePoints = [];

    isDrawing = false;

    redrawCanvas();

}


// =====================================================
// DRAW ACTIVE STROKE PREVIEW
// =====================================================

function drawActiveStroke() {

    redrawCanvas();

    if (
        activePoints.length < 2
    ) {

        return;

    }


    drawStrokeObject({

        type:
            "stroke",

        points:
            activePoints,

        color:
            colorPicker.value,

        size:
            Number(
                brushSize.value
            ),

        offsetX:
            0,

        offsetY:
            0

    });

}


// =====================================================
// START SHAPE
// =====================================================

function startShape(x, y) {

    saveState();

    shapeStart = {

        x: x,

        y: y

    };

    shapeEnd = {

        x: x,

        y: y

    };

    isDrawing = true;

}


// =====================================================
// UPDATE SHAPE
// =====================================================

function updateShape(x, y) {

    if (
        !isDrawing
    ) {

        startShape(
            x,
            y
        );

    }

    shapeEnd = {

        x: x,

        y: y

    };


    redrawCanvas();


    drawShapeObject({

        type:
            "shape",

        shape:
            selectedShape,

        start:
            shapeStart,

        end:
            shapeEnd,

        color:
            colorPicker.value,

        size:
            Number(
                brushSize.value
            ),

        offsetX:
            0,

        offsetY:
            0

    });

}


// =====================================================
// FINISH SHAPE
// =====================================================

function finishShape() {

    if (

        !shapeStart ||

        !shapeEnd

    ) {

        return;

    }


    if (

        distance(

            shapeStart.x,

            shapeStart.y,

            shapeEnd.x,

            shapeEnd.y

        ) > 10

    ) {

        objects.push({

            type:
                "shape",

            shape:
                selectedShape,

            start:
                {

                    ...shapeStart

                },

            end:
                {

                    ...shapeEnd

                },

            color:
                colorPicker.value,

            size:
                Number(
                    brushSize.value
                ),

            offsetX:
                0,

            offsetY:
                0

        });

    }


    shapeStart = null;
    shapeEnd = null;

    isDrawing = false;

    redrawCanvas();

}


// =====================================================
// CURSOR COLOR
// =====================================================

function updateCursorColor() {

    if (

        selectedTool ===
        "erase"

    ) {

        fingerCursor.style.background =
            "#ef4444";

        fingerCursor.style.boxShadow =
            "0 0 20px #ef4444";

        return;

    }


    fingerCursor.style.background =
        colorPicker.value;

    fingerCursor.style.boxShadow =
        `0 0 12px ${colorPicker.value},
         0 0 30px ${colorPicker.value}`;

}


// =====================================================
// TOOL PALETTES
// =====================================================

function openToolPalette() {

    if (
        toolPalette
    ) {

        toolPalette.style.display =
            "flex";

    }

}


function closeToolPalette() {

    if (
        toolPalette
    ) {

        toolPalette.style.display =
            "none";

    }

}


function openShapePalette() {

    menuOpen = true;

    closeToolPalette();

    if (
        shapePalette
    ) {

        shapePalette.style.display =
            "flex";

    }

    statusText.textContent =
        "🔷 Choose Shape";

}


function closeShapePalette() {

    if (
        shapePalette
    ) {

        shapePalette.style.display =
            "none";

    }

}


// =====================================================
// SHAPE SELECTION
// =====================================================

function getShapeName(shape) {

    const names = {

        line:
            "📏 Line",

        circle:
            "⭕ Circle",

        rectangle:
            "▭ Rectangle",

        triangle:
            "△ Triangle",

        arrow:
            "➡️ Arrow"

    };

    return (
        names[shape] ||
        "Shape"
    );

}


function selectShape(shape) {

    selectedShape =
        shape;

    selectedTool =
        "shape";

    menuOpen =
        false;

    closeShapePalette();

    closeToolPalette();

    statusText.textContent =
        getShapeName(shape) +
        " ☝️ Draw";

}


// =====================================================
// BUTTON EVENTS
// =====================================================

colorPicker.addEventListener(
    "input",
    () => {

        selectedTool =
            "draw";

        selectedShape =
            null;

        updateCursorColor();

    }
);


toolColors.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                colorPicker.value =
                    button.dataset.color;

                selectedTool =
                    "draw";

                selectedShape =
                    null;

                updateCursorColor();

                closeToolPalette();

            }
        );

    }
);


if (toolShapes) {

    toolShapes.addEventListener(
        "click",
        () => {

            openShapePalette();

        }
    );

}


if (toolEraser) {

    toolEraser.addEventListener(
        "click",
        () => {

            selectedTool =
                "erase";

            selectedShape =
                null;

            closeToolPalette();

            updateCursorColor();

        }
    );

}


if (toolUndo) {

    toolUndo.addEventListener(
        "click",
        () => {

            undo();

            closeToolPalette();

        }
    );

}


shapeTools.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                selectShape(
                    button.dataset.shape
                );

            }
        );

    }
);


if (shapeBack) {

    shapeBack.addEventListener(
        "click",
        () => {

            closeShapePalette();

            menuOpen = false;

            openToolPalette();

        }
    );

}


// =====================================================
// FIND BUTTON
// =====================================================

function findButtonAtPosition(

    container,

    screenX,

    screenY

) {

    if (!container) {

        return null;

    }


    const buttons =
        container.querySelectorAll(
            "button"
        );


    for (
        const button of buttons
    ) {

        const rect =
            button.getBoundingClientRect();


        if (

            screenX >= rect.left &&

            screenX <= rect.right &&

            screenY >= rect.top &&

            screenY <= rect.bottom

        ) {

            return button;

        }

    }

    return null;

}


// =====================================================
// BUTTON HOVER
// =====================================================

function handleToolHover(

    button,

    palette

) {

    if (!palette) {

        return;

    }


    palette
        .querySelectorAll("button")
        .forEach(
            (btn) => {

                btn.style.transform =
                    "";

            }
        );


    if (button) {

        button.style.transform =
            "scale(1.15)";

    }


    hoveredTool =
        button;

}


// =====================================================
// SELECT TOOL
// =====================================================

function selectMainTool(button) {

    if (!button) {

        return;

    }


    if (
        button === toolShapes
    ) {

        openShapePalette();

        return;

    }


    if (

        button.classList.contains(
            "toolColor"
        )

    ) {

        colorPicker.value =
            button.dataset.color;

        selectedTool =
            "draw";

        selectedShape =
            null;

        updateCursorColor();

        closeToolPalette();

        return;

    }


    if (
        button === toolEraser
    ) {

        selectedTool =
            "erase";

        selectedShape =
            null;

        updateCursorColor();

        closeToolPalette();

        return;

    }


    if (
        button === toolUndo
    ) {

        undo();

        closeToolPalette();

    }

}


// =====================================================
// SELECT SHAPE BUTTON
// =====================================================

function selectShapeButton(button) {

    if (!button) {

        return;

    }


    if (
        button === shapeBack
    ) {

        closeShapePalette();

        menuOpen = false;

        openToolPalette();

        return;

    }


    if (

        button.classList.contains(
            "shapeTool"
        )

    ) {

        selectShape(
            button.dataset.shape
        );

    }

}


// =====================================================
// GESTURES
// =====================================================

function isFingerFolded(

    hand,

    tip,

    pip

) {

    return (
        hand[tip].y >
        hand[pip].y
    );

}


function isFist(hand) {

    return (

        isFingerFolded(
            hand,
            8,
            6
        )

        &&

        isFingerFolded(
            hand,
            12,
            10
        )

        &&

        isFingerFolded(
            hand,
            16,
            14
        )

        &&

        isFingerFolded(
            hand,
            20,
            18
        )

    );

}


function isIndexFingerUp(hand) {

    return (

        hand[8].y <
        hand[6].y

        &&

        hand[12].y >
        hand[10].y

        &&

        hand[16].y >
        hand[14].y

        &&

        hand[20].y >
        hand[18].y

    );

}


function isPinching(hand) {

    const thumb =
        hand[4];

    const index =
        hand[8];

    const wrist =
        hand[0];

    const middleMCP =
        hand[9];


    const pinchDistance =
        distance(

            thumb.x,

            thumb.y,

            index.x,

            index.y

        );


    const handSize =
        distance(

            wrist.x,

            wrist.y,

            middleMCP.x,

            middleMCP.y

        );


    const threshold =
        Math.max(

            0.04,

            handSize * 0.65

        );


    return (
        pinchDistance <
        threshold
    );

}


// =====================================================
// MEDIAPIPE
// =====================================================

const hands =
    new Hands({

        locateFile: (file) =>

            "https://cdn.jsdelivr.net/npm/" +

            "@mediapipe/hands/" +

            file

    });


hands.setOptions({

    maxNumHands: 1,

    modelComplexity: 1,

    minDetectionConfidence: 0.75,

    minTrackingConfidence: 0.75

});


// =====================================================
// HAND RESULTS
// =====================================================

hands.onResults(
    (results) => {


        // =============================================
        // NO HAND
        // =============================================

        if (

            !results.multiHandLandmarks ||

            results.multiHandLandmarks.length === 0

        ) {

            fingerCursor.style.display =
                "none";

            pinchFrames = 0;

            if (
                isDraggingObject
            ) {

                isDraggingObject =
                    false;

                selectedObject =
                    null;

                redrawCanvas();

            }

            return;

        }


        // =============================================
        // HAND DATA
        // =============================================

        const hand =
            results.multiHandLandmarks[0];

        const indexTip =
            hand[8];


        // MIRROR

        const normalizedX =
            1 - indexTip.x;

        const normalizedY =
            indexTip.y;


        // RAW POSITION

        const rawX =
            normalizedX *
            CANVAS_WIDTH;

        const rawY =
            normalizedY *
            CANVAS_HEIGHT;


        // SMOOTH POSITION

        const smoothed =
            smoothPosition(
                rawX,
                rawY
            );

        const x =
            smoothed.x;

        const y =
            smoothed.y;


        // CURSOR

        fingerCursor.style.display =
            "block";

        fingerCursor.style.left =
            (x / CANVAS_WIDTH) *
            100 +
            "%";

        fingerCursor.style.top =
            (y / CANVAS_HEIGHT) *
            100 +
            "%";


        // =============================================
        // PINCH
        // =============================================

        const rawPinch =
            isPinching(hand);


        if (rawPinch) {

            pinchFrames++;

        } else {

            pinchFrames = 0;

        }


        const pinching =
            pinchFrames >=
            PINCH_REQUIRED_FRAMES;


        // =============================================
        // DRAG SELECTED OBJECT
        // =============================================

        if (

            isDraggingObject &&

            selectedObject

        ) {

            if (rawPinch) {

                selectedObject.offsetX =

                    x -

                    dragOffsetX;


                selectedObject.offsetY =

                    y -

                    dragOffsetY;


                redrawCanvas();

                statusText.textContent =
                    "🤏 Moving Object";

                return;

            }


            // RELEASE

            isDraggingObject =
                false;

            selectedObject =
                null;

            redrawCanvas();

            statusText.textContent =
                "✨ Object Dropped";

            return;

        }


        // =============================================
        // SHAPE MENU
        // =============================================

        if (

            menuOpen &&

            shapePalette &&

            shapePalette.style.display ===
            "flex"

        ) {

            const rect =
                drawingContainer
                    .getBoundingClientRect();


            const screenX =
                rect.left +

                (x / CANVAS_WIDTH) *
                rect.width;


            const screenY =
                rect.top +

                (y / CANVAS_HEIGHT) *
                rect.height;


            if (pinching) {

                const button =
                    findButtonAtPosition(

                        shapePalette,

                        screenX,

                        screenY

                    );


                handleToolHover(

                    button,

                    shapePalette

                );


                wasPinching =
                    true;

                return;

            }


            if (
                wasPinching
            ) {

                if (
                    hoveredTool
                ) {

                    selectShapeButton(
                        hoveredTool
                    );

                }

                hoveredTool =
                    null;

                wasPinching =
                    false;

            }

            return;

        }


        // =============================================
        // PINCH → GRAB OBJECT FIRST
        // =============================================

        if (

            pinching &&

            !isDrawing &&

            !menuOpen

        ) {

            const object =
                findObjectAt(
                    x,
                    y
                );


            if (object) {

                saveState();

                selectedObject =
                    object;

                isDraggingObject =
                    true;


                dragOffsetX =

                    x -

                    (
                        object.offsetX || 0
                    );


                dragOffsetY =

                    y -

                    (
                        object.offsetY || 0
                    );


                statusText.textContent =
                    "🤏 Object Grabbed";

                redrawCanvas();

                return;

            }

        }


        // =============================================
        // PINCH → TOOL MENU
        // =============================================

        if (

            pinching &&

            !menuOpen &&

            !isDrawing

        ) {

            const rect =
                drawingContainer
                    .getBoundingClientRect();


            const screenX =
                rect.left +

                (x / CANVAS_WIDTH) *
                rect.width;


            const screenY =
                rect.top +

                (y / CANVAS_HEIGHT) *
                rect.height;


            openToolPalette();


            const button =
                findButtonAtPosition(

                    toolPalette,

                    screenX,

                    screenY

                );


            handleToolHover(

                button,

                toolPalette

            );


            wasPinching =
                true;

            return;

        }


        // =============================================
        // TOOL MENU RELEASE
        // =============================================

        if (

            !rawPinch &&

            wasPinching &&

            toolPalette.style.display ===
            "flex"

        ) {

            if (
                hoveredTool
            ) {

                selectMainTool(
                    hoveredTool
                );

            }


            hoveredTool =
                null;

            wasPinching =
                false;

            closeToolPalette();

            return;

        }


        // =============================================
        // FIST = DELETE OBJECT
        // =============================================

        if (

            isFist(hand) &&

            !isDrawing

        ) {

            selectedTool =
                "erase";

            updateCursorColor();

            eraseObjectAt(
                x,
                y
            );

            statusText.textContent =
                "✊ Erase Object";

            return;

        }


        // =============================================
        // INDEX FINGER = DRAW
        // =============================================

        if (
            isIndexFingerUp(hand)
        ) {


            // -----------------------------------------
            // NORMAL DRAW
            // -----------------------------------------

            if (
                selectedTool ===
                "draw"
            ) {

                updateCursorColor();

                addStrokePoint(
                    x,
                    y
                );

                drawActiveStroke();

                statusText.textContent =
                    "✨ Neon Drawing";

                return;

            }


            // -----------------------------------------
            // SHAPE
            // -----------------------------------------

            if (

                selectedTool ===
                "shape"

                &&

                selectedShape

            ) {

                updateShape(
                    x,
                    y
                );

                statusText.textContent =
                    getShapeName(
                        selectedShape
                    );

                return;

            }


            // -----------------------------------------
            // ERASER
            // -----------------------------------------

            if (

                selectedTool ===
                "erase"

            ) {

                eraseObjectAt(
                    x,
                    y
                );

                return;

            }

        }


        // =============================================
        // PAUSE / FINGER DOWN
        // =============================================

        if (
            isDrawing
        ) {

            if (

                selectedTool ===
                "draw"

            ) {

                finishStroke();

            }


            else if (

                selectedTool ===
                "shape"

            ) {

                finishShape();

            }

        }


        statusText.textContent =
            "✋ Paused";

    }
);


// =====================================================
// START CAMERA
// =====================================================

startBtn.addEventListener(
    "click",
    async () => {

        if (
            cameraStarted
        ) {

            return;

        }


        try {

            statusText.textContent =
                "📷 Starting Camera...";


            const stream =

                await navigator
                    .mediaDevices
                    .getUserMedia({

                        video: {

                            width:
                                1280,

                            height:
                                720

                        },

                        audio:
                            false

                    });


            video.srcObject =
                stream;

            await video.play();


            camera =
                new Camera(

                    video,

                    {

                        onFrame:
                            async () => {

                                if (
                                    cameraStarted
                                ) {

                                    await hands.send({

                                        image:
                                            video

                                    });

                                }

                            },


                        width:
                            1280,

                        height:
                            720

                    }

                );


            cameraStarted =
                true;

            camera.start();


            startBtn.disabled =
                true;

            startBtn.textContent =
                "● Camera Running";

            stopBtn.disabled =
                false;


            statusText.textContent =
                "✋ Show Your Hand";


        } catch (error) {

            console.error(
                error
            );

            statusText.textContent =
                "❌ Camera Error";

            alert(

                "Camera Error:\n\n" +

                error.message

            );

        }

    }
);


// =====================================================
// STOP CAMERA
// =====================================================

stopBtn.addEventListener(
    "click",
    () => {


        if (camera) {

            camera.stop();

            camera =
                null;

        }


        if (
            video.srcObject
        ) {

            video.srcObject
                .getTracks()
                .forEach(

                    (track) =>

                        track.stop()

                );

            video.srcObject =
                null;

        }


        cameraStarted =
            false;


        resetDrawingPosition();

        activePoints = [];

        shapeStart = null;

        shapeEnd = null;

        isDrawing = false;

        isDraggingObject = false;

        selectedObject = null;

        pinchFrames = 0;

        wasPinching = false;

        hoveredTool = null;


        closeToolPalette();

        closeShapePalette();


        fingerCursor.style.display =
            "none";


        startBtn.disabled =
            false;

        startBtn.textContent =
            "▶ Start Camera";


        stopBtn.disabled =
            true;


        statusText.textContent =
            "Camera Off";

    }
);


// =====================================================
// KEYBOARD SHORTCUTS
// =====================================================

document.addEventListener(
    "keydown",
    (event) => {


        if (

            event.ctrlKey &&

            event.key.toLowerCase() ===
            "z"

        ) {

            event.preventDefault();

            undo();

        }


        if (

            event.ctrlKey &&

            event.key.toLowerCase() ===
            "y"

        ) {

            event.preventDefault();

            redo();

        }


        if (

            event.ctrlKey &&

            event.key.toLowerCase() ===
            "s"

        ) {

            event.preventDefault();

            saveDrawing();

        }

    }
);


// =====================================================
// INITIAL STATE
// =====================================================

closeToolPalette();

closeShapePalette();

updateCursorColor();

statusText.textContent =
    "Camera Off";