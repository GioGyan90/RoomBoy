import * as THREE from 'three';
export interface VertexMesh {
 name:string; positions:number[]; normals?:number[]; uvs?:number[]; indices?:number[];
 matrix?:number[];
 material:{color:[number,number,number];roughness:number;metalness:number;opacity:number;doubleSided:boolean};
}
export interface VertexAsset {version:1; meshes:VertexMesh[]}
/** Data-only assets. Transform is baked on the mesh, never into gameplay coordinates. */
export function createVertexAsset(asset:VertexAsset):THREE.Group {
 if(asset.version!==1)throw new Error('Unsupported vertex asset version');
 const root=new THREE.Group();
 for(const data of asset.meshes){
  if(data.positions.length%3!==0)throw new Error(`Invalid positions: ${data.name}`);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));
  if(data.normals)geo.setAttribute('normal',new THREE.Float32BufferAttribute(data.normals,3));
  if(data.uvs)geo.setAttribute('uv',new THREE.Float32BufferAttribute(data.uvs,2));
  if(data.indices)geo.setIndex(data.indices);
  if(!data.normals)geo.computeVertexNormals();
  const mat=new THREE.MeshStandardMaterial({color:new THREE.Color(...data.material.color),roughness:data.material.roughness,metalness:data.material.metalness,opacity:data.material.opacity,transparent:data.material.opacity<1,side:data.material.doubleSided?THREE.DoubleSide:THREE.FrontSide});
  const mesh=new THREE.Mesh(geo,mat);mesh.name=data.name;mesh.castShadow=true;mesh.receiveShadow=true;
  if(data.matrix)mesh.applyMatrix4(new THREE.Matrix4().fromArray(data.matrix));
  root.add(mesh);
 }
 return root;
}
