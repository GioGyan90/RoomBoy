import './styles.css';
import {startGame} from './game/Game';
import {startPelvisStudio} from './ui/pelvisStudio';
import {startStructureStudio} from './ui/structureStudio';
try{if(new URLSearchParams(location.search).get('view')==='pelvis')startPelvisStudio();else if(new URLSearchParams(location.search).get('view')==='structure')startStructureStudio();else startGame();}catch(error){console.error(error);const loader=document.getElementById('loader');if(loader)loader.textContent='Unable to start WebGL. Please enable hardware acceleration and reload.';}
