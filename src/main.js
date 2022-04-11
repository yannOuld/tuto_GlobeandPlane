import { DirectionalLightHelper, CameraHelper, MeshBasicMaterial, Vector2, DoubleSide, RingGeometry, PlaneGeometry, Clock, Vector3, Group, FloatType, PMREMGenerator, TextureLoader, Scene, PerspectiveCamera, WebGLRenderer, ACESFilmicToneMapping, sRGBEncoding, Color, SphereGeometry, MeshPhysicalMaterial, Mesh, DirectionalLight, PCFSoftShadowMap } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import anime from 'animejs';


let dayBackground = document.querySelector('.day-bg');
let nightBackground = document.querySelector('.night-bg')

// Scene et camera
const scene = new Scene();
const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 15, 50);

//Scene et camera qui gère les halos lumineux  sans controle orbitale
const ringsScene = new Scene()
const ringsCamera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
ringsCamera.position.set(0, 0, 50);

const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

//controle orbitale
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

// implementation lumiere directionnel pour le jour couleur blanche et intensité de 3.5
const dayLight = new DirectionalLight(new Color("#FFFFFF"), 3.5);
// position de la lumiere dans la scene 10 unités a droite
dayLight.position.set(10, 20, 10);
// projection d'ombre 
dayLight.castShadow = true;
dayLight.shadow.mapSize.width = 512;
dayLight.shadow.mapSize.height = 512;
dayLight.shadow.camera.near = 0.5;
dayLight.shadow.camera.far = 100;
dayLight.shadow.camera.left = -10;
dayLight.shadow.camera.right = 10;
dayLight.shadow.camera.top = 10;
dayLight.shadow.camera.bottom = -10;
scene.add(dayLight);

const helper = new DirectionalLightHelper(dayLight);
scene.add(helper);

// implementation lumiere directionnel pour la nuit couleur bleu et intensité de 0
const nightLight = new DirectionalLight(new Color("#77ccff").convertSRGBToLinear(), 0);
// position de la lumiere dans la scene 10 unités a gauche
nightLight.position.set(-10, 20, 10);
// projection d'ombre 
nightLight.castShadow = true;
nightLight.shadow.mapSize.width = 512;
nightLight.shadow.mapSize.height = 512;
nightLight.shadow.camera.near = 0.5;
nightLight.shadow.camera.far = 100;
nightLight.shadow.camera.left = -10;
nightLight.shadow.camera.right = 10;
nightLight.shadow.camera.top = 10;
nightLight.shadow.camera.bottom = -10;
scene.add(nightLight);

//crée un vecteur à partir du point x = 0 ,y = 0
let mousePos = new Vector2(0, 0);

//eventlistener qui récupere les coordonnées du mouvement de souris les places dans des var utilisés pour le mouvement du vecteur
window.addEventListener("mousemove", (e) => {
  let x = e.clientX - innerWidth * 0.5;
  let y = e.clientY - innerHeight * 0.5;
  // reduire l'amplitude du mouvement du vecteur 
  mousePos.x = x * 0.0003;
  mousePos.y = y * 0.0003;
});


(async function () {
  // Loader de la carte environemmental
  let pmrem = new PMREMGenerator(renderer);
  let envMapTexture = await new RGBELoader().setDataType(FloatType).loadAsync("../assets/envMap.hdr");
  let envMap = pmrem.fromEquirectangular(envMapTexture).texture;

  // Stucture des halos 
  const ring1 = new Mesh(
    new RingGeometry(15, 13.5, 80, 1, 0),
    new MeshPhysicalMaterial({
      color: new Color("#FFCB8E").convertSRGBToLinear().multiplyScalar(200),
      roughness: 0.25,
      envMap: envMap,
      envMapIntensity: 1.8,
      side: DoubleSide,
      transparent: true,
      opacity: 0.35,
    })
  );
  ring1.dayOpacity = 0.35;
  ring1.nightOpacity = 0.03;
  ringsScene.add(ring1);

  const ring2 = new Mesh(
    new RingGeometry(16.5, 15.75, 80, 1, 0),
    new MeshBasicMaterial({
      color: new Color("#ff8243").convertSRGBToLinear(),
      transparent: true,
      opacity: 0.3,
      side: DoubleSide,
    })
  );
  ring2.dayOpacity = 0.3;
  ring2.nightOpacity = 0.1;
  ringsScene.add(ring2);

  const ring3 = new Mesh(
    new RingGeometry(18, 17.75, 80),
    new MeshBasicMaterial({
      color: new Color("#FFCB8E").convertSRGBToLinear().multiplyScalar(50),
      transparent: true,
      side: DoubleSide,
      opacity: 0.5,
    })
  );
  ring3.dayOpacity = 0.5;
  ring3.nightOpacity = 0.05;
  ringsScene.add(ring3);

  // textures 
  let textures = {
    bump: await new TextureLoader().loadAsync("../assets/earthbump.jpg"),
    map: await new TextureLoader().loadAsync("../assets/earthmap.jpg"),
    spec: await new TextureLoader().loadAsync("../assets/earthspec.jpg"),
    planeTrailMask: await new TextureLoader().loadAsync("../assets/mask.png"),

  }

  // Loader du model  
  let plane = (await new GLTFLoader().loadAsync("../assets/plane/scene.glb")).scene.children[0];
  // array contenant les appels de la fonction qui crée le model 
  let planesData = [
    makeplane(plane, textures.planeTrailMask, envMap, scene),
    makeplane(plane, textures.planeTrailMask, envMap, scene),
    makeplane(plane, textures.planeTrailMask, envMap, scene),
    makeplane(plane, textures.planeTrailMask, envMap, scene),
    makeplane(plane, textures.planeTrailMask, envMap, scene),
    makeplane(plane, textures.planeTrailMask, envMap, scene),
    makeplane(plane, textures.planeTrailMask, envMap, scene),

  ]

  //Structure de la terre
  let sphere = new Mesh(
    new SphereGeometry(10, 70, 70),
    new MeshPhysicalMaterial({
      // carte environemental 
      envMap: envMap,
      envMapIntensity: 0.2,
      //carte couleurs de base
      map: textures.map,
      // carte d'intensité des couleurs
      roughnessMap: textures.spec,
      // carte des reliefs de la structure
      bumpMap: textures.bump,
      // intensité des reliefs 
      bumpScale: 0.05,
      // brillance des textures
      sheen: 1,
      // intensité de la brillance 
      sheenRoughness: 0.75,
      //couleur de la brillance
      sheenColor: new Color("#ff8a00").convertSRGBToLinear(),
      //transparance de surface 
      clearcoat: 0.5,
    }),
  );
  //intensité pour l'envMap durant l'animation des background 
  sphere.dayEnvIntensity = 0.4;
  sphere.nightEnvIntensity = 0.05;
  //vitesse de rotation de la sphere sur axe y 
  sphere.rotation.y += Math.PI * 1.25;
  sphere.receiveShadow = true;
  scene.add(sphere);

  // mise en place du temps
  let clock = new Clock();

  // variable qui set le model sur jour
  let cycleBoolean = true;

  //variable qui nous dis si le model est en cours d'animation 
  let animating = false;

  //eventListener de la souris pour le changement jour nuit
  window.addEventListener("mousemove", (e) => {

    // en empehe relancer l'animation  si elle est deja en cours en retournant directement la fonction   
    if (animating) return;

    // condition anim est un array qui va de 1 à 0 si le booléén est faux (passement au jour) et de 0 à 1 si le booléen est vrai (passement a la nuit )
    let anim;
    // si la souris client sur l'axe X est a une coordonnée supérieur -200 unité on effectue le changment nuit
    if (e.clientX > (innerWidth - 200) && !cycleBoolean) {
      anim = [1, 0];
    }
    // si la souris client a une coordonnée inferieru a 200 unité on effectue le changement jour 
    else if (e.clientX < 200 && cycleBoolean) {
      anim = [0, 1];
    } else {
      return;
    }
    // changement du booléen au lancement de l'animation 
    animating = true;

    //crée un objet avec une proprieté qui va servir a gerer les changements avec le temps  
    let obj = { t: 0 };

    anime({
      //cible de l'animation
      targets: obj,
      //proprieté de la cible qui a pour valeur les conditions de anim
      t: anim,
      //regles a la fin de l'animation
      complete: () => {
        // pas d'animation  
        animating = false;
        // le booléen passe de vrai a faux 
        cycleBoolean = !cycleBoolean;
      },
      //regles durant l'animation , obj.t sera de 0.5 
      update: () => {
        // regles pour l'intensité des lumières
        dayLight.intensity = 3.5 * (1 - obj.t);
        nightLight.intensity = 3.5 * obj.t;

        //regles pour la position des lumieres
        dayLight.position.setY(20 * (1 - obj.t));
        nightLight.position.setY(20 * obj.t);

        //brillance de la sphere
        sphere.material.sheen = (1 - obj.t);

        //remplacer les valeurs de l'envmap par les valeurs d'animation day et night en itérant sur les elements enfants de la scene 
        scene.children.forEach((child) => {
          // pour chaque enfant en regarde toute les elements possible qui le compose
          child.traverse((object) => {
            //si l'enfant est une structure 3D et possede une envMap
            if (object instanceof Mesh && object.material.envMap) {
              // on remplace l'intensité de l'envMap par les proprietés jour et nuit , par interpolation linéaire
              // debut animation / t = 0 : ( dayI * (1 - 0)) + (nightI * 0 )  = dayI
              // milieu animation / t = 0.5 : (dayI * (1 - 0.5)) + (nightI * 0.5) = 0.5 dayI + 0.5 nightI
              // fin animation  / t = 1 : (dayI * (1 - 1)) + (nightI * 1) = 0 dayI + 1 nightI
              object.material.envMapIntensity = object.dayEnvIntensity * (1 - obj.t) + object.nightEnvIntensity * obj.t;
            }
          })
        })

        //regles de l'opacité des background 
        dayBackground.style.opacity = 1 - obj.t;
        nightBackground.style.opacity = obj.t;
      },
      //regulation l'animation dans le temps (lente au  debut, lente en fin)
      easing: 'easeInOutSine',
      //durée de l'animation
      duration: 500,
    });
  });
  // animation loop
  renderer.setAnimationLoop(() => {
    // calcule du temps entre les frames
    let delta = clock.getDelta();

    //iteration sur chaque model 3D de l'array
    planesData.forEach(planeData => {
      let plane = planeData.group;

      //positionnement remis en neutre 
      plane.position.set(0, 0, 0);
      plane.rotation.set(0, 0, 0);
      plane.updateMatrixWorld();

      //positionnemnet durant les deplacements du model sur les axe 
      planeData.rot += delta * 0.25;
      plane.rotateOnAxis(planeData.randomAxis, planeData.randomAxisRot);
      plane.rotateOnAxis(new Vector3(0, 1, 0), planeData.rot);
      plane.rotateOnAxis(new Vector3(0, 0, 1), planeData.rad);
      plane.translateY(planeData.yOff);
      plane.rotateOnAxis(new Vector3(1, 0, 0), + Math.PI * 0.5);
    });

    controls.update();
    renderer.render(scene, camera);

    //rotations des halos celon les coordonnés x y de la souris 
    //100% de la rotation = 95% de la rotation globale + 5% du vecteur de la  souris  le dernier chiffre servant a choisir la vitesse d'animation 
    ring1.rotation.x = ring1.rotation.x * 0.95 + mousePos.y * 0.05 * 1.2;
    ring1.rotation.y = ring1.rotation.y * 0.95 + mousePos.x * 0.05 * 1.2;

    //differentes vitesse de rotation celon l'halos l'animation 
    ring2.rotation.x = ring2.rotation.x * 0.95 + mousePos.y * 0.05 * 0.375;
    ring2.rotation.y = ring2.rotation.y * 0.95 + mousePos.x * 0.05 * 0.375;

    //direction contraire pour le dernier halo 
    ring3.rotation.x = ring3.rotation.x * 0.95 - mousePos.y * 0.05 * 0.275;
    ring3.rotation.y = ring3.rotation.y * 0.95 - mousePos.x * 0.05 * 0.275;

    // eviter que le rendu ne soit rafraichit au dessus ne soit rafraichit par le nouveau rendu des halos  
    renderer.autoClear = false;
    renderer.render(ringsScene, ringsCamera);
    renderer.autoClear = true;
  });
})();


//fonction de creation des avions 

function makeplane(planeMesh, trailTexture, envMap, scene) {
  // clone de la structure 3D
  let plane = planeMesh.clone();
  // taille de la structure 
  plane.scale.set(0.001, 0.001, 0.001);
  // positionnement et angle  de la structure remis à neutre 
  plane.position.set(0, 0, 0);
  plane.rotation.set(0, 0, 0);
  plane.updateMatrixWorld();

  // on regarde tout les elements qui compose le model plane 
  plane.traverse((object) => {
    //si l'element et une structure 3D
    if (object instanceof Mesh) {
      //on met en place les regles suivante de reception de la lumiere du model (l'envmap aide a la visibilité du model , recevoir et produire une ombre )
      object.material.envMap = envMap;
      object.castShadow = true;
      object.receiveShadow = true;
      //durant l'animation background
      object.dayEnvIntensity = 1;
      object.nightEnvIntensity = 0.3;
    }
  });

  let trail = new Mesh(
    new PlaneGeometry(1, 2),
    new MeshPhysicalMaterial({

      envMap: envMap,
      envMapIntensity: 3,

      roughness: 0.4,
      metalness: 0,
      transmission: 1,

      transparent: true,
      opacity: 1,
      // determine le niveau d'opacité sur la structure grace au contraste de l'image 
      alphaMap: trailTexture,
    })
  );
  // intensité de l'envMap durant animation background
  trail.dayEnvIntensity = 3;
  trail.nightEnvIntensity = 0.7;
  //positionnement de la trainé de fumée sur le model plane
  trail.rotateX(Math.PI);
  trail.translateY(1.1);

  // ajout du model a un groupe d'object 3D 
  let group = new Group();
  group.add(plane);
  group.add(trail),
    scene.add(group);

  return {
    group,
    rot: Math.random() * Math.PI * 2.0,
    rad: Math.random() * Math.PI * 0.45 + 0.2,
    yOff: 10.5 + Math.random() * 1.0,
    randomAxis: new Vector3(nr(), nr(), nr()).normalize(),
    randomAxisRot: Math.random() * Math.PI * 2,

  };

}

// fonction qui trouve un axe aléatoire d'apparition pour le mouvement des models 

function nr() {
  return Math.random() * 2 - 1;
}