var view;
var ctx;
var scene;
var start_time;

//for clipping
var LEFT = 32;
var RIGHT = 16;
var BOTTOM = 8;
var TOPP = 4;
var NEAR = 2;
var FAR = 1;

// Initialization function - called when web page loads
function Init() {
    var w = 800;
    var h = 600;
    view = document.getElementById('view');
    view.width = w;
    view.height = h;

    ctx = view.getContext('2d');

    // initial scene... feel free to change this
    scene = {
        view: {
            type: 'perspective',
            prp: Vector3(44, 20, -16),
            srp: Vector3(20, 20, -40),
            vup: Vector3(0, 1, 0),
            clip: [-19, 5, -10, 8, 12, 100]
        },
        models: [
            {
                type: 'generic',
                vertices: [
                    Vector4( 0,  0, -30, 1),
                    Vector4(20,  0, -30, 1),
                    Vector4(20, 12, -30, 1),
                    Vector4(10, 20, -30, 1),
                    Vector4( 0, 12, -30, 1),
                    Vector4( 0,  0, -60, 1),
                    Vector4(20,  0, -60, 1),
                    Vector4(20, 12, -60, 1),
                    Vector4(10, 20, -60, 1),
                    Vector4( 0, 12, -60, 1)
                ],
                edges: [
                    [0, 1, 2, 3, 4, 0],
                    [5, 6, 7, 8, 9, 5],
                    [0, 5],
                    [1, 6],
                    [2, 7],
                    [3, 8],
                    [4, 9]
                ],
                matrix: new Matrix(4, 4)
            }
        ]
    };

    

    // event handler for pressing arrow keys
    document.addEventListener('keydown', OnKeyDown, false);
    
    // start animation loop
    start_time = performance.now(); // current timestamp in milliseconds
    window.requestAnimationFrame(Animate);
}

// Animation loop - repeatedly calls rendering code
function Animate(timestamp) {
    // step 1: calculate time (time since start) 
    // step 2: transform models based on time
    // step 3: draw scene
    // step 4: request next animation frame (recursively calling same function)


    var time = timestamp - start_time;

    // ... step 2

    DrawScene();

   // window.requestAnimationFrame(Animate);
}

// Main drawing code - use information contained in variable `scene`
function DrawScene() { 
    // by the time we get here, just dealing with vertices
    // Step 0: Clear the screen so a new scene can be drawn
    ctx.clearRect(0, 0, view.width, view.height);

    // Step 1: Transform models into canonical view volume using matrix functions in transforms.js
    // if scene.view.type is perspective,
    // loop over all models
    // for each model, loop over all vertices
    // transform them into perspective canonical view volume
    // HINT: DO NOT OVERWRITE MODELS IN SCENE, scene is read-only variable
    // once transformed, do clipping
    // loop over all edges in model_array, clip lines
    var vertex_array = []; // array of arrays containing each model's vertices
    var edge_array = [] // array of arrays containing each model's edges
    var near = scene.view.clip[4]; // near clipping plane
    var far = scene.view.clip[5]; // far clipping plane
    var view_window_matrix = new Matrix(4,4); // matrix for projecting onto view plane
    view_window_matrix.values = [[view.width/2, 0, 0, view.width/2], [0, view.height/2, 0, view.height/2], [0, 0, 1, 0], [0, 0, 0, 1]];
    if (scene.view.type == 'perspective') {
        var mper = new Matrix(4, 4);
        Mat4x4Projection(mper, scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
        console.log(mper); // ensuring correct calculations for mper, proven working
        for (let i = 0; i < scene.models.length; i++) {
            vertex_array.push([]); // push a blank array, populate with a model's transformed vertices
            edge_array.push([]); // blank array to be populated with edge data

            for (let j = 0; j < scene.models[i].vertices.length; j++) {
                var transform = Matrix.multiply([mper, scene.models[i].vertices[j]]);
                console.log(transform);
                vertex_array[i].push(transform);
            }

            for (let k = 0; k < scene.models[i].edges.length; k++) {
                edge_array[i].push(scene.models[i].edges[k]);
            }
        }
        console.log(vertex_array);
        console.log(edge_array);
        // Step 2: For every line, Clip using Cohen-Sutherland 3D clipping for Parallel or Perspective
        // once transformed, do clipping
        // loop over all edges in edge_array, clip lines
        for (let i = 0; i < scene.models.length; i++) {
            for (let j = 0; j < scene.models[i].edges.length; j++) {
                for (let k = 0; k < (scene.models[i].edges[j].length)-1; k++) {
                    var spot1 = scene.models[i].edges[j][k];
                    var spot2 = scene.models[i].edges[j][k+1];
                    var point1 = Matrix.multiply([view_window_matrix, vertex_array[i][spot1]]);
                    var point2 = Matrix.multiply([view_window_matrix, vertex_array[i][spot2]]);
                    console.log(spot1, spot2, point1, point2);
                    DrawLine(point1.x, point1.y, point2.x, point2.y);
                    //lineToDraw = clipLinePerspective(point1, point2, near, far);
                    // if any porton still exists in view volume, project then draw

                    /*if (clippedLine != null) {
                        // Step 2.1: Project onto view plane
                        console.log("ClippedLine != null");
                        var mper = new Matrix(4,4);
                        Mat4x4MPer(mper);
                        model_array.vertices[j] = Matrix.multiply([mper, model_array.vertices[i]]);

                        // Step 2.2: Draw 2d lines
                        DrawLine(point1.x, point1.y, point2.x, point2.y);
                    } */
                }
            }
        }
    }
    else { // scene.view.type == 'parallel'
    }

    
}

// Called when user selects a new scene JSON file
function LoadNewScene() {
    var scene_file = document.getElementById('scene_file');

    console.log(scene_file.files[0]);

    var reader = new FileReader();
    reader.onload = (event) => {
        scene = JSON.parse(event.target.result);
        scene.view.prp = Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]);
        scene.view.srp = Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]);
        scene.view.vup = Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]);

        for (let i = 0; i < scene.models.length; i++) {
            if (scene.models[i].type === 'generic') {
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    scene.models[i].vertices[j] = Vector4(scene.models[i].vertices[j][0],
                                                          scene.models[i].vertices[j][1],
                                                          scene.models[i].vertices[j][2],
                                                          1);
                }
            }
            else { // else if type is cube, cylinder, etc
                scene.models[i].center = Vector4(scene.models[i].center[0],
                                                 scene.models[i].center[1],
                                                 scene.models[i].center[2],
                                                 1);
            }
            scene.models[i].matrix = new Matrix(4, 4);
        }
    };
    reader.readAsText(scene_file.files[0], "UTF-8");
}

// Called when user presses a key on the keyboard down 
// translate prp and srp along u or n-axis
function OnKeyDown(event) {
    var n = scene.view.prp.subtract(scene.view.srp);
    n.normalize();
    var u = scene.view.vup.cross(n);
    u.normalize();
    var v = n.cross(u);
    var vrc = {n: n, u: u, v: v};
    // apply translate to prp and srp
    // determine x, y, z
    // u is some x, y, z because its a vector
    // query vector: how much in each direction
    switch (event.keyCode) {
        case 37: // LEFT Arrow
            console.log("left");
            var translateMatrix = new Matrix(4,4);
            var prp4 = Vector4(scene.view.prp.x, scene.view.prp.y, scene.view.prp.z, 1);
            console.log(prp4);
            Mat4x4Translate(translateMatrix, -u.x, -u.y, -u.z);
            var finalprp = Matrix.multiply([translateMatrix, prp4]);
            console.log(finalprp)
            scene.view.prp.x = finalprp.x;
            scene.view.prp.y = finalprp.y;
            scene.view.prp.z = finalprp.z;
            console.log(scene.view.prp);
            var srp4 = Vector4(scene.view.srp.x, scene.view.srp.y, scene.view.srp.z, 1);
            var finalsrp = Matrix.multiply([translateMatrix, srp4]);
            scene.view.srp.x = finalsrp.x;
            scene.view.srp.y = finalsrp.y;
            scene.view.srp.z = finalsrp.z;
            DrawScene();
            break;
        case 38: // UP Arrow, FORWARD
            console.log("up");
            var translateMatrix = new Matrix(4,4);
            var prp4 = Vector4(scene.view.prp.x, scene.view.prp.y, scene.view.prp.z, 1);
            Mat4x4Translate(translateMatrix, n.x, n.y, n.z);
            var finalprp = Matrix.multiply([translateMatrix, prp4]);
            scene.view.prp.x = finalprp.x;
            scene.view.prp.y = finalprp.y;
            scene.view.prp.z = finalprp.z;
            var srp4 = Vector4(scene.view.srp.x, scene.view.srp.y, scene.view.srp.z, 1);
            var finalsrp = Matrix.multiply([translateMatrix, srp4]);
            scene.view.srp.x = finalsrp.x;
            scene.view.srp.y = finalsrp.y;
            scene.view.srp.z = finalsrp.z;
            DrawScene();
            break; 
        case 39: // RIGHT Arrow
            console.log("right");
            var translateMatrix = new Matrix(4,4);
            var prp4 = Vector4(scene.view.prp.x, scene.view.prp.y, scene.view.prp.z, 1);
            Mat4x4Translate(translateMatrix, u.x, u.y, u.z);
            var finalprp = Matrix.multiply([translateMatrix, prp4]);
            scene.view.prp.x = finalprp.x;
            scene.view.prp.y = finalprp.y;
            scene.view.prp.z = finalprp.z;
            var srp4 = Vector4(scene.view.srp.x, scene.view.srp.y, scene.view.srp.z, 1);
            var finalsrp = Matrix.multiply([translateMatrix, srp4]);
            scene.view.srp.x = finalsrp.x;
            scene.view.srp.y = finalsrp.y;
            scene.view.srp.z = finalsrp.z;
            DrawScene();
            break;
        case 40: // DOWN Arrow BACK
            console.log("down");
            var translateMatrix = new Matrix(4,4);
            var prp4 = Vector4(scene.view.prp.x, scene.view.prp.y, scene.view.prp.z, 1);
            Mat4x4Translate(translateMatrix, -n.x, -n.y, -n.z);
            var finalprp = Matrix.multiply([translateMatrix, prp4]);
            scene.view.prp.x = finalprp.x;
            scene.view.prp.y = finalprp.y;
            scene.view.prp.z = finalprp.z;
            var srp4 = Vector4(scene.view.srp.x, scene.view.srp.y, scene.view.srp.z, 1);
            var finalsrp = Matrix.multiply([translateMatrix, srp4]);
            scene.view.srp.x = finalsrp.x;
            scene.view.srp.y = finalsrp.y;
            scene.view.srp.z = finalsrp.z;
            DrawScene();
            break;
    }
}

// Draw black 2D line with red endpoints 
function DrawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
}

function clipLineParallel(pt0, pt1) {
    // Probably not correct, not a concern at the moment
    var done = false;
	var line = null;
	var endpt0 = new Vector(pt0.x, pt0.y, pt0.z, pt0.w);
	var endpt1 = new Vector(pt1.x, pt1.y, pt1.z, pt0.w);
    var outcode0, outcode1, selected_outcode, t;
    var view_params = {xmin: 0, xmax: view.width - 1, ymin: 0, ymax: view.height - 1}
    
	while (!done) {
		outcode0 = outcode(endpt0, view);
		outcode1 = outcode(endpt1, view);
		console.log(outcode0, outcode1);
		if ((outcode0 | outcode1) === 0) { // trivial accept
			done = true;
			line = {pt0: endpt0, pt1: endpt1};
		}
		else if ((outcode0 & outcode1) !== 0) { // trivial reject
			done = true;
		}
		else {
			// choose endpoint that is outside view
			if (outcode0 !== 0) {
				selected_outcode = outcode0;
			}
			else {
				selected_outcode = outcode1;
			}
			console.log(selected_outcode);
			
			// calculate t (for intersection point with corresponding plane)
			if (selected_outcode & LEFT) {
				t = (-endpnt0.x - endpt0.z) / (deltax - deltaz);
			}
			else if (selected_outcode & RIGHT) {
				t = (endpt0.x - endpt0.z) / (-deltax - deltaz);
			}
			else if (selected_outcode & BOTTOM) {
				t = (-endpt0.y + endpt0.z) / (deltay - deltaz);
			}
			else if (selected_outcode & TOPP) {
				t = (endpt0.y + endpt0.z) / (-deltay - deltaz);
            }
            else if (selected_outcode & NEAR) {
                t = (endpt0.z - zmin) / -deltaz;
            }
            else { // if (selected_outcode & FAR)
                t = (-endpt.z - 1) / deltaz;
            }
			
			// replace selected endpoint with intersection point
			if (selected_outcode === outcode0) {
				endpt0.x = endpt0.x + t * (endpt1.x - endpt0.x);
                endpt0.y = endpt0.y + t * (endpt1.y - endpt0.y);
                endpt0.z = endpt0.z + t * (endpt1.z - endpt0.z);
			}
			else {
				endpt1.x = endpt1.x + t * (endpt1.x - endpt0.x);
                endpt1.y = endpt1.y + t * (endpt1.y - endpt0.y);
                endpt1.z = endpt1.z + t * (endpt1.z - endpt0.z)
			}
		}
	}
	return line;
}


function clipLinePerspective(pt0, pt1, near, far) { // create new copy of line that's the clipped version
	var done = false;
	var line = null;
	var endpt0 = new Vector (pt0.x, pt0.y, pt0.z, pt0.w);
	var endpt1 = new Vector (pt1.x, pt1.y, pt1.z, pt1.w);
    var outcode0, outcode1, selected_outcode, t;
    var deltax = endpt1.x - endpt0.x;
    var deltay = endpt1.y - endpt0.y;
    var deltaz = endpt1.z - endpt0.z;
    var zmin = -near/far; 
    
	while (!done) {
        outcode0 = outcodePerspective(endpt0, near, far);
        console.log(outcode0);
        outcode1 = outcodePerspective(endpt1, near, far);
        console.log(outcode1);
		if ((outcode0 | outcode1) === 0) { // trivial accept
			done = true;
			line = {pt0: endpt0, pt1: endpt1};
		}
		else if ((outcode0 & outcode1) !== 0) { // trivial reject
			done = true;
		}
		else {
			// choose endpoint that is outside view
			if (outcode0 !== 0) {
				selected_outcode = outcode0;
			}
			else {
				selected_outcode = outcode1;
			}
			
			// calculate t (for intersection point with corresponding plane)
			if (selected_outcode & LEFT) {
				t = (-endpt0.x - endpt0.z) / (deltax - deltaz);
			}
			else if (selected_outcode & RIGHT) {
				t = (endpt0.x - endpt0.z) / (-deltax - deltaz);
			}
			else if (selected_outcode & BOTTOM) {
				t = (-endpt0.y + endpt0.z) / (deltay - deltaz);
			}
			else if (selected_outcode & TOPP) {
				t = (endpt0.y + endpt0.z) / (-deltay - deltaz);
            }
            else if (selected_outcode & NEAR) {
                t = (endpt0.z - zmin) / -deltaz;
            }
            else { // if (selected_outcode & FAR)
                t = (-endpt.z - 1) / deltaz;
            }
			
			// replace selected endpoint with intersection point
			if (selected_outcode === outcode0) {
				endpt0.x = endpt0.x + t * (endpt1.x - endpt0.x);
                endpt0.y = endpt0.y + t * (endpt1.y - endpt0.y);
                endpt0.z = endpt0.z + t * (endpt1.z - endpt0.z);
			}
			else {
				endpt1.x = endpt1.x + t * (endpt1.x - endpt0.x);
                endpt1.y = endpt1.y + t * (endpt1.y - endpt0.y);
                endpt1.z = endpt1.z + t * (endpt1.z - endpt0.z)
			}
		}
	}
	return line;
}

function outcodeParallel(pt) {
	var outcode = 0;
	if (pt.x < -1) outcode += LEFT;
	else if (pt.x > 1) outcode += RIGHT;
	if (pt.y < -1) outcode += BOTTOM;
    else if (pt.y > 1) outcode += TOPP;
    if (pt.z < 0) outcode += NEAR;
    else if (pt.z > -1) outcode += FAR;
	return outcode; 
}

function outcodePerspective(pt, near, far) {
    var outcode = 0;
    var z_min = -near/far;
    if (pt.x < pt.z) outcode += LEFT;
	else if (pt.x > -pt.z) outcode += RIGHT;
	if (pt.y < pt.z) outcode += BOTTOM;
    else if (pt.y > -pt.z) outcode += TOPP;
    if (pt.z < z_min) outcode += NEAR;
    else if (pt.z > -1) outcode += FAR;
	return outcode; 
}
