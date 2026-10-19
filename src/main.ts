import './styles.css';
import {startGame} from './game/Game';
import {element} from './ui/dom';
try{startGame();}catch(error){console.error(error);element('loader').textContent='Unable to start WebGL. Please enable hardware acceleration and reload.';}
