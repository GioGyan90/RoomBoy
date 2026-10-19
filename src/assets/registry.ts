import type {Object3D,Group} from 'three';
import {createVertexAsset,type VertexAsset} from './vertexAsset';
export type RoomAssetId='shell'|'window'|'outside'|'decor'|'bed'|'desk'|'chair'|'wardrobe'|'shelves'|'props';
export type AssetFactory=()=>Group;
/** Add generated asset factories here. Existing procedural factories remain the fallback. */
export const roomOverrides:Partial<Record<RoomAssetId,AssetFactory>>={};
export function vertexFactory(data:VertexAsset):AssetFactory{return ()=>createVertexAsset(data);}
export function applyRoomOverrides(root:Object3D,registry:Map<string,Group>){
 for(const [id,factory] of Object.entries(roomOverrides)){
  if(id==='shell')throw new Error('Replace shell through createRoom to preserve the ceiling binding');
  const previous=registry.get(id);if(!previous)throw new Error(`Unknown room asset: ${id}`);
  const replacement=factory();replacement.name=id;
  root.remove(previous);root.add(replacement);registry.set(id,replacement);

 }
}
