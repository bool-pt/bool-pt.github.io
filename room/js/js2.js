
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js';


var skybox_path = '/img/';
var skybox_name = 'paze';

var urls = [
            skybox_path + skybox_name + '_rt.jpg',
            skybox_path + skybox_name + '_lf.jpg',
            skybox_path + skybox_name + '_up.jpg',
            skybox_path + skybox_name + '_dn.jpg',
            skybox_path + skybox_name + '_ft.jpg',
            skybox_path + skybox_name + '_bk.jpg'
          ];

 var materialArray = [];
 for (var i = 0; i < 6; i++)
  materialArray.push( new THREE.MeshBasicMaterial({
   map: THREE.ImageUtils.loadTexture( urls[i] ),
   side: THREE.BackSide
  }));

 var skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 );
 var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
 var skybox = new THREE.Mesh( skyGeometry, skyMaterial );

var mesh = new THREE.Mesh(geometry, materials );

const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    window.camera = camera;
  camera.position.z = 3;

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();
  window.controls = controls;

  const scene = new THREE.Scene();
scene.add(skybox);
