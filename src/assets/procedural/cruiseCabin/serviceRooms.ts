import * as T from 'three';
import {buildBathFinishes} from './bathroom/finishes';
import {buildBathTub} from './bathroom/bathtub';
import {buildBathShower} from './bathroom/shower';
import {buildBathVanity} from './bathroom/vanity';
import {buildBathToilet} from './bathroom/toilet';

/**
 * Black-and-gold cruise bathroom: each production group owns its geometry,
 * UVs and fixture connections. Names are preserved for navigation and QA.
 */
export function serviceRooms(root:T.Group){
 const g=new T.Group();g.name='cruise-marble-bathroom';root.add(g);
 const finish=new T.Group();finish.name='bathroom-finish-materials';g.add(finish);
 const tubZone=new T.Group();tubZone.name='bathroom-soaking-tub';g.add(tubZone);
 const showerZone=new T.Group();showerZone.name='bathroom-wall-plumbing';g.add(showerZone);
 const vanityZone=new T.Group();vanityZone.name='bathroom-vanity';g.add(vanityZone);
 const toiletZone=new T.Group();toiletZone.name='bathroom-toilet';g.add(toiletZone);
 buildBathFinishes(finish);
 buildBathTub(tubZone);
 buildBathShower(showerZone);
 buildBathVanity(vanityZone);
 buildBathToilet(toiletZone);
 return g;
}
