
(function () {
    'use strict';

    require('angular');

    var MODULE_NAME = 'js-3d-viewer';

    var THREE = require('three');

    var WEBGL = require('./WebGL');
    require('three/examples/js/controls/OrbitControls');
    require('three/examples/js/loaders/STLLoader');

    var Stats = require('three/examples/js/libs/stats.min.js');
    var Dat = require('three/examples/js/libs/dat.gui.min.js');

    angular.module(MODULE_NAME, [])
        .directive('threeDimensionalViewer', ['threeDimensionalViewerService', function (threeDimensionalViewerService) {
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
                    background: "&",
                    modelColor: "&",
                    showControls: "&",
                    file: "@file"
                },
                link: function (scope, element, attributes) {

                    var container, guiContainer, isRenderingText, stats;
                    var camera, cameraTarget, scene, renderer, raycaster;
                    var mouse = new THREE.Vector2();

                    THREE.Cache.enabled = true;

                    var defaultWidth = 800;
                    var defaultHeight = 600;

                    var defaultPositionX = 75;
                    var defaultPositionY = 15;
                    var defaultPositionZ = 3;

                    var defaultTargetX = 0;
                    var defaultTargetY = 30;
                    var defaultTargetZ = 0;

                    var defaultBackground = '#C4C4C7';
                    var defaultModelColor = '#CD8658';
                    var defaultScale = 0.5;

                    init();
                    animate();

                    function init() {

                        // Check browser compatibility
                        if (WEBGL.isWebGLAvailable() === false) {
                            document.body.appendChild(WEBGL.getWebGLErrorMessage());
                        }

                        // Create Container

                        var div = document.getElementsByTagName("three-dimensional-viewer");

                        isRenderingText = document.createElement("div");
                        isRenderingText.appendChild(document.createTextNode("Rendering..."));

                        isRenderingText.style.position = 'absolute';
                        isRenderingText.style.paddingLeft = (scope.windowWidth() ? (scope.windowWidth() / 2) - (scope.windowWidth() / 7) : (defaultWidth / 2) - (defaultWidth / 7)) + 'px';
                        isRenderingText.style.paddingTop = (scope.windowHeight() ? (scope.windowHeight() / 2) - 40 : (defaultHeight / 2) - 40) + 'px';
                        isRenderingText.style.fontSize = (scope.windowWidth() ? (scope.windowWidth() / 16) : (defaultWidth / 16)) + 'px';
                        isRenderingText.style.fontFamily = 'Helvetica';
                        div[0].appendChild(isRenderingText);

                        
                        container = document.createElement('div');
                        container.setAttribute("id", "viewer");
                        container.style.width = (scope.windowWidth() ? scope.windowWidth() : defaultWidth);
                        container.style.height = (scope.windowHeight() ? scope.windowHeight() : defaultHeight);
                        div[0].appendChild(container);  
                        
                        // Camera Settings
                        camera = new THREE.PerspectiveCamera(50, (scope.windowWidth() ? scope.windowWidth() : defaultWidth) / (scope.windowHeight() ? scope.windowHeight() : defaultHeight), 1, 300);
                        camera.position.set((scope.positionX() ? scope.positionX() : defaultPositionX), (scope.positionY() ? scope.positionY() : defaultPositionY), (scope.positionZ() ? scope.positionZ() : defaultPositionZ));

                        // Scene
                        scene = new THREE.Scene();
                        scene.background = new THREE.Color((scope.background() ? scope.background() : defaultBackground));


                        // Load Manager
                        var manager = new THREE.LoadingManager();

                        manager.onLoad = function () {
                            div[0].removeChild(isRenderingText);
                        };

                        // Loaders
                        var stlLoader = new THREE.STLLoader(manager);
                        var objToView = scope.file;

                        // Load files
                        if (objToView) {
                            stlLoader.load(objToView, function (geometry) {
                                geometry.center();
                                geometry.computeFaceNormals();
                                var material = new THREE.MeshPhongMaterial({ color: defaultModelColor, specular: 0x111111, shininess: 0 });

                                if (geometry.hasColors) {
                                    material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: THREE.VertexColors, shininess: 0 });
                                }
                                else if (scope.modelColor()) {
                                    material = new THREE.MeshPhongMaterial({ color: scope.modelColor(), specular: 0x111111, shininess: 0 });
                                }

                                material.side = THREE.DoubleSide;
                                var mesh = new THREE.Mesh(geometry, material);
                                mesh.name = "stlObject";
                                mesh.scale.set((scope.scale() ? scope.scale() : defaultScale), (scope.scale() ? scope.scale() : defaultScale), (scope.scale() ? scope.scale() : defaultScale));

                                resizeObject(camera, mesh);
                                scene.add(mesh);

                                threeDimensionalViewerService.registerDispose(function () {
                                    var object = scene.getObjectByName("stlObject");
                                    scene.remove(object);
                                    disposeObject(object);
                                });
                            });
                        }



                        var lightFactor = 0.7;
                        var shadowLightFactor = 0.3;
                        var lightDistance = 30;
                        // Lights
                        scene.add(new THREE.HemisphereLight(0x443333, 0x111122));
                        // z
                        addLight(-lightDistance, -1, -1, 0xffffff, lightFactor);
                        addLight(lightDistance, 1, - 1, 0xffffff, lightFactor);
                        //top
                        addLight(1, lightDistance, 1, 0xffffff, shadowLightFactor);
                       
                        //bottom   
                        addLight(1, -lightDistance, 1, 0xffffff, shadowLightFactor);

                        addLight(1, 1, - lightDistance, 0xffffff, lightFactor);
                        addLight(1, 1, lightDistance, 0xffffff, shadowLightFactor);

                        // raycaster
                        raycaster = new THREE.Raycaster();

                        // renderer
                        renderer = new THREE.WebGLRenderer({ antialias: true });
                        renderer.setPixelRatio(window.devicePixelRatio);
                        renderer.setSize(scope.windowWidth() ? scope.windowWidth() : defaultWidth, scope.windowHeight() ? scope.windowHeight() : defaultHeight);
                        renderer.gammaInput = true;
                        renderer.gammaOutput = true;
                      

                        // Stats
                        //stats = new Stats();
                        //container.appendChild(stats.dom);

                        // Orbit Controls
                        var controls = new THREE.OrbitControls(camera, renderer.domElement);
                        controls.minDistance = 0;
                        controls.maxDistance = 200;

                        //GUI Controls
                        if(scope.showControls()){
                            var effectController = {
                                Zoom: controls.target.distanceTo(controls.object.position),
                            };
    
                            var matChanger = function () {
                                var zoomDistance = effectController.Zoom;
                                var currentDistance = camera.position.length();
                                var factor = zoomDistance / currentDistance;
    
                                camera.position.x *= factor;
                                camera.position.y *= factor;
                                camera.position.z *= factor;
                            };
    
                            guiContainer = document.createElement('div');
                            guiContainer.setAttribute("id", "gui-container");
                            container.appendChild(guiContainer);
    
                            var GUI = new Dat.GUI({ autoPlace: false });
                            GUI.domElement.id = 'gui-controls';
                            guiContainer.style.position = 'absolute';
                            guiContainer.appendChild(GUI.domElement);
    
                            GUI.add(effectController, 'Zoom', 1, 135, 0.01).onChange(matChanger);
                            matChanger();    
                        }
                    
                        container.appendChild(renderer.domElement);

                        //Helpers

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

                        //Light Helper
                        
                        //scene.add(new THREE.PointLightHelper(directionalLight, 1) );
                    }

                    function onWindowResize() {
                        var element = document.getElementById('viewer');
                        if (element) {
                            camera.aspect = element.lastChild.clientWidth / element.lastChild.clientHeight;
                            camera.updateProjectionMatrix();
                        }
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

                    function disposeObject(node) {
                        if (node instanceof THREE.Mesh) {
                            if (node.geometry) {
                                node.geometry.dispose();
                            }

                            if (node.material) {
                                if (node.material.map) node.material.map.dispose();
                                if (node.material.lightMap) node.material.lightMap.dispose();
                                if (node.material.bumpMap) node.material.bumpMap.dispose();
                                if (node.material.normalMap) node.material.normalMap.dispose();
                                if (node.material.specularMap) node.material.specularMap.dispose();
                                if (node.material.envMap) node.material.envMap.dispose();

                                node.material.dispose();
                            }

                            if (node.textures) {
                                node.textures.dispose();
                            }
                        }
                    }
                }
            };
        }])
        .service('threeDimensionalViewerService', function () {
            function disposeViewer() { }

            function registerDispose(disposeFunc) {
                this.disposeViewer = disposeFunc;
            }

            return {
                disposeViewer: disposeViewer,
                registerDispose: registerDispose
            }
        });

    module.exports = MODULE_NAME;

})();