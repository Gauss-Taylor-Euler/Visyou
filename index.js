let key = ""; //clé de l'api youtube data
let videos = []; //tableau de nos videos recupéré depuis les fichier json
let when = [0, 0, 0]; //Quand ? indice 0 c'est les années , le 1 le mois et le 2 le jour.
let explode = false; //Est-ce que les videos sont visibles directement
let state = 0; //etat on est aux niveaux des année(etat 0) , des mois (etat 1) ou des jours(etat 2)
let affichageNb = document.querySelector(".nb-vid"); //affichage du nombre de videos contenu
let affichage = document.querySelector("#affichage"); //affichage des videos ou folder
let backer = document.querySelector(".back"); //bouton de retour en arrière
let stop = false; //Permet d'empecher les  videos de se charger qu'on veut remonter
let input = document.querySelector("#fileReader"); //Pour choisir le fichier json
let contenu = document.querySelector("#afterRead"); //Pour traiter l'affichage du contenu après le choix du fichier
let btnRead = document.querySelector(".btn-lecture"); //btn pour lire
function remonter() {
  //Permet de remonter dans le dossier parent
  stop = true;
  explode = false;
  if (state > 0) {
    state--;
  }

  showPage();
}

function initialiser() {
  //initialise la page en prenant les donnees de l'historque et en affichant le root
  let reader = new FileReader();
  reader.readAsText(input.files[0]);
  reader.onload = () => {
    doc = JSON.parse(reader.result);
    videos = doc.map((elem) => {
      let date = new Date(elem.time);

      return {
        lien: elem.titleUrl,
        date: [date.getFullYear(), date.getMonth() + 1, date.getDate()],
      };
    });
    btnRead.style.display = "none";
    contenu.style.display = "block";
    showPage();
  };
}

function testVidByState(video) {
  //test si une video est dans l'ensemble des videos correspondant à when
  for (let i = 0; i < state; i++) {
    if (video.date[i] != when[i]) {
      return false;
    }
  }
  return true;
}
function format(n) {
  if (n < 10) {
    return "0" + n;
  }
  return "" + n;
}
function vidstate() {
  //renvoie les videos qui correspondent à when
  const current = [];
  for (x of videos) {
    if (testVidByState(x)) {
      current.push(x);
    }
  }
  return current;
}
function showPage() {
  //affiche la page
  //Récuperation des videos correspodantes à where ,vidage de l'affichafe et affichage du nombre de videos du dossier
  const current = vidstate();
  affichageNb.innerHTML = `Nombre de videos : ${current.length}`;
  explode = explode || state == 3; //on passe à une explosion dès que l'on rentre dans un jour
  affichage.innerHTML = "";
  //disjonction selon que explosion ou non
  if (explode) {
    //pour chaque videos
    stop = false;
    current.forEach(async (video) => {
      //on recupère l'id et on fait une demande pour récuper le snippet qui contiendra la thumail et le titre
      let id = video.lien.replace("https://www.youtube.com/watch?v=", "");
      let videoSnippet = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${key}`
      ).then((result) => result.json());
      //on récupère le titre et la thumbmail on se prémunit du cas où la video est inaccessible
      let imgSrc, titreVid;
      if (videoSnippet.items.length) {
        imgSrc = videoSnippet.items[0].snippet.thumbnails.high.url;
        titreVid = videoSnippet.items[0].snippet.title;
      } else {
        imgSrc = "img/qm.jpg";
        titreVid = "Video non disponible";
      }
      //On crée un élément qui va contenir la video on le remplit comme il se doit et on le rajoute à l'affichage
      let elem = document.createElement("div");
      elem.classList.add("video");
      elem.innerHTML = `<img src ="${imgSrc}"/> <span class="title">${titreVid}</span>`;
      //on ajoute un listener pour aller vers la videos si il y'a un click
      elem.addEventListener("click", () => (location.href = `${video.lien}`));
      if (!stop) {
        affichage.append(elem);
      }
    });
  } else {
    //On récupère les identifiant unique à se niveau e.g dans
    //le cas où on est à la racine les dates au niveau des année les mois etc
    let identifier = [
      ...new Set(
        current.map((elem) => {
          return elem.date[state];
        })
      ),
    ];
    //On crée un tableau d'élement HTML qui contiendra nos dossiers
    let elemTab = identifier.map((id) => {
      let elem = document.createElement("div");
      elem.classList.add("folder");
      elem.id = id;
      return elem;
    });
    //Pour chaque élement du tableau on le remplit correctement
    elemTab.forEach((elem) => {
      let texte = format(elem.id);
      for (let i = state - 1; i >= 0; i--) {
        texte += "/" + format(when[i]);
      }
      elem.innerHTML = `
    <i class="fa-regular fa-folder"></i><span class="title">${texte}</span>
  `;
      //On rajoute un listener pour lors d'un click avancée se deplace dans le dossier  et on ajoute l'élement
      elem.addEventListener("click", () => {
        when[state] = elem.id;
        state++;
        showPage();
      });
      affichage.append(elem);
    });
  }
  explode = false;
}

//initialisation et ajout du listener pour pouvoir remonter dans le dossier parent si nécessaire
btnRead.addEventListener("click", () => {
  input.click();
  initialiser();
});
backer.addEventListener("click", remonter);
