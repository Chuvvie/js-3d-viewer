(function () {
    'use strict';

    require('angular');

    var MODULE_NAME = 'js-3d-viewer';

    var THREE = require('three');

    var WEBGL = require('./WebGL');
    require('three/examples/js/controls/OrbitControls');
    require('three/examples/js/loaders/STLLoader');

    var Stats = require('three/examples/js/libs/stats.min.js');

    angular.module(MODULE_NAME, [])
        .directive('threeDimensionalViewer', function () {
            return {
                scope: {
                    windowWidth: "&",
                    windowHeight: "&",
                    scale: "&",
                    positionX: "&",
                    positionY: "&",
                    positionZ: "&",
                    targetX: "&",
                    targetY: "&",
                    targetZ: "&",
                    file: "@file"
                },
                link: function (scope, element, attributes) {

                    var container, stats;
                    var camera, cameraTarget, scene, renderer, raycaster;
                    var mouse = new THREE.Vector2();

                    var defaultWidth = 800;
                    var defaultHeight = 600;

                    var defaultPositionX = 75;
                    var defaultPositionY = 15;
                    var defaultPositionZ = 3;

                    var defaultTargetX = 0;
                    var defaultTargetY = 30;
                    var defaultTargetZ = 0;

                    var defaultScale = 0.5;
                    init();
                    animate();

                    function init() {

                        // Check browser compatibility
                        if (WEBGL.isWebGLAvailable() === false) {
                            document.body.appendChild(WEBGL.getWebGLErrorMessage());
                        }

                        // Create Container
                        container = document.createElement('div');
                        document.body.appendChild(container);

                        // Camera Settings
                        camera = new THREE.PerspectiveCamera(50, (scope.windowWidth() ? scope.windowWidth() : defaultWidth) / (scope.windowHeight() ? scope.windowHeight() : defaultHeight), 1, 300);
                        camera.position.set((scope.positionX() ? scope.positionX() : defaultPositionX), (scope.positionY() ? scope.positionY() : defaultPositionY), (scope.positionZ() ? scope.positionZ() : defaultPositionZ));

                        // Scene
                        scene = new THREE.Scene();
                        scene.background = new THREE.Color(0xC4C4C7);

                        // Loaders
                        var stlLoader = new THREE.STLLoader();

                        var objToView = scope.file;

                        // Binary files

                        if (objToView) {
                            stlLoader.load(objToView, function (geometry) {
                                geometry.center()
                                var material = new THREE.MeshPhongMaterial({ color: 0xcd8658, specular: 0x111111, shininess: 100 });
                                material.side = THREE.DoubleSide;
                                var mesh = new THREE.Mesh(geometry, material);
                                mesh.scale.set((scope.scale() ? scope.scale() : defaultScale), (scope.scale() ? scope.scale() : defaultScale), (scope.scale() ? scope.scale() : defaultScale));

                                resizeObject(camera, mesh);
                                scene.add(mesh);
                            });
                        }

                        // Lights
                        scene.add(new THREE.HemisphereLight(0x443333, 0x111122));
                        addLight(-10, -1, -1, 0xffffff, 1);
                        addLight(1, 1, 1, 0xffffff, 1);
                        addLight(0.5, 1, - 1, 0xffffff, 1);

                        // raycaster
                        raycaster = new THREE.Raycaster();

                        // renderer
                        renderer = new THREE.WebGLRenderer({ antialias: true });
                        renderer.setPixelRatio(window.devicePixelRatio);
                        renderer.setSize(scope.windowWidth() ? scope.windowWidth() : defaultWidth, scope.windowHeight() ? scope.windowHeight() : defaultHeight);
                        renderer.gammaInput = true;
                        renderer.gammaOutput = true;
                        container.appendChild(renderer.domElement);

                        // Stats
                        //stats = new Stats();
                        //container.appendChild(stats.dom);

                        // Orbit Controls
                        var controls = new THREE.OrbitControls(camera, renderer.domElement);
                        controls.minDistance = 0;
                        controls.maxDistance = 200;

                        // Axes Helper
                        //var axesHelper = new THREE.AxesHelper(5);
                        //scene.add(axesHelper);

                        // Listeners
                        window.addEventListener('resize', onWindowResize, false);
                        document.addEventListener('click', onClick, false);
                    }

                    function addLight(x, y, z, color, intensity) {
                        var directionalLight = new THREE.DirectionalLight(color, intensity);
                        directionalLight.position.set(x, y, z);
                        scene.add(directionalLight);
                    }

                    function onWindowResize() {
                        camera.aspect = window.innerWidth / window.innerHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(window.innerWidth, window.innerHeight);
                    }

                    function animate() {
                        requestAnimationFrame(animate);
                        render();
                        //stats.update();
                    }

                    function render() {
                        renderer.render(scene, camera);
                    }

                    function onClick(event) {
                        event.preventDefault();
                        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
                        raycaster.setFromCamera(mouse, camera);
                    }


                    function resizeObject(camera, obj) {
                        var boundingBox = new THREE.Box3().setFromObject(obj);
						var center = new THREE.Vector3();
						var size = new THREE.Vector3();
                        boundingBox.getCenter(center);
                        boundingBox.getSize(size);

                        var maxDim = Math.max(size.x, size.y, size.z);
                        var fov = camera.fov * (Math.PI / 180);
                        var cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2)); 

                        scene.updateMatrixWorld(); 
                        var objectWorldPosition = new THREE.Vector3();
                        objectWorldPosition.setFromMatrixPosition(obj.matrixWorld);

                        var directionVector = camera.position.sub(objectWorldPosition);
                        var unitDirectionVector = directionVector.normalize(); 
						var result = unitDirectionVector.multiplyScalar(cameraZ); 
						camera.position.set(result.x, result.y, result.z);
                        camera.lookAt(objectWorldPosition); 						
                        camera.updateProjectionMatrix();
                        camera.lookAt(center);
                    }
                }
            };
        });

    module.exports = MODULE_NAME;

})();