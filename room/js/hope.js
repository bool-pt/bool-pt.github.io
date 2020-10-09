let scene, camera, renderer, skyboxGeo, skybox, controls, myReq, videoRef,tween;
let zoomOut = false;
let autoRotate = false;
let skyboxImage = 'purplenebula';

function createPathStrings(filename) {
    //const basePath = `https://raw.githubusercontent.com/codypearce/some-skyboxes/master/skyboxes/${filename}/`;
    const basePath = `/img/${filename}/`;
    const baseFilename = basePath + filename;
    //const fileType = filename == 'purplenebula' ? '.png' : '.jpg';
    const fileType = '.png';
    const sides = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'];
    const pathStings = sides.map(side => {
    //return baseFilename + '_' + side + fileType;
    return 'img/arena' + '_' + side + fileType;
  });

  return pathStings;
}

function createMaterialArray(filename) {
  const skyboxImagepaths = createPathStrings(filename);
  const materialArray = skyboxImagepaths.map(image => {
    let texture = new THREE.TextureLoader().load(image);

    return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
  });
  return materialArray;
}


  const boxWidth = 2000;
  const boxHeight = 1500;
  const boxDepth = 500;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  function makeInstance(geometry, color, texture, x) {
    //const material = new THREE.MeshBasicMaterial({color});
    const material = new THREE.MeshBasicMaterial( { map: texture } );

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;
    cube.position.z = -2000;

    return cube;
  }




function move( ) {
    var from = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };

    var to = {
        x: 1200,
        y: -250,
        z: 2000
    };
	
    tween = new TWEEN.Tween(from)   
		.to( to, 2000 )
        .easing( TWEEN.Easing.Quadratic.InOut /*TWEEN.Easing.Linear.None*/ ) // TWEEN.Easing.Quadratic.InOut ...
        .onUpdate( function ( ) {		
			camera.position.set( from.x, from.y, from.z );
			camera.lookAt(new THREE.Vector3( 0, 0, 0 ) );
    		} )	
       .start( );
}

function stop( ) {

	tween.stop();
	
}


function init() {

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        45,
        30000,
    );
    camera.position.set(1200, -250, 2000);
    
    videoRef =  document.getElementsByTagName("video")[1]; //document.getElementById( 'video' );
    var texture = new THREE.VideoTexture( videoRef );


    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = 'canvas';
    document.body.appendChild(renderer.domElement);

    const materialArray = createMaterialArray(skyboxImage);

    skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);
    skybox = new THREE.Mesh(skyboxGeo, materialArray);

    scene.add(skybox);

    
    const cubes = [
        makeInstance(geometry, 0x44aa88, texture,  0)
    ];
    

    var gridHelper = new THREE.GridHelper( 500, 1000 );
    //scene.add( gridHelper );
    var axesHelper = new THREE.AxesHelper( 5000 );
    //scene.add( axesHelper );

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enabled = true;
  controls.minDistance = 0;
  controls.maxDistance = 1500;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2;

  window.addEventListener('resize', onWindowResize, false);
    
    /*if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {

        var constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };

        navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {

            // apply the stream to the video element used in the texture

            videoRef.srcObject = stream;
            videoRef.play();

        } ).catch( function ( error ) {

            console.error( 'Unable to access the camera/webcam.', error );

        } );

    } else {

        console.error( 'MediaDevices interface not available.' );

    }*/    

  animate();
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    controls.autoRotate = autoRotate;
  
    if(controls.maxDistance == 1500 && zoomOut) {
    
      controls.maxDistance = 20000;
      camera.position.z = 20000;
    } else if(controls.maxDistance == 20000 && !zoomOut) {
          console.log('called')
      controls.maxDistance = 19500;
      camera.position.z = 2000;
    }
    
    
    
    //camera.rotation.y += 0.001;
    
    //camera.position.z += 10;
    
    //t {x: -1143.981842312225, y: -53.32718488092898, z: 968.7423578086185, isVector3: true}
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
    myReq = window.requestAnimationFrame(animate);
   
}



function switchSkyBox (skyboxName) {
  scene.remove(skybox);
  skyboxImage = skyboxName;
  const materialArray = createMaterialArray(skyboxImage);

  skybox = new THREE.Mesh(skyboxGeo, materialArray);
  scene.add(skybox);
}

function toggleAutoRotate(value) {
  autoRotate = value;
}

function toggleZoom(value) {
  zoomOut = value;
  zoomBtn.textContent = value ? 'Inside Box' : "Outside Box";
  loading.style.display = value ? 'none' : 'show';
}

const spaceBtn = document.getElementById('space');
const mountainsBtn = document.getElementById('mountains');
const waterBtn = document.getElementById('water');
const lavaButton = document.getElementById('lava');
const autoRotateBtn = document.getElementById('autoRotate');
const zoomBtn = document.getElementById('zoom');
const loading = document.getElementById('loading');


spaceBtn.addEventListener('click', () => switchSkyBox('purplenebula'))
mountainsBtn.addEventListener('click', () => switchSkyBox('afterrain'))
waterBtn.addEventListener('click', () => switchSkyBox('aqua9'))
lavaButton.addEventListener('click', () => switchSkyBox('flame'))
autoRotateBtn.addEventListener('click', () => toggleAutoRotate(!autoRotate))
zoomBtn.addEventListener('click', () => toggleZoom(!zoomOut))




